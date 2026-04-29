import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Checks all users with reminders enabled and sends email/in-app notifications
 * if the current time matches their configured schedule.
 *
 * Runs every 5 minutes via scheduled automation.
 * Wave 1: FunctionAuditLog added. No business logic changed.
 */

function greeting(user) {
  const first = (user.full_name || '').trim().split(/\s+/)[0];
  return first || 'there';
}

function getNowInTimezone(tz) {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      hour: 'numeric', minute: 'numeric', hour12: false,
      weekday: 'short',
    }).formatToParts(now);
    const get = (type) => parts.find(p => p.type === type)?.value;
    const hour = parseInt(get('hour'), 10);
    const minute = parseInt(get('minute'), 10);
    const weekdayStr = get('weekday');
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour, minute, weekday: weekdayMap[weekdayStr] ?? 0 };
  } catch {
    const now = new Date();
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes(), weekday: now.getUTCDay() };
  }
}

function shouldFire(reminder, hour, minute, weekday) {
  const { frequency, time, day } = reminder;

  if (frequency === 'hourly') {
    const targetMinute = parseInt(time || '0', 10);
    return minute === targetMinute;
  }

  if (frequency === 'daily') {
    if (!time) return false;
    const [h, m] = time.split(':').map(Number);
    const targetTotal = h * 60 + m;
    const nowTotal = hour * 60 + minute;
    return Math.abs(nowTotal - targetTotal) < 5;
  }

  if (frequency === 'weekly') {
    if (!time || day === undefined) return false;
    const [h, m] = time.split(':').map(Number);
    const targetTotal = h * 60 + m;
    const nowTotal = hour * 60 + minute;
    return weekday === parseInt(day, 10) && Math.abs(nowTotal - targetTotal) < 5;
  }

  return false;
}

Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const base44 = createClientFromRequest(req);

  // Auth check (unchanged)
  const isScheduled = req.headers.get('x-base44-scheduled') === 'true';
  if (!isScheduled) {
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const usersWithReminders = allUsers.filter(u => u.notification_daily_reminder && u.notification_reminders?.length);

    let fired = 0;
    const now = new Date();

    for (const user of usersWithReminders) {
      if (user.last_reminder_sent_at) {
        const lastSent = new Date(user.last_reminder_sent_at);
        if (now - lastSent < 4 * 60 * 1000) continue;
      }

      const tz = user.timezone || 'UTC';
      const { hour, minute, weekday } = getNowInTimezone(tz);

      let sentThisCycle = false;
      for (const reminder of user.notification_reminders) {
        if (!shouldFire(reminder, hour, minute, weekday)) continue;

        const viaEmail = reminder.via_email === true;
        if (viaEmail && user.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: "Time to log a moment 💛",
            body: `Hi ${greeting(user)},\n\nThis is your reminder to log a moment in your relationship space.\n\nSmall consistent check-ins make a big difference over time.\n\nOpen the app and record something — even a brief note counts.\n\nhttps://app.base44.app`,
          });
          sentThisCycle = true;
        }

        fired++;
      }

      if (sentThisCycle) {
        await base44.asServiceRole.entities.User.update(user.id, {
          last_reminder_sent_at: now.toISOString(),
        });
      }
    }

    // ── AUDIT: completed ───────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'sendReminders',
        trigger_type: 'scheduled',
        triggered_by: 'system',
        status: 'completed',
        records_affected: fired,
        duration_ms: Date.now() - startMs,
        metadata: { fired, checked: usersWithReminders.length },
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }

    return Response.json({ success: true, fired, checked: usersWithReminders.length });
  } catch (error) {
    // ── AUDIT: failed ──────────────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'sendReminders',
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