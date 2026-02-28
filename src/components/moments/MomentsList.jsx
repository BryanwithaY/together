import React from 'react';
import MomentCard from './MomentCard';
import { motion } from 'framer-motion';
import { Heart, Lock } from 'lucide-react';

export default function MomentsList({ moments, privateReflections = [], typeFilter, ownerFilter, currentUser }) {
  // When filtering for self_reflection, include private ones that belong to the current user
  const displayMoments = typeFilter === 'self_reflection'
    ? [
        ...moments.filter(m => m.type === 'self_reflection'),
        ...privateReflections,
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : moments;

  const filtered = displayMoments.filter(m => {
    const typeMatch = typeFilter === 'all' || m.type === typeFilter;
    
    // Don't apply owner filter to private reflections shown in reflection tab
    let ownerMatch = true;
    if (ownerFilter === 'mine') {
      ownerMatch = m.created_by === currentUser?.email;
    } else if (ownerFilter === 'partner') {
      ownerMatch = m.created_by !== currentUser?.email;
    }
    
    return typeMatch && ownerMatch;
  });

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-stone-300" />
        </div>
        <p className="text-stone-400 font-medium">No moments yet</p>
        <p className="text-stone-400 text-sm mt-1">Start recording your journey together</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((moment, index) => (
        <MomentCard key={moment.id} moment={moment} index={index} currentUser={currentUser} />
      ))}
    </div>
  );
}