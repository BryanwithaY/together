import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();
  const lastUpdated = 'April 29, 2026';
  const appName = 'Together';
  const companyName = 'Together App';
  const contactEmail = 'legal@together.app';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-semibold text-stone-800">Terms of Service</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-stone-700">
        <div>
          <p className="text-sm text-stone-500">Last updated: {lastUpdated}</p>
          <p className="mt-3 text-sm leading-relaxed">
            These Terms of Service ("Terms") govern your use of {appName}, operated by {companyName}
            ("we", "us", or "our"). By creating an account or using the app, you agree to these Terms.
            If you do not agree, do not use {appName}.
          </p>
        </div>

        <section className="space-y-3" aria-labelledby="tos-eligibility">
          <h2 id="tos-eligibility" className="text-base font-semibold text-stone-800">1. Eligibility</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>You must be at least 13 years old (or 16 in the EU/EEA) to use {appName}. By using the app, you represent that you meet this requirement.</p>
            <p>If you are using {appName} on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-account">
          <h2 id="tos-account" className="text-base font-semibold text-stone-800">2. Your Account</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</p>
            <p>You agree to provide accurate information and to notify us promptly of any unauthorized access to your account.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-acceptable-use">
          <h2 id="tos-acceptable-use" className="text-base font-semibold text-stone-800">3. Acceptable Use</h2>
          <p className="text-sm leading-relaxed">You agree <strong>not</strong> to:</p>
          <ul className="list-disc list-inside text-sm leading-relaxed space-y-1.5">
            <li>Use {appName} for any unlawful purpose or in violation of any applicable law</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Upload or transmit malicious code, spam, or unauthorized advertising</li>
            <li>Attempt to gain unauthorized access to other accounts or our systems</li>
            <li>Reverse engineer, decompile, or scrape the app or its data</li>
            <li>Use the app to store, share, or transmit content that is illegal, abusive, or violates third-party rights</li>
            <li>Circumvent subscription restrictions or access paid features without paying</li>
          </ul>
        </section>

        <section className="space-y-3" aria-labelledby="tos-content">
          <h2 id="tos-content" className="text-base font-semibold text-stone-800">4. Your Content</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>You retain ownership of all content you create in {appName} (moments, notes, comments, etc.).</p>
            <p>By using the app, you grant {companyName} a limited, non-exclusive, royalty-free license to store, process, and display your content solely for the purpose of providing the service to you.</p>
            <p>You are solely responsible for the accuracy and legality of content you submit. We do not monitor or review user content.</p>
            <p>You can export or delete your content at any time via Settings.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-facilitators">
          <h2 id="tos-facilitators" className="text-base font-semibold text-stone-800">5. Facilitators</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>{appName} allows approved facilitators (therapists, coaches, trusted individuals) to view relationship data with explicit member consent. Facilitators must:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Only use access for the benefit of the consenting relationship members</li>
              <li>Comply with applicable professional ethics and confidentiality obligations</li>
              <li>Not share, export, or use relationship data for any purpose outside of direct facilitation</li>
            </ul>
            <p>We are not liable for the conduct of facilitators. Any professional advice given by a facilitator is their sole responsibility, not ours.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-subscription">
          <h2 id="tos-subscription" className="text-base font-semibold text-stone-800">6. Subscriptions and Payments</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>Paid plans are billed through Stripe. By subscribing, you authorize us to charge the payment method on file on a recurring basis (monthly or annually, as selected).</p>
            <p>You may cancel your subscription at any time via Settings → Subscription. Cancellation takes effect at the end of the current billing period — no partial refunds are issued unless required by applicable law.</p>
            <p>We reserve the right to change pricing with at least 30 days' notice. Your continued subscription after the notice period constitutes acceptance of the new pricing.</p>
            <p>Lifetime plans are one-time purchases that provide access for the lifetime of the {appName} service. We do not guarantee the service will operate indefinitely.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-ai">
          <h2 id="tos-ai" className="text-base font-semibold text-stone-800">7. AI Coach Feature</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>The AI Relationship Coach in {appName} is an automated tool designed to support reflection — it is <strong>not</strong> a licensed therapist, counselor, or mental health professional.</p>
            <p>Do not use the AI Coach in place of professional help in a mental health emergency. If you or someone you know is in crisis, contact a crisis line or emergency services.</p>
            <p>Conversations with the AI Coach may be processed by third-party AI providers. Do not share information you would not want processed outside of Canada.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-ip">
          <h2 id="tos-ip" className="text-base font-semibold text-stone-800">8. Intellectual Property</h2>
          <p className="text-sm leading-relaxed">
            All app code, design, branding, and non-user content is owned by {companyName} and protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-disclaimer">
          <h2 id="tos-disclaimer" className="text-base font-semibold text-stone-800">9. Disclaimer of Warranties</h2>
          <p className="text-sm leading-relaxed">
            {appName} is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of harmful components. Use of the app is at your own risk.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-liability">
          <h2 id="tos-liability" className="text-base font-semibold text-stone-800">10. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            To the maximum extent permitted by applicable law, {companyName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the service — including loss of data, relationship harm, or emotional distress. Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim, or CAD $50, whichever is greater.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-indemnity">
          <h2 id="tos-indemnity" className="text-base font-semibold text-stone-800">11. Indemnification</h2>
          <p className="text-sm leading-relaxed">
            You agree to indemnify and hold harmless {companyName} and its officers, directors, and agents from any claims, damages, or expenses (including legal fees) arising from your use of the app, your content, or your violation of these Terms.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-termination">
          <h2 id="tos-termination" className="text-base font-semibold text-stone-800">12. Termination</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>You may delete your account at any time via Settings → Delete Account.</p>
            <p>We may suspend or terminate your account without notice if you violate these Terms, engage in fraudulent activity, or if we discontinue the service.</p>
            <p>Upon termination, your right to use the app ceases immediately. Sections 4, 9, 10, 11, and 13 survive termination.</p>
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="tos-governing">
          <h2 id="tos-governing" className="text-base font-semibold text-stone-800">13. Governing Law and Disputes</h2>
          <p className="text-sm leading-relaxed">
            These Terms are governed by the laws of British Columbia, Canada, without regard to conflict of law principles. Any disputes shall be resolved in the courts of British Columbia, and you consent to exclusive jurisdiction there. If you are in the EU/EEA, you may also access alternative dispute resolution mechanisms under applicable consumer law.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-changes">
          <h2 id="tos-changes" className="text-base font-semibold text-stone-800">14. Changes to These Terms</h2>
          <p className="text-sm leading-relaxed">
            We may update these Terms from time to time. We will notify you of material changes via email or in-app notice at least 14 days before they take effect. Continued use after the effective date constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-privacy">
          <h2 id="tos-privacy" className="text-base font-semibold text-stone-800">15. Privacy</h2>
          <p className="text-sm leading-relaxed">
            Your use of {appName} is also governed by our{' '}
            <a href="/PrivacyPolicy" className="text-stone-800 underline underline-offset-2 hover:text-stone-600">
              Privacy Policy
            </a>
            , which is incorporated into these Terms by reference.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="tos-contact">
          <h2 id="tos-contact" className="text-base font-semibold text-stone-800">16. Contact</h2>
          <p className="text-sm leading-relaxed">
            For questions about these Terms:{' '}
            <a href={`mailto:${contactEmail}`} className="text-stone-800 underline underline-offset-2 hover:text-stone-600">
              {contactEmail}
            </a>
          </p>
        </section>

        <div className="pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-400 leading-relaxed">
            By using {appName}, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </main>
    </div>
  );
}