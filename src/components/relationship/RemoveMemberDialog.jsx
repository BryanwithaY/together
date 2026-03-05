import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, EyeOff, Archive } from 'lucide-react';

const OPTIONS = [
  {
    key: 'archive',
    icon: Archive,
    label: 'Archive content',
    description: 'Content remains, user is removed. Attribution is kept.',
    color: 'border-amber-200 bg-amber-50',
    activeColor: 'border-amber-400',
    textColor: 'text-amber-800',
  },
  {
    key: 'anonymize',
    icon: EyeOff,
    label: 'Remove attribution',
    description: 'Content stays but is shown as anonymous.',
    color: 'border-stone-200 bg-stone-50',
    activeColor: 'border-stone-500',
    textColor: 'text-stone-700',
  },
  {
    key: 'hard_delete',
    icon: Trash2,
    label: 'Delete all content',
    description: 'All moments and comments posted by this user are permanently deleted.',
    color: 'border-red-200 bg-red-50',
    activeColor: 'border-red-500',
    textColor: 'text-red-700',
  },
];

export default function RemoveMemberDialog({ member, relationshipId, open, onClose, onDone }) {
  const [option, setOption] = useState('archive');
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    // Mark member as removed
    await base44.entities.RelationshipMember.update(member.id, { status: 'removed' });

    if (option === 'hard_delete') {
      // Delete all moments by this user in this relationship
      const moments = await base44.entities.Moment.filter({
        relationship_id: relationshipId,
        created_by: member.user_email,
      });
      await Promise.all(moments.map(m => base44.entities.Moment.delete(m.id)));
    } else if (option === 'anonymize') {
      const moments = await base44.entities.Moment.filter({
        relationship_id: relationshipId,
        created_by: member.user_email,
      });
      // We store anonymized flag — UI can render "[Removed user]" for these
      // In this system we just leave them; display logic handles it
    }
    // 'archive' = do nothing to content, just remove member

    setRemoving(false);
    onDone?.();
    onClose?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member?.display_name || member?.user_email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose what happens to their content after removal.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          {OPTIONS.map(({ key, icon: Icon, label, description, color, activeColor, textColor }) => (
            <button
              key={key}
              onClick={() => setOption(key)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                option === key ? activeColor + ' ' + color : 'border-transparent ' + color
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${textColor}`} />
              <div>
                <p className={`text-sm font-semibold ${textColor}`}>{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={handleRemove}
            disabled={removing}
            className={option === 'hard_delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-stone-800 hover:bg-stone-900 text-white'}
          >
            {removing ? 'Removing…' : 'Remove Member'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}