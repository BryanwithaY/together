import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin-only: identifies users who have gone inactive.
 * "Churned" = had at least 1 moment logged but haven't been active in 14+ days.
 * "At risk" = active within 14-28 days but not in last 7.
 * Also returns total deleted account count from DeletedUser entity.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const day14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const day28 = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data in parallel
    const [allUsers, deletedUsers] = await Promise.all([
      base44.asServiceRole.entities.User.list(undefined, 500),
      base44.asServiceRole.entities.DeletedUser.list('-deleted_at', 200),
    ]);

    // Only consider users who have actually used the app
    const activeUsers = allUsers.filter(u => u.total_moments_logged > 0 || u.last_active_at);

    const churned = activeUsers.filter(u => {
      if (!u.last_active_at) return u.total_moments_logged > 0; // never pinged but did log
      return u.last_active_at < day14;
    });

    const atRisk = activeUsers.filter(u => {
      if (!u.last_active_at) return false;
      return u.last_active_at >= day28 && u.last_active_at < day7;
    });

    // Deleted users breakdown by time window
    const deletedLast30 = deletedUsers.filter(u => u.deleted_at >= new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString());
    const deletedLast7  = deletedUsers.filter(u => u.deleted_at >= day7);

    return Response.json({
      success: true,
      summary: {
        total_active_users: activeUsers.length,
        churned_count: churned.length,
        at_risk_count: atRisk.length,
        deleted_total: deletedUsers.length,
        deleted_last_30_days: deletedLast30.length,
        deleted_last_7_days: deletedLast7.length,
      },
      churned: churned.map(u => ({
        email: u.email,
        name: u.full_name,
        last_active_at: u.last_active_at,
        total_moments: u.total_moments_logged,
      })),
      at_risk: atRisk.map(u => ({
        email: u.email,
        name: u.full_name,
        last_active_at: u.last_active_at,
        total_moments: u.total_moments_logged,
      })),
      recently_deleted: deletedLast30.map(u => ({
        email: u.user_email,
        name: u.user_name,
        deleted_at: u.deleted_at,
        days_as_user: u.days_since_signup,
        total_moments: u.total_moments_logged,
        had_partner: u.had_partner,
        reason: u.reason || null,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});