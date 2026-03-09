import React from 'react';

export default function AdminStatCard({ label, value, sub, color = 'stone', icon: Icon, onClick }) {
  const colorMap = {
    stone: 'bg-stone-50 text-stone-700 border-stone-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red:   'bg-red-50 text-red-700 border-red-200',
    violet:'bg-violet-50 text-violet-700 border-violet-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${colorMap[color]} ${onClick ? 'cursor-pointer hover:brightness-95 active:scale-95 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}