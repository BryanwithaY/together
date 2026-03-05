import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRelTypeInfo } from './relationshipUtils';

export default function InvitationBanner({ currentUser }) {
  const queryClient = useQueryClient();
  const myEmail = currentUser?.email?.toLowerCase();

  const { data: invitations = [] } = useQuery({
    queryKey: ['rel-invitations-received', myEmail],
    queryFn: () => base44.entities.RelationshipInvitation.filter({ invitee_email: myEmail, status: 'pending' }),
    enabled: !!myEmail,
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (inv) => {
      // Add user to relationship members
      const rels = await base44.entities.Relationship.filter({ id: inv.relationship_id });
      const rel = rels[0];
      if (rel) {
        const newMembers = [...(rel.member_emails || []), myEmail].filter((e, i, a) => a.indexOf(e) === i);
        await base44.entities.Relationship.update(rel.id, { member_emails: newMembers });
      }
      await base44.entities.RelationshipInvitation.update(inv.id, { status: 'accepted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] });
      queryClient.invalidateQueries({ queryKey: ['rel-invitations-received'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (invId) => base44.entities.RelationshipInvitation.update(invId, { status: 'declined' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rel-invitations-received'] }),
  });

  if (!invitations.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {invitations.map(inv => {
        const typeInfo = getRelTypeInfo(inv.relationship_type);
        const Icon = typeInfo?.icon;
        return (
          <div key={inv.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              {Icon && (
                <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">Invitation received!</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  <span className="font-medium">{inv.inviter_name || inv.inviter_email}</span> invited you to join <span className="font-medium">{inv.relationship_name}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate(inv)}
                disabled={acceptMutation.isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-8 text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => declineMutation.mutate(inv.id)}
                className="flex-1 text-stone-500 hover:text-stone-700 rounded-xl h-8 text-xs border border-stone-200"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}