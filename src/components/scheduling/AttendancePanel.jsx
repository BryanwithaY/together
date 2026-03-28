import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Determines if a user is eligible to mark attendance and leave a post-event note.
 * Eligible = event creator OR explicitly listed in attendee_emails (invited visibility).
 * Visibility-only users (relationship-wide viewers who aren't attendees) are NOT eligible.
 */
function isEligible(connection, userEmail) {
  if (!userEmail) return false;
  if (connection.created_by === userEmail) return true;
  if (connection.visibility_type === 'invited' && connection.attendee_emails?.includes(userEmail)) return true;
  return false;
}

/**
 * Aggregate summary — safe counts only, no names, no individual status leakage.
 * Shown to all eligible users.
 */
function AggregateSummary({ connection }) {
  const attendanceMap = connection.attendance_by_user || {};
  const responded = Object.keys(attendanceMap).length;
  const attended = Object.values(attendanceMap).filter(v => v === 'attended').length;
  const didNotAttend = Object.values(attendanceMap).filter(v => v === 'did_not_attend').length;

  // Only show aggregate when there's something meaningful to show
  if (responded === 0) return null;

  const invited = connection.attendee_emails?.length || 0;

  return (
    <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-stone-100">
      {invited > 0 && (
        <span className="text-xs text-stone-400">{invited} invited</span>
      )}
      <span className="text-xs text-stone-400">{responded} responded</span>
      {attended > 0 && (
        <span className="text-xs text-green-600">{attended} attended</span>
      )}
      {didNotAttend > 0 && (
        <span className="text-xs text-stone-400">{didNotAttend} couldn't make it</span>
      )}
    </div>
  );
}

export default function AttendancePanel({ connection, currentUser, onUpdate }) {
  const userEmail = currentUser?.email;

  if (!isEligible(connection, userEmail)) return null;

  const attendanceMap = connection.attendance_by_user || {};
  const notesMap = connection.post_event_notes_by_user || {};

  const myStatus = attendanceMap[userEmail] || null;
  const myNote = notesMap[userEmail] || '';

  const [noteText, setNoteText] = useState(myNote);
  const [showNoteInput, setShowNoteInput] = useState(!!myNote);
  const [savingNote, setSavingNote] = useState(false);

  const handleStatusToggle = (status) => {
    const newStatus = myStatus === status ? null : status;
    const updatedMap = { ...attendanceMap };
    if (newStatus === null) {
      delete updatedMap[userEmail];
    } else {
      updatedMap[userEmail] = newStatus;
    }
    onUpdate(connection.id, { attendance_by_user: updatedMap });
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    const updatedNotes = { ...notesMap, [userEmail]: noteText.trim() };
    if (!noteText.trim()) delete updatedNotes[userEmail];
    await onUpdate(connection.id, { post_event_notes_by_user: updatedNotes });
    setSavingNote(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
      {/* Attendance buttons */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-stone-500">
          {myStatus === 'attended' && '✓ You marked this as attended'}
          {myStatus === 'did_not_attend' && 'You couldn't make it — noted'}
          {!myStatus && 'How did it go?'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleStatusToggle('attended')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              myStatus === 'attended'
                ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {myStatus === 'attended' ? 'Attended' : 'Mark attended'}
          </button>
          <button
            onClick={() => handleStatusToggle('did_not_attend')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              myStatus === 'did_not_attend'
                ? 'bg-stone-100 border-stone-300 text-stone-600 font-medium'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            {myStatus === 'did_not_attend' ? 'Couldn\'t attend' : 'Couldn\'t make it'}
          </button>
        </div>
      </div>

      {/* Post-event note — toggle */}
      {showNoteInput ? (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a private note for yourself — only you can see this."
            className="h-24 text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={savingNote}
              className="bg-stone-800 hover:bg-stone-900 text-xs h-8 px-3"
            >
              {savingNote ? 'Saving…' : 'Save note'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNoteInput(false)}
              className="text-xs h-8 px-3 text-stone-400"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              Hide
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNoteInput(true)}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-0.5"
        >
          <ChevronDown className="w-3 h-3" />
          {myNote ? 'View your private note' : 'Add a private note for yourself'}
        </button>
      )}

      {/* Aggregate summary — safe, no names */}
      <AggregateSummary connection={connection} />
    </div>
  );
}