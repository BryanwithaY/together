import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Star, Check, X } from 'lucide-react';

const INTERVALS = { free: 'Free', month: '/mo', year: '/yr', once: 'one-time' };

function PlanForm({ plan, onSave, onCancel }) {
  const [form, setForm] = useState(plan || {
    name: '', slug: '', description: '', price_usd: 0,
    interval: 'month', stripe_price_id: '', is_active: true, sort_order: 0, highlight: false
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-stone-500">Name</label>
          <input className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Slug (code key)</label>
          <input className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono" value={form.slug} onChange={e => set('slug', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Price (USD)</label>
          <input type="number" className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm" value={form.price_usd} onChange={e => set('price_usd', parseFloat(e.target.value))} />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-500">Interval</label>
          <select className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm" value={form.interval} onChange={e => set('interval', e.target.value)}>
            <option value="free">Free</option>
            <option value="month">Monthly</option>
            <option value="year">Annual</option>
            <option value="once">One-time / Lifetime</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-stone-500">Stripe Price ID</label>
          <input className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm font-mono" placeholder="price_xxx" value={form.stripe_price_id || ''} onChange={e => set('stripe_price_id', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-stone-500">Description</label>
          <input className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-sm" value={form.description || ''} onChange={e => set('description', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
          Active
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.highlight} onChange={e => set('highlight', e.target.checked)} />
          Highlight (recommended)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-stone-500">Sort order:</span>
          <input type="number" className="w-16 px-2 py-1 rounded border border-stone-200 text-sm" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSave(form)}><Check className="w-3.5 h-3.5" /> Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
      </div>
    </div>
  );
}

export default function PlansManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | plan object

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list('sort_order')
  });

  const saveMutation = useMutation({
    mutationFn: (form) => form.id
      ? base44.entities.SubscriptionPlan.update(form.id, form)
      : base44.entities.SubscriptionPlan.create(form),
    onSuccess: () => { qc.invalidateQueries(['admin-plans']); setEditing(null); }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">Plans</h3>
        <Button size="sm" onClick={() => setEditing('new')}><Plus className="w-3.5 h-3.5" /> Add Plan</Button>
      </div>

      {editing === 'new' && (
        <PlanForm onSave={f => saveMutation.mutate(f)} onCancel={() => setEditing(null)} />
      )}

      <div className="space-y-2">
        {plans.map(plan => (
          <div key={plan.id}>
            {editing?.id === plan.id ? (
              <PlanForm plan={plan} onSave={f => saveMutation.mutate({ ...f, id: plan.id })} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center gap-3">
                  {plan.highlight && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800">{plan.name}</span>
                      <span className="font-mono text-xs text-stone-400">{plan.slug}</span>
                      {!plan.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                    <div className="text-xs text-stone-500">
                      {plan.price_usd > 0 ? `$${plan.price_usd}${INTERVALS[plan.interval] || ''}` : 'Free'}
                      {plan.stripe_price_id && <span className="ml-2 font-mono text-stone-400">{plan.stripe_price_id}</span>}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditing(plan)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}