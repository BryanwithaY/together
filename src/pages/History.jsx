import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { HandHeart, Sparkles, ShieldAlert, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import StatsOverview from '../components/moments/StatsOverview';
import ExportButton from '../components/moments/ExportButton';

const TYPE_CONFIG = {
  ego_aside:       { icon: HandHeart, label: 'Ego Aside',  color: 'text-amber-600',  bg: 'bg-amber-50' },
  gratitude:       { icon: Sparkles,  label: 'Gratitude',  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  self_reflection: { icon: ShieldAlert,label: 'Reflection',color: 'text-violet-600', bg: 'bg-violet-50' },
};

function MemberMonthRow({ member, moments, privateReflections, currentUserEmail, month }) {
  const navigate = useNavigate();
  const isMe = member.user_email?.toLowerCase() === currentUserEmail?.toLowerCase();
  const name = member.display_name || member.user_email?.split('@')[0] || '?';

  const myMoments = moments.filter(m => m.created_by?.toLowerCase() === member.user_email?.toLowerCase());
  const myPrivate = isMe ? privateReflections : [];
  const allMoments = [...myMoments, ...myPrivate];

  if (allMoments.length === 0) return null;

  const counts = { ego_aside: 0, gratitude: 0, self_reflection: 0 };
  allMoments.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });

  // Find the earliest moment this member had in this month
  const sorted = [...allMoments].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstMomentId = sorted[0]?.id;

  const handleClick = () => {
    if (!firstMomentId) return;
    navigate(createPageUrl(`Home?scrollTo=${firstMomentId}&owner=${member.user_email}`));
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 py-2 text-left hover:bg-stone-50 rounded-lg transition-colors -mx-1 px-1"
    >
      <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">
        {name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700">{isMe ? 'You' : name}</p>
        <p className="text-xs text-stone-400">{allMoments.length} moments</p>
      </div>
      <div className="flex gap-2">
        {Object.entries(counts).filter(([, v]) => v > 0).map(([type, count]) => {
          const { icon: Icon, color, bg } = TYPE_CONFIG[type];
          return (
            <span key={type} className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>
              <Icon className="w-3 h-3" />{count}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function MonthCard({ month, moments, privateReflections, members, currentUserEmail }) {
  const [expanded, setExpanded] = useState(false);
  const label = format(month, 'MMMM yyyy');

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthMoments = moments.filter(m => {
    const d = new Date(m.date);
    return d >= monthStart && d <= monthEnd;
  });
  const monthPrivate = privateReflections.filter(m => {
    const d = new Date(m.date);
    return d >= monthStart && d <= monthEnd;
  });

  if (monthMoments.length === 0 && monthPrivate.length === 0) return null;

  const total = monthMoments.length + monthPrivate.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="text-left">
          <p className="font-semibold text-stone-800">{label}</p>
          <p className="text-xs text-stone-400 mt-0.5">{total} moment{total !== 1 ? 's' : ''}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-4 divide-y divide-stone-50">
          {members.map(member => (
            <MemberMonthRow
              key={member.id}
              member={member}
              moments={monthMoments}
              privateReflections={monthPrivate}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MonthCardLazy({ month, currentUserEmail, relationshipId, members }) {
  const [expanded, setExpanded] = useState(false);
  const label = format(month, 'MMMM yyyy');
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const { data: moments = [], isLoading: loadingMoments } = useQuery({
    queryKey: ['moments-history-month', relationshipId, format(month, 'yyyy-MM')],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: relationshipId,
      is_private: false,
    }, '-date', 1000),
    enabled: expanded && !!relationshipId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    select: (data) => data.filter(m => {
      const d = new Date(m.date);
      return d >= monthStart && d <= monthEnd;
    }),
  });

  const { data: privateReflections = [] } = useQuery({
    queryKey: ['moments-private-history-month', relationshipId, currentUserEmail, format(month, 'yyyy-MM')],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: relationshipId,
      is_private: true,
      created_by: currentUserEmail,
    }, '-date', 500),
    enabled: expanded && !!relationshipId && !!currentUserEmail,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    select: (data) => data.filter(m => {
      const d = new Date(m.date);
      return d >= monthStart && d <= monthEnd;
    }),
  });

  const total = moments.length + privateReflections.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="text-left">
          <p className="font-semibold text-stone-800">{label}</p>
          {expanded && !loadingMoments && (
            <p className="text-xs text-stone-400 mt-0.5">{total} moment{total !== 1 ? 's' : ''}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-5 pb-4 divide-y divide-stone-50">
          {loadingMoments ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          ) : total === 0 ? (
            <p className="text-sm text-stone-400 py-3 text-center">No moments this month</p>
          ) : (
            members.map(member => (
              <MemberMonthRow
                key={member.id}
                member={member}
                moments={moments}
                privateReflections={privateReflections}
                currentUserEmail={currentUserEmail}
                month={month}
              />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

// Fetch only the last 12 months of moment counts for the stats overview + month list
function HistoryContent() {
  const { activeRelationship, currentUser, members } = useRelationship();

  // Lightweight query just for stats — last 12 months, limited fields
  const { data: moments = [], isLoading } = useQuery({
    queryKey: ['moments-history-stats', activeRelationship?.id],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: activeRelationship.id, is_private: false }, '-date', 1000),
    enabled: !!activeRelationship?.id,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const { data: privateReflections = [] } = useQuery({
    queryKey: ['moments-private-history-stats', activeRelationship?.id, currentUser?.email],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_private: true,
      created_by: currentUser.email,
    }, '-date', 500),
    enabled: !!activeRelationship?.id && !!currentUser?.email,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Build only months that have at least one moment
  const allMoments = [...moments, ...privateReflections];
  const monthsWithData = allMoments.reduce((acc, m) => {
    const key = format(new Date(m.date), 'yyyy-MM');
    acc.add(key);
    return acc;
  }, new Set());

  // Determine the earliest date from actual moment data
  const earliestMomentDate = allMoments.length > 0
    ? new Date(Math.min(...allMoments.map(m => new Date(m.date).getTime())))
    : null;
  const relationshipCreated = activeRelationship?.created_date ? new Date(activeRelationship.created_date) : null;
  const userCreated = currentUser?.created_date ? new Date(currentUser.created_date) : null;
  const earliestDate = earliestMomentDate || relationshipCreated || userCreated || subMonths(new Date(), 11);

  const now = new Date();
  const monthsRange = eachMonthOfInterval({ start: startOfMonth(earliestDate), end: now })
    .reverse()
    .filter(month => monthsWithData.has(format(month, 'yyyy-MM')));

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <RelationshipSwitcher />
          <h1 className="text-lg font-bold text-stone-800 ml-auto">History</h1>
          {activeRelationship?.allow_export !== false && (
            <ExportButton
              moments={moments}
              privateReflections={privateReflections}
              relationshipName={activeRelationship?.name}
            />
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <StatsOverview moments={moments} privateReflections={privateReflections} />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        ) : (
          monthsRange.map(month => (
            <MonthCardLazy
              key={month.toISOString()}
              month={month}
              relationshipId={activeRelationship?.id}
              currentUserEmail={currentUser?.email}
              members={members}
            />
          ))
        )}

        {!isLoading && moments.length === 0 && privateReflections.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-stone-300" />
            </div>
            <p className="text-stone-400 font-medium">No history yet</p>
            <p className="text-stone-400 text-sm mt-1">Start logging moments to see your history</p>
          </div>
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