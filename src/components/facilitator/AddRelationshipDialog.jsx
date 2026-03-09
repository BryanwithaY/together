import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Info, Hash, UserPlus, CheckCircle2 } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';

export default function AddRelationshipDialog({ onClose, onSuccess }) {
  const { currentUser } = useRelationship();
  const [mode, setMode] = useState('request'); // 'request' | 'invite'
  const [relationshipId, setRelationshipId] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(false); };

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
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteClient = async () => {
    if (!inviteeEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('manageFacilitatorAccess', {
        action: 'invite_to_app',
        invitee_email: inviteeEmail.trim().toLowerCase(),
        role_for_invitee: 'member',
        message: message.trim() || null
      });
      if (res.data?.success) {
        setSuccess(true);
      } else {
        setError(res.data?.error || 'Could not send invitation. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-lg font-bold text-stone-800">Add Relationship</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 mx-6 mb-5 bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => switchMode('request')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'request' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Hash className="w-3.5 h-3.5" />
            Request by ID
          </button>
          <button
            onClick={() => switchMode('invite')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'invite' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Client
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* REQUEST BY ID */}
          {mode === 'request' && (
            <>
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500">
                  Enter the relationship ID shared by a relationship member. All members will need to approve your access before you can view any content. The ID is found in Settings → Relationship Space.
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
                <Button onClick={handleRequest} disabled={loading || !relationshipId.trim()} className="flex-1 bg-stone-800 hover:bg-stone-900">
                  {loading ? 'Requesting...' : 'Request Access'}
                </Button>
              </div>
            </>
          )}

          {/* INVITE CLIENT */}
          {mode === 'invite' && !success && (
            <>
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500">
                  Invite a client to join the app. They'll get an email from you. Once they set up their relationship space, they can approve your facilitator access from their Settings.
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700 block mb-2">Client's Email</label>
                <Input
                  type="email"
                  value={inviteeEmail}
                  onChange={e => setInviteeEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700 block mb-1">
                  Personal Message <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a personal note to your invitation..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 p-3 text-sm text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleInviteClient} disabled={loading || !inviteeEmail.trim()} className="flex-1 bg-stone-800 hover:bg-stone-900">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {loading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </>
          )}

          {/* INVITE SUCCESS */}
          {mode === 'invite' && success && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-800">Invitation Sent!</p>
                <p className="text-sm text-stone-500 mt-1">
                  {inviteeEmail} will receive an email from you. Once they join and set up their relationship space, they can approve your facilitator access from their Settings.
                </p>
              </div>
              <Button onClick={onClose} className="bg-stone-800 hover:bg-stone-900">Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}