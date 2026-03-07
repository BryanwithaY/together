import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import MomentForm from '../components/moments/MomentForm';
import MomentsList from '../components/moments/MomentsList';
import FilterTabs from '../components/moments/FilterTabs';
import NewUserWelcome from '../components/help/NewUserWelcome';
import { usePageLoading } from '../components/PageLoadingContext';
import { Analytics } from '../components/lib/analytics';

function HomeContent() {
  const { activeRelationship, currentUser } = useRelationship();
  const { setPageReady } = usePageLoading();
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const queryClient = useQueryClient();

  // Handle deep-link from History tab — stable across renders
  const [scrollToId, ownerParam] = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return [p.get('scrollTo'), p.get('owner')];
  }, []);

  const { data: moments = [], isLoading: momentsLoading } = useQuery({
    queryKey: ['moments', activeRelationship?.id],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_private: false,
    }, '-date', 100),
    enabled: !!activeRelationship?.id,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!momentsLoading) setPageReady();
  }, [momentsLoading]);

  useEffect(() => { Analytics.pageViewed('home'); }, []);

  const { data: privateReflections = [] } = useQuery({
    queryKey: ['moments-private', activeRelationship?.id, currentUser?.email],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_private: true,
      created_by: currentUser.email,
    }, '-date', 50),
    enabled: !!activeRelationship?.id && !!currentUser?.email,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Moment.create({
      ...data,
      relationship_id: activeRelationship.id,
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['moments', activeRelationship?.id] });
      queryClient.invalidateQueries({ queryKey: ['moments-private', activeRelationship?.id] });
      setShowForm(false);
      // Log event + notify partners (fire-and-forget)
      base44.functions.invoke('logAppEvent', {
        event_type: 'moment_created',
        relationship_id: activeRelationship.id,
        moment_type: created?.type,
        moment_subtype: created?.subtype,
      }).catch(() => {});
      if (!created?.is_private) {
        base44.functions.invoke('sendEventNotification', {
          event_type: 'partner_logs',
          relationship_id: activeRelationship.id,
          actor_email: currentUser.email,
          context: created?.what_happened || created?.how_it_felt || '',
        }).catch(() => {});
      }
    },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <RelationshipSwitcher />
          <button
            onClick={() => { if (!showForm) Analytics.newMomentButtonTapped(); setShowForm(v => !v); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              showForm ? 'bg-stone-100 text-stone-600' : 'bg-stone-800 text-white hover:bg-stone-900'
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Moment'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <MomentForm
                onSubmit={(data) => createMutation.mutate(data)}
                onClose={() => setShowForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <FilterTabs
          activeType={typeFilter}
          activeOwner={ownerFilter}
          onTypeChange={setTypeFilter}
          onOwnerChange={setOwnerFilter}
        />

        {momentsLoading ? null : (
          <MomentsList
            moments={moments}
            privateReflections={privateReflections}
            typeFilter={typeFilter}
            ownerFilter={ownerFilter || ownerParam || 'all'}
            currentUser={currentUser}
            scrollToId={scrollToId}
          />
        )}
      </div>

      <NewUserWelcome />
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