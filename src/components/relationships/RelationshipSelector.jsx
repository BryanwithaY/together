import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getRelTypeInfo } from './relationshipUtils';

export default function RelationshipSelector({ relationships, activeRel, onSelect }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const typeInfo = activeRel ? getRelTypeInfo(activeRel.type) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
      >
        {typeInfo && (
          <div className={`w-5 h-5 rounded-md ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
            {React.createElement(typeInfo.icon, { className: `w-3 h-3 ${typeInfo.color}` })}
          </div>
        )}
        <span className="text-sm font-semibold text-stone-700 max-w-[140px] truncate">
          {activeRel?.name || 'Select…'}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-stone-200 min-w-[220px] overflow-hidden"
            >
              <div className="p-2 space-y-0.5">
                {relationships.map(rel => {
                  const info = getRelTypeInfo(rel.type);
                  const Icon = info.icon;
                  const isActive = activeRel?.id === rel.id;
                  return (
                    <button
                      key={rel.id}
                      onClick={() => { onSelect(rel); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isActive ? 'bg-stone-100' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl ${info.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${info.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{rel.name}</p>
                        <p className="text-xs text-stone-400">{info.label} · {(rel.member_emails || []).length} members</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(createPageUrl(`RelationshipSettings?id=${rel.id}`)); setOpen(false); }}
                        className="p-1 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-stone-100 p-2">
                <button
                  onClick={() => { navigate(createPageUrl('CreateRelationship')); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-stone-500" />
                  </div>
                  <span className="text-sm font-medium text-stone-600">New Relationship</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}