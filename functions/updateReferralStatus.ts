import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Called when a user loads the app with a ?ref=CODE param.
 * Finds the referral record by code and marks it as completed,
 * attributing it to the currently authenticated user.
 *
 * Payload: { ref_code: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ref_code } = await req.json().catch(() => ({}));

    if (!ref_code) {
      return Response.json({ error: 'ref_code is required' }, { status: 400 });
    }

    // Find the referral record by code — must not already have a referred_email
    // (i.e. it's the "owner" record, not already completed)
    const referrals = await base44.asServiceRole.entities.Referral.filter({
      code: ref_code.toUpperCase(),
      status: 'pending',
    });

    // Filter to the owner record (no referred_email) and ensure it's not self-referral
    const ownerRecord = referrals.find(
      r => !r.referred_email && r.referrer_email?.toLowerCase() !== user.email?.toLowerCase()
    );

    if (!ownerRecord) {
      // Already completed, self-referral, or invalid code — silently succeed
      return Response.json({ success: true, matched: false });
    }

    // Mark as completed and record who signed up
    await base44.asServiceRole.entities.Referral.update(ownerRecord.id, {
      status: 'completed',
      referred_email: user.email,
      referred_user_id: user.id,
      signup_date: new Date().toISOString(),
    });

    // Log the event
    await base44.asServiceRole.entities.AppEvent.create({
      user_email: user.email,
      user_id: user.id,
      event_type: 'member_joined',
      metadata: { referral_completed: true, referred_by: ownerRecord.referrer_email },
      occurred_at: new Date().toISOString(),
    });

    return Response.json({ success: true, matched: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});