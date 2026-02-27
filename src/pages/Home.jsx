import React, { useState } from 'react';
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

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['moments'],
    queryFn: () => base44.entities.Moment.list('-created_date', 100),
  });

  // Seed demo moments for brand-new accounts
  React.useEffect(() => {
    if (!isLoading && moments.length === 0 && currentUser) {
      base44.entities.Moment.bulkCreate(DEMO_MOMENTS).then(() => {
        queryClient.invalidateQueries({ queryKey: ['moments'] });
      });
    }
  }, [isLoading, moments.length, currentUser]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Moment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      setShowForm(false);
    },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Together</h1>
              <p className="text-sm text-stone-500 mt-1">Growing closer, one moment at a time</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-stone-800 hover:bg-stone-900 text-white shadow-sm h-10 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Moment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsOverview moments={moments} />

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <MomentForm
              onSubmit={(data) => createMutation.mutate(data)}
              onClose={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Filter + List */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Your Moments</h2>
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
              typeFilter={typeFilter} 
              ownerFilter={ownerFilter}
              currentUser={currentUser} 
            />
          )}
        </div>
      </div>
    </div>
  );
}