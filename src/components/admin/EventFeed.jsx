import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles, MessageCircle, Star, Heart, Share2, Users, Trash2, UserPlus, Eye } from 'lucide-react';

const EVENT_CONFIG = {
  moment_created:      { icon: Sparkles,      color: 'text-emerald-500', label: 'logged a moment' },
  moment_reviewed:     { icon: Eye,           color: 'text-amber-500',   label: 'reviewed a moment' },
  comment_posted:      { icon: MessageCircle, color: 'text-blue-500',    label: 'posted a comment' },
  moment_favorited:    { icon: Heart,         color: 'text-pink-500',    label: 'favorited a moment' },
  moment_shared:       { icon: Share2,        color: 'text-violet-500',  label: 'shared a reflection' },
  relationship_created:{ icon: Users,         color: 'text-stone-600',   label: 'created a space' },
  member_invited:      { icon: UserPlus,      color: 'text-blue-500',    label: 'invited a member' },
  member_joined:       { icon: UserPlus,      color: 'text-emerald-500', label: 'joined a space' },
  account_deleted:     { icon: Trash2,        color: 'text-red-500',     label: 'deleted their account' },
};

export default function EventFeed({ events }) {
  if (!events?.length) return <p className="text-sm text-stone-400 text-center py-6">No events yet</p>;

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto">
      {events.map((e, i) => {
        const cfg = EVENT_CONFIG[e.event_type] || { icon: Sparkles, color: 'text-stone-400', label: e.event_type };
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-stone-50">
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
            <p className="text-xs text-stone-600 flex-1 truncate">
              <span className="font-medium">{e.user_email?.split('@')[0]}</span>{' '}
              {cfg.label}
              {e.moment_type && <span className="text-stone-400"> ({e.moment_type.replace('_', ' ')})</span>}
            </p>
            <span className="text-xs text-stone-300 flex-shrink-0">
              {formatDistanceToNow(new Date(e.occurred_at), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}