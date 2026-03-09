import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, CheckCircle2, XCircle, Clock, Users, Mail } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';

export default function FacilitatorConsentManager() {
  const { activeRelationship, currentUser } = useRelationship();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myConsents', activeRelationship?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'get_my_consents',
        relationship_id: activeRelationship?.id
      });
      return res.data?.consents || [];
    },
    enabled: !!activeRelationship?.id
  });

  const approveMutation = useMutation({
    mutationFn: async ({ consent_id, hide_self_reflections }) => {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'approve_consent',
        consent_id,
        hide_self_reflections
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myConsents', activeRelationship?.id] })
  });

  const declineMutation = useMutation({
    mutationFn: async (consent_id) => {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'decline_consent',
        consent_id
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myConsents', activeRelationship?.id] })
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async ({ consent_id, hide_self_reflections }) => {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'update_consent_prefs',
        consent_id,
        hide_self_reflections
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myConsents', activeRelationship?.id] })
  });

  if (isLoading) return null;

  const consents = data || [];
  if (consents.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-400">No facilitators connected to this relationship.</p>
        <p className="text-xs text-stone-400 mt-1">A facilitator can request access, or a relationship admin can invite one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5" /> Facilitator Access Requests
      </p>
      {consents.map(consent => (
        <ConsentCard
          key={consent.id}
          consent={consent}
          onApprove={(hide) => approveMutation.mutate({ consent_id: consent.id, hide_self_reflections: hide })}
          onDecline={() => declineMutation.mutate(consent.id)}
          onUpdatePrefs={(hide) => updatePrefsMutation.mutate({ consent_id: consent.id, hide_self_reflections: hide })}
          isLoading={approveMutation.isPending || declineMutation.isPending || updatePrefsMutation.isPending}
        />
      ))}
    </div>
  );
}

function ConsentCard({ consent, onApprove, onDecline, onUpdatePrefs, isLoading }) {
  const [hideSelfReflections, setHideSelfReflections] = useState(consent.hide_self_reflections || false);
  const [showDetails, setShowDetails] = useState(consent.status === 'pending');

  const fr = consent.facilitator_relationship;

  const statusEl = {
    pending: <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />Pending your approval</span>,
    approved: <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approved</span>,
    declined: <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 flex items-center gap-1"><XCircle className="w-3 h-3" />Declined</span>
  }[consent.status];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${consent.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-stone-800 truncate">{consent.facilitator_email}</p>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {fr?.initiated_by_type === 'relationship_member' ? 'Invited by a relationship admin' : 'Requested access as facilitator'}
          </p>
        </div>
        {statusEl}
      </div>

      {consent.status === 'pending' && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-stone-200 p-3">
            <p className="text-xs font-semibold text-stone-600 mb-1">What will they see?</p>
            <ul className="text-xs text-stone-500 space-y-1">
              <li>· All shared moments in this relationship</li>
              <li>· Comments and interaction history</li>
              {!hideSelfReflections && <li>· Your self-reflection moments</li>}
              {hideSelfReflections && <li className="line-through opacity-50">· Your self-reflection moments</li>}
            </ul>
          </div>

          <button
            onClick={() => setHideSelfReflections(!hideSelfReflections)}
            className="flex items-center gap-2 text-xs text-stone-600 w-full"
          >
            {hideSelfReflections
              ? <EyeOff className="w-4 h-4 text-stone-400" />
              : <Eye className="w-4 h-4 text-stone-400" />}
            <span>{hideSelfReflections ? 'Keep self-reflections hidden from facilitator' : 'Share my self-reflections with facilitator'}</span>
          </button>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(hideSelfReflections)}
              disabled={isLoading}
              className="flex-1 bg-stone-800 hover:bg-stone-900"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approve Access
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDecline}
              disabled={isLoading}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {consent.status === 'approved' && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {showDetails ? 'Hide' : 'Manage'} preferences
        </button>
      )}

      {consent.status === 'approved' && showDetails && (
        <div className="space-y-3 border-t border-stone-100 pt-3">
          <button
            onClick={() => {
              const newVal = !hideSelfReflections;
              setHideSelfReflections(newVal);
              onUpdatePrefs(newVal);
            }}
            className="flex items-center gap-2 text-xs text-stone-600 w-full"
          >
            {hideSelfReflections
              ? <EyeOff className="w-4 h-4 text-stone-400" />
              : <Eye className="w-4 h-4 text-stone-400" />}
            <span>{hideSelfReflections ? 'Self-reflections are hidden from facilitator' : 'Self-reflections are shared with facilitator'}</span>
          </button>
        </div>
      )}
    </div>
  );
}