import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Bookmark } from 'lucide-react';
import MomentCard from '../components/moments/MomentCard';
import PullToRefresh from '../components/PullToRefresh';
import RelationshipGate from '../components/relationship/RelationshipGate';
import { useRelationship } from '../components/relationship/RelationshipContext';

function FavoritesContent() {
  const [tab, setTab] = useState('favorites');
  const queryClient = useQueryClient();
  const { currentUser, activeRelationship } = useRelationship();
  const relId = activeRelationship?.id;
  const myEmail = currentUser?.email?.toLowerCase();

  const { data: rawFaves = [], isLoading: loadingFaves } = useQuery({
    queryKey: ['favorites', relId],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId, is_favorite: true }, '-created_date', 100),
    enabled: !!relId,
  });

  const { data: rawSaved = [], isLoading: loadingSaved } = useQuery({
    queryKey: ['saved', relId, myEmail],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId, created_by: myEmail, is_saved: true }, '-created_date', 100),
    enabled: !!relId && !!myEmail,
  });

  const favorites = useMemo(() => {
    return rawFaves.filter(m => !m.is_private || m.shared_with_partner || m.created_by?.toLowerCase() === myEmail);
  }, [rawFaves, myEmail]);

  const saved = useMemo(() => {
    return rawSaved.filter(m => m.created_by?.toLowerCase() === myEmail);
  }, [rawSaved, myEmail]);

  const isLoading = tab === 'favorites' ? loadingFaves : loadingSaved;
  const moments = tab === 'favorites' ? favorites : saved;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200/60 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-0">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight select-none mb-4">Saved</h1>
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => setTab('favorites')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'favorites' ? 'border-amber-400 text-amber-600' : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={tab === 'favorites' ? 'currentColor' : 'none'} />
              Favorites
            </button>
            <button
              onClick={() => setTab('saved')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'saved' ? 'border-violet-500 text-violet-600' : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={tab === 'saved' ? 'currentColor' : 'none'} />
              Reflections
            </button>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={() => {
        queryClient.invalidateQueries({ queryKey: ['favorites', relId] });
        queryClient.invalidateQueries({ queryKey: ['saved', relId] });
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

export default function Favorites() {
  return (
    <RelationshipGate>
      <FavoritesContent />
    </RelationshipGate>
  );
}