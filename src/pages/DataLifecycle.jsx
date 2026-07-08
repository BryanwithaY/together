import React from 'react';
import { Shield, Archive, Users, Download, History as HistoryIcon, FileClock, CheckCircle2, XCircle } from 'lucide-react';
import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { useSharedHistoryGuard } from '../components/relationship/useSharedHistoryGuard';
import { isOwner as checkOwner } from '../components/lib/permissions';
import {
  getDefaultTrustLevel, getDefaultLifecyclePolicy,
  TRUST_LEVEL_LABELS, TRUST_LEVEL_DESCRIPTIONS, LIFECYCLE_POLICY_LABELS, DATA_PREFERENCE_LABELS,
} from '../components/lib/lifecycleDefaults';
import { usePageLoading } from '../components/PageLoadingContext';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <Icon className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-stone-700 mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function DataLifecycleContent() {
  const { activeRelationship, currentUser, members, myMembership } = useRelationship();
  const { setPageReady } = usePageLoading();
  const myEmail = currentUser?.email?.toLowerCase();
  const { loading: sharedHistoryLoading, hasEvidence: sharedHistoryEvidence } =
    useSharedHistoryGuard(activeRelationship, myEmail);

  React.useEffect(() => { if (!sharedHistoryLoading) setPageReady(); }, [sharedHistoryLoading]);

  if (!activeRelationship) return null;

  const trustLevel = activeRelationship.trust_level || getDefaultTrustLevel(activeRelationship.type);
  const lifecyclePolicy = activeRelationship.lifecycle_policy || getDefaultLifecyclePolicy(trustLevel);
  const activeMembers = members.filter(m => m.status === 'active');

  const isCreator = activeRelationship.created_by_id === currentUser?.id
    || activeRelationship.owner_email?.toLowerCase() === myEmail;
  const otherMemberEmails = (activeRelationship.member_emails || []).filter(e => e?.toLowerCase() !== myEmail);
  const otherMemberIds = (activeRelationship.member_user_ids || []).filter(id => id !== currentUser?.id);
  const otherEverJoined = otherMemberEmails.length > 0 || otherMemberIds.length > 0;
  const hasSharedHistory = otherEverJoined || sharedHistoryEvidence || !!activeRelationship.has_shared_history;
  const canDeleteSolo = isCreator && !sharedHistoryLoading && !hasSharedHistory && lifecyclePolicy !== 'never_destroy' && lifecyclePolicy !== 'archive_only';

  const myPreference = myMembership?.data_preference || 'ask_later';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <RelationshipSwitcher />
          <h1 className="text-lg font-bold text-stone-800 ml-auto">Data &amp; Lifecycle</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm px-5">
          <Row icon={activeRelationship.is_archived ? Archive : CheckCircle2} label="Relationship Status">
            {activeRelationship.is_archived ? 'Archived — read only' : 'Active'}
          </Row>
          <Row icon={Users} label="Members">
            {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
            <span className="text-stone-400"> ({activeMembers.map(m => m.display_name || m.user_email).join(', ')})</span>
          </Row>
          <Row icon={Shield} label="Trust Level">
            <span className="font-medium">{TRUST_LEVEL_LABELS[trustLevel]}</span>
            <p className="text-xs text-stone-400 mt-1">{TRUST_LEVEL_DESCRIPTIONS[trustLevel]}</p>
          </Row>
          <Row icon={FileClock} label="Lifecycle Policy">
            {LIFECYCLE_POLICY_LABELS[lifecyclePolicy]}
          </Row>
          <Row icon={Shield} label="Your Personal Data Preference">
            {DATA_PREFERENCE_LABELS[myPreference]}
          </Row>
          <Row icon={Download} label="Export Permissions">
            {activeRelationship.allow_export !== false ? 'Members can export their data' : 'Export disabled'}
          </Row>
          <Row icon={HistoryIcon} label="Retention Policy">
            {trustLevel === 'permanent_record'
              ? 'Content is retained indefinitely and never unilaterally destroyed.'
              : trustLevel === 'temporary'
              ? 'Content may be destroyed if this space stays solo and its policy allows it.'
              : 'Content is preferably archived rather than destroyed.'}
          </Row>
          <Row icon={hasSharedHistory ? CheckCircle2 : XCircle} label="Shared History Status">
            {sharedHistoryLoading ? 'Checking…' : hasSharedHistory ? 'This space has shared history (permanent)' : 'No shared history yet'}
          </Row>
          <Row icon={Archive} label="Archive Status">
            {activeRelationship.is_archived ? 'Archived' : 'Not archived'}
          </Row>
          <Row icon={canDeleteSolo ? CheckCircle2 : XCircle} label="Deletion Eligibility">
            {sharedHistoryLoading
              ? 'Checking…'
              : canDeleteSolo
              ? 'Eligible — you are the sole creator with no shared history'
              : 'Not eligible — this space has shared history or its policy does not allow destruction'}
          </Row>
          <Row icon={FileClock} label="Pending Approvals">
            None — consent workflows are not yet available.
          </Row>
          <Row icon={HistoryIcon} label="Lifecycle Audit Log">
            Not yet available — coming in a future update.
          </Row>
        </div>

        {isCreator && (
          <p className="text-xs text-stone-400 text-center px-4">
            Trust level and lifecycle policy are set automatically when a space is created. Editing them isn't available yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DataLifecycle() {
  return (
    <RelationshipGate>
      <DataLifecycleContent />
    </RelationshipGate>
  );
}