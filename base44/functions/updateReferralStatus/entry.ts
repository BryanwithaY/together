import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Called when a user loads the app with a ?ref=CODE param.
 * Validates the code, then creates a new completed referral record
 * attributing the sign-up to the code owner.
 * The owner's code record stays pending so it can be used by future signups.
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

    const code = ref_code.toUpperCase();

    // Find the owner's code record (no referred_email = the canonical code record)
    const ownerRecords = await base44.asServiceRole.entities.Referral.filter({
      code,
      status: 'pending',
    });

    const ownerRecord = ownerRecords.find(r => !r.referred_email);

    if (!ownerRecord) {
      return Response.json({ success: true, matched: false, reason: 'invalid_code' });
    }

    // Prevent self-referral
    if (ownerRecord.referrer_email?.toLowerCase() === user.email?.toLowerCase()) {
      return Response.json({ success: true, matched: false, reason: 'self_referral' });
    }

    // Prevent double-counting: check if this user already used this code
    const existing = await base44.asServiceRole.entities.Referral.filter({
      code,
      referred_email: user.email,
    });

    if (existing.length > 0) {
      return Response.json({ success: true, matched: false, reason: 'already_redeemed' });
    }

    // Create a new completed referral record — leave the owner record untouched
    await base44.asServiceRole.entities.Referral.create({
      referrer_email: ownerRecord.referrer_email,
      code,
      referred_email: user.email,
      referred_user_id: user.id,
      signup_date: new Date().toISOString(),
      status: 'completed',
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