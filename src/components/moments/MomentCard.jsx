import React from 'react';
import { motion } from 'framer-motion';
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const subtypeConfig = {
  listened: { icon: Ear, label: 'Listened' },
  learned: { icon: BookOpen, label: 'Learned' },
  admitted_mistake: { icon: Flag, label: 'Admitted a Mistake' },
  let_partner_lead: { icon: Users, label: 'Let Partner Lead' },
  general: { icon: HandHeart, label: 'Ego Aside' },
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export default function MomentCard({ moment, index }) {
  const isEgoAside = moment.type === 'ego_aside';
  const subtype = subtypeConfig[moment.subtype] || subtypeConfig.general;
  const Icon = isEgoAside ? subtype.icon : Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative flex gap-4 p-4 rounded-2xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        isEgoAside ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            isEgoAside ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {isEgoAside ? subtype.label : 'Gratitude'}
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-400">{formatDate(moment.date)}</span>
        </div>
        {moment.description && (
          <p className="text-sm text-stone-600 leading-relaxed">{moment.description}</p>
        )}
        {!moment.description && (
          <p className="text-sm text-stone-400 italic">No note added</p>
        )}
      </div>
    </motion.div>
  );
}