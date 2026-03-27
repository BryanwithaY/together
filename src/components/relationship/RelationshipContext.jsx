import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const RelationshipContext = createContext(null);

/**
 * Wave 6: Fetch the current user's active memberships.
 * Prefers user_id filter (validated by Wave 5 backfill) for performance and stability.
 * Falls back to user_email if id-based result is empty (safety net for any pre-backfill records).
 */
async function fetchMyMemberships(entities, user) {
  if (user.id) {
    const byId = await entities.RelationshipMember.filter({ user_id: user.id, status: 'active' });
    if (byId.length > 0) return byId;
  }
  // Fallback: email-based lookup (pre-backfill safety net)
  return entities.RelationshipMember.filter({ user_email: user.email.toLowerCase(), status: 'active' });
}

export function RelationshipProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRelationship, setActiveRelationshipState] = useState(null);
  const [myRelationships, setMyRelationships] = useState([]);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Bootstrap: run user fetch + membership fetch in parallel, then parallel relationship fetches
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const user = await base44.auth.me().catch(() => null);

        if (!user || cancelled) { setLoading(false); return; }
        setCurrentUser(user);

        // Wave 6: use user_id-primary fetch with email fallback
        const membershipsResult = await fetchMyMemberships(base44.entities, user);

        if (!membershipsResult.length || cancelled) { setLoading(false); return; }

        const relIds = membershipsResult.map(m => m.relationship_id);
        const savedId = localStorage.getItem('active_relationship_id');

        // Fetch all relationships in parallel — one call per relationship
        // For most users this is 1-3 relationships so N+1 is acceptable here
        const allRelArrays = await Promise.all(relIds.map(id => base44.entities.Relationship.filter({ id })));

        if (cancelled) return;

        const sortRels = (rels) => rels
          .filter(r => r && !r.is_deleted)
          .sort((a, b) => {
            if (a.is_archived && !b.is_archived) return 1;
            if (!a.is_archived && b.is_archived) return -1;
            return 0;
          });

        const allRels = sortRels(allRelArrays.flat());

        setMyRelationships(allRels);

        if (allRels.length > 0) {
          const preferred = (savedId && allRels.find(r => r.id === savedId)) || allRels[0];
          // Fetch members while we set state
          const m = await loadMembers(preferred.id);
          if (cancelled) return;
          setActiveRelationshipState(preferred);
          setMembers(m);
          const email = user.email.toLowerCase();
          setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
          localStorage.setItem('active_relationship_id', preferred.id);
        }
      } catch (err) {
        console.error('RelationshipContext bootstrap error:', err);
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

  const refreshRelationships = useCallback(async () => {
    if (!currentUser) return;
    // Wave 6: use user_id-primary fetch with email fallback
    const memberships = await fetchMyMemberships(base44.entities, currentUser);
    const relIds = memberships.map(m => m.relationship_id);
    const allRelArrays = await Promise.all(relIds.map(id => base44.entities.Relationship.filter({ id })));
    const sortRels = (rels) => rels
      .filter(r => r && !r.is_deleted)
      .sort((a, b) => {
        if (a.is_archived && !b.is_archived) return 1;
        if (!a.is_archived && b.is_archived) return -1;
        return 0;
      });
    const allRels = sortRels(allRelArrays.flat());
    setMyRelationships(allRels);

    if (activeRelationship) {
      const updated = allRels.find(r => r.id === activeRelationship.id);
      if (updated) {
        setActiveRelationshipState(updated);
        const m = await loadMembers(updated.id);
        setMembers(m);
        const email = currentUser.email.toLowerCase();
        setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
      } else {
        // Active relationship was removed
        setActiveRelationshipState(null);
        localStorage.removeItem('active_relationship_id');
        setMembers([]);
        setMyMembership(null);
      }
    }
  }, [currentUser, activeRelationship, loadMembers]);

  return (
    <RelationshipContext.Provider value={{
      currentUser,
      activeRelationship,
      myRelationships,
      members,
      myMembership,
      loading,
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