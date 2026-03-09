import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import UserDetailModal from './UserDetailModal';

const days = (n) => new Date(Date.now() - n * 86400000).toISOString();

const CONFIGS = {
  total_users: {
    title: 'All Users',
    fetch: () => base44.entities.User.list('-created_date', 500),
    userEmailKey: 'email',
    columns: [
      { key: 'full_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'is_disabled', label: 'Status', type: 'status' },
      { key: 'created_date', label: 'Joined', type: 'date' },
    ],
  },
  active_7d: {
    title: 'Active Users — Last 7 Days',
    fetch: () => base44.entities.AppEvent.filter({ occurred_at: { $gte: days(7) } }, '-occurred_at', 500),
    columns: [
      { key: 'user_email', label: 'User' },
      { key: 'event_type', label: 'Last Event' },
      { key: 'occurred_at', label: 'When', type: 'date' },
    ],
    dedupe: 'user_email',
  },
  active_30d: {
    title: 'Active Users — Last 30 Days',
    fetch: () => base44.entities.AppEvent.filter({ occurred_at: { $gte: days(30) } }, '-occurred_at', 1000),
    columns: [
      { key: 'user_email', label: 'User' },
      { key: 'event_type', label: 'Last Event' },
      { key: 'occurred_at', label: 'When', type: 'date' },
    ],
    dedupe: 'user_email',
  },
  new_7d: {
    title: 'New Users — Last 7 Days',
    fetch: () => base44.entities.User.filter({ created_date: { $gte: days(7) } }, '-created_date', 200),
    userEmailKey: 'email',
    columns: [
      { key: 'full_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'is_disabled', label: 'Status', type: 'status' },
      { key: 'created_date', label: 'Joined', type: 'date' },
    ],
  },
  new_30d: {
    title: 'New Users — Last 30 Days',
    fetch: () => base44.entities.User.filter({ created_date: { $gte: days(30) } }, '-created_date', 200),
    userEmailKey: 'email',
    columns: [
      { key: 'full_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'is_disabled', label: 'Status', type: 'status' },
      { key: 'created_date', label: 'Joined', type: 'date' },
    ],
  },
  deleted_30d: {
    title: 'Deleted Accounts — Last 30 Days',
    fetch: () => base44.entities.DeletedUser.filter({ deleted_at: { $gte: days(30) } }, '-deleted_at', 200),
    columns: [
      { key: 'user_name', label: 'Name' },
      { key: 'user_email', label: 'Email' },
      { key: 'deleted_at', label: 'Deleted', type: 'date' },
      { key: 'days_since_signup', label: 'Days Active' },
      { key: 'total_moments_logged', label: 'Moments' },
      { key: 'reason', label: 'Reason' },
    ],
  },
  deleted_total: {
    title: 'All Deleted Accounts',
    fetch: () => base44.entities.DeletedUser.list('-deleted_at', 500),
    columns: [
      { key: 'user_name', label: 'Name' },
      { key: 'user_email', label: 'Email' },
      { key: 'deleted_at', label: 'Deleted', type: 'date' },
      { key: 'days_since_signup', label: 'Days Active' },
      { key: 'total_moments_logged', label: 'Moments' },
      { key: 'reason', label: 'Reason' },
    ],
  },
  total_moments: {
    title: 'All Moments',
    fetch: () => base44.entities.Moment.list('-date', 500),
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'subtype', label: 'Subtype' },
      { key: 'created_by', label: 'Author' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
  },
  moments_7d: {
    title: 'Moments — Last 7 Days',
    fetch: () => base44.entities.Moment.filter({ date: { $gte: days(7) } }, '-date', 200),
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'subtype', label: 'Subtype' },
      { key: 'created_by', label: 'Author' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
  },
  connected_pairs: {
    title: 'Connected Relationships',
    fetch: () => base44.entities.Relationship.filter({ member_count: { $gte: 2 } }, '-created_date', 200),
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'member_count', label: 'Members' },
      { key: 'total_moments', label: 'Moments' },
      { key: 'owner_email', label: 'Owner' },
      { key: 'created_date', label: 'Created', type: 'date' },
    ],
  },
  solo_spaces: {
    title: 'Solo Relationship Spaces',
    fetch: () => base44.entities.Relationship.filter({ member_count: 1 }, '-created_date', 200),
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'total_moments', label: 'Moments' },
      { key: 'owner_email', label: 'Owner' },
      { key: 'created_date', label: 'Created', type: 'date' },
    ],
  },
  bugs_open: {
    title: 'Open Bug Reports',
    fetch: () => base44.entities.BugReport.filter({ status: 'open' }, '-created_date', 200),
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'priority', label: 'Priority' },
      { key: 'reporter_email', label: 'Reporter' },
      { key: 'created_date', label: 'Date', type: 'date' },
    ],
  },
  bugs_7d: {
    title: 'Bug Reports — This Week',
    fetch: () => base44.entities.BugReport.filter({ created_date: { $gte: days(7) } }, '-created_date', 200),
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'reporter_email', label: 'Reporter' },
      { key: 'created_date', label: 'Date', type: 'date' },
    ],
  },
  bugs_total: {
    title: 'All Bug Reports',
    fetch: () => base44.entities.BugReport.list('-created_date', 500),
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'reporter_email', label: 'Reporter' },
      { key: 'created_date', label: 'Date', type: 'date' },
    ],
  },
};

function formatCell(value, type) {
  if (type === 'status') {
    return value === true
      ? <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Disabled</span>
      : <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>;
  }
  if (value == null || value === '') return '—';
  if (type === 'date') {
    try { return format(new Date(value), 'MMM d, yyyy'); } catch { return value; }
  }
  return String(value);
}

export default function StatDetailModal({ type, onClose }) {
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const config = CONFIGS[type];

  const { data = [], isLoading } = useQuery({
    queryKey: ['statDetail', type],
    queryFn: config?.fetch,
    enabled: !!config,
    staleTime: 60_000,
  });

  if (!config) return null;

  let rows = data;
  if (config.dedupe) {
    const seen = new Set();
    rows = data.filter(row => {
      const key = row[config.dedupe];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 flex-shrink-0">
          <h2 className="text-base font-bold text-stone-800">{config.title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">No data found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 border-b border-stone-200">
                <tr>
                  {config.columns.map(col => (
                    <th key={col.key} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row, i) => {
                  const emailKey = config.userEmailKey;
                  const isUserRow = !!emailKey;
                  return (
                    <tr
                      key={row.id || i}
                      className={`transition-colors ${isUserRow ? 'cursor-pointer hover:bg-stone-100' : 'hover:bg-stone-50'}`}
                      onClick={isUserRow ? () => setSelectedUserEmail(row[emailKey]) : undefined}
                    >
                      {config.columns.map(col => (
                        <td key={col.key} className="px-4 py-2.5 text-stone-700 max-w-[220px] truncate">
                          {formatCell(row[col.key], col.type)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400 flex-shrink-0">
            {rows.length} record{rows.length !== 1 ? 's' : ''}
            {config.userEmailKey && <span className="ml-2 text-stone-300">· Click a row for full user details</span>}
          </div>
        )}
      </div>

      {selectedUserEmail && (
        <UserDetailModal
          userEmail={selectedUserEmail}
          onClose={() => setSelectedUserEmail(null)}
        />
      )}
    </div>
  );
}