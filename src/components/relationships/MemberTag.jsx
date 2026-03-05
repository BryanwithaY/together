import React from 'react';
import { X } from 'lucide-react';

export default function MemberTag({ email, displayName, selected, onToggle, color = 'stone' }) {
  const initial = (displayName || email || '?')[0].toUpperCase();
  return (
    <button
      onClick={() => onToggle(email)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
        selected
          ? 'border-stone-800 bg-stone-800 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
      }`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        selected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
      }`}>
        {initial}
      </div>
      <span className="max-w-[100px] truncate">{displayName || email?.split('@')[0]}</span>
      {selected && <X className="w-3 h-3 opacity-70" />}
    </button>
  );
}