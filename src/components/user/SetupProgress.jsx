import React, { useState } from 'react';
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react';
import { useRelationship } from '../relationship/RelationshipContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STORAGE_KEY = 'together_setup_dismissed';

/**
 * SetupProgress — lightweight user journey checklist.
 * Computed entirely from already-loaded RelationshipContext data.
 * Auto-hides once all steps are complete or manually dismissed.
 */
export default function SetupProgress({ moments = [] }) {
  const { activeRelationship, members, myMembership } = useRelationship();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  if (dismissed) return null;

  const partnerConnected = members.filter(m => m.status === 'active').length > 1;
  const firstMoment = moments.length > 0;

  const steps = [
    { label: 'Create your space', done: !!activeRelationship, action: null },
    { label: 'Invite your partner', done: partnerConnected, action: '/Settings', actionLabel: 'Invite' },
    { label: 'Log your first moment', done: firstMoment, action: null },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  // Auto-dismiss permanently once all steps complete
  if (allDone) {
    localStorage.setItem(STORAGE_KEY, '1');
    return null;
  }

  const nextStep = steps.find(s => !s.done);

  return (
    <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Getting started</p>
          <p className="text-xs text-stone-400 mt-0.5">{completedCount} of {steps.length} done</p>
        </div>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem(STORAGE_KEY, '1'); }}
          className="p-1 text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-stone-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-stone-800 rounded-full transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {step.done
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : <Circle className="w-4 h-4 text-stone-200 flex-shrink-0" />
            }
            <span className={`text-sm flex-1 ${step.done ? 'line-through text-stone-300' : 'text-stone-600'}`}>
              {step.label}
            </span>
            {!step.done && step.action && (
              <Link
                to={step.action}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-0.5 transition-colors"
              >
                {step.actionLabel}
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {nextStep && !nextStep.action && (
        <p className="text-xs text-stone-400 mt-3 border-t border-stone-100 pt-3">
          Next up: {nextStep.label} — tap <strong>New Moment</strong> above.
        </p>
      )}
    </div>
  );
}