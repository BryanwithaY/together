import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-500',
  past_due: 'bg-red-100 text-red-600',
  trialing: 'bg-blue-100 text-blue-600',
  paused: 'bg-amber-100 text-amber-600'
};

function SubscriberRow({ sub, plans }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const plan = plans.find(p => p.slug === sub.plan_slug);

  const updateNote = useMutation({
    mutationFn: (notes) => base44.entities.UserSubscription.update(sub.id, { notes }),
    onSuccess: () => qc.invalidateQueries(['admin-subscribers'])
  });

  return (
    <div className="border-b border-stone-100 last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-stone-800 text-sm truncate">{sub.user_email}</div>
          <div className="text-xs text-stone-400">{plan?.name || sub.plan_slug}</div>
        </div>
        <Badge className={`text-xs ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</Badge>
        <div className="text-sm font-medium text-stone-700 w-16 text-right">
          {sub.amount_paid_usd ? `$${sub.amount_paid_usd.toFixed(2)}` : '—'}
        </div>
        <div className="text-xs text-stone-400 w-24 text-right hidden sm:block">
          {sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM d, yyyy') : '—'}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </div>

      {open && (
        <div className="px-4 pb-4 bg-stone-50 border-t border-stone-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              ['Stripe Customer', sub.stripe_customer_id || '—'],
              ['Stripe Subscription', sub.stripe_subscription_id || '—'],
              ['Period Start', sub.current_period_start ? format(new Date(sub.current_period_start), 'MMM d, yyyy') : '—'],
              ['Period End', sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM d, yyyy') : '—'],
              ['Last Payment', sub.last_payment_at ? format(new Date(sub.last_payment_at), 'MMM d, yyyy') : '—'],
              ['Cancelled', sub.cancelled_at ? format(new Date(sub.cancelled_at), 'MMM d, yyyy') : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-stone-400">{k}</div>
                <div className="font-mono text-stone-600 truncate">{v}</div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-stone-400">Admin Notes</label>
            <textarea
              className="w-full mt-1 px-3 py-2 rounded-lg border border-stone-200 text-xs resize-none h-16"
              defaultValue={sub.notes || ''}
              onBlur={e => e.target.value !== (sub.notes || '') && updateNote.mutate(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscribersList() {
  const [search, setSearch] = useState('');

  const { data: subscribers = [] } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => base44.entities.UserSubscription.list('-created_date')
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list()
  });

  const filtered = subscribers.filter(s =>
    !search || s.user_email?.toLowerCase().includes(search.toLowerCase()) || s.plan_slug?.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">Subscribers ({subscribers.length})</h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-48"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 overflow-hidden bg-white">
        <div className="flex items-center gap-3 px-4 py-2 bg-stone-50 border-b border-stone-200 text-xs font-medium text-stone-500">
          <div className="flex-1">User</div>
          <div className="w-20">Status</div>
          <div className="w-16 text-right">Paid</div>
          <div className="w-24 text-right hidden sm:block">Renews</div>
          <div className="w-4"></div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-stone-400">No subscribers yet</div>
        ) : (
          filtered.map(sub => <SubscriberRow key={sub.id} sub={sub} plans={plans} />)
        )}
      </div>
    </div>
  );
}