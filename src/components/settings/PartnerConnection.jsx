import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Mail, CheckCircle, Clock, UserPlus, X } from 'lucide-react';

export default function PartnerConnection({ user }) {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const queryClient = useQueryClient();

  // Check for pending invitation sent by current user
  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['sentInvitations', user?.email],
    queryFn: () => base44.entities.PartnerInvitation.filter({ inviter_email: user?.email }),
    enabled: !!user?.email,
  });

  // Check for pending invitation received by current user
  const { data: receivedInvitations = [] } = useQuery({
    queryKey: ['receivedInvitations', user?.email],
    queryFn: () => base44.entities.PartnerInvitation.filter({ invitee_email: user?.email }),
    enabled: !!user?.email,
  });

  const pendingSent = sentInvitations.find(i => i.status === 'pending');
  const pendingReceived = receivedInvitations.find(i => i.status === 'pending');
  const isConnected = !!user?.partner_email;

  const handleSendInvite = async () => {
    if (!partnerEmail.trim()) return;
    setSending(true);
    try {
      await base44.users.inviteUser(partnerEmail.trim(), 'user');
      await base44.entities.PartnerInvitation.create({
        inviter_email: user.email,
        inviter_name: user.display_name || user.full_name || user.email,
        invitee_email: partnerEmail.trim().toLowerCase(),
        status: 'pending',
      });
      setPartnerEmail('');
      queryClient.invalidateQueries({ queryKey: ['sentInvitations'] });
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (invitation) => {
    // Guard: prevent duplicate acceptance from double-tap or re-render race
    if (accepting) return;
    if (invitation.status !== 'pending') return;
    if (user?.partner_email) return;
    setAccepting(true);
    try {
      await base44.entities.PartnerInvitation.update(invitation.id, { status: 'accepted' });
      await base44.auth.updateMe({ partner_email: invitation.inviter_email });
      queryClient.invalidateQueries({ queryKey: ['receivedInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelInvite = async (invitation) => {
    await base44.entities.PartnerInvitation.delete(invitation.id);
    queryClient.invalidateQueries({ queryKey: ['sentInvitations'] });
  };

  // Already connected
  if (isConnected) {
    return (
      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <Heart className="w-5 h-5 text-emerald-600 fill-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Connected with Partner</p>
          <p className="text-xs text-emerald-600 mt-0.5">{user.partner_email}</p>
        </div>
        <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
      </div>
    );
  }

  // Received a pending invitation
  if (pendingReceived) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Partner invitation received!</p>
              <p className="text-xs text-amber-600 mt-0.5">
                <span className="font-medium">{pendingReceived.inviter_name || pendingReceived.inviter_email}</span> wants to connect with you
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleAccept(pendingReceived)}
            disabled={accepting}
            className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept &amp; Connect
          </Button>
        </div>
      </div>
    );
  }

  // Sent a pending invitation
  if (pendingSent) {
    return (
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-stone-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-700">Invitation sent</p>
            <p className="text-xs text-stone-500 mt-0.5">Waiting for {pendingSent.invitee_email} to accept</p>
          </div>
          <button
            onClick={() => handleCancelInvite(pendingSent)}
            className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
            title="Cancel invitation"
          >
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>
    );
  }

  // No connection yet
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500">Invite your partner to connect and share moments together.</p>
      <div className="flex gap-2">
        <Input
          type="email"
          value={partnerEmail}
          onChange={(e) => setPartnerEmail(e.target.value)}
          placeholder="Partner's email address"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
        />
        <Button
          onClick={handleSendInvite}
          disabled={sending || !partnerEmail.trim()}
          className="bg-stone-800 hover:bg-stone-900 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {sending ? 'Sending…' : 'Invite'}
        </Button>
      </div>
    </div>
  );
}