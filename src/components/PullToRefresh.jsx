import React, { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, refreshing, onRefresh]);

  const indicatorOpacity = Math.min(pullDistance / THRESHOLD, 1);
  const indicatorScale = 0.6 + 0.4 * indicatorOpacity;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overscroll-y-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 pointer-events-none"
        style={{ height: pullDistance, opacity: indicatorOpacity }}
      >
        {refreshing ? (
          <Loader2
            className="w-5 h-5 text-stone-400 animate-spin"
            style={{ transform: `scale(${indicatorScale})` }}
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full border-2 border-stone-300"
            style={{ transform: `scale(${indicatorScale})` }}
          />
        )}
      </div>
      {children}
    </div>
  );
}