import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import StatsOverview from '../components/moments/StatsOverview';
import MomentForm from '../components/moments/MomentForm';
import MomentsList from '../components/moments/MomentsList';
import FilterTabs from '../components/moments/FilterTabs';
import PullToRefresh from '../components/PullToRefresh';
import NewUserWelcome from '../components/help/NewUserWelcome';
import RelationshipSelector from '../components/relationships/RelationshipSelector';
import InvitationBanner from '../components/relationships/InvitationBanner';

const DEMO_MOMENTS = [
  {
    type: 'ego_aside',
    subtype: 'listened',
    what_happened: "My partner was venting about work and I resisted jumping in with solutions. I just listened and asked how they were feeling.",
    how_it_felt: "It felt uncomfortable at first but I could see how much they appreciated it. Really proud of this one.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: true,
    visibility: 'group',
  },
  {
    type: 'gratitude',
    subtype: 'general',
    what_happened: "They made my favourite meal after a long day without me even mentioning I was tired.",
    how_it_felt: "Felt so seen and loved. Small gestures mean everything.",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: true,
    visibility: 'group',
  },
  {
    type: 'ego_aside',
    subtype: 'admitted_mistake',
    what_happened: "I acknowledged I was wrong about a disagreement we had last week. Said sorry properly.",
    how_it_felt: "Hard to do but it cleared the air instantly. We both felt lighter.",
    date: new Date().toISOString(),
    is_demo: true,
    visibility: 'group',
  },
];

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRel, setActiveRel] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const myEmail = currentUser?.email?.toLowerCase();

  // Load relationships this user belongs to
  const { data: allRelationships = [], isLoading: loadingRels } = useQuery({
    queryKey: ['relationships', myEmail],
    queryFn: async () => {
      if (!myEmail) return [];
      const owned = await base44.entities.Relationship.filter({ owner_email: myEmail });
      // Also find ones where user is a member but not owner
      const all = await base44.entities.Relationship.list('-created_date', 200);
      return all.filter(r => (r.member_emails || []).some(e => e.toLowerCase() === myEmail));
    },
    enabled: !!myEmail,
  });

  // Auto-select first relationship, or create one
  useEffect(() => {
    if (loadingRels || !myEmail) return;
    if (allRelationships.length === 0) return;
    if (!activeRel || !allRelationships.find(r => r.id === activeRel?.id)) {
      // Check URL param
      const urlParams = new URLSearchParams(window.location.search);
      const relId = urlParams.get('rel');
      const found = relId ? allRelationships.find(r => r.id === relId) : null;
      setActiveRel(found || allRelationships[0]);
    }
  }, [allRelationships, loadingRels, myEmail]);

  const relId = activeRel?.id;
  const members = activeRel?.member_emails || [];
  const isGroupRel = members.length > 2;

  // Fetch moments for active relationship
  const { data: relMoments = [], isLoading: loadingMoments } = useQuery({
    queryKey: ['moments-rel', relId],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId }, '-created_date', 300),
    enabled: !!relId,
  });

  // Filter moments: only show ones this user can see
  const visibleMoments = useMemo(() => {
    if (!myEmail) return [];
    return relMoments.filter(m => {
      if (m.created_by?.toLowerCase() === myEmail) return true; // always see own
      if (m.is_private && !m.shared_with_partner) return false;
      if (m.visibility === 'private') return false;
      if (m.visibility === 'tagged_only') {
        return (m.tagged_member_emails || []).some(e => e.toLowerCase() === myEmail);
      }
      return true;
    });
  }, [relMoments, myEmail]);

  const privateReflections = useMemo(() =>
    relMoments.filter(m => m.created_by?.toLowerCase() === myEmail && m.is_private && !m.shared_with_partner),
    [relMoments, myEmail]
  );

  const isLoading = loadingRels || loadingMoments;

  // Seed demo moments once
  useEffect(() => {
    if (!isLoading && currentUser && relId) {
      const seededKey = `demo_seeded_${relId}`;
      if (visibleMoments.length === 0 && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, '1');
        base44.entities.Moment.bulkCreate(DEMO_MOMENTS.map(m => ({ ...m, relationship_id: relId }))).then(() => {
          queryClient.invalidateQueries({ queryKey: ['moments-rel', relId] });
        });
      } else if (visibleMoments.length > 0 && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, '1');
      }
    }
  }, [isLoading, currentUser, relId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Moment.create({ ...data, relationship_id: relId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments-rel', relId] });
      setShowForm(false);
    },
  });

  // No relationships yet
  if (!loadingRels && allRelationships.length === 0 && myEmail) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <NewUserWelcome />
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Welcome to Together</h2>
        <p className="text-sm text-stone-500 mb-6 max-w-xs leading-relaxed">
          Start by creating your first relationship — with a partner, sibling, friend, or anyone you want to grow closer to.
        </p>
        <Button
          onClick={() => navigate(createPageUrl('CreateRelationship'))}
          className="bg-stone-800 hover:bg-stone-900 text-white h-11 px-6 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create a Relationship
        </Button>
        <InvitationBanner currentUser={currentUser} />
      </div>
    );
  }

  const relTypeInfo = activeRel ? (import('../components/relationships/relationshipUtils').then(() => {}), null) : null;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight select-none">Together</h1>
              <p className="text-xs text-stone-400 mt-0.5 select-none">Growing closer, one moment at a time</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {allRelationships.length > 0 && (
                <RelationshipSelector
                  relationships={allRelationships}
                  activeRel={activeRel}
                  onSelect={setActiveRel}
                />
              )}
              <Button
                onClick={() => setShowForm(!showForm)}
                className="rounded-xl bg-stone-800 hover:bg-stone-900 text-white shadow-sm h-10 px-3 select-none"
                disabled={!activeRel}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['moments-rel', relId] })}>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          <NewUserWelcome />
          <InvitationBanner currentUser={currentUser} />

          {/* Stats */}
          <StatsOverview moments={[...visibleMoments, ...privateReflections]} privateReflections={privateReflections} />

          {/* Form */}
          <AnimatePresence>
            {showForm && activeRel && (
              <MomentForm
                onSubmit={(data) => createMutation.mutate(data)}
                onClose={() => setShowForm(false)}
                relationship={activeRel}
                currentUser={currentUser}
              />
            )}
          </AnimatePresence>

          {/* Filter + List */}
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-stone-800 mb-3 select-none">Moments</h2>
              <FilterTabs
                activeType={typeFilter}
                activeOwner={ownerFilter}
                onTypeChange={setTypeFilter}
                onOwnerChange={setOwnerFilter}
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white border border-stone-200/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <MomentsList
                moments={visibleMoments}
                privateReflections={privateReflections}
                typeFilter={typeFilter}
                ownerFilter={ownerFilter}
                currentUser={currentUser}
                relationship={activeRel}
              />
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}