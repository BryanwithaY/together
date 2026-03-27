import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Weekly digest sent to all admin users.
 * Wave 1: FunctionAuditLog added. No business logic changed.
 */
Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [allUsers, allMoments, bugReports, deletedUsers] = await Promise.all([
      base44.asServiceRole.entities.User.list(undefined, 500),
      base44.asServiceRole.entities.Moment.list('-created_date', 500),
      base44.asServiceRole.entities.BugReport.filter({ status: 'open' }),
      base44.asServiceRole.entities.DeletedUser.list('-deleted_at', 100),
    ]);

    const newUsers7d = allUsers.filter(u => u.created_date >= day7).length;
    const moments7d  = allMoments.filter(m => m.created_date >= day7).length;
    const deleted7d  = deletedUsers.filter(u => u.deleted_at >= day7).length;
    const churned    = allUsers.filter(u => u.last_active_at && u.last_active_at < day7 && (u.total_moments_logged || 0) > 0).length;
    const admins     = allUsers.filter(u => u.role === 'admin');

    const subject = `Together Weekly Digest — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const body = `
Weekly Product Summary
━━━━━━━━━━━━━━━━━━━━━━━━

📈 New users this week:   ${newUsers7d}
✨ Moments logged:        ${moments7d}
🐛 Open bug reports:      ${bugReports.length}
⚠️  Churned this week:    ${churned}
🗑️  Deleted this week:    ${deleted7d}

Total users: ${allUsers.length}
Total moments (all time): ${allMoments.length}

━━━━━━━━━━━━━━━━━━━━━━━━
Sent automatically by Together
    `.trim();

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject,
        body,
      })
    ));

    // ── AUDIT: completed ───────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'weeklyAdminDigest',
        trigger_type: 'scheduled',
        triggered_by: 'system',
        status: 'completed',
        records_affected: admins.length,
        duration_ms: Date.now() - startMs,
        metadata: { sent_to: admins.length, new_users_7d: newUsers7d, moments_7d: moments7d },
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }

    return Response.json({ success: true, sent_to: admins.length });
  } catch (error) {
    // ── AUDIT: failed ──────────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'weeklyAdminDigest',
        trigger_type: 'scheduled',
        triggered_by: 'system',
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