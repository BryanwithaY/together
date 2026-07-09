import React, { useState } from 'react';
import { Shield, Archive, Users, Download, LogOut, Lock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { useSharedHistoryGuard } from '../components/relationship/useSharedHistoryGuard';
import {
  getDefaultTrustLevel, getDefaultLifecyclePolicy,
  TRUST_LEVEL_LABELS, TRUST_LEVEL_DESCRIPTIONS,
} from '../components/lib/lifecycleDefaults';
import { usePageLoading } from '../components/PageLoadingContext';
import SharedHistoryPreference from '../components/relationship/SharedHistoryPreference';

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-stone-800 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <Icon className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
        <div className="text-sm text-stone-700 mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function DataLifecycleContent() {
  const { activeRelationship, currentUser, members, myMembership: myMembershipFromContext } = useRelationship();
  const [myMembership, setMyMembership] = useState(myMembershipFromContext);
  const { setPageReady } = usePageLoading();

  React.useEffect(() => { setMyMembership(myMembershipFromContext); }, [myMembershipFromContext]);
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
  const canDeleteSolo = isCreator && !sharedHistoryLoading && !hasSharedHistory
    && lifecyclePolicy !== 'never_destroy' && lifecyclePolicy !== 'archive_only';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <RelationshipSwitcher />
          <h1 className="text-lg font-bold text-stone-800 ml-auto">Shared History</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Why this exists */}
        <div className="bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl border border-stone-200/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-800">Why this exists</h2>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            Relationships change. This space may eventually contain years of memories, reflections, schedules, conversations, and history.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mt-2">
            Together separates leaving a relationship from deleting its history, so no one can unexpectedly erase something you built together.
          </p>
          <p className="text-sm font-medium text-stone-700 mt-3 italic">
            The cost of accidentally preserving memories is far lower than the cost of accidentally destroying them.
          </p>
        </div>

        {/* 1. This Relationship */}
        <Section title="This Relationship">
          <Row icon={activeRelationship.is_archived ? Archive : CheckCircle2} label="Status">
            {activeRelationship.is_archived ? 'Archived — read only' : 'Active'}
          </Row>
          <Row icon={Shield} label="Trust Level">
            <span className="font-medium">{TRUST_LEVEL_LABELS[trustLevel]}</span>
            <p className="text-xs text-stone-400 mt-1">{TRUST_LEVEL_DESCRIPTIONS[trustLevel]}</p>
          </Row>
          <Row icon={Users} label="Members">
            {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
            <span className="text-stone-400"> ({activeMembers.map(m => m.display_name || m.user_email).join(', ')})</span>
          </Row>
          <Row icon={hasSharedHistory ? CheckCircle2 : XCircle} label="Shared History">
            {sharedHistoryLoading ? 'Checking…' : hasSharedHistory ? 'This space has shared history' : 'No shared history yet'}
          </Row>
        </Section>

        {/* 2. Your Data */}
        <Section title="Your Data">
          <Row icon={Download} label="Export Permissions">
            {activeRelationship.allow_export !== false ? 'You can export your data' : 'Export is disabled for this space'}
          </Row>
          <p className="text-xs text-stone-400 mt-2 mb-4">
            You own your contributions. Future tools will let you review, export, or request changes to your own data.
          </p>
        </Section>

        {/* Your Preference — editable, own row only */}
        <Section title="Your Preference">
          <SharedHistoryPreference membership={myMembership} onUpdated={setMyMembership} />
        </Section>

        {/* 3. If Someone Leaves */}
        <Section title="If Someone Leaves">
          <div className="flex items-start gap-3">
            <LogOut className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-stone-600 leading-relaxed">
              Leaving changes membership. It does not automatically delete shared history.
            </p>
          </div>
        </Section>

        {/* 4. If This Space Is Archived */}
        <Section title="If This Space Is Archived">
          <div className="flex items-start gap-3">
            <Archive className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-stone-600 leading-relaxed">
              Archiving makes the space inactive and read-only. Nothing is deleted, and the space can be restored.
            </p>
          </div>
        </Section>

        {/* 5. If This Space Is Destroyed */}
        <Section title="If This Space Is Destroyed">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-stone-600 leading-relaxed">
              {sharedHistoryLoading
                ? 'Checking eligibility…'
                : canDeleteSolo
                ? "This space is eligible for deletion — you're its sole creator and it has no shared history yet."
                : 'This space cannot be deleted by one person because it has shared history. Destruction would require a future consent workflow.'}
            </p>
          </div>
        </Section>

        {/* 6. Future Tools */}
        <Section title="Future Tools">
          <Row icon={Users} label="Consent Workflows">Not yet available</Row>
          <Row icon={Shield} label="Lifecycle Audit Log">Not yet available</Row>
          <Row icon={Download} label="Personal Data Requests">Not yet available</Row>
        </Section>

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