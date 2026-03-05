import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const RelationshipContext = createContext(null);

export function RelationshipProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRelationship, setActiveRelationshipState] = useState(null);
  const [myRelationships, setMyRelationships] = useState([]);
  const [members, setMembers] = useState([]); // members of active relationship
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
    // Find all memberships for this user
    const memberships = await base44.entities.RelationshipMember.filter({
      user_email: user.email.toLowerCase(),
      status: 'active',
    });
    if (!memberships.length) return [];

    const relIds = memberships.map(m => m.relationship_id);
    // Fetch each relationship
    const allRels = await Promise.all(
      relIds.map(id => base44.entities.Relationship.filter({ id }).then(r => r[0]).catch(() => null))
    );
    return allRels.filter(r => r && !r.is_deleted);
  }, []);

  const loadMembers = useCallback(async (relationshipId) => {
    if (!relationshipId) return [];
    return base44.entities.RelationshipMember.filter({ relationship_id: relationshipId, status: 'active' });
  }, []);

  const setActiveRelationship = useCallback(async (rel) => {
    setActiveRelationshipState(rel);
    if (rel) {
      localStorage.setItem('active_relationship_id', rel.id);
      const m = await loadMembers(rel.id);
      setMembers(m);
    } else {
      localStorage.removeItem('active_relationship_id');
      setMembers([]);
    }
  }, [loadMembers]);

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
      }
      setLoading(false);
    })();
  }, []);

  const refreshRelationships = useCallback(async () => {
    if (!currentUser) return;
    const rels = await loadRelationships(currentUser);
    setMyRelationships(rels);
    // If active relationship was deleted, clear it
    if (activeRelationship && !rels.find(r => r.id === activeRelationship.id)) {
      setActiveRelationshipState(null);
      localStorage.removeItem('active_relationship_id');
      setMembers([]);
    }
  }, [currentUser, activeRelationship, loadRelationships]);

  return (
    <RelationshipContext.Provider value={{
      currentUser,
      activeRelationship,
      myRelationships,
      members,
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