import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Github, ExternalLink, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  wont_fix: 'bg-stone-100 text-stone-500',
};

const PRIORITY_COLORS = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-stone-100 text-stone-500',
};

function parseGithubFromNotes(notes) {
  if (!notes) return null;
  const match = notes.match(/GitHub: #(\d+) (https?:\/\/\S+)/);
  if (!match) return null;
  return { number: match[1], url: match[2] };
}

function BugRow({ bug, onUpdate, onRefetch }) {
  const [open, setOpen] = useState(false);
  const [pushing, setPushing] = useState(false);

  const github = parseGithubFromNotes(bug.admin_notes);

  const handlePushToGithub = async (e) => {
    e.stopPropagation();
    setPushing(true);
    await base44.functions.invoke('pushBugToGithub', { bug_id: bug.id });
    onRefetch?.();
    setPushing(false);
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[bug.status] || ''}`}>{bug.status}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[bug.priority] || ''}`}>{bug.priority}</span>
            <span className="text-xs text-stone-400">{bug.type}</span>
            {github && (
              <a
                href={github.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                <Github className="w-3 h-3" />
                #{github.number}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <p className="text-sm font-medium text-stone-800 mt-1 truncate">{bug.title}</p>
          <p className="text-xs text-stone-400">{bug.reporter_email} · {new Date(bug.created_date).toLocaleDateString()}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="p-3 border-t border-stone-100 bg-stone-50 space-y-3">
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{bug.description}</p>
          {bug.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bug.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{a.name}</a>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {['open', 'in_progress', 'resolved', 'wont_fix'].map(s => (
              <Button
                key={s}
                size="sm"
                variant={bug.status === s ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => onUpdate(bug.id, { status: s, resolved_at: s === 'resolved' ? new Date().toISOString() : undefined })}
              >
                {s.replace('_', ' ')}
              </Button>
            ))}
          </div>
          {!github && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePushToGithub}
              disabled={pushing}
              className="h-7 text-xs border-stone-300 text-stone-600 flex items-center gap-1.5"
            >
              {pushing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
              Push to GitHub
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BugReportList({ bugs, onUpdate, onRefetch }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await base44.functions.invoke('syncGithubIssues', {});
    onRefetch?.();
    setSyncing(false);
  };

  if (!bugs?.length) return <p className="text-sm text-stone-400 text-center py-6">No reports yet</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          className="h-7 text-xs border-stone-300 text-stone-600 flex items-center gap-1.5"
        >
          {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
          Sync from GitHub
        </Button>
      </div>
      <div className="space-y-2">
        {bugs.map(bug => (
          <BugRow key={bug.id} bug={bug} onUpdate={onUpdate} onRefetch={onRefetch} />
        ))}
      </div>
    </div>
  );
}