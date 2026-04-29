import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Handles account deletion:
 * 1. Records a DeletedUser tombstone for churn tracking
 * 2. Records an account_deleted AppEvent
 * 3. Returns success (the client then logs out)
 *
 * Actual data cleanup (moments, memberships) is left for a
 * future admin maintenance job to avoid browser-side timeout risk.
 *
 * Wave 1: FunctionAuditLog added. No business logic changed.
 */
Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await req.json().catch(() => ({}));

    const [moments, memberships] = await Promise.all([
      base44.asServiceRole.entities.Moment.filter({ created_by: user.email }, undefined, 500),
      base44.asServiceRole.entities.RelationshipMember.filter({ user_email: user.email }),
    ]);

    const signupDate = new Date(user.created_date);
    const now = new Date();
    const daysSinceSignup = Math.floor((now - signupDate) / (1000 * 60 * 60 * 24));
    const ownedRelationships = memberships.filter(m => m.role === 'owner').length;
    const hadPartner = memberships.some(m => m.status === 'active');

    // Sanitize the user-provided reason — strip anything over 500 chars
    const safeReason = typeof reason === 'string' ? reason.slice(0, 500) : null;

    await Promise.all([
      base44.asServiceRole.entities.DeletedUser.create({
        user_email: user.email,
        user_name: user.full_name,
        deleted_at: now.toISOString(),
        days_since_signup: daysSinceSignup,
        total_moments_logged: moments.length,
        had_partner: hadPartner,
        reason: safeReason,
        relationships_owned: ownedRelationships,
      }),
      base44.asServiceRole.entities.AppEvent.create({
        user_email: user.email,
        user_id: user.id,
        event_type: 'account_deleted',
        // Only aggregate stats — no content, no PII beyond email which is system-required
        metadata: {
          days_as_user: daysSinceSignup,
          total_moments: moments.length,
          had_partner: hadPartner,
        },
        occurred_at: now.toISOString(),
      }),
    ]);

    // ── AUDIT: completed ───────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'deleteAccount',
        trigger_type: 'user_action',
        triggered_by: user.email,
        status: 'completed',
        records_affected: 1,
        duration_ms: Date.now() - startMs,
        metadata: { days_as_user: daysSinceSignup, had_partner: hadPartner },
        started_at: startedAt,
        completed_at: now.toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    // ── AUDIT: failed ──────────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'deleteAccount',
        trigger_type: 'user_action',
        triggered_by: 'unknown',
        status: 'failed',
        error_message: error.message,
        duration_ms: Date.now() - startMs,
        metadata: {},
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});