import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  ego_aside: '#f59e0b',
  gratitude: '#10b981',
  self_reflection: '#8b5cf6',
  unknown: '#d6d3d1',
};

const LABELS = {
  ego_aside: 'Ego Aside',
  gratitude: 'Gratitude',
  self_reflection: 'Self Reflection',
};

export default function FeatureUsageChart({ allTime, last30d }) {
  const data = Object.entries(allTime || {})
    .filter(([k]) => !k.includes(':')) // top-level types only
    .map(([key, count]) => ({
      name: LABELS[key] || key,
      key,
      allTime: count,
      last30d: last30d?.[key] || 0,
    }))
    .sort((a, b) => b.allTime - a.allTime);

  if (!data.length) return <p className="text-sm text-stone-400 text-center py-6">No data yet</p>;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
            formatter={(v, name) => [v, name === 'allTime' ? 'All Time' : 'Last 30d']}
          />
          <Bar dataKey="allTime" radius={[4, 4, 0, 0]}>
            {data.map(entry => (
              <Cell key={entry.key} fill={COLORS[entry.key] || '#d6d3d1'} />
            ))}
          </Bar>
          <Bar dataKey="last30d" radius={[4, 4, 0, 0]} fill="#d6d3d1" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center flex-wrap">
        {data.map(d => (
          <div key={d.key} className="flex items-center gap-1.5 text-xs text-stone-500">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.key] || '#d6d3d1' }} />
            {d.name}: <span className="font-semibold text-stone-700">{d.allTime}</span>
            <span className="text-stone-400">({d.last30d} / 30d)</span>
          </div>
        ))}
      </div>
    </div>
  );
}