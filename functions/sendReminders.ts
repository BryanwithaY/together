import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Checks all users with reminders enabled and sends email/in-app notifications
 * if the current time matches their configured schedule.
 * 
 * Runs every 5 minutes via scheduled automation.
 */

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
    const weekdayStr = get('weekday'); // 'Mon', 'Tue', etc.
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
    // time = minute of hour e.g. "30"
    const targetMinute = parseInt(time || '0', 10);
    return minute === targetMinute;
  }

  if (frequency === 'daily') {
    // time = "HH:MM" — match within a 5-minute window to account for automation jitter
    if (!time) return false;
    const [h, m] = time.split(':').map(Number);
    const targetTotal = h * 60 + m;
    const nowTotal = hour * 60 + minute;
    return Math.abs(nowTotal - targetTotal) < 5;
  }

  if (frequency === 'weekly') {
    // time = "HH:MM", day = weekday number string e.g. "1"
    if (!time || day === undefined) return false;
    const [h, m] = time.split(':').map(Number);
    const targetTotal = h * 60 + m;
    const nowTotal = hour * 60 + minute;
    return weekday === parseInt(day, 10) && Math.abs(nowTotal - targetTotal) < 5;
  }

  return false;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled (no auth) or admin manual calls
  const isScheduled = req.headers.get('x-base44-scheduled') === 'true';
  if (!isScheduled) {
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Get all users with reminders enabled
  const allUsers = await base44.asServiceRole.entities.User.list();
  const usersWithReminders = allUsers.filter(u => u.notification_daily_reminder && u.notification_reminders?.length);

  let fired = 0;

  for (const user of usersWithReminders) {
    const tz = user.timezone || 'UTC';
    const { hour, minute, weekday } = getNowInTimezone(tz);

    for (const reminder of user.notification_reminders) {
      if (!shouldFire(reminder, hour, minute, weekday)) continue;

      const viaEmail = reminder.via_email === true;

      if (viaEmail && user.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: "Time to log a moment 💛",
          body: `Hi ${user.full_name || 'there'},\n\nThis is your reminder to log a moment in your relationship space.\n\nSmall consistent check-ins make a big difference over time.\n\nOpen the app and record something — even a brief note counts.\n\nhttps://app.base44.app`,
        });
      }

      fired++;
    }
  }

  return Response.json({ success: true, fired, checked: usersWithReminders.length });
});