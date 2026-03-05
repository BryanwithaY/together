import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Bookmark } from 'lucide-react';
import MomentCard from '../components/moments/MomentCard';
import PullToRefresh from '../components/PullToRefresh';

export default function Favorites() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('favorites'); // 'favorites' | 'saved'
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

  // Favorites queries
  const { data: rawMyFaves = [], isLoading: loadingMineFaves } = useQuery({
    queryKey: ['favorites-mine', myEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: myEmail, is_favorite: true }, '-created_date', 100),
    enabled: !!myEmail,
  });

  const { data: rawPartnerFaves = [], isLoading: loadingPartnerFaves } = useQuery({
    queryKey: ['favorites-partner', partnerEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: partnerEmail, is_favorite: true }, '-created_date', 100),
    enabled: !!partnerEmail,
  });

  // Saved (self-reflections) queries
  const { data: rawSaved = [], isLoading: loadingSaved } = useQuery({
    queryKey: ['saved', myEmail],
    queryFn: () => base44.entities.Moment.filter({ created_by: myEmail, is_saved: true }, '-created_date', 100),
    enabled: !!myEmail,
  });

  const favorites = useMemo(() => {
    const myFaves = rawMyFaves.filter(m => m.created_by?.toLowerCase() === myEmail);
    const partnerFaves = partnerEmail
      ? rawPartnerFaves.filter(m => m.created_by?.toLowerCase() === partnerEmail && (!m.is_private || m.shared_with_partner))
      : [];
    const combined = [...myFaves, ...partnerFaves];
    combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return combined;
  }, [rawMyFaves, rawPartnerFaves, myEmail, partnerEmail]);

  const saved = useMemo(() => {
    return rawSaved.filter(m => m.created_by?.toLowerCase() === myEmail);
  }, [rawSaved, myEmail]);

  const isLoading =
    tab === 'favorites'
      ? loadingMineFaves || (!!partnerEmail && loadingPartnerFaves) || !partnerLoaded
      : loadingSaved;

  const moments = tab === 'favorites' ? favorites : saved;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-0">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight select-none mb-4">Saved</h1>
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => setTab('favorites')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'favorites'
                  ? 'border-amber-400 text-amber-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={tab === 'favorites' ? 'currentColor' : 'none'} />
              Favorites
            </button>
            <button
              onClick={() => setTab('saved')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'saved'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={tab === 'saved' ? 'currentColor' : 'none'} />
              Reflections
            </button>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={() => {
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['saved'] });
      }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white border border-stone-200/60 animate-pulse" />
              ))}
            </div>
          ) : moments.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              {tab === 'favorites' ? (
                <>
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium select-none">No favorites yet</p>
                  <p className="text-xs mt-1 select-none">Tap the ★ on any moment to save it here</p>
                </>
              ) : (
                <>
                  <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium select-none">No saved reflections yet</p>
                  <p className="text-xs mt-1 select-none">Tap the bookmark on a self-reflection to save it here</p>
                </>
              )}
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