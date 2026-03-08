import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Heart, Settings, BarChart2, ShieldCheck, Calendar, Sparkles, Users } from 'lucide-react';
import { useRelationship } from './relationship/RelationshipContext';

const BASE_TABS = [
  { label: 'Moments', icon: Heart, page: 'Home' },
  { label: 'Schedule', icon: Calendar, page: 'Schedule' },
  { label: 'Coach', icon: Sparkles, page: 'Coach' },
  { label: 'History', icon: BarChart2, page: 'History' },
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function BottomTabBar({ currentPageName }) {
  const navigate = useNavigate();
  const { currentUser } = useRelationship();

  let tabs = [...BASE_TABS];
  if (currentUser?.role === 'facilitator') {
    tabs = [...BASE_TABS, { label: 'Portal', icon: Users, page: 'FacilitatorPortal' }];
  }
  if (currentUser?.role === 'admin') {
    tabs = [...BASE_TABS, { label: 'Admin', icon: ShieldCheck, page: 'Admin' }];
  }

  const handleTabClick = (e, page) => {
    const active = currentPageName === page;
    if (active) {
      e.preventDefault();
      navigate(createPageUrl(page), { replace: true });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-stone-200/60 select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPageName === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              onClick={(e) => handleTabClick(e, page)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors select-none"
              draggable={false}
            >
              <Icon
                className={`w-5 h-5 select-none ${active ? 'text-stone-800' : 'text-stone-400'}`}
                fill={active && label === 'Moments' ? 'currentColor' : 'none'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium select-none ${active ? 'text-stone-800' : 'text-stone-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}