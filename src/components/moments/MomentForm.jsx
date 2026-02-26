import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HandHeart, Sparkles, Ear, BookOpen, Flag, Users, X, Send } from 'lucide-react';

const subtypes = [
  { value: 'listened', icon: Ear, label: 'Listened' },
  { value: 'learned', icon: BookOpen, label: 'Learned' },
  { value: 'admitted_mistake', icon: Flag, label: 'Admitted a Mistake' },
  { value: 'let_partner_lead', icon: Users, label: 'Let Partner Lead' },
];

export default function MomentForm({ onSubmit, onClose }) {
  const [type, setType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!type) return;
    setIsSubmitting(true);
    await onSubmit({
      type,
      subtype: type === 'ego_aside' ? (subtype || 'general') : 'general',
      description: description.trim(),
      date: new Date().toISOString(),
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

      {/* Type Selection */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">What kind of moment?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setType('ego_aside'); setSubtype(null); }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
              type === 'ego_aside'
                ? 'border-amber-400 bg-amber-50 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <HandHeart className={`w-5 h-5 ${type === 'ego_aside' ? 'text-amber-600' : 'text-stone-400'}`} />
            <span className={`text-sm font-medium ${type === 'ego_aside' ? 'text-amber-800' : 'text-stone-600'}`}>
              Ego Aside
            </span>
          </button>
          <button
            onClick={() => { setType('gratitude'); setSubtype(null); }}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
              type === 'gratitude'
                ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${type === 'gratitude' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span className={`text-sm font-medium ${type === 'gratitude' ? 'text-emerald-800' : 'text-stone-600'}`}>
              Gratitude
            </span>
          </button>
        </div>
      </div>

      {/* Subtype Selection for Ego Aside */}
      <AnimatePresence>
        {type === 'ego_aside' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">How did you show up?</p>
            <div className="grid grid-cols-2 gap-2">
              {subtypes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setSubtype(value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left ${
                    subtype === value
                      ? 'border-amber-300 bg-amber-50/60'
                      : 'border-stone-150 hover:border-stone-300 bg-stone-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${subtype === value ? 'text-amber-600' : 'text-stone-400'}`} />
                  <span className={`text-xs font-medium ${subtype === value ? 'text-amber-700' : 'text-stone-500'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <AnimatePresence>
        {type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Add a note <span className="text-stone-400 font-normal">(optional)</span>
            </p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'ego_aside' 
                ? "What happened? How did it feel?" 
                : "What are you grateful for about your partner?"}
              className="resize-none rounded-xl border-stone-200 focus:border-stone-400 focus:ring-stone-400/20 min-h-[80px] text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      {type && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-xl h-11 bg-stone-800 hover:bg-stone-900 text-white font-medium transition-all"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Moment'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}