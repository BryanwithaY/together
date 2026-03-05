import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AnimatePresence } from 'framer-motion';

import StatsOverview from '../components/moments/StatsOverview';
import MomentForm from '../components/moments/MomentForm';
import MomentsList from '../components/moments/MomentsList';
import FilterTabs from '../components/moments/FilterTabs';
import PullToRefresh from '../components/PullToRefresh';
import NewUserWelcome from '../components/help/NewUserWelcome';
import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';

const DEMO_MOMENTS = [
  {
    type: 'ego_aside',
    subtype: 'listened',
    what_happened: "My partner was venting about work and I resisted jumping in with solutions. I just listened and asked how they were feeling.",
    how_it_felt: "It felt uncomfortable at first but I could see how much they appreciated it. Really proud of this one.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: true,
  },
  {
    type: 'gratitude',
    subtype: 'general',
    what_happened: "They made my favourite meal after a long day without me even mentioning I was tired.",
    how_it_felt: "Felt so seen and loved. Small gestures mean everything.",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_demo: true,
  },
  {
    type: 'ego_aside',
    subtype: 'admitted_mistake',
    what_happened: "I acknowledged I was wrong about a disagreement we had last week. Said sorry properly.",
    how_it_felt: "Hard to do but it cleared the air instantly. We both felt lighter.",
    date: new Date().toISOString(),
    is_demo: true,
  },
];

function HomeContent() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const queryClient = useQueryClient();

  const { currentUser, activeRelationship, members } = useRelationship();
  const relId = activeRelationship?.id;
  const myEmail = currentUser?.email?.toLowerCase();

  // All member emails except mine
  const memberEmails = members
    .map(m => m.user_email?.toLowerCase())
    .filter(e => e && e !== myEmail);

  // Fetch all moments for this relationship
  const { data: rawMoments = [], isLoading } = useQuery({
    queryKey: ['moments', relId],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId }, '-created_date', 500),
    enabled: !!relId,
  });

  // My moments
  const allMyMoments = rawMoments.filter(m => m.created_by?.toLowerCase() === myEmail);
  const privateReflections = allMyMoments.filter(m => m.is_private && !m.shared_with_partner);
  const myMoments = allMyMoments.filter(m => !m.is_private || m.shared_with_partner);

  // Other members' moments (exclude private unshared)
  const otherMoments = rawMoments.filter(m => {
    const creator = m.created_by?.toLowerCase();
    return creator !== myEmail && (!m.is_private || m.shared_with_partner);
  });

  const moments = React.useMemo(() => {
    const combined = [...myMoments, ...otherMoments];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [myMoments, otherMoments]);

  const allMomentsForStats = React.useMemo(() => {
    const combined = [...allMyMoments, ...otherMoments];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [allMyMoments, otherMoments]);

  // Seed demo moments for new relationship
  React.useEffect(() => {
    if (!isLoading && currentUser && relId) {
      const seededKey = `demo_seeded_${currentUser.id || currentUser.email}_${relId}`;
      if (moments.length === 0 && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, '1');
        base44.entities.Moment.bulkCreate(DEMO_MOMENTS.map(m => ({ ...m, relationship_id: relId }))).then(() => {
          queryClient.invalidateQueries({ queryKey: ['moments', relId] });
        });
      } else if (moments.length > 0 && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, '1');
      }
    }
  }, [isLoading, currentUser, relId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Moment.create({ ...data, relationship_id: relId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', relId] });
      setShowForm(false);
    },
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <RelationshipSwitcher />
            <Button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-stone-800 hover:bg-stone-900 text-white shadow-sm h-9 px-3 select-none flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </div>

      <NewUserWelcome />
      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['moments', relId] })}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <StatsOverview moments={allMomentsForStats} privateReflections={privateReflections} />

          <AnimatePresence>
            {showForm && (
              <MomentForm
                onSubmit={(data) => createMutation.mutate(data)}
                onClose={() => setShowForm(false)}
              />
            )}
          </AnimatePresence>

          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-stone-800 mb-4 select-none">Moments</h2>
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
                moments={moments}
                privateReflections={privateReflections}
                typeFilter={typeFilter}
                ownerFilter={ownerFilter}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

export default function Home() {
  return (
    <RelationshipGate>
      <HomeContent />
    </RelationshipGate>
  );
}