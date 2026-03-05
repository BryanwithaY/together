import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth } from 'date-fns';
import { Heart, Smile, Users, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import RelationshipGate from '../components/relationship/RelationshipGate';
import { useRelationship } from '../components/relationship/RelationshipContext';

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

function MonthBlock({ monthLabel, moments, currentUserEmail, members }) {
  const [open, setOpen] = useState(false);
  const byType = (list, type) => list.filter(m => m.type === type).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
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

          {/* Per member breakdown */}
          {members.filter(m => m.user_email).map((member) => {
            const email = member.user_email.toLowerCase();
            const name = email === currentUserEmail?.toLowerCase()
              ? 'You'
              : (member.display_name || email.split('@')[0]);
            const memberMoments = moments.filter(m => m.created_by?.toLowerCase() === email);
            if (memberMoments.length === 0) return null;
            return (
              <div key={email}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Heart className="w-3.5 h-3.5 text-rose-400" fill="currentColor" />
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{name}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <StatPill label="Total" value={memberMoments.length} color="stone" />
                  <StatPill label="Ego Aside" value={byType(memberMoments, 'ego_aside')} color="sky" />
                  <StatPill label="Gratitude" value={byType(memberMoments, 'gratitude')} color="amber" />
                  <StatPill label="Reflections" value={byType(memberMoments, 'self_reflection')} color="rose" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryContent() {
  const { currentUser, activeRelationship, members } = useRelationship();
  const relId = activeRelationship?.id;
  const myEmail = currentUser?.email?.toLowerCase();

  const { data: rawMoments = [], isLoading } = useQuery({
    queryKey: ['moments-history', relId],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: relId }, '-date', 1000),
    enabled: !!relId,
  });

  const moments = React.useMemo(() => {
    return rawMoments.filter(m => !m.is_private || m.shared_with_partner || m.created_by?.toLowerCase() === myEmail);
  }, [rawMoments, myEmail]);

  const monthGroups = React.useMemo(() => {
    const map = new Map();
    moments.forEach(m => {
      const d = m.date ? parseISO(m.date) : new Date(m.created_date);
      const key = format(startOfMonth(d), 'yyyy-MM');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [moments]);

  const totalEgo = moments.filter(m => m.type === 'ego_aside').length;
  const totalGratitude = moments.filter(m => m.type === 'gratitude').length;
  const totalReflections = moments.filter(m => m.type === 'self_reflection').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">History</h1>
          <p className="text-sm text-stone-500 mt-1">Your journey together, month by month</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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
              members={members}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function History() {
  return (
    <RelationshipGate>
      <HistoryContent />
    </RelationshipGate>
  );
}