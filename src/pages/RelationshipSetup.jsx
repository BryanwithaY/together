import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Heart, Handshake, Baby, PersonStanding, Briefcase, UserRound, ArrowRight, Camera } from 'lucide-react';
import { useRelationship } from '../components/relationship/RelationshipContext';

const RELATIONSHIP_TYPES = [
  { value: 'romantic_partner', label: 'Romantic Partners', icon: Heart, color: 'rose' },
  { value: 'romantic_group', label: 'Romantic Group', icon: Heart, color: 'pink' },
  { value: 'friends', label: 'Friends (1-on-1)', icon: UserRound, color: 'sky' },
  { value: 'friend_group', label: 'Friend Group', icon: Users, color: 'blue' },
  { value: 'parent_adult_child', label: 'Parent & Adult Child', icon: Baby, color: 'amber' },
  { value: 'siblings', label: 'Siblings', icon: Users, color: 'orange' },
  { value: 'family', label: 'Family', icon: PersonStanding, color: 'yellow' },
  { value: 'co_parents', label: 'Co-Parents', icon: Users, color: 'teal' },
  { value: 'business_partners', label: 'Business Partners', icon: Briefcase, color: 'indigo' },
  { value: 'cofounders', label: 'Co-Founders', icon: Handshake, color: 'violet' },
  { value: 'other', label: 'Other', icon: Users, color: 'stone' },
];

const COLOR_MAP = {
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
  pink: 'bg-pink-50 border-pink-200 text-pink-700',
  sky: 'bg-sky-50 border-sky-200 text-sky-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  teal: 'bg-teal-50 border-teal-200 text-teal-700',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  violet: 'bg-violet-50 border-violet-200 text-violet-700',
  stone: 'bg-stone-50 border-stone-200 text-stone-700',
};

const SELECTED_MAP = {
  rose: 'bg-rose-100 border-rose-400 text-rose-800 ring-2 ring-rose-300',
  pink: 'bg-pink-100 border-pink-400 text-pink-800 ring-2 ring-pink-300',
  sky: 'bg-sky-100 border-sky-400 text-sky-800 ring-2 ring-sky-300',
  blue: 'bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-300',
  amber: 'bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-300',
  orange: 'bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-300',
  yellow: 'bg-yellow-100 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300',
  teal: 'bg-teal-100 border-teal-400 text-teal-800 ring-2 ring-teal-300',
  indigo: 'bg-indigo-100 border-indigo-400 text-indigo-800 ring-2 ring-indigo-300',
  violet: 'bg-violet-100 border-violet-400 text-violet-800 ring-2 ring-violet-300',
  stone: 'bg-stone-100 border-stone-400 text-stone-800 ring-2 ring-stone-300',
};

export default function RelationshipSetup() {
  const [step, setStep] = useState(1); // 1=type, 2=details
  const [relType, setRelType] = useState('');
  const [relName, setRelName] = useState('');
  const [maxMembers, setMaxMembers] = useState(2);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { currentUser, refreshRelationships, setActiveRelationship } = useRelationship();
  const navigate = useNavigate();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  // Capture referral code from URL on mount and attribute after signup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) sessionStorage.setItem('referral_code', ref);
  }, []);

  const handleCreate = async () => {
    if (!relName.trim() || !relType || !currentUser) return;
    // Guard: prevent double-submit
    if (saving) return;
    setSaving(true);

    let rel = null;
    try {
      rel = await base44.entities.Relationship.create({
        name: relName.trim(),
        type: relType,
        owner_email: currentUser.email.toLowerCase(),
        photo_url: photoUrl || null,
        max_members: maxMembers,
      });
    } catch (createErr) {
      setSaving(false);
      console.error('[RelationshipSetup] Relationship creation failed:', createErr.message);
      return;
    }

    // Step 2: Add creator as first member.
    // If this fails we soft-delete the relationship to avoid an orphaned active record.
    try {
      await base44.entities.RelationshipMember.create({
        relationship_id: rel.id,
        user_email: currentUser.email.toLowerCase(),
        user_id: currentUser.id || null,  // Wave 5: dual-write user_id
        status: 'active',
      });
    } catch (memberErr) {
      console.error('[RelationshipSetup] Owner membership creation failed — soft-deleting relationship:', memberErr.message);
      // Soft-delete the orphaned relationship
      try {
        await base44.entities.Relationship.update(rel.id, { is_deleted: true });
      } catch (cleanupErr) {
        console.error('[RelationshipSetup] Orphan cleanup also failed:', cleanupErr.message);
      }
      setSaving(false);
      return;
    }

    await refreshRelationships();
    await setActiveRelationship(rel);

    // Attribute referral if a code was stored — wrapped so it never blocks navigation
    try {
      const refCode = sessionStorage.getItem('referral_code');
      if (refCode && currentUser?.email) {
        const records = await base44.entities.Referral.filter({ code: refCode, status: 'pending' });
        const primary = records.find(r => !r.referred_email);
        if (primary && primary.referrer_email !== currentUser.email) {
          await base44.entities.Referral.create({
            referrer_email: primary.referrer_email,
            code: refCode,
            referred_email: currentUser.email,
            referred_user_id: currentUser.id,
            signup_date: new Date().toISOString(),
            status: 'completed',
          });
          sessionStorage.removeItem('referral_code');
        }
      }
    } catch (refErr) {
      // Referral attribution failure must never block relationship creation
      console.error('[RelationshipSetup] Referral attribution failed (non-blocking):', refErr.message);
    }

    setSaving(false);
    navigate(createPageUrl('Home'));
  };

  const selectedTypeConfig = RELATIONSHIP_TYPES.find(t => t.value === relType);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Create a Relationship</h1>
          <p className="text-sm text-stone-500 mt-1">Set up your shared space</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 w-full">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-base font-semibold text-stone-700 mb-4">What type of relationship is this?</h2>
            <div className="grid grid-cols-2 gap-3">
              {RELATIONSHIP_TYPES.map(({ value, label, icon: Icon, color }) => {
                const selected = relType === value;
                return (
                  <button
                    key={value}
                    onClick={() => setRelType(value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all text-left ${
                      selected ? SELECTED_MAP[color] : COLOR_MAP[color]
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!relType}
              className="mt-6 w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {selectedTypeConfig && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${COLOR_MAP[selectedTypeConfig.color]}`}>
                <selectedTypeConfig.icon className="w-4 h-4" />
                {selectedTypeConfig.label}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Relationship name</label>
              <Input
                value={relName}
                onChange={e => setRelName(e.target.value)}
                placeholder={selectedTypeConfig?.value === 'romantic_partner' ? 'e.g. Us, Our Space…' : 'e.g. The Squad, Family Hub…'}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                How many people will be in this space? <span className="text-stone-400 font-normal">(including you)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxMembers(n)}
                    className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-all ${
                      maxMembers === n
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Relationship photo <span className="text-stone-400 font-normal">(optional)</span></label>
              <div className="flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="relationship" className="w-16 h-16 rounded-2xl object-cover border border-stone-200" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-stone-400" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <span className={`text-sm font-medium px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Back</Button>
              <Button
                onClick={handleCreate}
                disabled={!relName.trim() || saving}
                className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
              >
                {saving ? 'Creating…' : 'Create Space'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}