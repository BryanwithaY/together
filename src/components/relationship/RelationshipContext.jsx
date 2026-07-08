import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const RelationshipContext = createContext(null);

// Temporary diagnostic flag — logs are gated behind this so they can be
// disabled in one place once the failing step is confirmed fixed.
const DIAG = true;
const log = (...args) => { if (DIAG) console.warn('[RelDiag]', ...args); };

/**
 * Wave 6: Fetch the current user's active memberships.
 * Prefers user_id filter (validated by Wave 5 backfill) for performance and stability.
 * Falls back to user_email if id-based result is empty (safety net for any pre-backfill records).
 */
async function fetchMyMemberships(entities, user) {
  if (user.id) {
    const byId = await entities.RelationshipMember.filter({ user_id: user.id, status: 'active' });
    log('fetchMyMemberships: user_id query returned', byId.length, 'rows');
    if (byId.length > 0) return byId;
  }
  const byEmail = await entities.RelationshipMember.filter({ user_email: user.email.toLowerCase(), status: 'active' });
  log('fetchMyMemberships: email fallback returned', byEmail.length, 'rows');
  return byEmail;
}

/**
 * Fetch relationships for a set of ids, trying the $in query first and falling
 * back to per-id parallel lookups if the $in query comes back short or errors.
 * This guards against any discrepancy between how $in behaves under RLS for the
 * authenticated client vs. a flat equality lookup.
 */
async function fetchRelationshipsForIds(relIds, outCounts) {
  if (relIds.length === 0) return [];

  let methodAResult = [];
  try {
    methodAResult = await base44.entities.Relationship.filter({ id: { $in: relIds } });
    log('Method A ($in query) returned', methodAResult.length, 'of', relIds.length, 'ids:', methodAResult.map(r => r.id));
  } catch (err) {
    log('Method A ($in query) threw error:', err?.message);
  }
  if (outCounts) outCounts.a = methodAResult.length;

  if (methodAResult.length >= relIds.length) {
    return methodAResult;
  }

  // Method A came back short or errored — try per-id lookups as a fallback.
  const settled = await Promise.allSettled(relIds.map(id => base44.entities.Relationship.filter({ id })));
  const methodBResult = settled.flatMap((r, i) => {
    if (r.status === 'rejected') {
      log('Method B per-id lookup failed for', relIds[i], ':', r.reason?.message);
      return [];
    }
    return r.value;
  });
  log('Method B (per-id) returned', methodBResult.length, 'of', relIds.length, 'ids:', methodBResult.map(r => r.id));
  if (outCounts) outCounts.b = methodBResult.length;

  // Use whichever method returned more results.
  return methodBResult.length > methodAResult.length ? methodBResult : methodAResult;
}

function sortRels(rels) {
  return rels
    .filter(r => r && !r.is_deleted)
    .sort((a, b) => {
      if (a.is_archived && !b.is_archived) return 1;
      if (!a.is_archived && b.is_archived) return -1;
      return 0;
    });
}

export function RelationshipProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRelationship, setActiveRelationshipState] = useState(null);
  const [myRelationships, setMyRelationships] = useState([]);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  const loadMembers = useCallback(async (relationshipId) => {
    if (!relationshipId) return [];
    return base44.entities.RelationshipMember.filter({ relationship_id: relationshipId, status: 'active' });
  }, []);

  const applyRelationship = useCallback(async (rel, userEmail, cachedMembers) => {
    setActiveRelationshipState(rel);
    if (!rel) {
      localStorage.removeItem('active_relationship_id');
      setMembers([]);
      setMyMembership(null);
      return;
    }
    localStorage.setItem('active_relationship_id', rel.id);
    const m = cachedMembers || await loadMembers(rel.id);
    setMembers(m);
    const email = (userEmail || '').toLowerCase();
    setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
  }, [loadMembers]);

  // Bootstrap: run user fetch + membership fetch in parallel, then relationship fetches
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await base44.auth.me().catch(() => null);

        if (!user || cancelled) { setLoading(false); return; }
        setCurrentUser(user);
        log('auth.me() ->', { id: user.id, email: user.email });
        setDebugInfo(d => ({ ...d, userEmail: user.email, userId: user.id }));

        let membershipsResult;
        try {
          membershipsResult = await fetchMyMemberships(base44.entities, user);
        } catch (err) {
          console.warn('Membership fetch failed, retrying once:', err);
          membershipsResult = await fetchMyMemberships(base44.entities, user);
        }

        const relIds = membershipsResult.map(m => m.relationship_id);
        log('membership relationship_ids:', relIds);
        setDebugInfo(d => ({ ...d, membershipCount: membershipsResult.length, relIds }));

        if (relIds.length === 0 || cancelled) { setLoading(false); return; }

        const savedId = localStorage.getItem('active_relationship_id');

        const methodACounts = {};
        let allRels = sortRels(await fetchRelationshipsForIds(relIds, methodACounts));
        // Retry once if short — guards against replication lag right after signup/creation.
        if (allRels.length < relIds.length) {
          await new Promise(res => setTimeout(res, 500));
          const retry = sortRels(await fetchRelationshipsForIds(relIds, methodACounts));
          if (retry.length > allRels.length) allRels = retry;
        }

        if (cancelled) return;

        log('final relationships before setMyRelationships:', allRels.length, allRels.map(r => r.name));
        setDebugInfo(d => ({
          ...d,
          methodACount: methodACounts.a,
          methodBCount: methodACounts.b,
          finalCount: allRels.length,
          finalNames: allRels.map(r => r.name),
        }));

        // Never wipe out relationships if we have memberships but the lookup came back empty —
        // surface an error/retry state instead of showing zero spaces.
        if (allRels.length === 0 && relIds.length > 0) {
          log('relationship lookup returned 0 despite', relIds.length, 'memberships — preserving loading/error state, not clearing list');
          setError('Failed to load your relationship spaces — please refresh.');
          setLoading(false);
          return;
        }

        setMyRelationships(allRels);

        const savedIdValid = savedId && allRels.some(r => r.id === savedId);
        log('saved active_relationship_id:', savedId, 'valid:', savedIdValid);

        const preferred = (savedIdValid && allRels.find(r => r.id === savedId)) || allRels[0];
        const m = await loadMembers(preferred.id);
        if (cancelled) return;
        setActiveRelationshipState(preferred);
        setMembers(m);
        const email = user.email.toLowerCase();
        setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
        localStorage.setItem('active_relationship_id', preferred.id);
        log('activeRelationship selected:', preferred.id, preferred.name);
        setDebugInfo(d => ({ ...d, activeRelationshipName: preferred.name }));
      } catch (err) {
        console.error('RelationshipContext bootstrap error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load your relationship space');
        setDebugInfo(d => ({ ...d, contextError: err?.message || 'Failed to load your relationship space' }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Public setter — used when switching relationships or after creating one
  const setActiveRelationship = useCallback(async (rel) => {
    await applyRelationship(rel, currentUser?.email, null);
  }, [applyRelationship, currentUser]);

  const fetchAllMyRelationships = useCallback(async () => {
    const memberships = await fetchMyMemberships(base44.entities, currentUser);
    const relIds = memberships.map(m => m.relationship_id);
    const rels = sortRels(await fetchRelationshipsForIds(relIds));
    return { allRels: rels, expectedCount: relIds.length };
  }, [currentUser]);

  const refreshRelationships = useCallback(async () => {
    if (!currentUser) return;
    let { allRels, expectedCount } = await fetchAllMyRelationships();
    if (allRels.length < expectedCount) {
      await new Promise(res => setTimeout(res, 500));
      const retry = await fetchAllMyRelationships();
      if (retry.allRels.length > allRels.length) allRels = retry.allRels;
    }

    // Don't overwrite an existing non-empty list with an empty one if we still have memberships —
    // preserve previous state and let the caller retry, rather than flashing an empty switcher.
    if (allRels.length === 0 && expectedCount > 0) {
      log('refreshRelationships: lookup returned 0 despite', expectedCount, 'memberships — preserving existing myRelationships');
      return;
    }

    setMyRelationships(allRels);

    if (activeRelationship) {
      const updated = allRels.find(r => r.id === activeRelationship.id);
      if (updated) {
        setActiveRelationshipState(updated);
        const m = await loadMembers(updated.id);
        setMembers(m);
        const email = currentUser.email.toLowerCase();
        setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
      } else if (allRels.length > 0) {
        // Active relationship no longer in the list (e.g. deleted) — fall back to another valid one
        // rather than clearing localStorage based on a possibly-incomplete fetch.
        setActiveRelationshipState(allRels[0]);
        localStorage.setItem('active_relationship_id', allRels[0].id);
        const m = await loadMembers(allRels[0].id);
        setMembers(m);
        const email = currentUser.email.toLowerCase();
        setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
      } else {
        setActiveRelationshipState(null);
        localStorage.removeItem('active_relationship_id');
        setMembers([]);
        setMyMembership(null);
      }
    }
  }, [currentUser, activeRelationship, loadMembers, fetchAllMyRelationships]);

  return (
    <RelationshipContext.Provider value={{
      currentUser,
      activeRelationship,
      myRelationships,
      members,
      myMembership,
      loading,
      error,
      debugInfo,
      setActiveRelationship,
      refreshRelationships,
    }}>
      {children}
    </RelationshipContext.Provider>
  );
}

export function useRelationship() {
  return useContext(RelationshipContext);
}