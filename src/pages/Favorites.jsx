import React, { useState, useEffect } from 'react';
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

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Moment.filter({ is_favorite: true }, '-created_date', 100),
  });

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