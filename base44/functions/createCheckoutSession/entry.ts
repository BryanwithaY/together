import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { price_id, plan_slug, success_url, cancel_url } = await req.json();

  // Check if user already has a Stripe customer ID
  const [existingSub] = await base44.entities.UserSubscription.filter({ user_email: user.email });
  let customer_id = existingSub?.stripe_customer_id;

  if (!customer_id) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { user_id: user.id }
    });
    customer_id = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customer_id,
    payment_method_types: ['card'],
    line_items: [{ price: price_id, quantity: 1 }],
    mode: plan_slug === 'lifetime' ? 'payment' : 'subscription',
    success_url: success_url || `${req.headers.get('origin')}/Settings?subscribed=1`,
    cancel_url: cancel_url || `${req.headers.get('origin')}/Settings`,
    metadata: { user_email: user.email, plan_slug, user_id: user.id }
  });

  return Response.json({ url: session.url });
});