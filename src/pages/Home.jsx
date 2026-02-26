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

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['moments'],
    queryFn: () => base44.entities.Moment.list('-created_date', 100),
  });

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">Your Moments</h2>
            <FilterTabs active={filter} onChange={setFilter} />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white border border-stone-200/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <MomentsList moments={moments} filter={filter} currentUser={currentUser} />
          )}
        </div>
      </div>
    </div>
  );
}