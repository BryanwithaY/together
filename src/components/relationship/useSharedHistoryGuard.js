import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Determines whether a relationship has any durable evidence of shared participation
// (beyond the current member arrays) — moments or schedules authored/attended by someone
// else. If evidence is found and the record isn't already flagged, permanently ratchets
// has_shared_history to true so it can never be missed again, even if members later leave.
export function useSharedHistoryGuard(relationship, myEmail) {
  const [loading, setLoading] = useState(true);
  const [hasEvidence, setHasEvidence] = useState(!!relationship?.has_shared_history);

  useEffect(() => {
    let cancelled = false;
    if (!relationship?.id) return;

    setLoading(true);
    (async () => {
      if (relationship.has_shared_history) {
        if (!cancelled) { setHasEvidence(true); setLoading(false); }
        return;
      }

      const [moments, schedules] = await Promise.all([
        base44.entities.Moment.filter({ relationship_id: relationship.id }, '-date', 200),
        base44.entities.ScheduledConnection.filter({ relationship_id: relationship.id }, '-start_time', 200),
      ]);

      const otherMoment = moments.some(m => m.created_by?.toLowerCase() !== myEmail);
      const otherSchedule = schedules.some(s =>
        s.created_by?.toLowerCase() !== myEmail
        || (s.attendee_emails || []).some(e => e?.toLowerCase() !== myEmail)
        || Object.keys(s.attendance_by_user || {}).some(e => e?.toLowerCase() !== myEmail)
      );
      const evidence = otherMoment || otherSchedule;

      if (evidence && !cancelled) {
        // One-way ratchet — never reset, only the creator can write this (Relationship update RLS).
        base44.entities.Relationship.update(relationship.id, { has_shared_history: true }).catch(() => {});
      }

      if (!cancelled) {
        setHasEvidence(evidence);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [relationship?.id, relationship?.has_shared_history, myEmail]);

  return { loading, hasEvidence };
}