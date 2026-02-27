import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import MomentCard from '../components/moments/MomentCard';
import PullToRefresh from '../components/PullToRefresh';

export default function Favorites() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const [partnerEmail, setPartnerEmail] = useState(null);
  const [partnerLoaded, setPartnerLoaded] = useState(false);

  useEffect(() => {
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

  const { data: rawMyFaves = [], isLoading: loadingMine } = useQuery({
    queryKey: ['favorites-mine', myEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: myEmail, is_favorite: true }, '-created_date', 100),
    enabled: !!myEmail,
  });

  const { data: rawPartnerFaves = [], isLoading: loadingPartner } = useQuery({
    queryKey: ['favorites-partner', partnerEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: partnerEmail, is_favorite: true }, '-created_date', 100),
    enabled: !!partnerEmail,
  });

  const moments = React.useMemo(() => {
    const myFaves = rawMyFaves.filter(m => m.created_by?.toLowerCase() === myEmail);
    const partnerFaves = partnerEmail
      ? rawPartnerFaves.filter(m => m.created_by?.toLowerCase() === partnerEmail)
      : [];
    const combined = [...myFaves, ...partnerFaves];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [rawMyFaves, rawPartnerFaves, myEmail, partnerEmail]);

  const isLoading = loadingMine || (!!partnerEmail && loadingPartner) || !partnerLoaded;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2 select-none">
            <Star className="w-6 h-6 text-amber-400" fill="currentColor" />
            Favorites
          </h1>
          <p className="text-sm text-stone-500 mt-1 select-none">Moments you've saved to remember</p>
        </div>
      </div>

      <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ['favorites'] })}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white border border-stone-200/60 animate-pulse" />
              ))}
            </div>
          ) : moments.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium select-none">No favorites yet</p>
              <p className="text-xs mt-1 select-none">Tap the ★ on any moment to save it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {moments.map((moment, index) => (
                <MomentCard key={moment.id} moment={moment} index={index} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}