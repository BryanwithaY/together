import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

function IssueRow({ label, description, count, examples }) {
  const [open, setOpen] = useState(false);
  const hasIssues = count > 0;
  return (
    <div className={`rounded-xl border p-3 ${hasIssues ? 'border-amber-200 bg-amber-50' : 'border-stone-100 bg-stone-50'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasIssues
            ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-stone-800">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${hasIssues ? 'text-amber-700' : 'text-emerald-600'}`}>{count}</span>
          {hasIssues && examples?.length > 0 && (
            <button onClick={() => setOpen(v => !v)} className="text-xs text-stone-400 hover:text-stone-600 underline">
              {open ? 'hide' : 'show examples'}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-stone-500 mt-1 ml-6">{description}</p>
      {open && examples?.length > 0 && (
        <div className="mt-2 ml-6 space-y-1">
          {examples.map((ex, i) => (
            <div key={i} className="text-xs font-mono bg-white border border-stone-100 rounded px-2 py-1 text-stone-600">
              id:{ex.id.slice(0, 12)}… type:{ex.type} vis:{ex.visibility} is_private:{String(ex.is_private)} shared:{String(ex.shared_with_partner)} → resolved:{ex.resolved}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrivacyAuditPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('auditMomentPrivacy', {});
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const totalIssues = result
    ? Object.values(result.issues || {}).reduce((sum, v) => sum + (v.count || 0), 0)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Moment Privacy Audit</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Read-only scan of Moment records for privacy field inconsistencies. No data is changed.
          </p>
        </div>
        <Button size="sm" onClick={runAudit} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning…' : 'Run Audit'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border ${
            totalIssues === 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {totalIssues === 0
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {totalIssues === 0
              ? `No inconsistencies found in ${result.sampled} moments`
              : `${totalIssues} inconsistencies across ${result.sampled} sampled moments`}
          </div>

          {/* Coverage stats */}
          <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Field Coverage
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ['Total sampled', result.coverage.total_moments],
                ['is_private=true', result.coverage.with_is_private_true],
                ['visibility field set', result.coverage.with_visibility_set],
                ['Self-reflections', result.coverage.self_reflection_total],
                ['Self-reflections shared', result.coverage.self_reflection_shared],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-stone-500">{label}</span>
                  <span className="font-medium text-stone-800">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved distribution */}
          <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Canonical Resolved Distribution</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(result.resolved_distribution).map(([k, v]) => (
                <div key={k} className="text-center bg-stone-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-stone-700">{v}</p>
                  <p className="text-xs text-stone-400">{k}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Issues</p>
            {Object.entries(result.issues).map(([key, issue]) => (
              <IssueRow
                key={key}
                label={key.replace(/_/g, ' ')}
                description={issue.description}
                count={issue.count}
                examples={issue.examples}
              />
            ))}
          </div>

          <p className="text-xs text-stone-400 text-right">Last run: {new Date(result.run_at).toLocaleString()}</p>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-6 space-y-1">
          <p className="text-sm text-stone-500">No audit data yet</p>
          <p className="text-xs text-stone-400">Click "Run Audit" to scan moment privacy fields</p>
        </div>
      )}
    </div>
  );
}