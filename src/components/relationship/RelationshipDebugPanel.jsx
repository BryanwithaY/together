import React, { useState } from 'react';
import { useRelationship } from './RelationshipContext';

// Temporary diagnostic panel — set to false or delete this file + its usage once
// relationship loading is confirmed fixed. Do not ship enabled to real users.
export const SHOW_RELATIONSHIP_DEBUG = true;

export default function RelationshipDebugPanel() {
  const { activeRelationship, debugInfo, error } = useRelationship();
  const [copied, setCopied] = useState(false);

  if (!SHOW_RELATIONSHIP_DEBUG) return null;

  const lines = [
    `user email: ${debugInfo.userEmail ?? '—'}`,
    `user id: ${debugInfo.userId ?? '—'}`,
    `membership count: ${debugInfo.membershipCount ?? '—'}`,
    `relationship ids: ${(debugInfo.relIds || []).join(', ') || '—'}`,
    `Method A count: ${debugInfo.methodACount ?? '—'}`,
    `Method B count: ${debugInfo.methodBCount ?? '(not needed)'}`,
    `final relationships count: ${debugInfo.finalCount ?? '—'}`,
    `final relationship names: ${(debugInfo.finalNames || []).join(', ') || '—'}`,
    `activeRelationship: ${activeRelationship?.name ?? debugInfo.activeRelationshipName ?? '—'}`,
    `context error: ${error || debugInfo.contextError || 'none'}`,
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-3">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-mono text-amber-900 space-y-1">
        <p className="font-semibold text-amber-700 mb-1">⚠ Relationship Debug Panel (temporary)</p>
        {lines.map((l, i) => <p key={i} className="break-all">{l}</p>)}
        <button
          onClick={handleCopy}
          className="mt-2 px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-medium"
        >
          {copied ? 'Copied!' : 'Copy Debug Report'}
        </button>
      </div>
    </div>
  );
}