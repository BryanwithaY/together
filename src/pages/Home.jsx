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

  const [partnerEmail, setPartnerEmail] = useState(null);
  const [partnerLoaded, setPartnerLoaded] = useState(false);

  React.useEffect(() => {
    if (!currentUser) return;
    const myEmail = currentUser.email.toLowerCase();
    base44.entities.PartnerInvitation.filter({ inviter_email: myEmail, status: 'accepted' }).then(sent => {
      const exact = sent.find(i => i.inviter_email?.toLowerCase() === myEmail && i.status === 'accepted');
      if (exact) { setPartnerEmail(exact.invitee_email?.toLowerCase()); setPartnerLoaded(true); return; }
      base44.entities.PartnerInvitation.filter({ invitee_email: myEmail, status: 'accepted' }).then(received => {
        const exactR = received.find(i => i.invitee_email?.toLowerCase() === myEmail && i.status === 'accepted');
        if (exactR) setPartnerEmail(exactR.inviter_email?.toLowerCase());
        setPartnerLoaded(true);
      });
    });
  }, [currentUser]);

  const myEmail = currentUser?.email?.toLowerCase();

  const { data: rawMyMoments = [], isLoading: loadingMine } = useQuery({
    queryKey: ['moments-mine', myEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: myEmail }, '-created_date', 200),
    enabled: !!myEmail,
  });

  const { data: rawPartnerMoments = [], isLoading: loadingPartner } = useQuery({
    queryKey: ['moments-partner', partnerEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: partnerEmail }, '-created_date', 200),
    enabled: !!partnerEmail,
  });

  // Strict email filtering to prevent cross-account data leakage
  const allMyMoments = rawMyMoments.filter(m => m.created_by?.toLowerCase() === myEmail);
  // Private self-reflections not yet shared — only visible to the owner
  const privateReflections = allMyMoments.filter(m => m.is_private && !m.shared_with_partner);
  // Moments visible in the shared feed
  const myMoments = allMyMoments.filter(m => !m.is_private || m.shared_with_partner);
  const partnerMoments = partnerEmail
    ? rawPartnerMoments.filter(m => m.created_by?.toLowerCase() === partnerEmail && (!m.is_private || m.shared_with_partner))
    : [];

  const moments = React.useMemo(() => {
    const combined = [...myMoments, ...partnerMoments];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [myMoments, partnerMoments]);

  // All my moments including private ones (for stats)
  const allMomentsForStats = React.useMemo(() => {
    const combined = [...allMyMoments, ...partnerMoments];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [allMyMoments, partnerMoments]);

  const isLoading = loadingMine || (!!partnerEmail && loadingPartner) || !partnerLoaded;

  // Seed demo moments only once for brand-new accounts
  // Use a localStorage flag so we never re-seed after the user deletes demo data
  React.useEffect(() => {
    if (!isLoading && currentUser) {
      const seededKey = `demo_seeded_${currentUser.id || currentUser.email}`;
      if (moments.length === 0 && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, '1');
        base44.entities.Moment.bulkCreate(DEMO_MOMENTS).then(() => {
          queryClient.invalidateQueries({ queryKey: ['moments'] });
        });
      } else if (moments.length > 0) {
        // Mark as seeded so future empty state never re-seeds
        const seededKey2 = `demo_seeded_${currentUser.id || currentUser.email}`;
        if (!localStorage.getItem(seededKey2)) {
          localStorage.setItem(seededKey2, '1');
        }
      }
    }
  }, [isLoading, currentUser]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Moment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments-mine'] });
      queryClient.invalidateQueries({ queryKey: ['moments-partner'] });
      setShowForm(false);
    },
  });

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight select-none">Together</h1>
              <p className="text-sm text-stone-500 mt-1 select-none">Growing closer, one moment at a time</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-stone-800 hover:bg-stone-900 text-white shadow-sm h-10 px-4 select-none"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Moment
            </Button>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['moments'] })}>
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
              <h2 className="text-lg font-semibold text-stone-800 mb-4 select-none">Your Moments</h2>
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
      </PullToRefresh>
    </div>
  );
}