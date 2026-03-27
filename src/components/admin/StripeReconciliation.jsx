import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, Webhook } from 'lucide-react';

// Human-readable labels and colors for each mismatch type code
const MISMATCH_LABELS = {
  STATUS_MISMATCH:               { label: 'Status mismatch',                color: 'bg-red-100 text-red-700' },
  PERIOD_END_MISMATCH:           { label: 'Period end mismatch (>1 day)',    color: 'bg-amber-100 text-amber-700' },
  PERIOD_END_MISSING_IN_APP:     { label: 'Period end missing in app',       color: 'bg-amber-100 text-amber-700' },
  CANCELLED_AT_MISSING_IN_APP:   { label: 'Cancelled-at missing in app',     color: 'bg-amber-100 text-amber-700' },
  SUBSCRIPTION_MISSING_IN_STRIPE:{ label: 'Not found in Stripe',             color: 'bg-red-100 text-red-700' },
  STRIPE_LOOKUP_FAILED:          { label: 'Stripe lookup failed',            color: 'bg-red-100 text-red-700' },
};

function MismatchTypeBadge({ code }) {
  const cfg = MISMATCH_LABELS[code] || { label: code, color: 'bg-stone-100 text-stone-600' };
  return (
    <span className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function fmt(isoStr) {
  if (!isoStr) return <span className="text-stone-300">—</span>;
  return new Date(isoStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusChip({ value }) {
  if (!value) return <span className="text-stone-300">—</span>;
  const color = value === 'active' ? 'text-emerald-600' : value === 'canceled' ? 'text-red-600' : 'text-amber-600';
  return <span className={`font-semibold ${color}`}>{value}</span>;
}

export default function StripeReconciliation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Read-only audit run — no writes, no repair actions
  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('reconcileStripeSubscriptions', {});
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Reconciliation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Stripe Subscription Reconciliation</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Read-only comparison of app subscription records against Stripe live state. No data is changed.
          </p>
        </div>
        <Button size="sm" onClick={runReconciliation} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Run Audit'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border ${
            result.mismatch_count === 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {result.mismatch_count === 0
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            }
            <span>
              {result.mismatch_count === 0
                ? `All ${result.checked_count} subscriptions match Stripe`
                : `${result.mismatch_count} of ${result.checked_count} subscriptions have drift`
              }
            </span>
            {result.duration_ms && (
              <span className="ml-auto text-xs opacity-60">{result.duration_ms}ms</span>
            )}
          </div>

          {/* Mismatch cards */}
          {result.mismatches?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Mismatches requiring investigation</p>
              {result.mismatches.map((m, i) => (
                <div key={i} className="bg-white border border-red-100 rounded-xl p-3 space-y-2.5">

                  {/* User + sub ID */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-stone-800 break-all">{m.user_email}</span>
                    <span className="text-xs text-stone-400 font-mono whitespace-nowrap flex-shrink-0">
                      {m.stripe_subscription_id}
                    </span>
                  </div>

                  {/* Mismatch type badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {m.mismatch_types?.map((code, j) => (
                      <MismatchTypeBadge key={j} code={code} />
                    ))}
                  </div>

                  {/* Status + dates comparison grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-stone-100 text-xs">
                    <div>
                      <span className="text-stone-400">App status: </span>
                      <StatusChip value={m.app_status} />
                    </div>
                    <div>
                      <span className="text-stone-400">Stripe status: </span>
                      <StatusChip value={m.stripe_status} />
                    </div>
                    <div>
                      <span className="text-stone-400">App period end: </span>
                      <span className="text-stone-700">{fmt(m.app_current_period_end)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Stripe period end: </span>
                      <span className="text-stone-700">{fmt(m.stripe_current_period_end)}</span>
                    </div>
                    {(m.app_cancelled_at || m.stripe_cancelled_at) && (
                      <>
                        <div>
                          <span className="text-stone-400">App cancelled: </span>
                          <span className="text-stone-700">{fmt(m.app_cancelled_at)}</span>
                        </div>
                        <div>
                          <span className="text-stone-400">Stripe cancelled: </span>
                          <span className="text-stone-700">{fmt(m.stripe_cancelled_at)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Webhook correlation hint */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-stone-100">
                    <Webhook className="w-3 h-3 text-stone-400" />
                    <span className="text-xs text-stone-500">
                      {m.recent_webhook_event_found
                        ? 'Recent webhook event found for this user — check StripeWebhookEvent log for details'
                        : 'No recent processed webhook event found for this user'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-stone-400 text-right">
            Last run: {new Date(result.run_at).toLocaleString()}
          </p>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-6 space-y-1">
          <p className="text-sm text-stone-500">No reconciliation data yet</p>
          <p className="text-xs text-stone-400">Click "Run Audit" to compare records against Stripe live state</p>
        </div>
      )}
    </div>
  );
}