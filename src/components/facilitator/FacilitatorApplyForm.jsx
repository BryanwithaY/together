import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Analytics } from '../lib/analytics';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Users, Briefcase, Heart, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FacilitatorApplyForm({ user, existingApplication, onApplied }) {
  const [facilitatorType, setFacilitatorType] = useState('personal');
  const [professionalRole, setProfessionalRole] = useState('');
  const [bio, setBio] = useState('');
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (existingApplication?.status === 'pending') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-800">Application Under Review</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Your application was submitted. You'll have access once an administrator reviews and approves it.
          </p>
        </div>
      </div>
    );
  }

  if (existingApplication?.status === 'rejected') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-800">Application Not Approved</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Your application was not approved at this time. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-800">Application Submitted</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            An administrator will review your application and you'll receive access once approved.
          </p>
        </div>
      </motion.div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bio.trim() || !motivation.trim()) return;
    setSubmitting(true);
    await base44.entities.FacilitatorApplication.create({
      applicant_email: user.email,
      facilitator_type: facilitatorType,
      professional_role: facilitatorType === 'professional' ? professionalRole : '',
      bio: bio.trim(),
      motivation: motivation.trim(),
      status: 'pending'
    });
    setSubmitting(false);
    setSubmitted(true);
    if (onApplied) onApplied();
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-3">
          <Users className="w-7 h-7 text-violet-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">Apply for Facilitator Access</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
          Facilitators can oversee and guide relationships they're invited to support — as a therapist, coach, mentor, or trusted friend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selection */}
        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-2">Your role as a facilitator</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFacilitatorType('personal')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                facilitatorType === 'personal'
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${facilitatorType === 'personal' ? 'text-violet-600' : 'text-stone-400'}`} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${facilitatorType === 'personal' ? 'text-violet-800' : 'text-stone-600'}`}>Personal</p>
                <p className="text-xs text-stone-400 mt-0.5">Friend, mentor, family member</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFacilitatorType('professional')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                facilitatorType === 'professional'
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <Briefcase className={`w-5 h-5 ${facilitatorType === 'professional' ? 'text-violet-600' : 'text-stone-400'}`} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${facilitatorType === 'professional' ? 'text-violet-800' : 'text-stone-600'}`}>Professional</p>
                <p className="text-xs text-stone-400 mt-0.5">Therapist, coach, counselor</p>
              </div>
            </button>
          </div>
        </div>

        {facilitatorType === 'professional' && (
          <div>
            <label className="text-sm font-semibold text-stone-700 block mb-2">Your professional role</label>
            <Input
              value={professionalRole}
              onChange={e => setProfessionalRole(e.target.value)}
              placeholder="e.g. Couples Therapist, Life Coach, Relationship Counselor"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-2">
            Background & experience <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell us about your background and experience relevant to supporting relationships..."
            className="min-h-[100px] resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-700 block mb-2">
            Why do you want facilitator access? <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="Describe how you plan to use this portal and who you'll be supporting..."
            className="min-h-[100px] resize-none"
            required
          />
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <p className="text-xs text-stone-500">
            <strong className="text-stone-700">Note:</strong> Facilitator access is reviewed and approved by app administrators. 
            Once approved, you'll be able to connect to relationships only with explicit consent from all relationship members. 
            Personal facilitators (non-professional) access is free. Professional facilitators have tiered plans for advanced AI features.
          </p>
        </div>

        <Button
          type="submit"
          disabled={submitting || !bio.trim() || !motivation.trim()}
          className="w-full bg-stone-800 hover:bg-stone-900"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  );
}