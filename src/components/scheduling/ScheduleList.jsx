import React from 'react';
import { Calendar, MapPin, Clock, Link2 } from 'lucide-react';

export default function ScheduleList({ connections, onDelete }) {
  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No scheduled connections</p>
      </div>
    );
  }

  const upcoming = connections
    .filter(c => new Date(c.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const past = connections
    .filter(c => new Date(c.start_time) <= new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-800 mb-3">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map(conn => (
              <ConnectionCard key={conn.id} connection={conn} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-600 mb-3 opacity-75">Past</h3>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 5).map(conn => (
              <ConnectionCard key={conn.id} connection={conn} onDelete={onDelete} past />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ connection, onDelete, past }) {
  return (
    <div className={`border rounded-lg p-4 ${past ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-200 hover:shadow-md'} transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-stone-800">{connection.title}</h4>
          <div className="text-sm text-stone-600 mt-2 space-y-1">
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(connection.start_time).toLocaleString()}
            </p>
            {connection.location && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {connection.location}
              </p>
            )}
            {connection.linked_moment_ids?.length > 0 && (
              <p className="flex items-center gap-2 text-blue-600">
                <Link2 className="w-4 h-4" />
                {connection.linked_moment_ids.length} moment(s)
              </p>
            )}
          </div>
        </div>
        {!past && onDelete && (
          <button onClick={() => onDelete(connection.id)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}