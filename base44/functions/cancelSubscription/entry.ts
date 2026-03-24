import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [sub] = await base44.entities.UserSubscription.filter({ user_email: user.email });
  if (!sub) return Response.json({ error: 'No subscription found' }, { status: 404 });

  if (sub.stripe_subscription_id) {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true
    });
  }

  await base44.entities.UserSubscription.update(sub.id, {
    cancelled_at: new Date().toISOString()
  });

  return Response.json({ success: true });
});