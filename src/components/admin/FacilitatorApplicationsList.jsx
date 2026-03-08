import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Briefcase, Heart, ChevronDown, ChevronUp } from 'lucide-react';

export default function FacilitatorApplicationsList() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['facilitatorApplications'],
    queryFn: () => base44.entities.FacilitatorApplication.list('-created_date', 100),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ application }) => {
      // Update application status
      await base44.entities.FacilitatorApplication.update(application.id, {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      });
      // Update user role and type
      const users = await base44.asServiceRole?.entities?.User?.filter?.({ email: application.applicant_email }) ||
        await base44.entities.User.filter({ email: application.applicant_email });
      if (users?.length) {
        await base44.entities.User.update(users[0].id, {
          role: 'facilitator',
          facilitator_type: application.facilitator_type,
          facilitator_tier: application.facilitator_type === 'personal' ? 'pro' : 'free',
          facilitator_approved_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facilitatorApplications'] })
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.FacilitatorApplication.update(id, {
      status: 'rejected',
      reviewed_at: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facilitatorApplications'] })
  });

  const pending = applications.filter(a => a.status === 'pending');
  const reviewed = applications.filter(a => a.status !== 'pending');

  const statusBadge = (status) => {
    if (status === 'approved') return <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">Approved</span>;
    if (status === 'rejected') return <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-medium">Rejected</span>;
    return <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
  };

  if (isLoading) return <p className="text-sm text-stone-400 py-4">Loading applications...</p>;

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Pending Review ({pending.length})</p>
          <div className="space-y-2">
            {pending.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                expanded={expanded === app.id}
                onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                onApprove={() => approveMutation.mutate({ application: app })}
                onReject={() => rejectMutation.mutate(app.id)}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
                statusBadge={statusBadge}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <p className="text-sm text-stone-400 py-4 text-center">No pending applications.</p>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-4">Reviewed ({reviewed.length})</p>
          <div className="space-y-2">
            {reviewed.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                expanded={expanded === app.id}
                onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                statusBadge={statusBadge}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app, expanded, onToggle, onApprove, onReject, isLoading, statusBadge }) {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
          {app.facilitator_type === 'professional'
            ? <Briefcase className="w-4 h-4 text-stone-500" />
            : <Heart className="w-4 h-4 text-stone-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{app.applicant_email}</p>
          <p className="text-xs text-stone-400 capitalize">{app.facilitator_type} {app.professional_role ? `— ${app.professional_role}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {statusBadge(app.status)}
          {expanded ? <ChevronUp className="w-4 h-4 text-stone-300" /> : <ChevronDown className="w-4 h-4 text-stone-300" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 p-4 bg-stone-50 space-y-3">
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-1">Background</p>
            <p className="text-sm text-stone-700">{app.bio}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-1">Motivation</p>
            <p className="text-sm text-stone-700">{app.motivation}</p>
          </div>
          <p className="text-xs text-stone-400">
            Applied {new Date(app.created_date).toLocaleDateString()}
            {app.reviewed_at && ` · Reviewed ${new Date(app.reviewed_at).toLocaleDateString()}`}
          </p>
          {app.status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isLoading}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}