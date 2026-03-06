import React, { useState, useEffect, useRef } from 'react';
import MomentCard from './MomentCard';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const PAGE_SIZE = 20;

export default function MomentsList({ moments, privateReflections = [], typeFilter, ownerFilter, currentUser, scrollToId, ownerFilter2 }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const scrolledRef = useRef(false);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    scrolledRef.current = false;
  }, [typeFilter, ownerFilter]);

  // If coming from History with a specific scrollToId, ensure we show enough items
  useEffect(() => {
    if (!scrollToId || scrolledRef.current) return;
    // Find how far down the target moment is and ensure it's in the visible window
    const allCombined = [
      ...moments.filter(m => m.type === 'self_reflection' || m.type !== 'self_reflection'),
      ...privateReflections,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const idx = allCombined.findIndex(m => m.id === scrollToId);
    if (idx !== -1 && idx + 1 > visibleCount) {
      setVisibleCount(idx + 5);
    }
  }, [scrollToId, moments, privateReflections]);

  // Scroll to target moment after render
  useEffect(() => {
    if (!scrollToId || scrolledRef.current) return;
    const el = document.getElementById(`moment-${scrollToId}`);
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-stone-400', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-stone-400', 'ring-offset-2'), 2000);
      }, 150);
    }
  }, [scrollToId, visibleCount]);

  const displayMoments = typeFilter === 'self_reflection'
    ? [
        ...moments.filter(m => m.type === 'self_reflection'),
        ...privateReflections,
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    : moments;

  const filtered = displayMoments.filter(m => {
    const typeMatch = typeFilter === 'all' || m.type === typeFilter;
    let ownerMatch = true;
    if (ownerFilter === 'mine') {
      ownerMatch = m.created_by === currentUser?.email;
    } else if (ownerFilter === 'partner') {
      ownerMatch = m.created_by !== currentUser?.email;
    }
    return typeMatch && ownerMatch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

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
      {visible.map((moment, index) => (
        <div key={moment.id} id={`moment-${moment.id}`} className="transition-all duration-500 rounded-2xl">
          <MomentCard moment={moment} index={index} currentUser={currentUser} />
        </div>
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}