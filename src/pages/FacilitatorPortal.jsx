import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Analytics } from '../components/lib/analytics';
import { useQuery } from '@tanstack/react-query';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { usePageLoading } from '../components/PageLoadingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Sparkles, RefreshCw, Plus, Mail, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FacilitatorApplyForm from '../components/facilitator/FacilitatorApplyForm';
import FacilitatorRelationshipCard from '../components/facilitator/FacilitatorRelationshipCard';
import FacilitatorRelationshipDetail from '../components/facilitator/FacilitatorRelationshipDetail';
import AddRelationshipDialog from '../components/facilitator/AddRelationshipDialog';

export default function FacilitatorPortal() {
  const { currentUser } = useRelationship();
  const { setPageReady } = usePageLoading();
  const navigate = useNavigate();
  const [selectedRelId, setSelectedRelId] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const isFacilitator = currentUser?.role === 'facilitator' || currentUser?.role === 'admin';

  // Check for existing application if not yet a facilitator
  const { data: existingApp, isLoading: appLoading } = useQuery({
    queryKey: ['myFacilitatorApp'],
    queryFn: () => base44.entities.FacilitatorApplication.filter({ applicant_email: currentUser?.email }),
    enabled: !!currentUser && !isFacilitator,
  });

  // Load relationships for facilitators
  const { data: facRelsData, isLoading: relsLoading, refetch } = useQuery({
    queryKey: ['facilitatorRelationships'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFacilitatorData', { action: 'list_relationships' });
      return res.data?.facilitator_relationships || [];
    },
    enabled: isFacilitator,
  });

  // Load stats for each active relationship
  const { data: enrichedRels = [], isLoading: statsLoading } = useQuery({
    queryKey: ['facilitatorRelStats', facRelsData?.map(r => r.id).join(',')],
    queryFn: async () => {
      const active = (facRelsData || []).filter(r => r.status === 'active');
      const results = await Promise.all(
        active.map(async fr => {
          const res = await base44.functions.invoke('getFacilitatorData', {
            action: 'get_detail',
            relationship_id: fr.relationship_id
          });
          return {
            ...fr,
            stats: res.data?.stats || {},
            concerns: res.data?.concerns || []
          };
        })
      );
      const pending = (facRelsData || []).filter(r => r.status !== 'active');
      return [...results, ...pending];
    },
    enabled: !!facRelsData?.length && isFacilitator,
  });

  // Auto-link any pending invitations when facilitator loads the portal
  useEffect(() => {
    if (!isFacilitator) return;
    base44.functions.invoke('manageFacilitatorAccess', { action: 'check_pending_invitations' })
      .then(res => { if (res.data?.processed > 0) refetch(); })
      .catch(() => {});
  }, [isFacilitator]);

  // Load sent client invitations so facilitator can see their outbound invites
  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['facilitatorSentInvitations'],
    queryFn: () => base44.entities.FacilitatorInvitation.filter({ inviter_email: currentUser?.email, role_for_invitee: 'member' }),
    enabled: isFacilitator,
  });

  const isLoading = appLoading || relsLoading;

  useEffect(() => {
    if (!isLoading) {
      setPageReady();
      Analytics.facilitatorPortalViewed();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  const pendingApp = existingApp?.[0];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Facilitator Portal
            </h1>
            {isFacilitator && (
              <p className="text-xs text-stone-400 capitalize">
                {currentUser?.facilitator_type || 'facilitator'} · {currentUser?.facilitator_tier || 'free'} plan
              </p>
            )}
          </div>
          {isFacilitator && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-stone-400">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => { setShowAddDialog(true); Analytics.facilitatorAccessRequested(); }} className="bg-stone-800 hover:bg-stone-900">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* NOT A FACILITATOR — show apply form */}
          {!isFacilitator && (
            <motion.div
              key="apply"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6"
            >
              <FacilitatorApplyForm
                user={currentUser}
                existingApplication={pendingApp}
                onApplied={() => {}}
              />
            </motion.div>
          )}

          {/* FACILITATOR — show detail view */}
          {isFacilitator && selectedRelId && (
            <motion.div
              key={`detail-${selectedRelId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4"
            >
              <FacilitatorRelationshipDetail
                facRelId={selectedRelId}
                onBack={() => setSelectedRelId(null)}
              />
            </motion.div>
          )}

          {/* FACILITATOR — show dashboard */}
          {isFacilitator && !selectedRelId && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* AI Coach entry */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-200 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-700" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-violet-900 text-sm">AI Facilitation Guide</p>
                  <p className="text-xs text-violet-700 mt-0.5">
                    Get pattern analysis, intervention suggestions, and session prep — powered by your relationship data.
                  </p>
                  {(currentUser?.facilitator_tier === 'free') ? (
                    <p className="text-xs text-violet-500 mt-1.5 font-medium">Upgrade to Pro to unlock AI insights</p>
                  ) : (
                    <p className="text-xs text-violet-600 mt-1.5">Available in the Coach tab</p>
                  )}
                </div>
              </div>

              {/* Tier limit warning */}
              {currentUser?.facilitator_tier === 'free' && (facRelsData || []).filter(r => r.status === 'active').length >= 2 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700 font-medium">Free tier limit reached (2 active relationships)</p>
                  <p className="text-xs text-amber-600 mt-0.5">Upgrade to Pro to oversee up to 10 relationships.</p>
                </div>
              )}

              {/* Weekly digest — computed from already-loaded enrichedRels */}
              {enrichedRels.length > 0 && !statsLoading && (() => {
                const activeCount   = enrichedRels.filter(r => r.status === 'active').length;
                const pendingCount  = enrichedRels.filter(r => r.status === 'pending_approval').length;
                const momentsThisWeek = enrichedRels.reduce((sum, r) => sum + (r.stats?.recent_count_7d || 0), 0);
                const withActivity  = enrichedRels.filter(r => (r.stats?.recent_count_7d || 0) > 0).length;
                const quietWeek     = momentsThisWeek === 0 && activeCount > 0;
                return (
                  <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Your week at a glance</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-stone-800">{activeCount}</p>
                        <p className="text-xs text-stone-400 mt-0.5">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-stone-800">{momentsThisWeek}</p>
                        <p className="text-xs text-stone-400 mt-0.5">Moments this week</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-stone-800">{withActivity}</p>
                        <p className="text-xs text-stone-400 mt-0.5">With activity</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {withActivity > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <p className="text-xs text-emerald-700">{withActivity} relationship{withActivity !== 1 ? 's' : ''} showed new activity this week</p>
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <p className="text-xs text-amber-700">{pendingCount} relationship{pendingCount !== 1 ? 's' : ''} still awaiting member consent</p>
                        </div>
                      )}
                      {quietWeek && (
                        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-stone-500">Activity was quieter this week — check back later or reach out.</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 mt-2.5">Some activity may be limited by current access settings.</p>
                  </div>
                );
              })()}

              {/* Relationships list */}
              {enrichedRels.length === 0 && !statsLoading && (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/60">
                  <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-600 font-medium">No relationships yet</p>
                  <p className="text-sm text-stone-400 mt-1">Request access to a relationship or wait for an invitation.</p>
                  <Button
                    onClick={() => { setShowAddDialog(true); Analytics.facilitatorAccessRequested(); }}
                    className="mt-4 bg-stone-800 hover:bg-stone-900"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Access
                  </Button>
                </div>
              )}

              {statsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-800 mx-auto" />
                  <p className="text-xs text-stone-400 mt-2">Loading relationship data...</p>
                </div>
              )}

              {/* Pending client invitations */}
              {sentInvitations.filter(i => i.status === 'pending').length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200/60 p-4">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Pending Client Invitations
                  </p>
                  <div className="space-y-2">
                    {sentInvitations.filter(i => i.status === 'pending').map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-stone-700 truncate">{inv.invitee_email}</span>
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0 ml-2">Awaiting signup</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400 mt-3">They'll be automatically linked once they join and you're connected to their relationship.</p>
                </div>
              )}

              {enrichedRels.map(rel => (
                <FacilitatorRelationshipCard
                  key={rel.id}
                  facRel={rel}
                  onClick={() => {
                    if (rel.status === 'active') {
                      setSelectedRelId(rel.relationship_id);
                      Analytics.facilitatorRelationshipViewed(rel.relationship_id);
                    }
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAddDialog && (
        <AddRelationshipDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => { setShowAddDialog(false); refetch(); }}
        />
      )}
    </div>
  );
}