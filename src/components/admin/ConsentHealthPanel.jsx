import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Surfaces FacilitatorRelationship records stuck in pending_approval
 * that are missing their FacilitatorConsent records (PARTIAL_CONSENT_SETUP).
 */
export default function ConsentHealthPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['consentHealth'],
    queryFn: async () => {
      const [facRels, consents] = await Promise.all([
        base44.entities.FacilitatorRelationship.filter({ status: 'pending_approval' }),
        base44.entities.FacilitatorConsent.list('-created_date', 500),
      ]);

      const broken = facRels.filter(fr => {
        const relConsents = consents.filter(c => c.facilitator_relationship_id === fr.id);
        return relConsents.length === 0;
      });

      const partial = facRels.filter(fr => {
        const relConsents = consents.filter(c => c.facilitator_relationship_id === fr.id);
        return relConsents.length > 0 && relConsents.every(c => c.status === 'pending');
      });

      return { broken, partial, total_pending: facRels.length };
    },
    staleTime: 60_000,
  });

  if (isLoading) return <p className="text-sm text-stone-400 py-2">Checking consent health...</p>;

  const { broken = [], partial = [], total_pending = 0 } = data || {};
  const hasIssues = broken.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Consent Health</h4>
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="h-7 px-2 text-stone-400">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!hasIssues ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>All {total_pending} pending relationships have consent records.</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>{broken.length}</strong> relationship{broken.length !== 1 ? 's' : ''} stuck in <code className="text-xs bg-red-100 px-1 rounded">pending_approval</code> with <strong>no consent records</strong> — likely a PARTIAL_CONSENT_SETUP failure.</span>
          </div>
          <div className="space-y-1">
            {broken.map(fr => (
              <div key={fr.id} className="flex items-center justify-between text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium text-stone-700">{fr.relationship_name || fr.relationship_id}</span>
                  <span className="text-stone-400 ml-2">← facilitator: {fr.facilitator_email}</span>
                </div>
                <span className="text-stone-400">{fr.initiated_by_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {partial.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><strong>{partial.length}</strong> relationship{partial.length !== 1 ? 's' : ''} pending — all consent records exist but none approved yet. Normal if recently created.</span>
        </div>
      )}
    </div>
  );
}