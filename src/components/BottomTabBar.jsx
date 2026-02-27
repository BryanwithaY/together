import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, Settings, BarChart2, Star } from 'lucide-react';

const tabs = [
  { label: 'Moments', icon: Heart, page: 'Home' },
  { label: 'History', icon: BarChart2, page: 'History' },
  { label: 'Favorites', icon: Star, page: 'Favorites' },
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function BottomTabBar({ currentPageName }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-stone-200/60"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPageName === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${active ? 'text-stone-800' : 'text-stone-400'}`}
                fill={active && (label === 'Moments' || label === 'Favorites') ? 'currentColor' : 'none'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-stone-800' : 'text-stone-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}