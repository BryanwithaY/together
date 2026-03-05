import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns';
import { Heart, Smile, Users, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

function StatPill({ label, value, color = 'stone' }) {
  const colors = {
    stone: 'bg-stone-100 text-stone-700',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className={`flex flex-col items-center rounded-xl px-4 py-3 ${colors[color]}`}>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-[11px] mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

function MonthBlock({ monthLabel, moments, currentUserEmail, partnerEmail }) {
  const [open, setOpen] = useState(false);

  const myMoments = moments.filter(m => m.created_by === currentUserEmail);
  const partnerMoments = moments.filter(m => m.created_by === partnerEmail);

  const byType = (list, type) => list.filter(m => m.type === type).length;

  const myName = 'You';
  const partnerName = partnerEmail ? partnerEmail.split('@')[0] : 'Partner';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-stone-800 text-base">{monthLabel}</span>
          <span className="text-xs text-stone-400 font-medium">{moments.length} moments</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-stone-100">
          {/* Combined */}
          <div>
            <div className="flex items-center gap-1.5 mt-4 mb-3">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Together</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Total" value={moments.length} color="stone" />
              <StatPill label="Ego Aside" value={byType(moments, 'ego_aside')} color="sky" />
              <StatPill label="Gratitude" value={byType(moments, 'gratitude')} color="amber" />
              <StatPill label="Reflections" value={byType(moments, 'self_reflection')} color="rose" />
            </div>
          </div>

          {/* You */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Heart className="w-3.5 h-3.5 text-rose-400" fill="currentColor" />
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{myName}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Total" value={myMoments.length} color="stone" />
              <StatPill label="Ego Aside" value={byType(myMoments, 'ego_aside')} color="sky" />
              <StatPill label="Gratitude" value={byType(myMoments, 'gratitude')} color="amber" />
              <StatPill label="Reflections" value={byType(myMoments, 'self_reflection')} color="rose" />
            </div>
          </div>

          {/* Partner */}
          {partnerEmail && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Smile className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{partnerName}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <StatPill label="Total" value={partnerMoments.length} color="stone" />
                <StatPill label="Ego Aside" value={byType(partnerMoments, 'ego_aside')} color="sky" />
                <StatPill label="Gratitude" value={byType(partnerMoments, 'gratitude')} color="amber" />
                <StatPill label="Reflections" value={byType(partnerMoments, 'self_reflection')} color="rose" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRel, setActiveRel] = useState(null);
  const [allRelationships, setAllRelationships] = useState([]);

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      const myEmail = user.email.toLowerCase();
      base44.entities.Relationship.list('-created_date', 200).then(all => {
        const mine = all.filter(r => (r.member_emails || []).some(e => e.toLowerCase() === myEmail));
        setAllRelationships(mine);
        if (mine.length > 0) setActiveRel(mine[0]);
      });
    });
  }, []);

  const myEmail = currentUser?.email?.toLowerCase();
  const relId = activeRel?.id;

  const { data: rawMoments = [], isLoading } = useQuery({
    queryKey: ['moments-history-rel', relId],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId }, '-date', 1000),
    enabled: !!relId,
  });

  const moments = React.useMemo(() => {
    if (!myEmail) return [];
    return rawMoments.filter(m => {
      if (m.created_by?.toLowerCase() === myEmail) return true;
      if (m.is_private && !m.shared_with_partner) return false;
      if (m.visibility === 'private' || m.visibility === 'tagged_only') return false;
      return true;
    });
  }, [rawMoments, myEmail]);

  const memberEmails = activeRel?.member_emails || [];

  // Group moments by month
  const monthGroups = React.useMemo(() => {
    const map = new Map();
    moments.forEach(m => {
      const d = m.date ? parseISO(m.date) : new Date(m.created_date);
      const key = format(startOfMonth(d), 'yyyy-MM');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    // Sort newest first
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [moments]);

  // All-time totals
  const totalEgo = moments.filter(m => m.type === 'ego_aside').length;
  const totalGratitude = moments.filter(m => m.type === 'gratitude').length;
  const totalReflections = moments.filter(m => m.type === 'self_reflection').length;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">History</h1>
          {activeRel && <p className="text-sm text-stone-500 mt-1">{activeRel.name} · month by month</p>}
          {/* Relationship tabs */}
          {allRelationships.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {allRelationships.map(rel => (
                <button
                  key={rel.id}
                  onClick={() => setActiveRel(rel)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                    activeRel?.id === rel.id
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {rel.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* All-time summary */}
        {moments.length > 0 && (
          <div className="bg-stone-800 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">All Time</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{moments.length}</span>
                <span className="text-[11px] text-stone-400 mt-1">Total</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{totalEgo}</span>
                <span className="text-[11px] text-stone-400 mt-1">Ego Aside</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{totalGratitude}</span>
                <span className="text-[11px] text-stone-400 mt-1">Gratitude</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{totalReflections}</span>
                <span className="text-[11px] text-stone-400 mt-1">Reflections</span>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-4 text-center">
              Across {monthGroups.length} month{monthGroups.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-white border border-stone-200/60 animate-pulse" />
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No moments logged yet.</p>
          </div>
        ) : (
          monthGroups.map(([key, moms]) => (
            <MonthBlock
              key={key}
              monthLabel={format(parseISO(key + '-01'), 'MMMM yyyy')}
              moments={moms}
              currentUserEmail={currentUser?.email}
              partnerEmail={partnerEmail}
            />
          ))
        )}
      </div>
    </div>
  );
}