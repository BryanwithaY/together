import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

export default function StripeReconciliation() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Stripe Subscription Reconciliation</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Compares app subscription records against Stripe live state. Read-only — no data is changed.
          </p>
        </div>
        <Button size="sm" onClick={runReconciliation} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Run Check'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Summary badge */}
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
                : `${result.mismatch_count} of ${result.checked_count} subscriptions have mismatches`
              }
            </span>
          </div>

          {/* Mismatch list */}
          {result.mismatches?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Mismatches</p>
              {result.mismatches.map((m, i) => (
                <div key={i} className="bg-white border border-red-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-stone-800 break-all">{m.user_email}</span>
                    <span className="text-xs text-stone-400 whitespace-nowrap flex-shrink-0">
                      {m.stripe_subscription_id}
                    </span>
                  </div>

                  {/* Issues */}
                  {m.issues.map((issue, j) => (
                    <p key={j} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1 font-mono">
                      {issue}
                    </p>
                  ))}

                  {/* Status comparison */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-50">
                    <div className="text-xs">
                      <span className="text-stone-400">App status: </span>
                      <span className={`font-semibold ${
                        m.app_status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>{m.app_status}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-stone-400">Stripe status: </span>
                      <span className={`font-semibold ${
                        m.stripe_status === 'active' ? 'text-emerald-600' :
                        m.stripe_status === 'RETRIEVAL_FAILED' ? 'text-red-600' : 'text-amber-600'
                      }`}>{m.stripe_status}</span>
                    </div>
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
          <p className="text-xs text-stone-400">Click "Run Check" to compare records against Stripe</p>
        </div>
      )}
    </div>
  );
}