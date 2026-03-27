import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Link2, Zap } from 'lucide-react';
import { generateEventDescription, getFocusAreasForType } from '../lib/connectionGuidance';

export default function ScheduleConnectionForm({ relationshipId, relationshipType = 'other', linkedMoments = [], onSuccess }) {
  const focusAreas = getFocusAreasForType(relationshipType);
  const [title, setTitle] = useState('Connection Time');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [focusArea, setFocusArea] = useState(() => focusAreas[0] || 'general');
  const [recurrence, setRecurrence] = useState('none');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const eventDescription = generateEventDescription(relationshipType, focusArea, linkedMoments);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !relationshipId) return;
    setIsLoading(true);
    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO   = new Date(`${date}T${endTime}`).toISOString();
    await base44.entities.ScheduledConnection.create({
      relationship_id: relationshipId,
      title,
      description: eventDescription,
      start_time: startISO,
      end_time: endISO,
      location: location || null,
      focus_area: focusArea,
      recurrence_pattern: recurrence,
      notes: notes || null,
      linked_moment_ids: linkedMoments.map(m => m.id),
    });
    setIsLoading(false);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Event Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Coffee - Relationship Review"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where you'll meet"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Start Time
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              End Time
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            <Zap className="w-4 h-4 inline mr-1" />
            Focus Area
          </label>
          <Select value={focusArea} onValueChange={setFocusArea}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {focusAreas.map(area => (
                <SelectItem key={area} value={area}>
                  {area.charAt(0).toUpperCase() + area.slice(1).replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Repeat
          </label>
          <Select value={recurrence} onValueChange={setRecurrence}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">One Time</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Personal Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes for you..."
            className="h-20"
          />
        </div>

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
            {isLoading ? 'Scheduling...' : 'Schedule Connection'}
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