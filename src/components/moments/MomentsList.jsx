import React from 'react';
import MomentCard from './MomentCard';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function MomentsList({ moments, filter, currentUser }) {
  const filtered = filter === 'all' 
    ? moments 
    : moments.filter(m => m.type === filter);

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