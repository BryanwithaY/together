import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Called when a new user signs up — checks if their email matches a pending referral
 * and marks it as completed.
 * 
 * Payload: { new_user_email: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_user_email } = await req.json().catch(() => ({}));
    const targetEmail = (new_user_email || user.email).toLowerCase();

    // Find a pending referral for this email
    const referrals = await base44.asServiceRole.entities.Referral.filter({
      referred_email: targetEmail,
      status: 'pending',
    });

    if (!referrals.length) {
      return Response.json({ success: true, matched: false });
    }

    // Mark all matching referrals as completed (should only be 1)
    await Promise.all(referrals.map(r =>
      base44.asServiceRole.entities.Referral.update(r.id, {
        status: 'completed',
        referred_user_id: user.id,
        signup_date: new Date().toISOString(),
      })
    ));

    // Log the event
    await base44.asServiceRole.entities.AppEvent.create({
      user_email: targetEmail,
      user_id: user.id,
      event_type: 'member_joined',
      metadata: { referral_completed: true, referred_by: referrals[0].referrer_email },
      occurred_at: new Date().toISOString(),
    });

    return Response.json({ success: true, matched: true, count: referrals.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});