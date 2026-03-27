import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Info, Play, Eye } from 'lucide-react';

const TARGET_ENTITIES = [
  'RelationshipMember',
  'FacilitatorRelationship',
  'FacilitatorConsent',
  'UserSubscription',
  'Referral',
];

export default function IdentityMigrationPanel() {
  const [backfillResult, setBackfillResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [runningBackfill, setRunningBackfill] = useState(false);
  const [runningValidation, setRunningValidation] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const [dryRun, setDryRun] = useState(true);

  const runBackfill = async () => {
    setRunningBackfill(true);
    setBackfillResult(null);
    try {
      const res = await base44.functions.invoke('backfillUserIds', {
        batch_size: batchSize,
        dry_run: dryRun,
        entities: TARGET_ENTITIES,
      });
      setBackfillResult(res.data);
    } finally {
      setRunningBackfill(false);
    }
  };

  const runValidation = async () => {
    setRunningValidation(true);
    setValidationResult(null);
    try {
      const res = await base44.functions.invoke('validateUserIdMigration', {
        entities: TARGET_ENTITIES,
        sample_size: 200,
      });
      setValidationResult(res.data);
    } finally {
      setRunningValidation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-800 mb-1">Wave 5 — Identity Migration</h3>
        <p className="text-xs text-stone-500">
          Backfill <code className="bg-stone-100 px-1 rounded">user_id</code> onto existing records and validate email↔id linkage.
          All operations are admin-only. Backfill is non-destructive — only adds <code className="bg-stone-100 px-1 rounded">user_id</code>, never changes emails.
        </p>
      </div>

      {/* ── Backfill section ── */}
      <div className="border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-stone-700">Backfill user_id</h4>
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Write</span>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <label className="flex items-center gap-2 text-xs text-stone-600">
            Batch size:
            <input
              type="number"
              min={1}
              max={200}
              value={batchSize}
              onChange={e => setBatchSize(Math.min(200, Math.max(1, parseInt(e.target.value) || 50)))}
              className="w-16 border border-stone-200 rounded px-2 py-1 text-xs"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
              className="rounded"
            />
            Dry run (preview only, no writes)
          </label>
        </div>

        {dryRun && (
          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Dry run mode: counts what would be updated without making any changes.
          </div>
        )}

        <Button
          size="sm"
          onClick={runBackfill}
          disabled={runningBackfill}
          className={`${dryRun ? 'bg-blue-700 hover:bg-blue-800' : 'bg-amber-700 hover:bg-amber-800'} text-white`}
        >
          {runningBackfill
            ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Running…</>
            : <><Play className="w-3.5 h-3.5 mr-1.5" />{dryRun ? 'Preview Backfill' : 'Run Backfill'}</>
          }
        </Button>

        {backfillResult && (
          <div className="space-y-2 mt-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Backfill result {backfillResult.dry_run ? '(dry run)' : '(live)'}
              {' '}— {backfillResult.total_duration_ms}ms
            </p>
            {backfillResult.results?.map((r, i) => (
              <div key={i} className={`rounded-lg border p-3 text-xs space-y-1 ${r.error ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-stone-700">{r.entity}.{r.id_field}</span>
                  {r.has_more && <span className="text-amber-600 font-medium">More remaining</span>}
                </div>
                {r.error ? (
                  <p className="text-red-600">{r.error}</p>
                ) : (
                  <div className="flex gap-4 text-stone-600">
                    <span>Needs backfill: <b>{r.total_needing_backfill}</b></span>
                    <span>Processed: <b>{r.batch_processed}</b></span>
                    <span className="text-emerald-700">Updated: <b>{r.updated}</b></span>
                    <span>Skipped: <b>{r.skipped}</b></span>
                    <span className="text-amber-700">Unmatched: <b>{r.unmatched}</b></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Validation section ── */}
      <div className="border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-sky-600" />
          <h4 className="text-sm font-semibold text-stone-700">Validate email↔id linkage</h4>
          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">Read-only</span>
        </div>
        <p className="text-xs text-stone-500">
          Compares stored <code className="bg-stone-100 px-1 rounded">user_id</code> against canonical email→id resolution.
          Reports mismatches and backfill coverage only — makes no writes.
        </p>

        <Button
          size="sm"
          variant="outline"
          onClick={runValidation}
          disabled={runningValidation}
          className="border-sky-300 text-sky-700 hover:bg-sky-50"
        >
          {runningValidation
            ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Validating…</>
            : <><Eye className="w-3.5 h-3.5 mr-1.5" />Run Validation</>
          }
        </Button>

        {validationResult && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Validation result — {validationResult.duration_ms}ms
              </p>
              {validationResult.total_mismatches === 0 ? (
                <span className="flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />No mismatches
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5" />{validationResult.total_mismatches} mismatches
                </span>
              )}
            </div>

            {validationResult.summary?.map((s, i) => (
              <div key={i} className={`rounded-lg border p-3 text-xs space-y-1 ${s.error ? 'border-red-200 bg-red-50' : 'border-stone-200 bg-stone-50'}`}>
                <div className="font-mono font-semibold text-stone-700">{s.entity}.{s.id_field}</div>
                {s.error ? (
                  <p className="text-red-600">{s.error}</p>
                ) : (
                  <div className="flex gap-4 flex-wrap text-stone-600">
                    <span>Checked: <b>{s.total_checked}</b></span>
                    <span className="text-emerald-700">Matched: <b>{s.matched}</b></span>
                    <span className={s.mismatched > 0 ? 'text-red-600' : ''}>Mismatched: <b>{s.mismatched}</b></span>
                    <span className="text-amber-700">Needs backfill: <b>{s.backfill_needed}</b></span>
                    <span>Unresolvable: <b>{s.unresolvable_email}</b></span>
                  </div>
                )}
              </div>
            ))}

            {validationResult.mismatches?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Mismatches</p>
                {validationResult.mismatches.map((m, i) => (
                  <div key={i} className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-mono text-red-700 space-y-0.5">
                    <div><span className="text-red-400">entity:</span> {m.entity} / <span className="text-red-400">record:</span> {m.record_id}</div>
                    <div><span className="text-red-400">email:</span> {m.user_email}</div>
                    <div><span className="text-red-400">stored id:</span> {m.stored_user_id}</div>
                    <div><span className="text-red-400">canonical id:</span> {m.canonical_user_id}</div>
                    <div><span className="text-red-400">type:</span> {m.mismatch_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}