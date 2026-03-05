import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { HandHeart, Sparkles, ShieldAlert, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

import RelationshipGate from '../components/relationship/RelationshipGate';
import RelationshipSwitcher from '../components/relationship/RelationshipSwitcher';
import { useRelationship } from '../components/relationship/RelationshipContext';
import StatsOverview from '../components/moments/StatsOverview';

const TYPE_CONFIG = {
  ego_aside:       { icon: HandHeart, label: 'Ego Aside',  color: 'text-amber-600',  bg: 'bg-amber-50' },
  gratitude:       { icon: Sparkles,  label: 'Gratitude',  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  self_reflection: { icon: ShieldAlert,label: 'Reflection',color: 'text-violet-600', bg: 'bg-violet-50' },
};

function MemberMonthRow({ member, moments, privateReflections, currentUserEmail }) {
  const isMe = member.user_email?.toLowerCase() === currentUserEmail?.toLowerCase();
  const name = member.display_name || member.user_email?.split('@')[0] || '?';

  const myMoments = moments.filter(m => m.created_by?.toLowerCase() === member.user_email?.toLowerCase());
  const myPrivate = isMe ? privateReflections : [];
  const allMoments = [...myMoments, ...myPrivate];

  if (allMoments.length === 0) return null;

  const counts = { ego_aside: 0, gratitude: 0, self_reflection: 0 };
  allMoments.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });

  return (
    <div className="flex items-center gap-3 py-2">
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
    </div>
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

function HistoryContent() {
  const { activeRelationship, currentUser, members } = useRelationship();

  const { data: moments = [] } = useQuery({
    queryKey: ['moments-history', activeRelationship?.id],
    queryFn: () => base44.entities.Moment.filter({ relationship_id: activeRelationship.id, is_private: false }, '-date', 500),
    enabled: !!activeRelationship?.id,
  });

  const { data: privateReflections = [] } = useQuery({
    queryKey: ['moments-private-history', activeRelationship?.id, currentUser?.email],
    queryFn: () => base44.entities.Moment.filter({
      relationship_id: activeRelationship.id,
      is_private: true,
      created_by: currentUser.email,
    }, '-date', 200),
    enabled: !!activeRelationship?.id && !!currentUser?.email,
  });

  const allMoments = [...moments, ...privateReflections];

  // Build months to display (from oldest moment to now, up to 12 months back)
  const now = new Date();
  const earliest = allMoments.length > 0
    ? new Date(Math.min(...allMoments.map(m => new Date(m.date))))
    : subMonths(now, 0);
  const monthsRange = eachMonthOfInterval({ start: earliest, end: now }).reverse();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <RelationshipSwitcher />
          <h1 className="text-lg font-bold text-stone-800 ml-auto">History</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <StatsOverview moments={moments} privateReflections={privateReflections} />

        {monthsRange.map(month => (
          <MonthCard
            key={month.toISOString()}
            month={month}
            moments={moments}
            privateReflections={privateReflections}
            members={members}
            currentUserEmail={currentUser?.email}
          />
        ))}

        {allMoments.length === 0 && (
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