import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // ── Step 1: Validate Stripe signature ─────────────────────────────────────
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    // Signature failure = permanent error. Return 400 so Stripe stops retrying.
    console.error(`[stripeWebhook] Signature verification failed: ${err.message}`);
    return Response.json({ error: `Signature verification failed: ${err.message}` }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  const processedAt = new Date().toISOString();

  // ── Step 2: Idempotency check ──────────────────────────────────────────────
  // If this event ID was already successfully processed, return 200 immediately.
  // This prevents double-writes on Stripe retries.
  try {
    const [alreadyProcessed] = await base44.asServiceRole.entities.StripeWebhookEvent.filter({
      stripe_event_id: event.id,
      processing_status: 'processed'
    });
    if (alreadyProcessed) {
      console.log(`[stripeWebhook] Duplicate event ${event.id} (${event.type}) — skipping.`);
      return Response.json({ received: true, duplicate: true });
    }
  } catch (err) {
    // If the idempotency check itself fails, log it but continue processing.
    // Better to risk a duplicate than to silently drop a real event.
    console.error(`[stripeWebhook] Idempotency check failed for ${event.id}: ${err.message}`);
  }

  // ── Step 3: Process the event ─────────────────────────────────────────────
  // All existing business logic is preserved exactly as before.
  let processingStatus = 'unhandled';
  let processingError = null;
  let affectedEmail = null;
  let affectedCustomerId = null;

  try {

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_email, plan_slug, user_id } = session.metadata;
      affectedEmail = user_email;
      affectedCustomerId = session.customer;

      const isSubscription = session.mode === 'subscription';
      const stripeSubId = isSubscription ? session.subscription : null;

      let periodStart = null, periodEnd = null;
      if (stripeSubId) {
        const sub = await stripe.subscriptions.retrieve(stripeSubId);
        periodStart = new Date(sub.current_period_start * 1000).toISOString();
        periodEnd = new Date(sub.current_period_end * 1000).toISOString();
      }

      const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ user_email });

      const data = {
        user_email,
        user_id,
        plan_slug,
        status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: stripeSubId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        amount_paid_usd: (session.amount_total || 0) / 100,
        last_payment_at: new Date().toISOString()
      };

      if (existing) {
        await base44.asServiceRole.entities.UserSubscription.update(existing.id, data);
      } else {
        await base44.asServiceRole.entities.UserSubscription.create(data);
      }
      processingStatus = 'processed';
    }

    else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      affectedCustomerId = sub.customer;
      const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: sub.customer });
      if (existing) {
        affectedEmail = existing.user_email;
        await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null
        });
        processingStatus = 'processed';
      } else {
        console.warn(`[stripeWebhook] customer.subscription.updated: no UserSubscription found for customer ${sub.customer}`);
        processingStatus = 'unhandled';
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      affectedCustomerId = sub.customer;
      const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: sub.customer });
      if (existing) {
        affectedEmail = existing.user_email;
        await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        });
        processingStatus = 'processed';
      } else {
        console.warn(`[stripeWebhook] customer.subscription.deleted: no UserSubscription found for customer ${sub.customer}`);
        processingStatus = 'unhandled';
      }
    }

    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      affectedCustomerId = invoice.customer;
      const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: invoice.customer });
      if (existing) {
        affectedEmail = existing.user_email;
        await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
          status: 'active',
          amount_paid_usd: (existing.amount_paid_usd || 0) + (invoice.amount_paid / 100),
          last_payment_at: new Date().toISOString()
        });
        processingStatus = 'processed';
      } else {
        console.warn(`[stripeWebhook] invoice.payment_succeeded: no UserSubscription found for customer ${invoice.customer}`);
        processingStatus = 'unhandled';
      }
    }

    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      affectedCustomerId = invoice.customer;
      const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: invoice.customer });
      if (existing) {
        affectedEmail = existing.user_email;
        await base44.asServiceRole.entities.UserSubscription.update(existing.id, { status: 'past_due' });
        processingStatus = 'processed';
      } else {
        console.warn(`[stripeWebhook] invoice.payment_failed: no UserSubscription found for customer ${invoice.customer}`);
        processingStatus = 'unhandled';
      }
    }

    else {
      // Event type not handled — log it but treat as success so Stripe stops retrying.
      console.log(`[stripeWebhook] Unhandled event type: ${event.type} (${event.id})`);
      processingStatus = 'unhandled';
    }

  } catch (err) {
    // Business logic failed — capture the error and return 500 so Stripe will retry.
    processingStatus = 'failed';
    processingError = err.message;
    console.error(`[stripeWebhook] Processing failed for event ${event.id} (${event.type}): ${err.message}`);

    // Write the failure record before returning, so admins can see it.
    try {
      await base44.asServiceRole.entities.StripeWebhookEvent.create({
        stripe_event_id: event.id,
        event_type: event.type,
        raw_event_type: event.type,
        user_email: affectedEmail,
        stripe_customer_id: affectedCustomerId,
        processing_status: 'failed',
        error_message: err.message,
        processed_at: processedAt
      });
    } catch (logErr) {
      console.error(`[stripeWebhook] Failed to write failure audit record: ${logErr.message}`);
    }

    // Return 500 — tells Stripe to retry this event later.
    return Response.json({ error: 'Processing failed, will retry' }, { status: 500 });
  }

  // ── Step 4: Write audit record for successful / unhandled events ───────────
  try {
    await base44.asServiceRole.entities.StripeWebhookEvent.create({
      stripe_event_id: event.id,
      event_type: event.type,
      raw_event_type: event.type,
      user_email: affectedEmail,
      stripe_customer_id: affectedCustomerId,
      processing_status: processingStatus,
      processed_at: processedAt
    });
  } catch (logErr) {
    // Audit logging failure must NOT fail the webhook response.
    // Stripe has already received its success — do not cause a retry over a log write.
    console.error(`[stripeWebhook] Audit log write failed (non-fatal): ${logErr.message}`);
  }

  return Response.json({ received: true });
});