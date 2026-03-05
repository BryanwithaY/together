import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Trash2, Crown, Camera, Users, Clock, X } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TYPE_LABELS = {
  romantic_partner: 'Romantic Partners',
  romantic_group: 'Romantic Group',
  friends: 'Friends',
  friend_group: 'Friend Group',
  parent_adult_child: 'Parent & Adult Child',
  siblings: 'Siblings',
  family: 'Family',
  co_parents: 'Co-Parents',
  business_partners: 'Business Partners',
  cofounders: 'Co-Founders',
  other: 'Other',
};

export default function RelationshipSettings() {
  const { currentUser, activeRelationship, members, refreshRelationships, setActiveRelationship } = useRelationship();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  if (!activeRelationship) return null;

  const isOwner = activeRelationship.owner_email === currentUser?.email?.toLowerCase();
  const maxMembers = activeRelationship.max_members || 10;
  const canInvite = members.length < maxMembers;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSending(true);
    await base44.users.inviteUser(inviteEmail.trim(), 'user');
    await base44.entities.RelationshipMember.create({
      relationship_id: activeRelationship.id,
      user_email: inviteEmail.trim().toLowerCase(),
      status: 'pending',
    });
    setInviteEmail('');
    setSending(false);
    refreshRelationships();
  };

  const handleRemoveMember = async (member) => {
    await base44.entities.RelationshipMember.update(member.id, { status: 'removed' });
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

  const handleDeleteRelationship = async () => {
    await base44.entities.Relationship.update(activeRelationship.id, { is_deleted: true });
    await refreshRelationships();
  };

  return (
    <div className="space-y-5">
      {/* Relationship info */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {activeRelationship.photo_url ? (
            <img src={activeRelationship.photo_url} alt="relationship" className="w-16 h-16 rounded-2xl object-cover border border-stone-200" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
              <Users className="w-7 h-7 text-stone-400" />
            </div>
          )}
          {isOwner && (
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center cursor-pointer hover:bg-stone-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>
        <div>
          <p className="font-semibold text-stone-800">{activeRelationship.name}</p>
          <p className="text-sm text-stone-500">{TYPE_LABELS[activeRelationship.type] || 'Relationship'}</p>
          <p className="text-xs text-stone-400 mt-0.5">Owner: {activeRelationship.owner_email}</p>
        </div>
      </div>

      {/* Members list */}
      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2">Members <span className="text-stone-400 font-normal">({members.length}/{maxMembers})</span></p>
        <div className="space-y-2">
          {members.map(member => {
            const isMe = member.user_email?.toLowerCase() === currentUser?.email?.toLowerCase();
            const isRelOwner = member.user_email?.toLowerCase() === activeRelationship.owner_email;
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-semibold text-stone-600">
                  {(member.display_name || member.user_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{member.display_name || member.user_email}</p>
                  {member.status === 'pending' && (
                    <p className="text-xs text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending invite</p>
                  )}
                </div>
                {isRelOwner && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Owner" />}
                {isMe && <span className="text-xs text-stone-400">You</span>}
                {isOwner && !isMe && !isRelOwner && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite */}
      {isOwner && canInvite && (
        <div>
          <p className="text-sm font-semibold text-stone-700 mb-2">Invite someone</p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Their email address"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
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

      {/* Delete relationship (owner only) */}
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full text-stone-400 hover:text-red-500 hover:bg-red-50 text-sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete this Space
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{activeRelationship.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the relationship for all members. Moments logged in this space will no longer be accessible. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRelationship} className="bg-red-600 hover:bg-red-700 text-white">
                Delete Space
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}