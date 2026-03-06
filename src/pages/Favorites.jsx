import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Star, Bookmark, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import MomentCard from '../components/moments/MomentCard';
import { usePageLoading } from '../components/PageLoadingContext';

const TABS = [
  { key: 'favorites', label: 'Favorites', icon: Star },
  { key: 'saved', label: 'Reflections', icon: Bookmark },
];

function FavoritesContent() {
  const { activeRelationship, currentUser } = useRelationship();
  const { setPageReady } = usePageLoading();
  const [tab, setTab] = useState('favorites');

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites', activeRelationship?.id],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_favorite: true,
    }, '-date', 200),
    enabled: !!activeRelationship?.id,
  });

  const { data: saved = [] } = useQuery({
    queryKey: ['saved', activeRelationship?.id, currentUser?.email],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_saved: true,
      created_by: currentUser.email,
    }, '-date', 200),
    enabled: !!activeRelationship?.id && !!currentUser?.email,
  });

  const displayed = tab === 'favorites' ? favorites : saved;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <RelationshipSwitcher />
          <h1 className="text-lg font-bold text-stone-800 ml-auto">Saved</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 select-none"
            >
              {tab === key && (
                <motion.div
                  layoutId="savedTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon className={`relative z-10 w-3.5 h-3.5 ${tab === key ? 'text-stone-700' : 'text-stone-400'}`} />
              <span className={`relative z-10 ${tab === key ? 'text-stone-800' : 'text-stone-500'}`}>{label}</span>
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              {tab === 'favorites' ? <Star className="w-7 h-7 text-stone-300" /> : <Bookmark className="w-7 h-7 text-stone-300" />}
            </div>
            <p className="text-stone-400 font-medium">
              {tab === 'favorites' ? 'No favorites yet' : 'No saved reflections yet'}
            </p>
            <p className="text-stone-400 text-sm mt-1">
              {tab === 'favorites'
                ? 'Star moments to save them here'
                : 'Bookmark self-reflections to revisit them'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {displayed.map((moment, index) => (
              <MomentCard key={moment.id} moment={moment} index={index} currentUser={currentUser} />
            ))}
          </div>
        )}
      </div>
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