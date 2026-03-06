import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useRelationship } from '../relationship/RelationshipContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, HandHeart, ShieldAlert, Flame, Star } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const TYPE_CONFIG = {
  ego_aside:      { label: 'Ego Aside',      color: '#f59e0b', icon: HandHeart },
  gratitude:      { label: 'Gratitude',       color: '#10b981', icon: Sparkles },
  self_reflection:{ label: 'Self Reflection', color: '#8b5cf6', icon: ShieldAlert },
};

function StatPill({ icon: Icon, label, count, color }) {
  return (
    <div className="flex items-center gap-2.5 bg-white border border-stone-100 rounded-2xl px-4 py-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-stone-800 leading-none">{count}</p>
        <p className="text-xs text-stone-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StreakBadge({ streak }) {
  if (!streak) return null;
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <Flame className="w-5 h-5 text-amber-500" />
      <div>
        <p className="text-xl font-bold text-amber-700 leading-none">{streak}</p>
        <p className="text-xs text-amber-600 mt-0.5">day streak</p>
      </div>
    </div>
  );
}

export default function PersonalStats({ user }) {
  const { activeRelationship } = useRelationship();

  const { data: moments = [] } = useQuery({
    queryKey: ['personalMoments', activeRelationship?.id, user?.email],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: activeRelationship.id }, '-date', 500),
    enabled: !!activeRelationship?.id && !!user?.email,
    staleTime: 5 * 60_000,
  });

  // Only moments by this user
  const mine = moments.filter(m => m.created_by === user?.email && !m.is_demo);

  // Totals by type
  const totals = mine.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});

  // Last 6 months bar chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d).toISOString();
    const end   = endOfMonth(d).toISOString();
    const count = mine.filter(m => m.date >= start && m.date <= end).length;
    return { month: format(d, 'MMM'), count };
  });

  // Streak: consecutive days with at least 1 moment
  const streak = (() => {
    const days = new Set(mine.map(m => m.date?.slice(0, 10)));
    let s = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    while (days.has(d.toISOString().slice(0, 10))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  // Most-used ego aside subtype
  const topSubtype = mine
    .filter(m => m.type === 'ego_aside' && m.subtype)
    .reduce((acc, m) => { acc[m.subtype] = (acc[m.subtype] || 0) + 1; return acc; }, {});
  const topEgoSubtype = Object.entries(topSubtype).sort((a, b) => b[1] - a[1])[0];

  if (!mine.length) {
    return (
      <div className="text-center py-8 text-stone-400 text-sm">
        Log your first moment to see your stats here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview pills */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <StatPill key={type} icon={cfg.icon} label={cfg.label} count={totals[type] || 0} color={cfg.color} />
        ))}
        <StreakBadge streak={streak} />
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Last 6 months</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
              formatter={(v) => [v, 'moments']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, i) => (
                <Cell key={i} fill={entry.count > 0 ? '#292524' : '#e7e5e4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top subtype */}
      {topEgoSubtype && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Your most-logged ego aside type: <span className="font-semibold">{topEgoSubtype[0].replace(/_/g, ' ')}</span>
            <span className="text-amber-500 ml-1">({topEgoSubtype[1]}x)</span>
          </p>
        </div>
      )}
    </div>
  );
}