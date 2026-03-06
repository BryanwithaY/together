import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRelationship } from '../components/relationship/RelationshipContext';
import { usePageLoading } from '../components/PageLoadingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Users, Activity, Bug, Heart, TrendingDown, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminStatCard from '../components/admin/AdminStatCard';
import FeatureUsageChart from '../components/admin/FeatureUsageChart';
import BugReportList from '../components/admin/BugReportList';
import EventFeed from '../components/admin/EventFeed';
import ChurnPanel from '../components/admin/ChurnPanel';
import { useEffect } from 'react';

export default function Admin() {
  const { currentUser } = useRelationship();
  const { setPageReady } = usePageLoading();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const SYSTEM_ADMIN_EMAILS = ['bryan.atkins@gmail.com'];
  const isAdmin = currentUser && SYSTEM_ADMIN_EMAILS.includes(currentUser.email);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getAdminStats', {});
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 2 * 60_000,
  });

  // Fetch all bug reports for management tab
  const { data: allBugs = [] } = useQuery({
    queryKey: ['allBugReports'],
    queryFn: () => base44.entities.BugReport.list('-created_date', 100),
    enabled: isAdmin && activeTab === 'bugs',
    staleTime: 60_000,
  });

  const updateBugMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BugReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBugReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  useEffect(() => {
    if (!isLoading) setPageReady();
  }, [isLoading]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 font-medium">Admin access only</p>
        </div>
      </div>
    );
  }

  const s = stats;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'features', label: 'Features', icon: Heart },
    { id: 'bugs',     label: `Bugs ${s?.bugs?.open ? `(${s.bugs.open})` : ''}`, icon: Bug },
    { id: 'churn',    label: 'Churn',    icon: TrendingDown },
    { id: 'events',   label: 'Events',   icon: GitFork },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-lg font-bold text-stone-800 flex-1">Admin Dashboard</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-stone-500"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-stone-800 text-stone-800'
                  : 'border-transparent text-stone-400 hover:text-stone-600'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && s && (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <AdminStatCard label="Total Users" value={s.users.total} icon={Users} color="stone" />
                  <AdminStatCard label="Active (7d)" value={s.users.active_7d} sub={`${s.users.active_30d} last 30d`} icon={Activity} color="green" />
                  <AdminStatCard label="New Users (7d)" value={s.users.new_7d} sub={`${s.users.new_30d} last 30d`} color="blue" />
                  <AdminStatCard label="Deleted (30d)" value={s.users.deleted_30d} sub={`${s.users.deleted_total} all time`} color="red" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AdminStatCard label="Total Moments" value={s.moments.total} sub={`${s.moments.last_7d} this week`} icon={Heart} color="amber" />
                  <AdminStatCard label="Connected Pairs" value={s.relationships.connected_pairs} sub={`${s.relationships.solo_spaces} solo spaces`} icon={Users} color="violet" />
                </div>
                <div className="bg-white rounded-2xl border border-stone-200/60 p-4">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3">Bug Reports</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{s.bugs.open}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Open</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-700">{s.bugs.last_7d}</p>
                      <p className="text-xs text-stone-400 mt-0.5">This Week</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-700">{s.bugs.total}</p>
                      <p className="text-xs text-stone-400 mt-0.5">All Time</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES */}
            {activeTab === 'features' && (
              <div className="bg-white rounded-2xl border border-stone-200/60 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-stone-700">Feature Usage</h3>
                <FeatureUsageChart
                  allTime={s.moments.feature_usage_all_time}
                  last30d={s.moments.feature_usage_30d}
                />
                {/* Ego aside subtypes */}
                {Object.entries(s.moments.feature_usage_all_time)
                  .filter(([k]) => k.startsWith('ego_aside:'))
                  .length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <p className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Ego Aside Subtypes</p>
                    <div className="space-y-1">
                      {Object.entries(s.moments.feature_usage_all_time)
                        .filter(([k]) => k.startsWith('ego_aside:'))
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-stone-600">{k.replace('ego_aside:', '').replace('_', ' ')}</span>
                            <span className="font-medium text-stone-800">{v}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BUGS */}
            {activeTab === 'bugs' && (
              <div className="space-y-3">
                <BugReportList
                  bugs={allBugs}
                  onUpdate={(id, data) => updateBugMutation.mutate({ id, data })}
                />
              </div>
            )}

            {/* CHURN */}
            {activeTab === 'churn' && (
              <div className="bg-white rounded-2xl border border-stone-200/60 p-4">
                <ChurnPanel />
              </div>
            )}

            {/* EVENTS */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-2xl border border-stone-200/60 p-4">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">Live Event Feed</h3>
                <EventFeed events={s.event_feed} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}