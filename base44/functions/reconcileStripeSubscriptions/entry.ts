import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

/**
 * Read-only Stripe reconciliation.
 * Compares UserSubscription records against Stripe's live state.
 * Writes NO data. Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all UserSubscription records that have a Stripe subscription ID
    const allSubs = await base44.asServiceRole.entities.UserSubscription.list('-created_date', 500);
    const subsWithStripe = allSubs.filter(s => s.stripe_subscription_id);

    const mismatches = [];

    for (const sub of subsWithStripe) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

        const appStatus = sub.status;
        const stripeStatus = stripeSub.status;
        const appPeriodEnd = sub.current_period_end || null;
        const stripePeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        const appCancelledAt = sub.cancelled_at || null;
        const stripeCancelledAt = stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000).toISOString()
          : null;

        const issues = [];

        // Status mismatch
        if (appStatus !== stripeStatus) {
          issues.push(`status: app="${appStatus}" stripe="${stripeStatus}"`);
        }

        // Period end mismatch (>1 day tolerance for timing skew)
        if (appPeriodEnd && stripePeriodEnd) {
          const diffMs = Math.abs(new Date(appPeriodEnd) - new Date(stripePeriodEnd));
          if (diffMs > 86400000) {
            issues.push(`current_period_end: app="${appPeriodEnd}" stripe="${stripePeriodEnd}"`);
          }
        } else if (!appPeriodEnd && stripePeriodEnd && stripeStatus !== 'canceled') {
          issues.push(`current_period_end missing in app, stripe has "${stripePeriodEnd}"`);
        }

        // Cancelled_at mismatch (app doesn't have it but Stripe does)
        if (!appCancelledAt && stripeCancelledAt) {
          issues.push(`cancelled_at: app=null stripe="${stripeCancelledAt}"`);
        }

        if (issues.length > 0) {
          mismatches.push({
            user_email: sub.user_email,
            app_subscription_id: sub.id,
            stripe_subscription_id: sub.stripe_subscription_id,
            stripe_customer_id: sub.stripe_customer_id || null,
            app_plan_slug: sub.plan_slug,
            app_status: appStatus,
            stripe_status: stripeStatus,
            app_period_end: appPeriodEnd,
            stripe_period_end: stripePeriodEnd,
            app_cancelled_at: appCancelledAt,
            stripe_cancelled_at: stripeCancelledAt,
            issues
          });
        }
      } catch (stripeErr) {
        // Stripe subscription could not be retrieved (deleted, wrong ID, API error)
        mismatches.push({
          user_email: sub.user_email,
          app_subscription_id: sub.id,
          stripe_subscription_id: sub.stripe_subscription_id,
          app_status: sub.status,
          stripe_status: 'RETRIEVAL_FAILED',
          issues: [`Stripe retrieval error: ${stripeErr.message}`]
        });
      }
    }

    return Response.json({
      success: true,
      checked_count: subsWithStripe.length,
      mismatch_count: mismatches.length,
      mismatches,
      run_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});