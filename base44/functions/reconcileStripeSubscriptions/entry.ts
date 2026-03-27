import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

/**
 * Wave 3 — Read-only Stripe reconciliation.
 * Compares UserSubscription records against Stripe live state.
 * Writes NO UserSubscription data. Admin-only.
 *
 * Structured mismatch_types codes:
 *   STATUS_MISMATCH              — app status != stripe status
 *   PERIOD_END_MISMATCH          — current_period_end differs by >1 day
 *   PERIOD_END_MISSING_IN_APP    — stripe has a period_end, app does not
 *   CANCELLED_AT_MISSING_IN_APP  — stripe shows cancelled_at, app does not
 *   SUBSCRIPTION_MISSING_IN_STRIPE — stripe returns 404/resource_missing
 *   STRIPE_LOOKUP_FAILED         — any other stripe retrieval error
 */

// ── Safe FunctionAuditLog trace (fire-and-forget) ─────────────────────────────
async function logAuditTrace(base44, { checked_count, mismatch_count, duration_ms }) {
  try {
    await base44.asServiceRole.entities.FunctionAuditLog.create({
      function_name: 'reconcileStripeSubscriptions',
      trigger_type: 'admin_manual',
      triggered_by: 'admin',
      status: 'completed',
      records_affected: checked_count,
      duration_ms,
      metadata: {
        checked_count,
        mismatch_count
      },
      started_at: new Date(Date.now() - duration_ms).toISOString(),
      completed_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('[reconcileStripeSubscriptions] audit log failed:', e.message);
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all UserSubscription records that have a Stripe subscription ID
    const allSubs = await base44.asServiceRole.entities.UserSubscription.list('-created_date', 500);
    const subsWithStripe = allSubs.filter(s => s.stripe_subscription_id);

    // Pre-fetch recent StripeWebhookEvent records for correlation (read-only hint)
    // We fetch the most recent 200 processed events and build a lookup by subscription_id
    // This is best-effort — webhook events don't always carry subscription IDs directly,
    // so we match on user_email as a fallback.
    let recentWebhookEvents = [];
    try {
      recentWebhookEvents = await base44.asServiceRole.entities.StripeWebhookEvent.list('-processed_at', 200);
    } catch (e) {
      // Non-blocking — webhook correlation is advisory only
      console.error('[reconcileStripeSubscriptions] webhook event fetch failed:', e.message);
    }

    // Build a set of user_emails that have at least one recent webhook event
    const emailsWithRecentWebhook = new Set(
      recentWebhookEvents
        .filter(e => e.processing_status === 'processed')
        .map(e => e.user_email)
        .filter(Boolean)
    );

    const mismatches = [];

    for (const sub of subsWithStripe) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

        const appStatus         = sub.status || null;
        const stripeStatus      = stripeSub.status;
        const appCurrentPeriodEnd   = sub.current_period_end || null;
        const stripeCurrentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        const appCancelledAt    = sub.cancelled_at || null;
        const stripeCancelledAt = stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000).toISOString()
          : null;

        const mismatch_types = [];

        if (appStatus !== stripeStatus) {
          mismatch_types.push('STATUS_MISMATCH');
        }

        if (appCurrentPeriodEnd && stripeCurrentPeriodEnd) {
          const diffMs = Math.abs(new Date(appCurrentPeriodEnd) - new Date(stripeCurrentPeriodEnd));
          if (diffMs > 86400000) {
            mismatch_types.push('PERIOD_END_MISMATCH');
          }
        } else if (!appCurrentPeriodEnd && stripeCurrentPeriodEnd && stripeStatus !== 'canceled') {
          mismatch_types.push('PERIOD_END_MISSING_IN_APP');
        }

        if (!appCancelledAt && stripeCancelledAt) {
          mismatch_types.push('CANCELLED_AT_MISSING_IN_APP');
        }

        if (mismatch_types.length > 0) {
          mismatches.push({
            user_email: sub.user_email,
            stripe_subscription_id: sub.stripe_subscription_id,
            app_plan_slug: sub.plan_slug,
            app_status: appStatus,
            stripe_status: stripeStatus,
            app_current_period_end: appCurrentPeriodEnd,
            stripe_current_period_end: stripeCurrentPeriodEnd,
            app_cancelled_at: appCancelledAt,
            stripe_cancelled_at: stripeCancelledAt,
            mismatch_types,
            // Advisory: helps admin correlate whether webhook events were received
            recent_webhook_event_found: emailsWithRecentWebhook.has(sub.user_email)
          });
        }

      } catch (stripeErr) {
        // Discriminate between "subscription does not exist" and other API errors
        const isMissing =
          stripeErr.code === 'resource_missing' ||
          (stripeErr.statusCode === 404) ||
          stripeErr.message?.toLowerCase().includes('no such subscription');

        mismatches.push({
          user_email: sub.user_email,
          stripe_subscription_id: sub.stripe_subscription_id,
          app_plan_slug: sub.plan_slug,
          app_status: sub.status || null,
          stripe_status: null,
          app_current_period_end: sub.current_period_end || null,
          stripe_current_period_end: null,
          app_cancelled_at: sub.cancelled_at || null,
          stripe_cancelled_at: null,
          mismatch_types: [isMissing ? 'SUBSCRIPTION_MISSING_IN_STRIPE' : 'STRIPE_LOOKUP_FAILED'],
          recent_webhook_event_found: emailsWithRecentWebhook.has(sub.user_email)
        });
      }
    }

    const duration_ms = Date.now() - startTime;

    // Write audit trace — safe metadata only, no billing content
    await logAuditTrace(base44, {
      checked_count: subsWithStripe.length,
      mismatch_count: mismatches.length,
      duration_ms
    });

    return Response.json({
      success: true,
      checked_count: subsWithStripe.length,
      mismatch_count: mismatches.length,
      mismatches,
      run_at: new Date().toISOString(),
      duration_ms
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});