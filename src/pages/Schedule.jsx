import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Copy, MapPin, Clock, RotateCw, CalendarPlus, Pencil, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import RelationshipGate from '../components/relationship/RelationshipGate';
import AttendancePanel from '../components/scheduling/AttendancePanel';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { usePageLoading } from '../components/PageLoadingContext';
import ScheduleConnectionForm from '../components/scheduling/ScheduleConnectionForm';
import SchedulingGuideLink from '../components/scheduling/SchedulingGuideLink';
import { Analytics } from '../components/lib/analytics';

function buildRRule(connection) {
  const pattern = connection.recurrence_pattern;
  if (!pattern || pattern === 'none') return null;

  const formatUntil = (dateStr) =>
    new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  if (pattern === 'weekly') return 'RRULE:FREQ=WEEKLY';
  if (pattern === 'biweekly') return 'RRULE:FREQ=WEEKLY;INTERVAL=2';
  if (pattern === 'monthly') return 'RRULE:FREQ=MONTHLY';

  if (pattern === 'custom' && connection.recurrence_config) {
    const { interval = 1, unit, end_date } = connection.recurrence_config;
    const freqMap = { days: 'DAILY', weeks: 'WEEKLY', months: 'MONTHLY' };
    const freq = freqMap[unit];
    if (!freq) return null;
    let rule = `RRULE:FREQ=${freq};INTERVAL=${interval}`;
    if (end_date) rule += `;UNTIL=${formatUntil(end_date)}`;
    return rule;
  }

  return null;
}

function generateICS(connection) {
  const formatDate = (date) =>
    new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const desc = (connection.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');

  const attendeeLines = (connection.attendee_emails || [])
    .map(email => `ATTENDEE;RSVP=TRUE:mailto:${email}`)
    .join('\n');

  const rrule = buildRRule(connection);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Together//Connection Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${connection.id}@together.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(connection.start_time)}`,
    `DTEND:${formatDate(connection.end_time)}`,
    `SUMMARY:${connection.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${connection.location || ''}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    ...(rrule ? [rrule] : []),
    ...(attendeeLines ? attendeeLines.split('\n') : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\n');
}

function downloadICS(connection) {
  const ics = generateICS(connection);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${connection.title.replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getGoogleCalendarUrl(connection) {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: connection.title,
    dates: `${fmt(connection.start_time)}/${fmt(connection.end_time)}`,
    details: connection.description || '',
    location: connection.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getOutlookUrl(connection) {
  const fmt = (d) => new Date(d).toISOString();
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: connection.title,
    startdt: fmt(connection.start_time),
    enddt: fmt(connection.end_time),
    body: connection.description || '',
    location: connection.location || '',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function AddToCalendarMenu({ connection }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          title="Add to Calendar"
        >
          <CalendarPlus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1.5 rounded-xl shadow-lg">
        <p className="text-xs text-stone-400 font-medium px-2 pt-1 pb-1.5">Add to calendar</p>
        <a
          href={getGoogleCalendarUrl(connection)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
          Google Calendar
        </a>
        <a
          href={getOutlookUrl(connection)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <img src="https://outlook.live.com/favicon.ico" alt="" className="w-4 h-4" />
          Outlook
        </a>
        <button
          onClick={() => downloadICS(connection)}
          className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <Calendar className="w-4 h-4 text-stone-500" />
          Apple / Other (.ics)
        </button>
      </PopoverContent>
    </Popover>
  );
}

const RECURRENCE_LABEL = {
  none: null,
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  custom: 'Custom',
};

function getRecurrenceLabel(connection) {
  if (connection.recurrence_pattern === 'custom' && connection.recurrence_config) {
    const { interval, unit } = connection.recurrence_config;
    return `Every ${interval} ${unit}`;
  }
  return RECURRENCE_LABEL[connection.recurrence_pattern] || null;
}

function ConnectionCard({ connection, onDelete, onEdit, onCopy, isPast, currentUser, onUpdateAttendance }) {
  const dateStr = new Date(connection.start_time).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const timeStr = new Date(connection.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isPast ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-white rounded-2xl border ${isPast ? 'border-stone-100' : 'border-stone-200'} overflow-hidden`}
    >
      {!isPast && (
        <div className="h-1 bg-gradient-to-r from-stone-700 to-stone-500" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${isPast ? 'text-stone-500' : 'text-stone-800'}`}>
              {connection.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
              {connection.location && (
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {connection.location}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {connection.recurrence_pattern && connection.recurrence_pattern !== 'none' && (
                <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                  <RotateCw className="w-3 h-3" />
                  {getRecurrenceLabel(connection)}
                </span>
              )}
              {connection.focus_area && connection.focus_area !== 'general' && (
                <span className="inline-flex items-center text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 capitalize">
                  {connection.focus_area.replace(/_/g, ' ')}
                </span>
              )}
              {connection.visibility_type === 'creator_only' && (
                <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                  <Eye className="w-3 h-3" />
                  Just me
                </span>
              )}
              {connection.visibility_type === 'invited' && connection.attendee_emails?.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" />
                  {connection.attendee_emails.length} invited
                </span>
              )}
              {connection.linked_moment_ids?.length > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {connection.linked_moment_ids.length} moment{connection.linked_moment_ids.length > 1 ? 's' : ''} linked
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <AddToCalendarMenu connection={connection} />
            {!isPast && connection.description && (
              <button
                onClick={() => onCopy(connection.description)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Copy event description"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {!isPast && (
              <button
                onClick={() => onEdit(connection)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(connection)}
              className="p-2 rounded-xl hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isPast && (
          <AttendancePanel
            connection={connection}
            currentUser={currentUser}
            onUpdate={onUpdateAttendance}
          />
        )}
      </div>
    </motion.div>
  );
}

function ScheduleContent() {
  const { activeRelationship, members, currentUser } = useRelationship();
  const { setPageReady } = usePageLoading();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', activeRelationship?.id],
    queryFn: () => base44.entities.ScheduledConnection.filter({
      relationship_id: activeRelationship.id,
    }, '-start_time'),
    enabled: !!activeRelationship?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', activeRelationship?.id] });
      setDeleteTarget(null);
      Analytics.connectionDeleted?.();
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', activeRelationship?.id] });
    },
  });

  const handleUpdateAttendance = (id, data) => updateAttendanceMutation.mutateAsync({ id, data });

  useEffect(() => {
    if (!isLoading) setPageReady();
  }, [isLoading]);

  useEffect(() => {
    Analytics.pageViewed('schedule');
  }, []);

  const visibleConnections = connections.filter(c => {
    if (!c.visibility_type || c.visibility_type === 'relationship') return true;
    if (c.created_by === currentUser?.email) return true;
    if (c.visibility_type === 'invited' && c.attendee_emails?.includes(currentUser?.email)) return true;
    return false;
  });

  const upcomingConnections = visibleConnections
    .filter(c => new Date(c.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const pastConnections = visibleConnections
    .filter(c => new Date(c.start_time) <= new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const handleEdit = (connection) => {
    setEditTarget(connection);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    Analytics.eventDescriptionCopied?.();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">Connection Schedule</h1>
            <p className="text-xs text-stone-400 mt-0.5">Plan intentional in-person time</p>
          </div>
          <div className="flex items-center gap-2">
            <SchedulingGuideLink />
            <Button
              onClick={() => setShowForm(true)}
              className="bg-stone-800 hover:bg-stone-900 rounded-xl gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Upcoming */}
        {upcomingConnections.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Upcoming</h2>
            </div>
            <AnimatePresence>
              {upcomingConnections.map(c => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  onDelete={setDeleteTarget}
                  onEdit={handleEdit}
                  onCopy={handleCopy}
                  isPast={false}
                  currentUser={currentUser}
                  onUpdateAttendance={handleUpdateAttendance}
                />
              ))}
            </AnimatePresence>
          </section>
        )}

        {/* Past */}
        {pastConnections.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300" />
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide">Past</h2>
            </div>
            <div className="space-y-2">
              {pastConnections.slice(0, 5).map(c => (
                <ConnectionCard
                  key={c.id}
                  connection={c}
                  onDelete={setDeleteTarget}
                  onEdit={handleEdit}
                  onCopy={handleCopy}
                  isPast={true}
                  currentUser={currentUser}
                  onUpdateAttendance={handleUpdateAttendance}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && visibleConnections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-stone-400" />
            </div>
            <p className="font-semibold text-stone-700 text-lg">No connections yet</p>
            <p className="text-stone-400 text-sm mt-1 max-w-xs">
              Schedule your first in-person connection to start building intentional relationship time.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-stone-800 hover:bg-stone-900 rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule First Connection
            </Button>
          </div>
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pb-8"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-lg font-semibold text-stone-800">
              Edit Connection
            </SheetTitle>
          </SheetHeader>
          {editTarget && (
            <ScheduleConnectionForm
              relationshipId={activeRelationship?.id}
              relationshipType={activeRelationship?.type}
              connection={editTarget}
              members={members}
              currentUser={currentUser}
              onSuccess={() => {
                setEditTarget(null);
                queryClient.invalidateQueries({ queryKey: ['connections', activeRelationship?.id] });
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Schedule Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pb-8"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-lg font-semibold text-stone-800">
              Schedule Connection Time
            </SheetTitle>
          </SheetHeader>
          <ScheduleConnectionForm
            relationshipId={activeRelationship?.id}
            relationshipType={activeRelationship?.type}
            members={members}
            currentUser={currentUser}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['connections', activeRelationship?.id] });
              Analytics.connectionScheduled?.();
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this connection?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Schedule() {
  return (
    <RelationshipGate>
      <ScheduleContent />
    </RelationshipGate>
  );
}