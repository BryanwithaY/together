import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#78716c', '#a8a29e', '#d6d3d1', '#57534e', '#292524'];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-stone-800">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function RevenueOverview() {
  const { data: subscribers = [] } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => base44.entities.UserSubscription.list()
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const active = subscribers.filter(s => s.status === 'active');
  const cancelled = subscribers.filter(s => s.status === 'cancelled');
  const pastDue = subscribers.filter(s => s.status === 'past_due');

  const totalRevenue = subscribers.reduce((sum, s) => sum + (s.amount_paid_usd || 0), 0);

  // MRR estimate — count monthly subs + annual/12
  const mrr = active.reduce((sum, s) => {
    const plan = plans.find(p => p.slug === s.plan_slug);
    if (!plan || plan.interval === 'free') return sum;
    if (plan.interval === 'month') return sum + (plan.price_usd || 0);
    if (plan.interval === 'year') return sum + (plan.price_usd || 0) / 12;
    return sum;
  }, 0);

  // By plan breakdown
  const byPlan = plans.map(plan => ({
    name: plan.name,
    count: subscribers.filter(s => s.plan_slug === plan.slug).length,
    revenue: subscribers.filter(s => s.plan_slug === plan.slug).reduce((sum, s) => sum + (s.amount_paid_usd || 0), 0)
  })).filter(p => p.count > 0);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-stone-800">Revenue Overview</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard label="Est. MRR" value={`$${mrr.toFixed(2)}`} sub="monthly recurring" />
        <StatCard label="Active Subscribers" value={active.length} sub={`${cancelled.length} cancelled`} />
        <StatCard label="Past Due" value={pastDue.length} sub="needs attention" />
      </div>

      {byPlan.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="text-sm font-medium text-stone-700 mb-3">Subscribers by Plan</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byPlan} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4', fontSize: 12 }}
                formatter={(v, n) => [v, n === 'count' ? 'Subscribers' : 'Revenue ($)']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50 text-xs font-medium text-stone-500 grid grid-cols-4">
          <span>Plan</span><span className="text-center">Subscribers</span><span className="text-center">Active</span><span className="text-right">Total Revenue</span>
        </div>
        {byPlan.map(row => (
          <div key={row.name} className="px-4 py-2.5 border-b border-stone-50 last:border-0 text-sm grid grid-cols-4">
            <span className="font-medium text-stone-700">{row.name}</span>
            <span className="text-center text-stone-600">{row.count}</span>
            <span className="text-center text-stone-400">
              {subscribers.filter(s => s.plan_slug === plans.find(p => p.name === row.name)?.slug && s.status === 'active').length}
            </span>
            <span className="text-right font-medium text-stone-700">${row.revenue.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}