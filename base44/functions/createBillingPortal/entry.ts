import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [sub] = await base44.entities.UserSubscription.filter({ user_email: user.email });
  if (!sub?.stripe_customer_id) {
    return Response.json({ error: 'No billing account found' }, { status: 404 });
  }

  const origin = req.headers.get('origin') || 'https://app.base44.app';
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/Settings`,
  });

  return Response.json({ url: session.url });
});