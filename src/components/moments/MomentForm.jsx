import React, { useState } from 'react';
import { Analytics } from '@/components/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, X, Send, Clock, MoreHorizontal, ShieldAlert, Frown, VolumeX, PhoneOff, Zap, Power, Lock, Info, HeartHandshake } from 'lucide-react';
import MediaUpload from './MediaUpload';
import VoiceInput from '../ui/VoiceInput';

// Format a Date to "yyyy-MM-ddTHH:mm" for datetime-local input
function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const egoSubtypes = [
  { value: 'listened', icon: Ear, label: 'Listened' },
  { value: 'learned', icon: BookOpen, label: 'Learned' },
  { value: 'admitted_mistake', icon: Flag, label: 'Admitted a Mistake' },
  { value: 'let_partner_lead', icon: Users, label: 'Let Partner Lead' },
];

const reflectionSubtypes = [
  { value: 'shut_down', icon: Power, label: 'Shut Down' },
  { value: 'reacted_poorly', icon: Zap, label: 'Reacted Poorly' },
  { value: 'was_dismissive', icon: VolumeX, label: 'Was Dismissive' },
  { value: 'not_present', icon: PhoneOff, label: "Wasn't Present" },
  { value: 'unkind', icon: Frown, label: 'Was Unkind' },
];



export default function MomentForm({ onSubmit, onClose }) {
  const [type, setType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [otherLabel, setOtherLabel] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [howItFelt, setHowItFelt] = useState('');
  const [couldHaveDoneBetter, setCouldHaveDoneBetter] = useState('');
  const [showUpNextTime, setShowUpNextTime] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [momentDate, setMomentDate] = useState(() => toLocalDatetimeString(new Date()));
  // Self-reflection is always private by default. Ego Aside, Gratitude, and Other
  // are shared by default but can optionally be kept private until shared later.
  const [keepPrivate, setKeepPrivate] = useState(false);

  const isPrivateByDefault = type === 'self_reflection';
  const willBePrivate = isPrivateByDefault || keepPrivate;

  const handleSubmit = async () => {
    // Guard: prevent duplicate submission from rapid double-tap or programmatic re-call
    if (isSubmitting) return;
    if (!type) return;
    let finalSubtype = 'general';
    if (type === 'ego_aside') {
      finalSubtype = subtype === 'other' ? (otherLabel.trim() || 'other') : (subtype || 'general');
    } else if (type === 'self_reflection') {
      finalSubtype = subtype === 'other' ? (otherLabel.trim() || 'other') : (subtype || 'other');
    } else if (type === 'other') {
      finalSubtype = otherLabel.trim() || 'general';
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        subtype: finalSubtype,
        what_happened: whatHappened.trim(),
        how_it_felt: howItFelt.trim(),
        could_have_done_better: couldHaveDoneBetter.trim() || undefined,
        show_up_next_time: showUpNextTime.trim() || undefined,
        media_url: mediaUrl || undefined,
        date: new Date(momentDate).toISOString(),
        visibility: 'relationship',
        is_private: willBePrivate,
        shared_with_partner: false,
      });
      Analytics.momentLogged(type, finalSubtype, !!mediaUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl border border-stone-200/60 shadow-lg p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-stone-800">Record a Moment</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors" aria-label="Close moment form">
          <X className="w-4 h-4 text-stone-400" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">What kind of moment?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setType('ego_aside'); setSubtype(null); setOtherLabel(''); setKeepPrivate(false); Analytics.momentTypeSelected('ego_aside'); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              type === 'ego_aside' ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <HandHeart className={`w-5 h-5 ${type === 'ego_aside' ? 'text-amber-600' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium text-center ${type === 'ego_aside' ? 'text-amber-800' : 'text-stone-600'}`}>Ego Aside</span>
          </button>
          <button
            onClick={() => { setType('gratitude'); setSubtype(null); setOtherLabel(''); setKeepPrivate(false); Analytics.momentTypeSelected('gratitude'); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              type === 'gratitude' ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${type === 'gratitude' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium text-center ${type === 'gratitude' ? 'text-emerald-800' : 'text-stone-600'}`}>Gratitude</span>
          </button>
          <button
            onClick={() => { setType('self_reflection'); setSubtype(null); setOtherLabel(''); setKeepPrivate(false); Analytics.momentTypeSelected('self_reflection'); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              type === 'self_reflection' ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${type === 'self_reflection' ? 'text-violet-600' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium text-center ${type === 'self_reflection' ? 'text-violet-800' : 'text-stone-600'}`}>Self Reflection</span>
          </button>
          <button
            onClick={() => { setType('other'); setSubtype(null); setOtherLabel(''); setKeepPrivate(false); Analytics.momentTypeSelected('other'); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
              type === 'other' ? 'border-stone-400 bg-stone-100 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${type === 'other' ? 'text-stone-700' : 'text-stone-400'}`} />
            <span className={`text-xs font-medium text-center ${type === 'other' ? 'text-stone-800' : 'text-stone-600'}`}>Other</span>
          </button>
        </div>
        {type === 'self_reflection' && (
          <p className="text-xs text-violet-600 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" />
            Private to you — share with your partner when you're ready.
          </p>
        )}
        {type === 'other' && (
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-2">
            <p className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> A place for anything that doesn't fit neatly
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Use this for whatever matters to you and isn't quite an Ego Aside, Gratitude, or Self Reflection.
            </p>
            <p className="text-xs text-stone-500 leading-relaxed flex items-start gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-stone-400" />
              <span>
                If you're logging something about your partner's behavior, try approaching it with empathy and
                curiosity rather than judgment — think about what you noticed and how it affected you, not just
                what they did wrong. If it's not something you're ready to share, you can always keep it private below.
              </span>
            </p>
          </div>
        )}
        {(type === 'ego_aside' || type === 'gratitude' || type === 'other') && (
          <label className="mt-3 flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepPrivate}
              onChange={e => setKeepPrivate(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-700 focus:ring-stone-400"
            />
            <Lock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <span className="text-xs text-stone-600">Keep this private for now — share with your partner when you're ready.</span>
          </label>
        )}
      </div>

      <AnimatePresence>
        {type === 'ego_aside' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">How did you show up?</p>
            <div className="grid grid-cols-2 gap-2">
              {egoSubtypes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setSubtype(value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                    subtype === value ? 'border-amber-300 bg-amber-50/60' : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${subtype === value ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`text-xs font-medium ${subtype === value ? 'text-amber-700' : 'text-stone-500'}`}>{label}</span>
                </button>
              ))}
              <button
                onClick={() => setSubtype('other')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                  subtype === 'other' ? 'border-amber-300 bg-amber-50/60' : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <MoreHorizontal className={`w-4 h-4 ${subtype === 'other' ? 'text-amber-600' : 'text-stone-400'}`} />
                <span className={`text-xs font-medium ${subtype === 'other' ? 'text-amber-700' : 'text-stone-500'}`}>Other</span>
              </button>
            </div>
            <AnimatePresence>
              {subtype === 'other' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                  <input
                    type="text"
                    value={otherLabel}
                    onChange={e => setOtherLabel(e.target.value)}
                    placeholder="Describe your moment..."
                    className="w-full rounded-xl border border-stone-200 focus:border-amber-300 focus:outline-none px-3 py-3 text-stone-700 bg-white"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {type === 'other' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              What would you call this moment? <span className="text-stone-400 font-normal normal-case">(optional)</span>
            </p>
            <input
              type="text"
              value={otherLabel}
              onChange={e => setOtherLabel(e.target.value)}
              placeholder="e.g. A shared decision, a hard conversation..."
              className="w-full rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none px-3 py-3 text-stone-700 bg-white"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {type === 'self_reflection' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">What happened?</p>
            <div className="grid grid-cols-2 gap-2">
              {reflectionSubtypes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setSubtype(value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                    subtype === value ? 'border-violet-300 bg-violet-50/60' : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${subtype === value ? 'text-violet-600' : 'text-stone-400'}`} />
                  <span className={`text-xs font-medium ${subtype === value ? 'text-violet-700' : 'text-stone-500'}`}>{label}</span>
                </button>
              ))}
              <button
                onClick={() => setSubtype('other')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                  subtype === 'other' ? 'border-violet-300 bg-violet-50/60' : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <MoreHorizontal className={`w-4 h-4 ${subtype === 'other' ? 'text-violet-600' : 'text-stone-400'}`} />
                <span className={`text-xs font-medium ${subtype === 'other' ? 'text-violet-700' : 'text-stone-500'}`}>Other</span>
              </button>
            </div>
            <AnimatePresence>
              {subtype === 'other' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                  <input
                    type="text"
                    value={otherLabel}
                    onChange={e => setOtherLabel(e.target.value)}
                    placeholder="Briefly describe what happened..."
                    className="w-full rounded-xl border border-stone-200 focus:border-violet-300 focus:outline-none px-3 py-3 text-stone-700 bg-white"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {type && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                What happened? <span className="text-stone-400 font-normal">(optional)</span>
              </p>
              <div className="relative">
                <Textarea
                  value={whatHappened}
                  onChange={e => setWhatHappened(e.target.value)}
                  placeholder={type === 'ego_aside' ? "Describe the situation..." : type === 'self_reflection' ? "What did you do or say? Be honest with yourself..." : type === 'other' ? "What happened?" : "What are you grateful for?"}
                  className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[120px] text-base pr-12"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput value={whatHappened} onChange={setWhatHappened} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                How did it make you feel? <span className="text-stone-400 font-normal">(optional)</span>
              </p>
              <div className="relative">
                <Textarea
                  value={howItFelt}
                  onChange={e => setHowItFelt(e.target.value)}
                  placeholder={type === 'self_reflection' ? "What would you do differently? What can you learn from this?" : "Share your emotions and reflections..."}
                  className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[120px] text-base pr-12"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInput value={howItFelt} onChange={setHowItFelt} />
                </div>
              </div>
            </div>
            {type === 'self_reflection' && (
              <div className="space-y-4 border border-violet-100 bg-violet-50/40 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Follow-up</p>
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-2">What could you have done better? <span className="text-stone-400 font-normal">(optional)</span></p>
                  <div className="relative">
                    <Textarea
                      value={couldHaveDoneBetter}
                      onChange={e => setCouldHaveDoneBetter(e.target.value)}
                      placeholder="Be honest and specific with yourself..."
                      className="resize-none rounded-xl border-violet-200 focus:border-violet-400 min-h-[90px] text-base bg-white pr-12"
                      style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                    />
                    <div className="absolute bottom-2 right-2">
                      <VoiceInput value={couldHaveDoneBetter} onChange={setCouldHaveDoneBetter} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-2">How do you hope to show up next time? <span className="text-stone-400 font-normal">(optional)</span></p>
                  <div className="relative">
                    <Textarea
                      value={showUpNextTime}
                      onChange={e => setShowUpNextTime(e.target.value)}
                      placeholder="What intention do you want to set for similar situations?"
                      className="resize-none rounded-xl border-violet-200 focus:border-violet-400 min-h-[90px] text-base bg-white pr-12"
                      style={{ userSelect: 'text', WebkitUserSelect: 'text', fontSize: '16px' }}
                    />
                    <div className="absolute bottom-2 right-2">
                      <VoiceInput value={showUpNextTime} onChange={setShowUpNextTime} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <MediaUpload currentUrl={mediaUrl} onUpload={setMediaUrl} onClear={() => setMediaUrl('')} />
            <div>
              <label htmlFor="moment-date" className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" aria-hidden="true" /> When did it happen?
              </label>
              <input
                id="moment-date"
                type="datetime-local"
                value={momentDate}
                max={toLocalDatetimeString(new Date())}
                onChange={e => setMomentDate(e.target.value)}
                className="w-full rounded-xl border border-stone-200 focus:border-stone-400 focus:outline-none px-3 py-2 text-sm text-stone-700 bg-white"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {type && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl h-11 bg-stone-800 hover:bg-stone-900 text-white font-medium"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Moment'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}