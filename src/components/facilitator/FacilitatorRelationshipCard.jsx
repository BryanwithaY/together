import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Users, ChevronRight, Lock, XCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Status configs for non-active states
const STATUS_CONFIG = {
  pending_approval: {
    border: 'border-amber-200 bg-amber-50',
    icon: Clock,
    iconColor: 'text-amber-500',
    label: 'Awaiting consent',
    description: 'Members still need to approve access before you can view activity.',
    clickable: false,
  },
  declined: {
    border: 'border-stone-200 bg-stone-50',
    icon: XCircle,
    iconColor: 'text-stone-400',
    label: 'Access declined',
    description: 'Access was declined. Reach out to the relationship owner if you think this was a mistake.',
    clickable: false,
  },
  revoked: {
    border: 'border-stone-200 bg-stone-50',
    icon: Lock,
    iconColor: 'text-stone-400',
    label: 'Access removed',
    description: 'Your access was removed. Contact the members if you believe this was unintentional.',
    clickable: false,
  },
};

export default function FacilitatorRelationshipCard({ facRel, onClick }) {
  const concerns = facRel.concerns || [];
  const stats = facRel.stats || {};

  // Non-active states: render a clear status card with no interactivity
  const statusCfg = STATUS_CONFIG[facRel.status];
  if (statusCfg) {
    const StatusIcon = statusCfg.icon;
    return (
      <div className={`w-full text-left rounded-2xl border p-4 ${statusCfg.border}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
            <StatusIcon className={`w-5 h-5 ${statusCfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-stone-700 truncate">{facRel.relationship_name || 'Unnamed Relationship'}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                facRel.status === 'pending_approval'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-500'
              }`}>{statusCfg.label}</span>
            </div>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{statusCfg.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // Active state: full interactive card
  const highConcern = concerns.some(c => c.severity === 'high');
  const medConcern  = concerns.some(c => c.severity === 'medium');
  const statusColor = highConcern ? 'border-red-200 bg-red-50' : medConcern ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white';
  const ConcernIcon = (highConcern || medConcern) ? AlertTriangle : CheckCircle2;
  const iconColor   = highConcern ? 'text-red-500' : medConcern ? 'text-amber-500' : 'text-emerald-500';

  // Determine if visible moments may be limited by consent
  const hasLimitedVisibility = stats.total_moments === 0 && facRel.status === 'active';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md ${statusColor}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-stone-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-800 truncate">{facRel.relationship_name || 'Unnamed Relationship'}</h3>
            <ConcernIcon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-stone-400">
              {stats.total_moments || 0} visible moment{stats.total_moments !== 1 ? 's' : ''}
            </span>
            {stats.recent_count_7d > 0 && (
              <span className="text-xs text-emerald-600 font-medium">
                +{stats.recent_count_7d} this week
              </span>
            )}
            {stats.recent_count_7d === 0 && stats.total_moments > 0 && (
              <span className="text-xs text-stone-300">no activity this week</span>
            )}
          </div>
          {hasLimitedVisibility && (
            <div className="mt-2 flex items-start gap-1.5">
              <Info className="w-3 h-3 text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-600">Some content may be hidden due to privacy settings.</p>
            </div>
          )}
          {concerns.length > 0 && (
            <div className="mt-2 space-y-1">
              {concerns.slice(0, 2).map((c, i) => (
                <p key={i} className={`text-xs ${c.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                  · {c.message}
                </p>
              ))}
              {concerns.length > 2 && (
                <p className="text-xs text-stone-400">+{concerns.length - 2} more</p>
              )}
            </div>
          )}
          {stats.last_activity && (
            <p className="text-xs text-stone-400 mt-1.5">
              Last activity {formatDistanceToNow(new Date(stats.last_activity), { addSuffix: true })}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}