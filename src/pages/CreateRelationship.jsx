import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Users, UserCircle, Briefcase, Smile, Star, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';

const RELATIONSHIP_TYPES = [
  { value: 'romantic', label: 'Romantic Partner', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', description: 'Spouse, partner, significant other' },
  { value: 'siblings', label: 'Siblings', icon: Users, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', description: 'Brothers, sisters, step-siblings' },
  { value: 'parent_child', label: 'Parent & Adult Child', icon: UserCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', description: 'Parent and grown child relationship' },
  { value: 'family', label: 'Family Group', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200', description: 'Extended family, cousins, in-laws' },
  { value: 'friendship', label: 'Friendship', icon: Smile, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200', description: 'Close friends, best friends' },
  { value: 'business', label: 'Business', icon: Briefcase, color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200', description: 'Co-founders, partners, colleagues' },
  { value: 'other', label: 'Other', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', description: 'Any other meaningful relationship' },
];

const MAX_MEMBERS = 6;

export default function CreateRelationship() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: type, 2: name + size, 3: done
  const [relType, setRelType] = useState(null);
  const [relName, setRelName] = useState('');
  const [maxMembers, setMaxMembers] = useState(2);
  const [saving, setSaving] = useState(false);

  const selectedType = RELATIONSHIP_TYPES.find(t => t.value === relType);

  const handleCreate = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const rel = await base44.entities.Relationship.create({
      name: relName.trim() || `My ${selectedType?.label}`,
      type: relType,
      owner_email: user.email.toLowerCase(),
      admin_emails: [user.email.toLowerCase()],
      member_emails: [user.email.toLowerCase()],
      max_members: maxMembers,
    });
    setSaving(false);
    navigate(createPageUrl(`RelationshipSettings?id=${rel.id}`));
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-stone-800">New Relationship</h1>
            <p className="text-xs text-stone-400 mt-0.5">Step {step} of 2</p>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1 bg-stone-100">
          <div className="h-1 bg-stone-800 transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">What kind of relationship is this?</h2>
              <p className="text-sm text-stone-500 mb-5">We'll customize the language and features for you.</p>
              <div className="space-y-2.5">
                {RELATIONSHIP_TYPES.map(t => {
                  const Icon = t.icon;
                  const selected = relType === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setRelType(t.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        selected ? `${t.border} ${t.bg}` : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">{t.label}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{t.description}</p>
                      </div>
                      {selected && <Check className={`w-5 h-5 ${t.color} flex-shrink-0`} />}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!relType}
                className="w-full mt-6 bg-stone-800 hover:bg-stone-900 text-white h-11 rounded-xl"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-stone-800 mb-1">Give it a name</h2>
              <p className="text-sm text-stone-500 mb-5">This helps you identify which relationship you're posting in.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 block">
                    Relationship Name
                  </label>
                  <Input
                    value={relName}
                    onChange={e => setRelName(e.target.value)}
                    placeholder={selectedType ? `e.g. ${getNamePlaceholder(relType)}` : 'Name your relationship'}
                    className="rounded-xl h-11 text-base"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 block">
                    How many members? <span className="text-stone-400 font-normal normal-case">(you + others, max 6)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map(n => (
                      <button
                        key={n}
                        onClick={() => setMaxMembers(n)}
                        className={`py-3 rounded-xl border-2 font-bold text-lg transition-all ${
                          maxMembers === n
                            ? 'border-stone-800 bg-stone-800 text-white'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400 mt-2">
                    {maxMembers === 2 ? 'Just you and one other person' : `You can invite up to ${maxMembers - 1} others`}
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Preview</p>
                  <div className="flex items-center gap-3">
                    {selectedType && (
                      <div className={`w-9 h-9 rounded-xl ${selectedType.bg} flex items-center justify-center`}>
                        {React.createElement(selectedType.icon, { className: `w-4 h-4 ${selectedType.color}` })}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{relName || `My ${selectedType?.label}`}</p>
                      <p className="text-xs text-stone-500">{selectedType?.label} · {maxMembers} members</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full mt-6 bg-stone-800 hover:bg-stone-900 text-white h-11 rounded-xl"
              >
                {saving ? 'Creating…' : 'Create & Invite Members'}
                {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getNamePlaceholder(type) {
  const map = {
    romantic: 'Us Two',
    siblings: 'The Smith Siblings',
    parent_child: 'Mom & Me',
    family: 'The Family',
    friendship: 'Best Friends',
    business: 'Founders Circle',
    other: 'My Relationship',
  };
  return map[type] || 'My Relationship';
}