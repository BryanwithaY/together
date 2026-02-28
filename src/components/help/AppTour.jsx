import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Heart, HandHeart, Sparkles, ShieldAlert, BarChart2, Bookmark, Settings, MessageCircle, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Welcome to Together 👋',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>Together helps you and your partner grow — not by replacing your connection, but by helping you <strong className="text-stone-800">track, reflect, and show up better</strong> for each other.</p>
        <p>This tour will walk you through every feature in about 2 minutes.</p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-800 text-xs">
          💡 <strong>Remember:</strong> The app tracks moments — but the real growth happens in your conversations.
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
        <p>Tap the <strong className="text-stone-800">+ button</strong> on the Home screen to log a moment. There are three types:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3">
            <HandHeart className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-xs">Ego Aside</p>
              <p className="text-xs text-amber-700 mt-0.5">Moments when you put your partner first — listened, admitted a mistake, let them lead.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-3">
            <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-xs">Gratitude</p>
              <p className="text-xs text-emerald-700 mt-0.5">Things you appreciate about your partner. Log it — then go say it to them directly!</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-violet-50 rounded-xl p-3">
            <ShieldAlert className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-violet-800 text-xs">Self Reflection</p>
              <p className="text-xs text-violet-700 mt-0.5">Private moments where you assess how you could have shown up better. Honest, personal growth.</p>
            </div>
          </div>
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
        <p>Self-reflections are <strong className="text-stone-800">private to you by default</strong>. They're a safe space to be honest with yourself.</p>
        <div className="space-y-2">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-800">
            <strong>Follow-up fields</strong> let you note what you could have done better and how you want to show up next time.
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-600">
            <Share2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p>When you're ready to have a real conversation about it, tap <strong>Share with Partner</strong> to make it visible to them.</p>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-stone-600">
            <Bookmark className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p>Bookmark reflections you want to revisit — find them in the <strong>Saved</strong> tab.</p>
          </div>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600">
          💬 <strong>Tip:</strong> Use the reflection to prepare what you want to say, then have the conversation in person.
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
        <p>The <strong className="text-stone-800">Home</strong> screen shows all moments — yours and your partner's.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Filter by owner:</strong> <span className="text-stone-500">See all moments, just yours, or just your partner's.</span>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Filter by type:</strong> <span className="text-stone-500">Focus on ego, gratitude, or reflection moments.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-stone-600">
          <MessageCircle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <p>Each moment has a <strong>comments thread</strong> — great for leaving a quick reaction or follow-up thought.</p>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-stone-600">
          <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>Tap the <strong>star</strong> on ego/gratitude moments to save them as favorites.</p>
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
            <strong className="text-stone-700">All-time stats</strong> at the top show your total counts across all categories.
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Monthly breakdowns</strong> help you see trends — are you logging more gratitude this month? More reflections?
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
          🗓️ <strong>Suggestion:</strong> Make it a weekly ritual to review your History together and talk about what you each noticed.
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
              <p className="text-xs text-amber-700 mt-0.5">Starred ego aside and gratitude moments from you and your partner.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-violet-50 rounded-xl p-3">
            <Bookmark className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" fill="currentColor" />
            <div>
              <p className="font-semibold text-violet-800 text-xs">Reflections</p>
              <p className="text-xs text-violet-700 mt-0.5">Bookmarked self-reflections you want to keep coming back to.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Settings & Partner',
    icon: Settings,
    iconColor: 'text-stone-600',
    iconBg: 'bg-stone-100',
    content: (
      <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
        <p>In <strong className="text-stone-800">Settings</strong> you can manage your profile, connect with your partner, and adjust preferences.</p>
        <div className="space-y-2">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Partner Connection:</strong> <span className="text-stone-500">Invite your partner by email to share the experience. Once connected, you'll see each other's public moments.</span>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
            <strong className="text-stone-700">Profile:</strong> <span className="text-stone-500">Update your display name and other preferences.</span>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800">
          ❤️ <strong>Together works best as a pair.</strong> Invite your partner to join so you can both track and grow together.
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
          <p className="text-sm leading-relaxed">This app is a mirror, not a messenger. Use it to grow your self-awareness — then bring that growth into your real, human connection.</p>
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
          {/* Progress bar */}
          <div className="h-1 bg-stone-100">
            <div
              className="h-1 bg-stone-800 transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${current.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${current.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium">
                    Step {step + 1} of {steps.length}
                  </p>
                  <h2 className="text-base font-bold text-stone-800 leading-tight">{current.title}</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">{current.content}</div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {!isFirst && (
                <Button
                  variant="outline"
                  onClick={() => setStep(s => s - 1)}
                  className="flex-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => isLast ? onClose() : setStep(s => s + 1)}
                className="flex-1 bg-stone-800 hover:bg-stone-900 text-white"
              >
                {isLast ? 'Done' : (
                  <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}