import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, X, Send, Clock, MoreHorizontal } from 'lucide-react';
import MediaUpload from './MediaUpload';

// Format a Date to "yyyy-MM-ddTHH:mm" for datetime-local input
function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const subtypes = [
  { value: 'listened', icon: Ear, label: 'Listened' },
  { value: 'learned', icon: BookOpen, label: 'Learned' },
  { value: 'admitted_mistake', icon: Flag, label: 'Admitted a Mistake' },
  { value: 'let_partner_lead', icon: Users, label: 'Let Partner Lead' },
];



export default function MomentForm({ onSubmit, onClose }) {
  const [type, setType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [otherLabel, setOtherLabel] = useState('');
  const [otherEmoji, setOtherEmoji] = useState('💪');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [whatHappened, setWhatHappened] = useState('');
  const [howItFelt, setHowItFelt] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [momentDate, setMomentDate] = useState(() => toLocalDatetimeString(new Date()));

  const handleSubmit = async () => {
    if (!type) return;
    let finalSubtype = 'general';
    if (type === 'ego_aside') {
      finalSubtype = subtype === 'other' ? (otherLabel.trim() || 'other') : (subtype || 'general');
    }
    setIsSubmitting(true);
    await onSubmit({
      type,
      subtype: finalSubtype,
      what_happened: whatHappened.trim(),
      how_it_felt: howItFelt.trim(),
      media_url: mediaUrl || undefined,
      date: new Date(momentDate).toISOString(),
    });
    setIsSubmitting(false);
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
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
          <X className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">What kind of moment?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setType('ego_aside'); setSubtype(null); }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
              type === 'ego_aside' ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <HandHeart className={`w-5 h-5 ${type === 'ego_aside' ? 'text-amber-600' : 'text-stone-400'}`} />
            <span className={`text-sm font-medium ${type === 'ego_aside' ? 'text-amber-800' : 'text-stone-600'}`}>Ego Aside</span>
          </button>
          <button
            onClick={() => { setType('gratitude'); setSubtype(null); }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
              type === 'gratitude' ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${type === 'gratitude' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span className={`text-sm font-medium ${type === 'gratitude' ? 'text-emerald-800' : 'text-stone-600'}`}>Gratitude</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {type === 'ego_aside' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">How did you show up?</p>
            <div className="grid grid-cols-2 gap-2">
              {subtypes.map(({ value, icon: Icon, label }) => (
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
              {/* Other option */}
              <button
                onClick={() => setSubtype('other')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                  subtype === 'other' ? 'border-amber-300 bg-amber-50/60' : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <span className="text-base leading-none">{otherEmoji}</span>
                <span className={`text-xs font-medium ${subtype === 'other' ? 'text-amber-700' : 'text-stone-500'}`}>Other</span>
              </button>
            </div>

            {/* Other subtype expanded input */}
            <AnimatePresence>
              {subtype === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="flex gap-2 items-center">
                    {/* Emoji picker trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(p => !p)}
                        className="w-10 h-10 rounded-xl border border-stone-200 bg-stone-50 text-xl flex items-center justify-center hover:border-amber-300 transition-colors flex-shrink-0"
                      >
                        {otherEmoji}
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute left-0 top-12 z-20 bg-white border border-stone-200 rounded-xl shadow-lg p-3 w-64 max-h-52 overflow-y-auto">
                          <div className="grid grid-cols-7 gap-1">
                            {EMOJI_OPTIONS.map((e, i) => (
                              <button
                                key={`${e}-${i}`}
                                type="button"
                                onClick={() => { setOtherEmoji(e); setShowEmojiPicker(false); }}
                                className={`text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 transition-colors ${otherEmoji === e ? 'bg-amber-100' : ''}`}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={otherLabel}
                      onChange={e => setOtherLabel(e.target.value)}
                      placeholder="Describe your moment..."
                      className="flex-1 rounded-xl border border-stone-200 focus:border-amber-300 focus:outline-none px-3 py-2 text-sm text-stone-700 bg-white"
                      style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                    />
                  </div>
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
              <Textarea
                value={whatHappened}
                onChange={e => setWhatHappened(e.target.value)}
                placeholder={type === 'ego_aside' ? "Describe the situation..." : "What are you grateful for?"}
                className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[70px] text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                How did it make you feel? <span className="text-stone-400 font-normal">(optional)</span>
              </p>
              <Textarea
                value={howItFelt}
                onChange={e => setHowItFelt(e.target.value)}
                placeholder="Share your emotions and reflections..."
                className="resize-none rounded-xl border-stone-200 focus:border-stone-400 min-h-[70px] text-sm"
              />
            </div>
            <MediaUpload currentUrl={mediaUrl} onUpload={setMediaUrl} onClear={() => setMediaUrl('')} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> When did it happen?
              </p>
              <input
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