import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, UserX, TrendingDown } from 'lucide-react';

function UserRow({ user, variant }) {
  const colors = {
    churned: 'border-red-100 bg-red-50',
    at_risk:  'border-amber-100 bg-amber-50',
  };
  const textColors = {
    churned: 'text-red-700',
    at_risk:  'text-amber-700',
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${colors[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textColors[variant]}`}>{user.name || user.email}</p>
          <p className="text-xs text-stone-400">{user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">{user.total_moments} moments</p>
          {user.last_active_at && (
            <p className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Accepts churn data directly from the parent (getAdminStats) — no extra API call needed
export default function ChurnPanel({ churn }) {
  const { summary, churned = [], at_risk = [], recently_deleted = [] } = churn || {};

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
          <UserX className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{summary?.churned_count ?? 0}</p>
          <p className="text-xs text-red-500 mt-0.5">Churned</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{summary?.at_risk_count ?? 0}</p>
          <p className="text-xs text-amber-500 mt-0.5">At Risk</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
          <TrendingDown className="w-4 h-4 text-stone-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-stone-600">{summary?.deleted_last_30_days ?? 0}</p>
          <p className="text-xs text-stone-400 mt-0.5">Deleted (30d)</p>
        </div>
      </div>

      {/* At Risk */}
      {at_risk.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">At Risk (no activity 7–28d)</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {at_risk.map((u, i) => <UserRow key={i} user={u} variant="at_risk" />)}
          </div>
        </div>
      )}

      {/* Churned */}
      {churned.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-700 uppercase tracking-wider mb-2">Churned (inactive 14+ days)</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {churned.map((u, i) => <UserRow key={i} user={u} variant="churned" />)}
          </div>
        </div>
      )}

      {/* Recently deleted */}
      {recently_deleted.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Recently Deleted (30d)</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {recently_deleted.map((u, i) => (
              <div key={i} className="border border-stone-200 rounded-xl px-3 py-2.5 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-700">{u.name || u.email}</p>
                    {u.reason && <p className="text-xs text-stone-500 italic">"{u.reason}"</p>}
                  </div>
                  <p className="text-xs text-stone-400">{u.days_as_user}d · {u.total_moments} moments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!churned.length && !at_risk.length && !recently_deleted.length && (
        <p className="text-sm text-stone-400 text-center py-4">No churn signals detected 🎉</p>
      )}
    </div>
  );
}