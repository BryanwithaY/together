import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Info } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';

export default function AddRelationshipDialog({ onClose, onSuccess }) {
  const { currentUser } = useRelationship();
  const [relationshipId, setRelationshipId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    if (!relationshipId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'request_access',
        relationship_id: relationshipId.trim(),
        facilitator_email: currentUser?.email,
        initiated_by_type: 'facilitator'
      });
      if (res.data?.success) {
        onSuccess?.();
      } else {
        setError(res.data?.error || 'Could not request access. Check the relationship ID and try again.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800">Request Relationship Access</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-stone-500">
            Enter the relationship ID shared by a relationship member. 
            All members of that relationship will need to approve your access before you can view any content.
            You can find the relationship ID in Settings → Relationship Space.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-2">Relationship ID</label>
          <Input
            value={relationshipId}
            onChange={e => setRelationshipId(e.target.value)}
            placeholder="Paste the relationship ID here..."
            onKeyDown={e => e.key === 'Enter' && handleRequest()}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleRequest}
            disabled={loading || !relationshipId.trim()}
            className="flex-1 bg-stone-800 hover:bg-stone-900"
          >
            {loading ? 'Requesting...' : 'Request Access'}
          </Button>
        </div>
      </div>
    </div>
  );
}