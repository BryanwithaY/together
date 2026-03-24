import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Handles account deletion:
 * 1. Records a DeletedUser tombstone for churn tracking
 * 2. Records an account_deleted AppEvent
 * 3. Returns success (the client then logs out)
 *
 * Actual data cleanup (moments, memberships) is left for a
 * future admin maintenance job to avoid browser-side timeout risk.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await req.json().catch(() => ({}));

    // Gather data about the user before deletion (in parallel)
    const [moments, memberships] = await Promise.all([
      base44.asServiceRole.entities.Moment.filter({ created_by: user.email }, undefined, 500),
      base44.asServiceRole.entities.RelationshipMember.filter({ user_email: user.email }),
    ]);

    const signupDate = new Date(user.created_date);
    const now = new Date();
    const daysSinceSignup = Math.floor((now - signupDate) / (1000 * 60 * 60 * 24));
    const ownedRelationships = memberships.filter(m => m.role === 'owner').length;
    const hadPartner = memberships.some(m => m.status === 'active');

    // Record tombstone + app event in parallel
    await Promise.all([
      base44.asServiceRole.entities.DeletedUser.create({
        user_email: user.email,
        user_name: user.full_name,
        deleted_at: now.toISOString(),
        days_since_signup: daysSinceSignup,
        total_moments_logged: moments.length,
        had_partner: hadPartner,
        reason: reason || null,
        relationships_owned: ownedRelationships,
      }),
      base44.asServiceRole.entities.AppEvent.create({
        user_email: user.email,
        user_id: user.id,
        event_type: 'account_deleted',
        metadata: {
          days_as_user: daysSinceSignup,
          total_moments: moments.length,
          had_partner: hadPartner,
        },
        occurred_at: now.toISOString(),
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});