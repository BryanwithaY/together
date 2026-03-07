import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, CheckCircle2, ExternalLink, RefreshCw, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PLAN_META = {
  free:     { label: 'Free',     icon: Star,   color: 'text-stone-500', bg: 'bg-stone-100' },
  monthly:  { label: 'Monthly',  icon: Zap,    color: 'text-amber-600', bg: 'bg-amber-50'  },
  annual:   { label: 'Annual',   icon: Crown,  color: 'text-violet-600', bg: 'bg-violet-50' },
  lifetime: { label: 'Lifetime', icon: Crown,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SubscriptionSettings() {
  const { subscription, plan, plan_slug, features, isLoading, refetch } = useSubscription();
  const [upgrading, setUpgrading] = useState(null);
  const [portaling, setPortaling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: allPlans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.filter({ is_active: true }),
    staleTime: 10 * 60 * 1000,
  });

  const meta = PLAN_META[plan_slug] || PLAN_META.free;
  const Icon = meta.icon;

  const isCancelled = !!subscription?.cancelled_at;
  const isLifetime = plan_slug === 'lifetime';
  const isPaid = plan_slug !== 'free';
  const renewsAt = subscription?.current_period_end;
  const cancelledAt = subscription?.cancelled_at;
  const paidTotal = subscription?.amount_paid_usd;
  const lastPayment = subscription?.last_payment_at;

  // Plans available to upgrade/switch to
  const upgradePlans = [
    { slug: 'monthly', label: 'Monthly', price: '$7.99/mo', stripe_price_id: plan?.stripe_price_id },
    { slug: 'annual',  label: 'Annual',  price: '$59.99/yr', note: 'Save 37%' },
    { slug: 'lifetime',label: 'Lifetime',price: '$149 once', note: 'Best value' },
  ].filter(p => p.slug !== plan_slug);

  const handleUpgrade = async (targetPlan) => {
    setUpgrading(targetPlan.slug);
    // Fetch the plan from DB to get the stripe_price_id
    const plans = await base44.entities.SubscriptionPlan.filter({ slug: targetPlan.slug });
    const p = plans[0];
    if (!p?.stripe_price_id) { setUpgrading(null); return; }
    const res = await base44.functions.invoke('createCheckoutSession', {
      price_id: p.stripe_price_id,
      plan_slug: p.slug,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setUpgrading(null);
  };

  const handleManageBilling = async () => {
    setPortaling(true);
    const res = await base44.functions.invoke('createBillingPortal');
    if (res.data?.url) window.location.href = res.data.url;
    setPortaling(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await base44.functions.invoke('cancelSubscription');
    await refetch();
    setCancelling(false);
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-stone-100 rounded-xl" />;
  }

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border ${meta.bg} border-stone-200/60`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-800">{plan?.name || meta.label} Plan</span>
            {isCancelled && (
              <Badge className="bg-red-100 text-red-600 border-0 text-xs">Cancels {fmt(renewsAt)}</Badge>
            )}
            {!isCancelled && isPaid && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
            )}
            {!isPaid && (
              <Badge className="bg-stone-100 text-stone-500 border-0 text-xs">Free</Badge>
            )}
          </div>
          {plan?.description && (
            <p className="text-xs text-stone-500 mt-0.5">{plan.description}</p>
          )}
        </div>
      </div>

      {/* Billing Details */}
      {isPaid && (
        <div className="grid grid-cols-2 gap-3">
          {renewsAt && !isCancelled && (
            <div className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <Calendar className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-stone-400">Next billing</p>
                <p className="text-sm font-medium text-stone-700">{fmt(renewsAt)}</p>
              </div>
            </div>
          )}
          {cancelledAt && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-400">Access ends</p>
                <p className="text-sm font-medium text-red-600">{fmt(renewsAt)}</p>
              </div>
            </div>
          )}
          {lastPayment && (
            <div className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <CreditCard className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-stone-400">Last payment</p>
                <p className="text-sm font-medium text-stone-700">{fmt(lastPayment)}</p>
              </div>
            </div>
          )}
          {paidTotal > 0 && (
            <div className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-stone-400">Total paid</p>
                <p className="text-sm font-medium text-stone-700">${paidTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Included Features */}
      {Object.keys(features).length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">What's included</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(features).map(([key, f]) => (
              <div key={key} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg ${f.enabled ? 'text-stone-700' : 'text-stone-300'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${f.enabled ? 'text-emerald-500' : 'text-stone-200'}`} />
                <span>{f.limit_label || f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {!isLifetime && upgradePlans.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            {isPaid ? 'Switch plan' : 'Upgrade'}
          </p>
          <div className="space-y-2">
            {upgradePlans.map(p => (
              <div key={p.slug} className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors">
                <div>
                  <span className="text-sm font-medium text-stone-800">{p.label}</span>
                  <span className="text-sm text-stone-500 ml-2">{p.price}</span>
                  {p.note && <span className="ml-2 text-xs text-emerald-600 font-medium">{p.note}</span>}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleUpgrade(p)}
                  disabled={!!upgrading}
                  className="bg-stone-800 text-white hover:bg-stone-700 text-xs h-7 px-3"
                >
                  {upgrading === p.slug ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Select'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Billing / Cancel */}
      {isPaid && subscription?.stripe_customer_id && (
        <div className="space-y-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageBilling}
            disabled={portaling}
            className="w-full border-stone-200 text-stone-600 hover:bg-stone-50 text-sm"
          >
            {portaling ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
            Manage Payment Method & Invoices
          </Button>

          {!isCancelled && !isLifetime && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full text-center text-xs text-stone-400 hover:text-red-500 transition-colors py-1">
                  Cancel subscription
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll keep access until <strong>{fmt(renewsAt)}</strong>. After that your account reverts to the free plan. Your moments and data will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {cancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}