import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus, Trash2, ShieldCheck, ShieldOff, Mail, Clock, X, Check, Crown, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { RELATIONSHIP_TYPES_MAP } from '../components/relationships/relationshipUtils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function RelationshipSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const relId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setSending] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: relationship, isLoading } = useQuery({
    queryKey: ['relationship', relId],
    queryFn: () => base44.entities.Relationship.filter({ id: relId }).then(r => r[0]),
    enabled: !!relId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['rel-invitations', relId],
    queryFn: () => base44.entities.RelationshipInvitation.filter({ relationship_id: relId }),
    enabled: !!relId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const myEmail = currentUser?.email?.toLowerCase();
  const isAdmin = relationship?.admin_emails?.includes(myEmail) || relationship?.owner_email === myEmail;
  const isOwner = relationship?.owner_email === myEmail;
  const members = relationship?.member_emails || [];
  const maxMembers = relationship?.max_members || 2;
  const canInviteMore = members.length < maxMembers;

  const pendingInvites = invitations.filter(i => i.status === 'pending');

  const getUserName = (email) => {
    const u = allUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    return u?.full_name || u?.display_name || email?.split('@')[0] || email;
  };

  const updateRelMutation = useMutation({
    mutationFn: (data) => base44.entities.Relationship.update(relId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['relationship', relId] }),
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !isAdmin) return;
    setSending(true);
    const email = inviteEmail.trim().toLowerCase();
    await base44.users.inviteUser(email, 'user');
    await base44.entities.RelationshipInvitation.create({
      relationship_id: relId,
      relationship_name: relationship.name,
      relationship_type: relationship.type,
      inviter_email: myEmail,
      inviter_name: currentUser?.full_name || currentUser?.email,
      invitee_email: email,
      status: 'pending',
    });
    setInviteEmail('');
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ['rel-invitations', relId] });
  };

  const handleRemoveMember = async (email) => {
    const newMembers = members.filter(e => e !== email);
    const newAdmins = (relationship.admin_emails || []).filter(e => e !== email);
    await updateRelMutation.mutateAsync({ member_emails: newMembers, admin_emails: newAdmins });
  };

  const handleToggleAdmin = async (email) => {
    const admins = relationship.admin_emails || [];
    const newAdmins = admins.includes(email) ? admins.filter(e => e !== email) : [...admins, email];
    await updateRelMutation.mutateAsync({ admin_emails: newAdmins });
  };

  const handleCancelInvite = async (invId) => {
    await base44.entities.RelationshipInvitation.delete(invId);
    queryClient.invalidateQueries({ queryKey: ['rel-invitations', relId] });
  };

  const typeInfo = relationship ? RELATIONSHIP_TYPES_MAP[relationship.type] : null;

  if (isLoading || !relationship) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex items-center gap-3">
            {typeInfo && (
              <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center`}>
                {React.createElement(typeInfo.icon, { className: `w-4 h-4 ${typeInfo.color}` })}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-stone-800">{relationship.name}</h1>
              <p className="text-xs text-stone-500">{typeInfo?.label} · {members.length}/{maxMembers} members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Members */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">Members ({members.length}/{maxMembers})</h2>
          <div className="space-y-2.5">
            {members.map(email => {
              const isMemberAdmin = (relationship.admin_emails || []).includes(email);
              const isMemberOwner = relationship.owner_email === email;
              const isMe = email === myEmail;
              return (
                <div key={email} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-stone-600">{getUserName(email)[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {getUserName(email)} {isMe && <span className="text-stone-400 font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isMemberOwner && <Crown className="w-4 h-4 text-amber-500" title="Owner" />}
                    {isMemberAdmin && !isMemberOwner && <ShieldCheck className="w-4 h-4 text-emerald-500" title="Admin" />}
                    {isAdmin && !isMemberOwner && !isMe && (
                      <>
                        <button
                          onClick={() => handleToggleAdmin(email)}
                          className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
                          title={isMemberAdmin ? 'Remove admin' : 'Make admin'}
                        >
                          {isMemberAdmin ? <ShieldOff className="w-3.5 h-3.5 text-stone-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(email)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">Pending Invitations</h2>
            <div className="space-y-2">
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">{inv.invitee_email}</p>
                    <p className="text-xs text-stone-400">Awaiting response</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleCancelInvite(inv.id)} className="p-1.5 hover:bg-amber-100 rounded-lg">
                      <X className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-4">Invite a Member</h2>
            {canInviteMore ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-500">
                  {maxMembers - members.length - pendingInvites.length} invitation{maxMembers - members.length - pendingInvites.length !== 1 ? 's' : ''} remaining
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 rounded-xl"
                    style={{ fontSize: '16px' }}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  />
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="bg-stone-800 hover:bg-stone-900 rounded-xl">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    {inviting ? 'Sending…' : 'Invite'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500">This relationship is at its maximum of {maxMembers} members.</p>
            )}
          </div>
        )}

        {/* Adjust max members (admin only) */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">Group Size</h2>
            <p className="text-sm text-stone-500 mb-3">Adjust the maximum number of members (current: {maxMembers}).</p>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => updateRelMutation.mutate({ max_members: n })}
                  disabled={n < members.length}
                  className={`py-3 rounded-xl border-2 font-bold text-lg transition-all disabled:opacity-40 ${
                    maxMembers === n
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Go to moments */}
        <Button
          onClick={() => navigate(createPageUrl(`Home?rel=${relId}`))}
          className="w-full bg-stone-800 hover:bg-stone-900 text-white h-11 rounded-xl"
        >
          <Users className="w-4 h-4 mr-2" />
          Open {relationship.name}
        </Button>
      </div>
    </div>
  );
}