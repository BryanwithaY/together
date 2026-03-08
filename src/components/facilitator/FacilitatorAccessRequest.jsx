import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Info } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';

export default function FacilitatorAccessRequest({ onSuccess }) {
  const { activeRelationship, currentUser } = useRelationship();
  const [facilitatorEmail, setFacilitatorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!facilitatorEmail.trim()) return;
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('manageFacilitatorAccess', {
      action: 'request_access',
      relationship_id: activeRelationship.id,
      facilitator_email: facilitatorEmail.trim().toLowerCase(),
      initiated_by_type: 'relationship_member'
    });
    setLoading(false);
    if (res.data?.success) {
      setSuccess(true);
      setFacilitatorEmail('');
      if (onSuccess) onSuccess();
    } else {
      setError(res.data?.error || 'Something went wrong. Please check the email and try again.');
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-700 font-medium">Facilitator invited</p>
        <p className="text-xs text-emerald-600 mt-0.5">
          All members will be asked to approve access before the facilitator can view the relationship.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-stone-700">Invite a Facilitator</p>
      <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-stone-500">
          Invite a therapist, coach, mentor, or trusted friend to oversee this relationship. 
          All members must approve access before they can view any content.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          value={facilitatorEmail}
          onChange={e => setFacilitatorEmail(e.target.value)}
          placeholder="Facilitator's email address"
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleInvite()}
        />
        <Button
          onClick={handleInvite}
          disabled={loading || !facilitatorEmail.trim()}
          className="bg-stone-800 hover:bg-stone-900 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          {loading ? 'Sending...' : 'Invite'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}