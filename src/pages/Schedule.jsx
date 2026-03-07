import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import RelationshipGate from '../components/relationship/RelationshipGate';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { usePageLoading } from '../components/PageLoadingContext';
import ScheduleConnectionForm from '../components/scheduling/ScheduleConnectionForm';
import ScheduleList from '../components/scheduling/ScheduleList';
import { Analytics } from '../components/lib/analytics';

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
      Analytics.connectionDeleted();
    },
  });

  useEffect(() => {
    if (!isLoading) setPageReady();
  }, [isLoading]);

  useEffect(() => {
    Analytics.pageViewed('schedule');
  }, []);

  const upcomingConnections = connections.filter(
    c => new Date(c.start_time) > new Date()
  ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const pastConnections = connections.filter(
    c => new Date(c.start_time) <= new Date()
  ).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-800 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Connection Schedule
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Plan in-person time to discuss moments and deepen your connection
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-stone-800 hover:bg-stone-900 gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-stone-200 p-6"
            >
              <h2 className="text-lg font-semibold text-stone-800 mb-4">Schedule Connection Time</h2>
              <ScheduleConnectionForm
                relationshipId={activeRelationship.id}
                relationshipType={activeRelationship.type}
                onSuccess={() => {
                  setShowForm(false);
                  Analytics.connectionScheduled();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">💡 How This Works</h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Schedule dedicated time to connect in person</li>
            <li>• Link moments you want to discuss during your time together</li>
            <li>• Smart event descriptions include guidance on communication</li>
            <li>• When you're together, you can reference the calendar event—no app needed</li>
            <li>• Create recurring connections to build consistent relationship practice</li>
          </ul>
        </div>

        {/* Upcoming Connections */}
        {upcomingConnections.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-stone-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              Upcoming
            </h2>
            <AnimatePresence>
              {upcomingConnections.map((connection) => (
                <motion.div
                  key={connection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-800">{connection.title}</h3>
                      <p className="text-sm text-stone-600 mt-1">
                        {new Date(connection.start_time).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {connection.location && (
                        <p className="text-xs text-stone-500 mt-1">📍 {connection.location}</p>
                      )}
                      {connection.linked_moment_ids?.length > 0 && (
                        <p className="text-xs text-blue-600 mt-2">
                          {connection.linked_moment_ids.length} moment(s) to discuss
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(connection.description);
                          Analytics.eventDescriptionCopied();
                        }}
                        title="Copy description"
                      >
                        <Copy className="w-4 h-4 text-stone-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(connection)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Past Connections */}
        {pastConnections.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-stone-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              Past
            </h2>
            <div className="space-y-2">
              {pastConnections.slice(0, 5).map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white border border-stone-200 rounded-lg p-3 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 truncate">{connection.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {new Date(connection.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: connection.start_time.getFullYear?.() !== new Date().getFullYear() ? 'numeric' : undefined,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(connection)}
                    >
                      <Trash2 className="w-4 h-4 text-stone-300 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && connections.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">No scheduled connections yet</p>
            <p className="text-sm text-stone-500 mt-1">Create one to get started</p>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteTarget?.title}" from your schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
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