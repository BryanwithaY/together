import React, { useState, useEffect, useRef, useMemo } from 'react';
import MomentCard from './MomentCard';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const PAGE_SIZE = 20;

export default function MomentsList({ moments, privateReflections = [], typeFilter, ownerFilter, currentUser, scrollToId, ownerFilter2 }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const scrolledRef = useRef(false);
  const observerRef = useRef(null);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    scrolledRef.current = false;
  }, [typeFilter, ownerFilter]);

  // Compute filtered list — memoized so it doesn't re-run on every render
  const filtered = useMemo(() => {
    const combined = typeFilter === 'self_reflection'
      ? [
          ...moments.filter(m => m.type === 'self_reflection'),
          ...privateReflections,
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
      : moments;

    return combined.filter(m => {
      const typeMatch = typeFilter === 'all' || m.type === typeFilter;
      let ownerMatch = true;
      if (ownerFilter === 'mine') ownerMatch = m.created_by === currentUser?.email;
      else if (ownerFilter === 'partner') ownerMatch = m.created_by !== currentUser?.email;
      return typeMatch && ownerMatch;
    });
  }, [moments, privateReflections, typeFilter, ownerFilter, currentUser?.email]);

  // Expand visible window so scrollToId is always reachable
  useEffect(() => {
    if (!scrollToId || scrolledRef.current) return;
    const idx = filtered.findIndex(m => m.id === scrollToId);
    if (idx !== -1 && idx + 1 > visibleCount) {
      setVisibleCount(idx + 5);
    }
  }, [scrollToId, filtered]);

  // Scroll to and highlight the target moment
  useEffect(() => {
    if (!scrollToId || scrolledRef.current) return;
    const el = document.getElementById(`moment-${scrollToId}`);
    if (el) {
      scrolledRef.current = true;
      const t = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-stone-400', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-stone-400', 'ring-offset-2'), 2000);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [scrollToId, visibleCount]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // IntersectionObserver — only re-attach when sentinel ref changes, not on every visibleCount bump
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: '300px' }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore]); // only reconnect when hasMore flips

  if (filtered.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-stone-300" />
        </div>
        <p className="text-stone-400 font-medium">No moments yet</p>
        <p className="text-stone-400 text-sm mt-1">Start recording your journey together</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
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