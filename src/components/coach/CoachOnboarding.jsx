import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHY_OPTIONS = [
  { value: 'self_motivated', label: 'I want to grow', desc: 'I\'m here because I want to be a better partner, friend, or person in my relationships.' },
  { value: 'partner_requested', label: 'Someone in my life asked me', desc: 'A partner, friend, or family member encouraged or asked me to use this.' },
  { value: 'therapist_recommended', label: 'Therapist or coach recommended it', desc: 'A professional guided me here as part of my personal growth work.' },
  { value: 'curious', label: 'Just exploring', desc: 'I\'m curious to see what this is about and how it might help.' },
];

const GOAL_OPTIONS = [
  { value: 'immediate_help', label: 'Work through something specific', desc: 'There\'s a situation or pattern I want to understand better right now.' },
  { value: 'long_term_growth', label: 'Long-term relationship growth', desc: 'I want to build stronger, healthier relationships over time.' },
  { value: 'understand_patterns', label: 'Understand my patterns', desc: 'I notice recurring dynamics in my relationships and want clarity on them.' },
  { value: 'general_improvement', label: 'General self-improvement', desc: 'I want to become more self-aware and emotionally intelligent.' },
  { value: 'not_sure', label: 'Not sure yet', desc: 'I\'m open to wherever this takes me.' },
];

export default function CoachOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [why, setWhy] = useState('');
  const [goal, setGoal] = useState('');
  const [situation, setSituation] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    const whyLabel = WHY_OPTIONS.find(o => o.value === why)?.label || '';
    const goalLabel = GOAL_OPTIONS.find(o => o.value === goal)?.label || '';
    const parts = [
      why && `Reason for using app: ${whyLabel}`,
      goal && `Primary goal: ${goalLabel}`,
      situation && `Initial context they shared: ${situation}`,
    ].filter(Boolean);
    const summary = parts.join('. ');
    await onComplete({ why, goal, summary });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Progress dots */}
      <div className="flex gap-1.5 px-8 pt-12 justify-center">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-stone-800' : 'bg-stone-200'}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* STEP 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-stone-800 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800 mb-3">Your AI Relationship Coach</h1>
                <p className="text-stone-500 leading-relaxed">
                  This coach is built to help you reflect deeply, see situations clearly, and take constructive action in your relationships.
                </p>
                <p className="text-stone-500 leading-relaxed mt-3">
                  It won't just validate how you feel — it will challenge you to grow.
                </p>
              </div>
              <div className="bg-stone-100 rounded-2xl p-4 text-left space-y-2.5">
                <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider">What to expect</p>
                {[
                  'Balanced perspectives — yours and theirs',
                  'Honest reflection, not just reassurance',
                  'Practical next steps for real growth',
                ].map((item, i) => (
                  <p key={i} className="text-sm text-stone-600 flex items-start gap-2">
                    <span className="text-stone-400 mt-0.5 flex-shrink-0">✦</span> {item}
                  </p>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-12">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* STEP 1: Why */}
          {step === 1 && (
            <motion.div key="why" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-1.5">What brought you here?</h2>
                <p className="text-stone-500 text-sm">There's no wrong answer. Your starting point helps the coach guide you more effectively.</p>
              </div>
              <div className="space-y-2.5">
                {WHY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setWhy(opt.value)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${why === opt.value ? 'border-stone-800 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                  >
                    <p className="font-semibold text-stone-800 text-sm">{opt.label}</p>
                    <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-shrink-0 rounded-xl h-11 w-11 p-0"><ArrowLeft className="w-4 h-4" /></Button>
                <Button onClick={() => setStep(2)} disabled={!why} className="flex-1 bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-11">Continue</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Goal */}
          {step === 2 && (
            <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-1.5">What's your primary goal?</h2>
                <p className="text-stone-500 text-sm">Short-term relief and long-term transformation require different approaches. This helps calibrate your coach.</p>
              </div>
              <div className="space-y-2.5">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${goal === opt.value ? 'border-stone-800 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                  >
                    <p className="font-semibold text-stone-800 text-sm">{opt.label}</p>
                    <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0 rounded-xl h-11 w-11 p-0"><ArrowLeft className="w-4 h-4" /></Button>
                <Button onClick={() => setStep(3)} disabled={!goal} className="flex-1 bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-11">Continue</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Situation */}
          {step === 3 && (
            <motion.div key="context" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-1.5">Anything on your mind right now?</h2>
                <p className="text-stone-500 text-sm">Optional — share a situation or question you're facing. Your coach will start there. You can also skip and begin fresh.</p>
              </div>
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="E.g., I've been struggling with how my partner responds when I bring up something that bothers me..."
                className="w-full h-36 p-4 rounded-2xl border-2 border-stone-200 focus:border-stone-400 focus:outline-none text-sm resize-none"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-shrink-0 rounded-xl h-11 w-11 p-0"><ArrowLeft className="w-4 h-4" /></Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-11">
                  {situation.trim() ? 'Continue' : 'Skip for now'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Ready */}
          {step === 4 && (
            <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-800 mb-3">You're all set.</h2>
                <p className="text-stone-500 leading-relaxed">
                  Your AI coach is ready. The goal isn't to feel better in the moment — it's to grow stronger over time.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">A note before you begin</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your coach may challenge your perspective. This is intentional. The most valuable insights come from questioning our own narratives.
                </p>
              </div>
              <Button onClick={handleComplete} disabled={saving} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-12">
                {saving ? 'Setting up...' : 'Begin Coaching'}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}