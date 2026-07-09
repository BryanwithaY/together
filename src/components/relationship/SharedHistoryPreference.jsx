import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { DATA_PREFERENCE_LABELS } from '../lib/lifecycleDefaults';

const PREFERENCE_OPTIONS = ['ask_later', 'retain_on_leave', 'require_approval', 'delete_on_leave'];

// Lets the current user set their own data_preference and acknowledge shared
// history — only ever writes to the caller's own RelationshipMember row.
export default function SharedHistoryPreference({ membership, onUpdated }) {
  const [saving, setSaving] = useState(false);

  if (!membership?.id) return null;

  const preference = membership.data_preference || 'ask_later';
  const acknowledgedAt = membership.shared_history_acknowledged_at;

  const savePreference = async (value) => {
    setSaving(true);
    const updated = await base44.entities.RelationshipMember.update(membership.id, { data_preference: value });
    onUpdated({ ...membership, ...updated, data_preference: value });
    setSaving(false);
  };

  const toggleAcknowledgment = async (checked) => {
    setSaving(true);
    const value = checked ? new Date().toISOString() : null;
    const updated = await base44.entities.RelationshipMember.update(membership.id, { shared_history_acknowledged_at: value });
    onUpdated({ ...membership, ...updated, shared_history_acknowledged_at: value });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-stone-600 mb-2">
          Your preference helps Together understand what you would want if you ever left this space. It only records your wish — it doesn't delete, anonymize, or change anything right now.
        </p>
        <select
          value={preference}
          onChange={(e) => savePreference(e.target.value)}
          disabled={saving}
          className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-white text-stone-900"
        >
          {PREFERENCE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{DATA_PREFERENCE_LABELS[opt]}</option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3 pt-2 border-t border-stone-100">
        <Checkbox
          id="shared-history-ack"
          checked={!!acknowledgedAt}
          disabled={saving}
          onCheckedChange={toggleAcknowledgment}
          className="mt-0.5"
        />
        <label htmlFor="shared-history-ack" className="text-sm text-stone-600 leading-relaxed cursor-pointer">
          I understand that leaving a space does not automatically delete shared history.
        </label>
      </div>

      <p className="text-xs text-stone-400 flex items-center gap-1.5">
        {acknowledgedAt ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Acknowledged on {format(new Date(acknowledgedAt), 'MMM d, yyyy')}
          </>
        ) : (
          'Not acknowledged yet'
        )}
      </p>
    </div>
  );
}