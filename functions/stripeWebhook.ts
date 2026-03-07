import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

  const base44 = createClientFromRequest(req);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_email, plan_slug, user_id } = session.metadata;

    const isSubscription = session.mode === 'subscription';
    const stripeSubId = isSubscription ? session.subscription : null;

    // Fetch subscription details if recurring
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
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer);
    const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: sub.customer });
    if (existing) {
      await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancelled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: sub.customer });
    if (existing) {
      await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      });
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: invoice.customer });
    if (existing) {
      await base44.asServiceRole.entities.UserSubscription.update(existing.id, {
        status: 'active',
        amount_paid_usd: (existing.amount_paid_usd || 0) + (invoice.amount_paid / 100),
        last_payment_at: new Date().toISOString()
      });
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const [existing] = await base44.asServiceRole.entities.UserSubscription.filter({ stripe_customer_id: invoice.customer });
    if (existing) {
      await base44.asServiceRole.entities.UserSubscription.update(existing.id, { status: 'past_due' });
    }
  }

  return Response.json({ received: true });
});