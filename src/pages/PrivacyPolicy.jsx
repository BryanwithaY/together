import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const lastUpdated = 'April 28, 2026';
  const appName = 'Together';
  const companyName = 'Together App';
  const contactEmail = 'privacy@together.app';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200/60 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-stone-600" />
          </button>
          <h1 className="text-lg font-semibold text-stone-800">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-stone-700">
        <div>
          <p className="text-sm text-stone-500">Last updated: {lastUpdated}</p>
          <p className="mt-3 text-sm leading-relaxed">
            {companyName} operates {appName}, a relationship wellness app. This Privacy Policy explains
            what personal information we collect, how we use it, and your rights. We take privacy
            seriously — your relationship data is sensitive, and we treat it accordingly.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">1. Information We Collect</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p><strong>Account data:</strong> Your email address and display name, provided at sign-up.</p>
            <p><strong>Relationship content:</strong> Moments (ego-aside, gratitude, self-reflection entries), comments, and notes you write within the app. This content may be intimate and personal.</p>
            <p><strong>Usage data:</strong> Event logs (e.g., moments logged, features used), timestamps of last activity, and app engagement counters. We do not collect device identifiers, precise location, or behavioral tracking beyond in-app actions.</p>
            <p><strong>Payment data:</strong> If you subscribe, Stripe processes your payment card data directly. We store only your Stripe customer ID, subscription status, and plan information. We never see or store your full card number.</p>
            <p><strong>Communications:</strong> If you contact support or submit a bug report, we collect the content of your message and your email.</p>
            <p><strong>Facilitator data:</strong> If you use the facilitator feature, we collect consent records, facilitator email addresses, and access event logs.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">2. How We Use Your Data</h2>
          <ul className="text-sm leading-relaxed list-disc list-inside space-y-1.5">
            <li>To provide the app and its core features</li>
            <li>To send transactional notifications (partner activity alerts, facilitator access requests)</li>
            <li>To process and manage your subscription via Stripe</li>
            <li>To understand aggregate feature usage and improve the product (no individual profiling)</li>
            <li>To detect churn and send re-engagement emails (admin-only insight, not automated spam)</li>
            <li>To comply with legal obligations and respond to lawful requests</li>
          </ul>
          <p className="text-sm leading-relaxed">
            We do <strong>not</strong> sell your data, share it with advertisers, use it to train AI models
            without explicit consent, or profile you for targeting purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">3. Data Sharing</h2>
          <div className="space-y-2 text-sm leading-relaxed">
            <p><strong>Within your relationship:</strong> Moments you mark as "relationship" visibility are shared with active members of your relationship space. Moments marked private are never shared.</p>
            <p><strong>Facilitators:</strong> If you grant a facilitator access, they can view moments you and other consenting members have shared. You can revoke this access at any time.</p>
            <p><strong>Service providers:</strong> We use Base44 (infrastructure), Stripe (payments), and GitHub (bug tracking). These providers have their own privacy policies and data processing agreements.</p>
            <p><strong>Legal:</strong> We may disclose data if required by law, court order, or to protect the safety of users.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">4. Data Retention</h2>
          <div className="text-sm leading-relaxed space-y-2">
            <p>Your content and account data are retained while your account is active.</p>
            <p>When you delete your account, we record a de-identified tombstone record (no content, only aggregate stats like "days as user" and "had partner") for product analytics. This tombstone does not contain your email after processing. Your moments, relationship data, and personal content are queued for deletion.</p>
            <p>Audit logs (FunctionAuditLog, access events) are retained for 90 days for security monitoring.</p>
            <p>Stripe webhook event records are retained for 90 days for payment integrity.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">5. Your Rights</h2>
          <div className="text-sm leading-relaxed space-y-2">
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Delete your account via Settings → Delete Account (GDPR/PIPEDA right to erasure)</li>
              <li><strong>Portability:</strong> Export your moments as CSV via the History page</li>
              <li><strong>Withdrawal of consent:</strong> Revoke facilitator access at any time</li>
              <li><strong>Opt-out:</strong> Unsubscribe from notification emails in Settings → Notifications</li>
            </ul>
            <p>To exercise your rights or ask questions, contact us at <a href={`mailto:${contactEmail}`} className="text-stone-800 underline">{contactEmail}</a>.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">6. Security</h2>
          <p className="text-sm leading-relaxed">
            All data is transmitted over HTTPS. Access to your personal data from backend functions
            requires authentication. Sensitive operations (attendance updates, facilitator access) are
            enforced server-side with explicit authorization checks. We do not store passwords — authentication
            is managed by Base44's identity platform. No API keys or credentials are stored in or exposed
            from the frontend application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">7. Children's Privacy</h2>
          <p className="text-sm leading-relaxed">
            {appName} is not directed at children under 13 (or 16 under GDPR). If you believe a child
            has created an account, please contact us and we will promptly delete the account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">8. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed">
            We will notify users of material changes to this policy via email or in-app notice. Continued
            use after notice constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">9. Jurisdiction</h2>
          <p className="text-sm leading-relaxed">
            {companyName} operates under Canadian law (PIPEDA / BC PIPA). We also comply with GDPR
            obligations for users in the European Economic Area.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-800">10. Contact</h2>
          <p className="text-sm leading-relaxed">
            For privacy-related questions: <a href={`mailto:${contactEmail}`} className="text-stone-800 underline">{contactEmail}</a>
          </p>
        </section>
      </div>
    </div>
  );
}