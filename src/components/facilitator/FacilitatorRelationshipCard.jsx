import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FacilitatorRelationshipCard({ facRel, onClick }) {
  const concerns = facRel.concerns || [];
  const stats = facRel.stats || {};
  const highConcern = concerns.some(c => c.severity === 'high');
  const medConcern = concerns.some(c => c.severity === 'medium');

  const statusColor = highConcern
    ? 'border-red-200 bg-red-50'
    : medConcern
    ? 'border-amber-200 bg-amber-50'
    : 'border-stone-200 bg-white';

  const ConcernIcon = highConcern ? AlertTriangle : medConcern ? AlertTriangle : CheckCircle2;
  const iconColor = highConcern ? 'text-red-500' : medConcern ? 'text-amber-500' : 'text-emerald-500';

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
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-stone-400">
              {stats.total_moments || 0} moments
            </span>
            {stats.recent_count_7d > 0 && (
              <span className="text-xs text-stone-400">
                {stats.recent_count_7d} this week
              </span>
            )}
            {facRel.status === 'pending_approval' && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Awaiting consent
              </span>
            )}
          </div>
          {concerns.length > 0 && (
            <div className="mt-2 space-y-1">
              {concerns.slice(0, 2).map((c, i) => (
                <p key={i} className={`text-xs ${c.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                  · {c.message}
                </p>
              ))}
              {concerns.length > 2 && (
                <p className="text-xs text-stone-400">+{concerns.length - 2} more concerns</p>
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