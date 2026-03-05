import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const RelationshipContext = createContext(null);

export function RelationshipProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRelationship, setActiveRelationshipState] = useState(null);
  const [myRelationships, setMyRelationships] = useState([]);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null); // current user's own RelationshipMember record
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      return user;
    } catch {
      return null;
    }
  }, []);

  const loadRelationships = useCallback(async (user) => {
    if (!user) return [];
    const memberships = await base44.entities.RelationshipMember.filter({
      user_email: user.email.toLowerCase(),
      status: 'active',
    });
    if (!memberships.length) return [];
    const relIds = memberships.map(m => m.relationship_id);
    const allRels = await Promise.all(
      relIds.map(id => base44.entities.Relationship.filter({ id }).then(r => r[0]).catch(() => null))
    );
    return allRels.filter(r => r && !r.is_deleted).sort((a, b) => {
      // archived go last
      if (a.is_archived && !b.is_archived) return 1;
      if (!a.is_archived && b.is_archived) return -1;
      return 0;
    });
  }, []);

  const loadMembers = useCallback(async (relationshipId) => {
    if (!relationshipId) return [];
    return base44.entities.RelationshipMember.filter({ relationship_id: relationshipId, status: 'active' });
  }, []);

  const setActiveRelationship = useCallback(async (rel, userEmail) => {
    setActiveRelationshipState(rel);
    if (rel) {
      localStorage.setItem('active_relationship_id', rel.id);
      const m = await loadMembers(rel.id);
      setMembers(m);
      const email = (userEmail || currentUser?.email || '').toLowerCase();
      const mine = m.find(mb => mb.user_email?.toLowerCase() === email) || null;
      setMyMembership(mine);
    } else {
      localStorage.removeItem('active_relationship_id');
      setMembers([]);
      setMyMembership(null);
    }
  }, [loadMembers, currentUser]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const user = await loadUser();
      if (!user) { setLoading(false); return; }

      const rels = await loadRelationships(user);
      setMyRelationships(rels);

      if (rels.length > 0) {
        const savedId = localStorage.getItem('active_relationship_id');
        const preferred = (savedId && rels.find(r => r.id === savedId)) || rels[0];
        setActiveRelationshipState(preferred);
        const m = await loadMembers(preferred.id);
        setMembers(m);
        const email = user.email.toLowerCase();
        setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
      }
      setLoading(false);
    })();
  }, []);

  const refreshRelationships = useCallback(async () => {
    if (!currentUser) return;
    const rels = await loadRelationships(currentUser);
    setMyRelationships(rels);
    if (activeRelationship && !rels.find(r => r.id === activeRelationship.id)) {
      setActiveRelationshipState(null);
      localStorage.removeItem('active_relationship_id');
      setMembers([]);
      setMyMembership(null);
    } else if (activeRelationship) {
      const updated = rels.find(r => r.id === activeRelationship.id);
      if (updated) setActiveRelationshipState(updated);
      const m = await loadMembers(activeRelationship.id);
      setMembers(m);
      const email = currentUser.email.toLowerCase();
      setMyMembership(m.find(mb => mb.user_email?.toLowerCase() === email) || null);
    }
  }, [currentUser, activeRelationship, loadRelationships, loadMembers]);

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