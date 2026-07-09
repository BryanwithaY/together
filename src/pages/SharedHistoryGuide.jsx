import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, LogOut, Archive, Heart, Settings2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { usePageLoading } from '@/components/PageLoadingContext';

const SECTIONS = [
  {
    icon: Lock,
    title: 'Private means private',
    body: "Your private reflections and personal notes stay yours. No one else in the space can see them unless you choose to share.",
  },
  {
    icon: Shield,
    title: 'Shared means protected',
    body: "Once something is shared with the people in your space, it isn't something one person can quietly erase. Shared memories deserve protection.",
  },
  {
    icon: LogOut,
    title: 'Leaving is not deleting',
    body: "If someone leaves a shared space, the memories that were already built together stay intact. Leaving changes who's involved — it doesn't erase what happened.",
  },
  {
    icon: Archive,
    title: 'Archive before destroy',
    body: "Together always prefers archiving a space over deleting it. Archived spaces become read-only, but nothing is lost — and they can be reopened later.",
  },
  {
    icon: Heart,
    title: 'Your contributions remain yours',
    body: "What you add to a shared space is still your own. Together is working toward giving you more control to review, export, or manage your own contributions over time.",
  },
];

export default function SharedHistoryGuide() {
  const navigate = useNavigate();
  const { setPageReady } = usePageLoading();

  useEffect(() => { setPageReady(); }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors select-none"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">How Together Protects Shared History</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
          <p className="text-sm text-stone-600 leading-relaxed">
            Together helps people build a shared record of memories, reflections, schedules, and growth.
            Because this history can belong to more than one person, Together protects it a little differently
            than ordinary app data.
          </p>
        </div>

        {SECTIONS.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-200/60 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4.5 h-4.5 text-stone-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-800 text-sm mb-1">{s.title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-4.5 h-4.5 text-stone-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 text-sm mb-1">Where to manage this space</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                You can review your own preferences, acknowledge how shared history works, and see your space's
                status anytime in Shared History settings.
              </p>
            </div>
          </div>
          <Link
            to={createPageUrl('SharedHistory')}
            className="flex items-center justify-center w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl h-11 text-sm font-medium transition-colors"
          >
            Open Shared History
          </Link>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}