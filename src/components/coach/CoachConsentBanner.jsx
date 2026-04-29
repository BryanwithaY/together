import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, ShieldAlert, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * One-time consent screen shown before first AI Coach session.
 * Discloses that conversations are processed by a third-party AI provider.
 */
export default function CoachConsentBanner({ onAccept }) {
  return (
    <div
      className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-consent-title"
      aria-describedby="coach-consent-desc"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 max-w-sm w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Bot className="w-7 h-7 text-stone-600" aria-hidden="true" />
          </div>
        </div>

        <div>
          <h2 id="coach-consent-title" className="text-lg font-semibold text-stone-800">
            Before you talk to the AI Coach
          </h2>
          <p id="coach-consent-desc" className="mt-3 text-sm text-stone-500 leading-relaxed">
            Your conversations are processed by a third-party AI provider outside of Canada.
            Do not share information you would not want stored or processed externally.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-800 leading-relaxed">
              The AI Coach is <strong>not</strong> a licensed therapist or mental health professional.
              In a crisis, please contact emergency services or a crisis line.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <Button
            onClick={onAccept}
            className="w-full bg-stone-800 hover:bg-stone-900 rounded-xl"
          >
            I understand — continue
          </Button>
          <p className="text-xs text-stone-400">
            By continuing you agree to our{' '}
            <Link
              to="/TermsOfService"
              className="underline underline-offset-2 text-stone-500 hover:text-stone-700"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/PrivacyPolicy"
              className="underline underline-offset-2 text-stone-500 hover:text-stone-700"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}