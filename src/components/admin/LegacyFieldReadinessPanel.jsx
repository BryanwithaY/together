import React, { useState } from 'react';

/**
 * Wave 7 — Read-only legacy field removal readiness summary.
 * Admin-only. No writes. No sensitive content.
 * Documents field candidates for future cleanup waves.
 */

const STATUS = {
  NOT_READY: { label: 'Not Ready', color: 'bg-red-100 text-red-700' },
  PENDING:   { label: 'Pending Validation', color: 'bg-amber-100 text-amber-700' },
  READY:     { label: 'Ready to Remove', color: 'bg-green-100 text-green-700' },
};

const CANDIDATES = [
  {
    field: 'Moment.reviewed_by',
    entity: 'Moment',
    status: 'PENDING',
    active_reads: [
      'MomentCard: isReviewed = !!(moment.reviewed_by || moment.reviews?.length) — reads both, tolerates both',
      'getAdminStats: m.reviewed_by || (m.reviews && m.reviews.length > 0) — reads both',
    ],
    active_writes: [
      'MomentCard markReviewedMutation: dual-writes reviewed_by AND reviews simultaneously',
    ],
    blocker: 'Active reads still check reviewed_by as fallback. Safe to remove only after all records have reviews array populated and all read paths drop the reviewed_by check.',
    migration_path: 'Backfill reviews array from reviewed_by on existing records, then remove reviewed_by fallback from MomentCard and getAdminStats reads.',
  },
  {
    field: 'RelationshipMember.user_email (for current-user lookup)',
    entity: 'RelationshipMember',
    status: 'PENDING',
    active_reads: [
      'RelationshipContext: fetchMyMemberships — now id-primary with email fallback (Wave 6)',
      'RelationshipSettings: member.user_email used for display and "isMe" check',
      'Various components: member.user_email used for display names',
    ],
    active_writes: [
      'RelationshipSettings handleInvite: writes user_email on new member records',
    ],
    blocker: 'user_email still used for display (member names). Backfill is confirmed 100% complete (validated 2026-04-29, 0 mismatches, 0 backfill_needed). Email fallback in fetchMyMemberships can now be removed. Cannot drop user_email entirely until display layer is updated to use a separate display_name source.',
    migration_path: 'Remove fetchMyMemberships email fallback. Keep user_email for display until a proper display_name field is standardised.',
  },
  {
    field: 'Moment.is_private (redundant with visibility)',
    entity: 'Moment',
    status: 'NOT_READY',
    active_reads: [
      'MomentCard: isPrivate = moment.is_private && !moment.shared_with_partner',
      'permissions.js canViewMoment: resolved via canonical resolver (Wave 7 aligned)',
      'momentPrivacyResolver.js resolveVisibility: is_private is highest-precedence flag',
      'filterMomentsForFacilitator.js: reads is_private',
      'auditMomentPrivacy.js: audits is_private field coverage',
    ],
    active_writes: [
      'MomentCard shareWithPartnerMutation: sets is_private: false when sharing',
      'MomentForm: sets is_private on self-reflection creation',
    ],
    blocker: 'is_private is the highest-precedence flag in the canonical resolver. Removing it would require all private moments to have visibility="private" set correctly. Field is load-bearing in both frontend and backend privacy logic.',
    migration_path: 'Not recommended until a full audit confirms all is_private=true records also have visibility="private". Would require a careful schema migration and resolver update.',
  },
  {
    field: 'FacilitatorRelationship.relationship_name (cached display)',
    entity: 'FacilitatorRelationship',
    status: 'NOT_READY',
    active_reads: [
      'FacilitatorRelationshipCard and FacilitatorRelationshipDetail: read relationship_name for display',
    ],
    active_writes: [
      'manageFacilitatorAccess: writes relationship_name on access request creation',
    ],
    blocker: 'No relationship rename path exists in the current UI — there is no name-edit form in RelationshipSettings. Drift risk is therefore low but not zero. If a rename path is added, a sync-on-write update to FacilitatorRelationship records would be needed.',
    migration_path: 'If a rename path is ever added: update manageFacilitatorAccess or add an entity automation to sync relationship_name on Relationship update events.',
  },
];

function StatusBadge({ status }) {
  const { label, color } = STATUS[status] || STATUS.PENDING;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function CandidateCard({ c }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-stone-200 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusBadge status={c.status} />
          <span className="text-sm font-mono font-medium text-stone-700 truncate">{c.field}</span>
        </div>
        <span className="text-stone-400 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-xs text-stone-600 border-t border-stone-100">
          <div className="pt-3">
            <p className="font-semibold text-stone-500 uppercase tracking-wider mb-1">Active Reads</p>
            <ul className="space-y-0.5 list-disc ml-4">
              {c.active_reads.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-stone-500 uppercase tracking-wider mb-1">Active Writes</p>
            <ul className="space-y-0.5 list-disc ml-4">
              {c.active_writes.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="font-semibold text-amber-700 mb-1">Blocker</p>
            <p>{c.blocker}</p>
          </div>
          <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
            <p className="font-semibold text-stone-500 mb-1">Migration Path</p>
            <p>{c.migration_path}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegacyFieldReadinessPanel() {
  const ready = CANDIDATES.filter(c => c.status === 'READY').length;
  const pending = CANDIDATES.filter(c => c.status === 'PENDING').length;
  const notReady = CANDIDATES.filter(c => c.status === 'NOT_READY').length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-700">Legacy Field Removal Readiness</h3>
        <p className="text-xs text-stone-400 mt-0.5">Read-only. Wave 7 structured summary of field candidates for future cleanup.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-green-700">{ready}</p>
          <p className="text-xs text-green-600">Ready</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-red-700">{notReady}</p>
          <p className="text-xs text-red-600">Not Ready</p>
        </div>
      </div>

      <div className="space-y-2">
        {CANDIDATES.map((c, i) => <CandidateCard key={i} c={c} />)}
      </div>

      <p className="text-xs text-stone-400 italic">This panel is read-only. No fields have been removed. All fields remain active.</p>
    </div>
  );
}