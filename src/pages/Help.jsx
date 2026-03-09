import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, HandHeart, Sparkles, ShieldAlert, BarChart2, Bookmark, Play, MessageCircle, Users, Eye, Star, Shield, UserCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppTour from '../components/help/AppTour.jsx';
import BugReportForm from '../components/support/BugReportForm.jsx';
import { usePageLoading } from '../components/PageLoadingContext';
import { Analytics } from '../components/lib/analytics';

const principles = [
  {
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    title: 'This app supports connection — it doesn\'t replace it',
    body: 'Together is a tracking tool, not a communication tool. The real magic happens when you say things out loud — face to face, voice to voice. Use this app to reflect and notice patterns, then bring those insights into your actual conversations.',
  },
  {
    icon: MessageCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    title: 'Say praise out loud — don\'t just log it',
    body: 'When you notice something wonderful about your partner, tell them directly. Logging a gratitude moment is meaningful for your own growth, but hearing "I\'m grateful for you because..." is irreplaceable. Let the app remind you to say it, not say it for you.',
  },
  {
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    title: 'What gets measured gets managed',
    body: 'Tracking moments of ego, gratitude, and self-reflection builds self-awareness over time. You\'ll start to see patterns — the situations where you shine and the ones where you struggle. That awareness is the foundation for real growth.',
  },
  {
    icon: Eye,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    title: 'Growth requires discomfort',
    body: 'The most valuable conversations are often the hardest ones. If something feels uncomfortable to share with your partner, that\'s usually a signal it\'s worth saying out loud. True growth rarely comes from validation — it comes from honest, sometimes difficult self-examination.',
  },
  {
    icon: Star,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    title: 'Review together, grow together',
    body: 'Set aside regular time — even just 10 minutes a week — to look at each other\'s logged moments together. This ritual builds transparency and gives you both a shared language for your relationship.',
  },
  {
    icon: Sparkles,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    title: 'One story is never the whole story',
    body: 'When conflict or tension arises, we naturally present our own narrative. But every situation has at least three perspectives: yours, theirs, and a neutral observer\'s. The AI coach is designed to help you see all three — including where you may be contributing to the dynamic.',
  },
];

const features = [
  {
    icon: HandHeart,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Ego Aside',
    description: 'Log moments when you put your partner\'s needs first — listening, admitting a mistake, letting them lead.',
  },
  {
    icon: Sparkles,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Gratitude',
    description: 'Capture things you\'re grateful for. Then go say it to them directly.',
  },
  {
    icon: ShieldAlert,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Self Reflection',
    description: 'Private space to honestly assess moments where you could have shown up better. Share when you\'re ready.',
  },
  {
    icon: BarChart2,
    color: 'text-stone-600',
    bg: 'bg-stone-100',
    title: 'History',
    description: 'See your patterns over time — monthly breakdowns of your moments and growth.',
  },
  {
    icon: Bookmark,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Saved',
    description: 'Favorites for ego & gratitude moments. Bookmarks for self-reflections you want to revisit.',
  },
];

export default function Help() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPageReady } = usePageLoading();
  const [tourOpen, setTourOpen] = useState(false);
  const canGoBack = location.key !== 'default';

  useEffect(() => { setPageReady(); Analytics.pageViewed('help'); }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => canGoBack ? navigate(-1) : navigate(createPageUrl('Home'))}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors select-none"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Help & Philosophy</h1>
              <p className="text-sm text-stone-500 mt-0.5">How to get the most from Together</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Take the Tour CTA */}
        <div className="bg-stone-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">App Tour</h2>
              <p className="text-stone-300 text-sm">A guided walkthrough of every feature</p>
            </div>
          </div>
          <p className="text-stone-400 text-sm mb-4">
            New to Together? Take the tour to learn what each section does and how to make the most of it.
          </p>
          <Button
            onClick={() => { setTourOpen(true); Analytics.appTourStarted(); }}
            className="bg-white text-stone-900 hover:bg-stone-100 font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Tour
          </Button>
        </div>

        {/* Philosophy */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-3 px-1">Our Philosophy</h2>
          <div className="space-y-3">
            {principles.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className={`bg-white rounded-2xl border ${p.border} p-5`}>
                  <div className="flex gap-4">
                    <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4.5 h-4.5 ${p.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 text-sm mb-1.5 leading-snug">{p.title}</h3>
                      <p className="text-sm text-stone-500 leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Reference */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-3 px-1">Feature Guide</h2>
          <div className="bg-white rounded-2xl border border-stone-200/60 divide-y divide-stone-100">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{f.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-rose-700 uppercase tracking-wider mb-3">Quick Tips</h2>
          <ul className="space-y-2.5">
            {[
              'Log moments as soon as they happen — memory fades fast.',
              'Use the History tab to review patterns at the end of each week.',
              'Share self-reflections with your partner only when you\'re ready to have a real conversation about them.',
              'A logged gratitude is a reminder — don\'t forget to actually say it out loud.',
              'Consistency matters more than perfection. Even one moment a day builds awareness.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-rose-900">
                <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Facilitator Guide */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-3 px-1">Facilitators — Guided Support</h2>
          <div className="bg-white rounded-2xl border border-violet-100 divide-y divide-stone-100 mb-3">
            {[
              {
                icon: Shield,
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                title: 'What is a Facilitator?',
                body: 'A facilitator is someone — a therapist, couples coach, trusted mentor, or even a close friend — who you invite to view your relationship\'s moments and patterns. They can send you guidance, take private session notes, and use AI-assisted pattern analysis to help you grow.'
              },
              {
                icon: UserCheck,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                title: 'How to Approve a Facilitator',
                body: 'Go to Settings → Relationship → Facilitator Oversight. Share your Relationship ID with your facilitator so they can request access. Once they do, each member will be asked to individually approve or decline. Access is only granted when all members consent.'
              },
              {
                icon: Eye,
                color: 'text-sky-600',
                bg: 'bg-sky-50',
                title: 'What They Can & Can\'t See',
                body: 'Facilitators see only moments you\'ve shared with the relationship (visibility set to "relationship"). You can also hide your self-reflection moments entirely, or hide specific moments one by one. Private moments are never visible. You stay in full control — always.'
              },
              {
                icon: Lock,
                color: 'text-stone-600',
                bg: 'bg-stone-100',
                title: 'Revoke Access Anytime',
                body: 'You can revoke a facilitator\'s access at any time in Relationship Settings. This immediately and permanently removes their visibility into your data. Their private session notes (visible only to them) are not affected.'
              },
              {
                icon: Users,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                title: 'Become a Facilitator Yourself',
                body: 'Do you know a couple or group who could benefit from guided support? If you have the skills, bandwidth, and genuine motivation to help — you can apply to become a facilitator in Settings → Facilitator Portal. Personal mentors and professional practitioners are both welcome. Your role is to guide, not to judge.'
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{item.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate(createPageUrl('FacilitatorPortal'))}
            className="w-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium rounded-xl py-3 hover:bg-violet-100 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" /> Open Facilitator Portal
          </button>
        </div>

        {/* AI Coach CTA */}
        <div className="bg-indigo-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">AI Relationship Coach</h2>
              <p className="text-indigo-300 text-sm">Honest reflection. Real growth.</p>
            </div>
          </div>
          <p className="text-indigo-200 text-sm mb-4 leading-relaxed">
            Your AI coach doesn't just validate how you feel — it helps you see situations clearly, understand other perspectives, and take constructive action to strengthen your relationships.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Coach'))}
            className="bg-white text-indigo-900 hover:bg-indigo-50 font-medium"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Open AI Coach
          </Button>
        </div>

        {/* Bug Report / Support */}
        <BugReportForm />

        <div className="h-6" />
      </div>

      {tourOpen && <AppTour onClose={() => setTourOpen(false)} />}
    </div>
  );
}