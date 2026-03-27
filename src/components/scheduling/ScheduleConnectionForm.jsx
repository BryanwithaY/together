import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Link2, Zap, Users, Eye } from 'lucide-react';
import { generateEventDescription, getFocusAreasForType } from '../lib/connectionGuidance';

export default function ScheduleConnectionForm({
  relationshipId,
  relationshipType = 'other',
  linkedMoments = [],
  onSuccess,
  connection,
  members = [],
  currentUser = null,
}) {
  const isEditMode = !!connection;
  const focusAreas = getFocusAreasForType(relationshipType);

  const parseDate = (iso) => iso ? new Date(iso).toISOString().slice(0, 10) : '';
  const parseTime = (iso) => iso ? new Date(iso).toTimeString().slice(0, 5) : '';

  const [title, setTitle] = useState(connection?.title || 'Connection Time');
  const [date, setDate] = useState(connection ? parseDate(connection.start_time) : '');
  const [startTime, setStartTime] = useState(connection ? parseTime(connection.start_time) : '');
  const [endTime, setEndTime] = useState(connection ? parseTime(connection.end_time) : '');
  const [location, setLocation] = useState(connection?.location || '');
  const [focusArea, setFocusArea] = useState(connection?.focus_area || focusAreas[0] || 'general');
  const [recurrence, setRecurrence] = useState(connection?.recurrence_pattern || 'none');
  const [notes, setNotes] = useState(connection?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Custom recurrence fields
  const [customInterval, setCustomInterval] = useState(connection?.recurrence_config?.interval || 2);
  const [customUnit, setCustomUnit] = useState(connection?.recurrence_config?.unit || 'weeks');
  const [customEndDate, setCustomEndDate] = useState(connection?.recurrence_config?.end_date || '');

  // Visibility & attendees
  const [visibilityType, setVisibilityType] = useState(connection?.visibility_type || 'relationship');
  const [attendeeEmails, setAttendeeEmails] = useState(connection?.attendee_emails || []);

  const otherMembers = members.filter(
    m => m.user_email !== currentUser?.email && m.status === 'active'
  );

  const toggleAttendee = (email) => {
    setAttendeeEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleVisibilityChange = (val) => {
    setVisibilityType(val);
    if (val !== 'invited') setAttendeeEmails([]);
  };

  const eventDescription = generateEventDescription(relationshipType, focusArea, linkedMoments);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !relationshipId) return;
    setIsLoading(true);

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO   = new Date(`${date}T${endTime}`).toISOString();

    const recurrenceConfig = recurrence === 'custom' ? {
      interval: Number(customInterval),
      unit: customUnit,
      ...(customEndDate ? { end_date: customEndDate } : {}),
    } : null;

    const payload = {
      title,
      description: eventDescription,
      start_time: startISO,
      end_time: endISO,
      location: location || null,
      focus_area: focusArea,
      recurrence_pattern: recurrence,
      recurrence_config: recurrenceConfig,
      notes: notes || null,
      linked_moment_ids: linkedMoments.map(m => m.id),
      visibility_type: visibilityType,
      attendee_emails: visibilityType === 'invited' ? attendeeEmails : [],
    };

    if (isEditMode) {
      await base44.entities.ScheduledConnection.update(connection.id, payload);
    } else {
      await base44.entities.ScheduledConnection.create({
        relationship_id: relationshipId,
        ...payload,
      });
    }

    setIsLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Event Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Coffee - Relationship Review"
            required
          />
        </div>

        {/* Date & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />Date
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />Location
            </label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where you'll meet" />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />Start Time
            </label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">End Time</label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>

        {/* Focus Area */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            <Zap className="w-4 h-4 inline mr-1" />Focus Area
          </label>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-white text-stone-900"
          >
            {focusAreas.map(area => (
              <option key={area} value={area}>
                {area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Repeat */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Repeat</label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-white text-stone-900"
          >
            <option value="none">One Time</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom…</option>
          </select>

          {recurrence === 'custom' && (
            <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600 shrink-0">Every</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customInterval}
                  onChange={(e) => setCustomInterval(e.target.value)}
                  className="w-16 h-8 rounded-md border border-input px-2 text-sm bg-white text-stone-900 text-center"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="flex-1 h-8 rounded-md border border-input px-2 text-sm bg-white text-stone-900"
                >
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">End date (optional)</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full h-8 rounded-md border border-input px-2 text-sm bg-white text-stone-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            <Eye className="w-4 h-4 inline mr-1" />Who can see this?
          </label>
          <select
            value={visibilityType}
            onChange={(e) => handleVisibilityChange(e.target.value)}
            className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-white text-stone-900"
          >
            <option value="relationship">Everyone in this relationship</option>
            <option value="creator_only">Just me</option>
            {otherMembers.length > 0 && <option value="invited">Specific people only</option>}
          </select>
        </div>

        {/* Attendee picker — only when visibility = invited */}
        {visibilityType === 'invited' && otherMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />Invite
            </label>
            <div className="rounded-xl border border-stone-200 divide-y divide-stone-100">
              {otherMembers.map(member => (
                <label
                  key={member.user_email}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={attendeeEmails.includes(member.user_email)}
                    onChange={() => toggleAttendee(member.user_email)}
                    className="rounded"
                  />
                  <span className="text-sm text-stone-700">
                    {member.display_name || member.user_email}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Personal Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes for you..."
            className="h-20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1"
          >
            {showPreview ? 'Hide' : 'Preview'} Event Description
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-stone-800 hover:bg-stone-900">
            {isLoading
              ? (isEditMode ? 'Saving...' : 'Scheduling...')
              : (isEditMode ? 'Save Changes' : 'Schedule Connection')}
          </Button>
        </div>
      </form>

      {showPreview && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
          <h3 className="font-semibold text-stone-800 mb-3">Event Description Preview</h3>
          <p className="text-sm text-stone-700 whitespace-pre-wrap font-mono">{eventDescription}</p>
        </div>
      )}

      {linkedMoments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Link2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">{linkedMoments.length} moment(s) linked</p>
              <p className="text-blue-700 text-xs mt-1">
                These will be included in the event description to guide your conversation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}