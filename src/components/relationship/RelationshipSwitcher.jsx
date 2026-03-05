import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check, Users, Heart, Handshake, Baby, PersonStanding, Briefcase, UserRound } from 'lucide-react';
import { useRelationship } from './RelationshipContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TYPE_ICONS = {
  romantic_partner: Heart,
  romantic_group: Heart,
  friends: UserRound,
  friend_group: Users,
  parent_adult_child: Baby,
  siblings: Users,
  family: PersonStanding,
  co_parents: Users,
  business_partners: Briefcase,
  cofounders: Handshake,
  other: Users,
};

const TYPE_LABELS = {
  romantic_partner: 'Romantic Partners',
  romantic_group: 'Romantic Group',
  friends: 'Friends',
  friend_group: 'Friend Group',
  parent_adult_child: 'Parent & Adult Child',
  siblings: 'Siblings',
  family: 'Family',
  co_parents: 'Co-Parents',
  business_partners: 'Business Partners',
  cofounders: 'Co-Founders',
  other: 'Relationship',
};

export default function RelationshipSwitcher() {
  const [open, setOpen] = useState(false);
  const { activeRelationship, myRelationships, setActiveRelationship } = useRelationship();
  const navigate = useNavigate();

  if (!activeRelationship) return null;

  const Icon = TYPE_ICONS[activeRelationship.type] || Users;
  const typeLabel = TYPE_LABELS[activeRelationship.type] || 'Relationship';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-stone-100 hover:bg-stone-200 transition-colors"
      >
        {activeRelationship.photo_url ? (
          <img src={activeRelationship.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
        ) : (
          <Icon className="w-4 h-4 text-stone-600 flex-shrink-0" />
        )}
        <div className="text-left">
          <p className="text-xs font-semibold text-stone-800 leading-tight">{activeRelationship.name}</p>
          <p className="text-[10px] text-stone-500 leading-tight">{typeLabel}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-stone-200/60 min-w-[220px] py-2 overflow-hidden"
            >
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-4 py-1">Your Spaces</p>
              {myRelationships.map(rel => {
                const RIcon = TYPE_ICONS[rel.type] || Users;
                const isActive = activeRelationship?.id === rel.id;
                return (
                  <button
                    key={rel.id}
                    onClick={async () => {
                      await setActiveRelationship(rel);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors ${isActive ? 'bg-stone-50' : ''}`}
                  >
                    {rel.photo_url ? (
                      <img src={rel.photo_url} alt="" className="w-7 h-7 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <RIcon className="w-3.5 h-3.5 text-stone-500" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{rel.name}</p>
                      <p className="text-xs text-stone-400">{TYPE_LABELS[rel.type]}</p>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-stone-600 flex-shrink-0" />}
                  </button>
                );
              })}
              <div className="border-t border-stone-100 mt-1 pt-1">
                <button
                  onClick={() => { setOpen(false); navigate(createPageUrl('RelationshipSetup')); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-stone-500" />
                  </div>
                  <span className="text-sm font-medium">New Space</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}