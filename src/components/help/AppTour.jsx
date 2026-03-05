import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Heart, HandHeart, Sparkles, ShieldAlert,
  BarChart2, Bookmark, Settings, MessageCircle, Share2, Star, Users, Eye, Lock, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Welcome to Together 👋',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>Together helps the people you care about grow — not by replacing real connection, but by helping you <strong className="text-stone-800">track, reflect, and show up better</strong>.</p>
        <p>It works across all relationship types: romantic partners, friends, families, co-founders, and more.</p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-800 text-xs">
          💡 <strong>Remember:</strong> The app tracks moments — but real growth happens in your actual conversations.
        </div>
      </div>
    ),
  },
  {
    title: 'Relationship Spaces',
    icon: Users,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>Each group you belong to lives in its own <strong className="text-stone-800">Relationship Space</strong>. Data is fully isolated between spaces.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Switch spaces</strong> using the switcher in the top-left of the home screen.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Roles</strong>: Owner → Admin → Member → Read Only. Each has different permissions.
          </div>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800">
          👑 The <strong>Owner</strong> can delete the space, transfer ownership, and control export settings.
        </div>
      </div>
    ),
  },
  {
    title: 'Recording Moments',
    icon: HandHeart,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>Tap <strong className="text-stone-800">+</strong> to log a moment. Three types:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
            <HandHeart className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-xs">Ego Aside</p>
              <p className="text-xs text-amber-700 mt-0.5">Moments when you put others first — listened, admitted a mistake, let someone lead.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-xs">Gratitude</p>
              <p className="text-xs text-emerald-700 mt-0.5">Log it — then go say it directly to them!</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-violet-50 rounded-xl p-3">
            <ShieldAlert className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-violet-800 text-xs">Self Reflection</p>
              <p className="text-xs text-violet-700 mt-0.5">Private by default. Honest self-assessment for your own growth.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Tagging & Visibility',
    icon: Tag,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>When posting, you can <strong className="text-stone-800">tag</strong> who the moment is about.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Groups of 3+:</strong> tagging is required. You can tag one person, multiple, or everyone.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">1-to-1 relationships:</strong> tagging is optional.
          </div>
        </div>
        <p>You can also set <strong className="text-stone-800">visibility</strong>:</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs"><Users className="w-3.5 h-3.5 text-stone-400" /> <strong>Whole relationship</strong> — everyone can see it</div>
          <div className="flex items-center gap-2 text-xs"><Eye className="w-3.5 h-3.5 text-stone-400" /> <strong>Tagged only</strong> — only tagged members see it</div>
          <div className="flex items-center gap-2 text-xs"><Lock className="w-3.5 h-3.5 text-stone-400" /> <strong>Private</strong> — only you (always available)</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
          ⚠️ Once someone comments, tags and visibility are locked and can't be changed.
        </div>
      </div>
    ),
  },
  {
    title: 'Self Reflections',
    icon: ShieldAlert,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>Self-reflections are <strong className="text-stone-800">private to you by default</strong>.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-stone-600">
            <Share2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p>Tap <strong>Share with relationship</strong> to make it visible to others when you're ready.</p>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-600">
            <Bookmark className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p>Bookmark reflections to revisit them in the <strong>Saved</strong> tab.</p>
          </div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600">
          💬 Use the reflection to prepare what you want to say — then have the real conversation in person.
        </div>
      </div>
    ),
  },
  {
    title: 'Home Feed & Filtering',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>The <strong className="text-stone-800">Home</strong> screen shows moments for your active relationship space.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Filter by person:</strong> see everyone's, just yours, or a specific member's.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Filter by type:</strong> focus on ego aside, gratitude, or reflections.
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-stone-600">
          <MessageCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <p>Comments can be added by tagged members. Once a comment is posted, the moment is locked from editing.</p>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-stone-600">
          <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>Tap the <strong>star</strong> to save a moment to your Favorites.</p>
        </div>
      </div>
    ),
  },
  {
    title: 'History',
    icon: BarChart2,
    iconColor: 'text-stone-600',
    iconBg: 'bg-stone-100',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>The <strong className="text-stone-800">History</strong> tab gives you a monthly view of your moments and patterns.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">All-time totals</strong> at the top show aggregate counts across all categories.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Monthly breakdowns</strong> per member — see each person's contribution.
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
          🗓️ Make it a weekly ritual to review History together and talk about what you each noticed.
        </div>
      </div>
    ),
  },
  {
    title: 'Saved',
    icon: Bookmark,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>The <strong className="text-stone-800">Saved</strong> tab keeps your most meaningful moments in one place.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
            <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" />
            <div>
              <p className="font-semibold text-amber-800 text-xs">Favorites</p>
              <p className="text-xs text-amber-700 mt-0.5">Starred ego aside and gratitude moments.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-violet-50 rounded-xl p-3">
            <Bookmark className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" />
            <div>
              <p className="font-semibold text-violet-800 text-xs">Reflections</p>
              <p className="text-xs text-violet-700 mt-0.5">Bookmarked self-reflections to revisit.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Settings & Roles',
    icon: Settings,
    iconColor: 'text-stone-600',
    iconBg: 'bg-stone-100',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>In <strong className="text-stone-800">Settings</strong> you can manage your profile and relationship space.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Relationship Space:</strong> invite members, change roles, and manage settings — based on your permission level.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Remove members:</strong> admins can remove users with three options — archive content, anonymize, or hard delete.
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800">
          ❤️ Together works best when everyone in the group is engaged. Invite the people who matter.
        </div>
      </div>
    ),
  },
  {
    title: 'You\'re all set! 🎉',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>You now know everything you need to start using Together with intention.</p>
        <div className="bg-stone-800 rounded-xl p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Remember</p>
          <p className="text-sm leading-relaxed">This app is a mirror, not a messenger. Use it to grow your self-awareness — then bring that growth into your real, human connections.</p>
        </div>
        <p className="text-xs text-stone-400 text-center">You can always find this tour again in Help & Philosophy.</p>
      </div>
    ),
  },
];

export default function AppTour({ onClose }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="h-1 bg-stone-100">
            <div className="h-1 bg-stone-800 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${current.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${current.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">Step {step + 1} of {steps.length}</p>
                  <h2 className="text-base font-bold text-stone-800 leading-tight">{current.title}</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-6">{current.content}</div>
            <div className="flex items-center gap-3">
              {!isFirst && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-none">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={() => isLast ? onClose() : setStep(s => s + 1)} className="flex-1 bg-stone-800 hover:bg-stone-900 text-white">
                {isLast ? 'Done' : <><span>Next</span><ChevronRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}