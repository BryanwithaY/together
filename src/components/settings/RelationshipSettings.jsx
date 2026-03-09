import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Camera, Users, Clock, ChevronDown, Settings2, Trash2, Archive, ArchiveRestore, Shield } from 'lucide-react';
import FacilitatorConsentManager from '../facilitator/FacilitatorConsentManager';
import FacilitatorAccessRequest from '../facilitator/FacilitatorAccessRequest';
import { useRelationship } from '../relationship/RelationshipContext';
import MemberRoleBadge from '../relationship/MemberRoleBadge';
import RemoveMemberDialog from '../relationship/RemoveMemberDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  isOwner as checkOwner, isAdmin as checkAdmin, canInvite as checkCanInvite,
  canRemoveMembers, canToggleExport, ROLE_LABELS,
} from '../lib/permissions';

const TYPE_LABELS = {
  romantic_partner: 'Romantic Partners', romantic_group: 'Romantic Group',
  friends: 'Friends', friend_group: 'Friend Group',
  parent_adult_child: 'Parent & Adult Child', siblings: 'Siblings',
  family: 'Family', co_parents: 'Co-Parents',
  business_partners: 'Business Partners', cofounders: 'Co-Founders', other: 'Other',
};

const ROLES = ['owner', 'admin', 'member', 'read_only'];

export default function RelationshipSettings() {
  const { currentUser, activeRelationship, members, myMembership, refreshRelationships } = useRelationship();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [showRoleMenuFor, setShowRoleMenuFor] = useState(null);
  const [deleteSpaceConfirmText, setDeleteSpaceConfirmText] = useState('');
  const [deleteSpaceOpen, setDeleteSpaceOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!activeRelationship) return null;

  const isArchived = !!activeRelationship.is_archived;
  const isOwner = checkOwner(myMembership);
  const isAdmin = checkAdmin(myMembership) && !isArchived;
  const canInvite = checkCanInvite(myMembership) && !isArchived;
  const canRemove = canRemoveMembers(myMembership);
  const maxMembers = activeRelationship.max_members || 10;
  const activeMembers = members.filter(m => m.status === 'active');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), 'user');
    await base44.entities.RelationshipMember.create({
      relationship_id: activeRelationship.id,
      user_email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: 'pending',
      invited_by: currentUser?.email?.toLowerCase(),
      invited_at: new Date().toISOString(),
    });
    setInviteEmail('');
    setInviting(false);
    refreshRelationships();
  };

  const handleRoleChange = async (member, newRole) => {
    if (member.role === 'owner') return; // can't change owner role here
    await base44.entities.RelationshipMember.update(member.id, { role: newRole });
    setShowRoleMenuFor(null);
    refreshRelationships();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Relationship.update(activeRelationship.id, { photo_url: file_url });
    await refreshRelationships();
    setUploading(false);
  };

  const handleToggleSetting = async (key) => {
    const newValue = activeRelationship[key] === false ? true : !activeRelationship[key];
    await base44.entities.Relationship.update(activeRelationship.id, { [key]: newValue });
    await refreshRelationships();
  };

  const handleDeleteRelationship = async () => {
    await base44.entities.Relationship.update(activeRelationship.id, { is_deleted: true });
    await refreshRelationships();
  };

  const handleArchive = async () => {
    await base44.entities.Relationship.update(activeRelationship.id, { is_archived: true });
    await refreshRelationships();
  };

  const handleUnarchive = async () => {
    await base44.entities.Relationship.update(activeRelationship.id, { is_archived: false });
    await refreshRelationships();
  };

  return (
    <div className="space-y-6">

      {/* Archived banner */}
      {activeRelationship.is_archived && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Archive className="w-4 h-4 text-stone-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-600">This space is archived</p>
            <p className="text-xs text-stone-400">It's locked and read-only. Unarchive to make it active again.</p>
          </div>
          {isOwner && (
            <button
              onClick={handleUnarchive}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
            >
              <ArchiveRestore className="w-3.5 h-3.5" /> Unarchive
            </button>
          )}
        </div>
      )}

      {/* Relationship ID (for sharing with facilitators) */}
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Relationship ID</p>
          <p className="text-xs font-mono text-stone-600 mt-0.5 break-all">{activeRelationship.id}</p>
          <p className="text-xs text-stone-400 mt-0.5">Share with a facilitator so they can request access</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(activeRelationship.id).then(() => {
              setCopiedId(true);
              setTimeout(() => setCopiedId(false), 2000);
            });
          }}
          className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors flex-shrink-0 ${copiedId ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-stone-400 hover:text-stone-700 border-stone-200'}`}
        >
          {copiedId ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Relationship identity */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {activeRelationship.photo_url ? (
            <img src={activeRelationship.photo_url} alt="relationship" className="w-16 h-16 rounded-2xl object-cover border border-stone-200" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Users className="w-7 h-7 text-stone-400" />
            </div>
          )}
          {isAdmin && (
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center cursor-pointer hover:bg-stone-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>
        <div>
          <p className="font-semibold text-stone-800">{activeRelationship.name}</p>
          <p className="text-sm text-stone-500">{TYPE_LABELS[activeRelationship.type] || 'Relationship'}</p>
          <p className="text-xs text-stone-400 mt-0.5">Your role: <strong>{ROLE_LABELS[myMembership?.role] || 'Member'}</strong></p>
        </div>
      </div>

      {/* Owner-only toggles */}
      {isOwner && (
        <div className="bg-stone-50 rounded-xl border border-stone-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Space Settings</p>
          {[
            ...(activeMembers.length > 2 ? [{ key: 'allow_private_moments', label: 'Allow private moments', desc: 'Members can post moments visible only to tagged users' }] : []),
            { key: 'allow_export', label: 'Allow data export', desc: 'Members can export their moments and data' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-700">{label}</p>
                <p className="text-xs text-stone-400">{desc}</p>
              </div>
              <button
                onClick={() => handleToggleSetting(key)}
                className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${
                  activeRelationship[key] !== false ? 'bg-stone-800' : 'bg-stone-200'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  activeRelationship[key] !== false ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2">
          Members <span className="text-stone-400 font-normal">({activeMembers.length}/{maxMembers})</span>
        </p>
        <div className="space-y-2">
          {members.map(member => {
            const isMe = member.user_email?.toLowerCase() === currentUser?.email?.toLowerCase();
            const isThisOwner = member.role === 'owner';
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-semibold text-stone-600 flex-shrink-0">
                  {(member.display_name || member.user_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{member.display_name || member.user_email}</p>
                  {member.status === 'pending' && (
                    <p className="text-xs text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending invite</p>
                  )}
                </div>

                {/* Role badge / change */}
                {isAdmin && !isMe && !isThisOwner ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleMenuFor(showRoleMenuFor === member.id ? null : member.id)}
                      className="flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 text-stone-500 border-stone-200 hover:border-stone-400"
                    >
                      {ROLE_LABELS[member.role] || 'Member'} <ChevronDown className="w-3 h-3" />
                    </button>
                    {showRoleMenuFor === member.id && (
                      <div className="absolute right-0 top-7 z-20 bg-white border border-stone-200 rounded-xl shadow-lg py-1 w-36">
                        {ROLES.filter(r => r !== 'owner').map(r => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member, r)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 ${member.role === r ? 'font-semibold text-stone-800' : 'text-stone-600'}`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <MemberRoleBadge role={member.role || 'member'} />
                )}

                {isMe && <span className="text-xs text-stone-400 flex-shrink-0">You</span>}

                {/* Remove */}
                {canRemove && !isMe && !isThisOwner && (
                  <button
                    onClick={() => setRemovingMember(member)}
                    className="text-xs text-stone-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite */}
      {canInvite && activeMembers.length < maxMembers && (
        <div>
          <p className="text-sm font-semibold text-stone-700 mb-2">Invite someone</p>
          <div className="flex gap-2 flex-wrap">
            <Input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 min-w-0"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            {isAdmin && (
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="border border-stone-200 rounded-md px-2 py-1.5 text-sm text-stone-700 bg-white"
              >
                {['admin', 'member', 'read_only'].map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            )}
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-stone-800 hover:bg-stone-900 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              {inviting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
        </div>
      )}

      {/* Archive / Unarchive (owner only) */}
      {isOwner && !activeRelationship.is_archived && (
        <Button
          variant="ghost"
          onClick={handleArchive}
          className="w-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-sm"
        >
          <Archive className="w-4 h-4 mr-2" />
          Archive this Space
        </Button>
      )}

      {/* Delete relationship (owner only) — low-prominence */}
      {isOwner && (
        <AlertDialog open={deleteSpaceOpen} onOpenChange={(open) => { setDeleteSpaceOpen(open); if (!open) setDeleteSpaceConfirmText(''); }}>
          <AlertDialogTrigger asChild>
            <button className="w-full text-xs text-stone-300 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 py-1">
              <Trash2 className="w-3 h-3" />
              Delete this space
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{activeRelationship.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive the relationship for all members. Moments will no longer be accessible. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="px-1 py-2">
              <p className="text-sm text-stone-600 mb-2">Type <strong>delete</strong> to confirm:</p>
              <Input
                value={deleteSpaceConfirmText}
                onChange={e => setDeleteSpaceConfirmText(e.target.value)}
                placeholder="delete"
                autoComplete="off"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={handleDeleteRelationship}
                disabled={deleteSpaceConfirmText.toLowerCase() !== 'delete'}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
              >
                Delete Space
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Facilitator Access — for owners/admins: invite, for all members: consent management */}
      <div className="border-t border-stone-100 pt-4 space-y-4">
        <p className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-stone-400" /> Facilitator Oversight
        </p>
        {canInvite && <FacilitatorAccessRequest />}
        <FacilitatorConsentManager />
      </div>

      {/* Remove member dialog */}
      {removingMember && (
        <RemoveMemberDialog
          open={!!removingMember}
          member={removingMember}
          relationshipId={activeRelationship.id}
          onClose={() => setRemovingMember(null)}
          onDone={refreshRelationships}
        />
      )}
    </div>
  );
}