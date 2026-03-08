import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Copy, MapPin, Clock, RotateCw, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import RelationshipGate from '../components/relationship/RelationshipGate';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { usePageLoading } from '../components/PageLoadingContext';
import ScheduleConnectionForm from '../components/scheduling/ScheduleConnectionForm';
import SchedulingGuideLink from '../components/scheduling/SchedulingGuideLink';
import { Analytics } from '../components/lib/analytics';

const RECURRENCE_LABEL = {
  none: null,
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

function ConnectionCard({ connection, onDelete, onCopy, isPast }) {
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
      {/* Color accent bar */}
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
                  {RECURRENCE_LABEL[connection.recurrence_pattern]}
                </span>
              )}
              {connection.focus_area && connection.focus_area !== 'general' && (
                <span className="inline-flex items-center text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 capitalize">
                  {connection.focus_area.replace(/_/g, ' ')}
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
            {!isPast && connection.description && (
              <button
                onClick={() => onCopy(connection.description)}
                className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Copy event description"
              >
                <Copy className="w-4 h-4" />
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
      </div>
    </motion.div>
  );
}

function ScheduleContent() {
  const { activeRelationship } = useRelationship();
  const { setPageReady } = usePageLoading();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => {
    if (!isLoading) setPageReady();
  }, [isLoading]);

  useEffect(() => {
    Analytics.pageViewed('schedule');
  }, []);

  const upcomingConnections = connections
    .filter(c => new Date(c.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const pastConnections = connections
    .filter(c => new Date(c.start_time) <= new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

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
                  onCopy={handleCopy}
                  isPast={false}
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
                  onCopy={handleCopy}
                  isPast={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && connections.length === 0 && (
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