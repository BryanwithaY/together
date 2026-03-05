import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Sends notifications to relevant relationship members when an event occurs.
 * 
 * Payload:
 *   - event_type: 'partner_logs' | 'partner_comments' | 'partner_reviews'
 *   - relationship_id: string
 *   - actor_email: string  (the person who triggered the event)
 *   - context: string  (short description shown in the email)
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me().catch(() => null);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event_type, relationship_id, actor_email, context } = await req.json();

  if (!event_type || !relationship_id || !actor_email) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get all active members of this relationship
  const members = await base44.asServiceRole.entities.RelationshipMember.filter({
    relationship_id,
    status: 'active',
  });

  // Notify all members except the actor
  const recipients = members.filter(m => m.user_email?.toLowerCase() !== actor_email.toLowerCase());
  if (!recipients.length) return Response.json({ success: true, sent: 0 });

  // Fetch user records for recipients
  const allUsers = await base44.asServiceRole.entities.User.list();
  const recipientUsers = allUsers.filter(u =>
    recipients.some(r => r.user_email?.toLowerCase() === u.email?.toLowerCase())
  );

  const subjectMap = {
    partner_logs:     'Your partner logged a new moment 💛',
    partner_comments: 'Your partner left a comment 💬',
    partner_reviews:  'Your partner reviewed a moment ✓',
  };

  const bodyMap = {
    partner_logs:     `Your partner recorded a new moment in your shared space.\n\n${context || ''}\n\nOpen the app to see it.`,
    partner_comments: `Your partner left a comment.\n\n${context || ''}\n\nOpen the app to reply.`,
    partner_reviews:  `Your partner marked a moment as reviewed.\n\n${context || ''}\n\nOpen the app to view it.`,
  };

  const prefKey = event_type; // matches notification_partner_logs etc.
  const emailPrefKey = `${event_type}_email`; // e.g. notification_partner_logs_email

  let sent = 0;
  for (const recipUser of recipientUsers) {
    // Check if user has this notification type enabled (default true)
    const notifEnabled = recipUser[`notification_${prefKey}`] ?? true;
    if (!notifEnabled) continue;

    // Email: send if they have _email pref true (default true for backward compat)
    const emailEnabled = recipUser[`notification_${emailPrefKey}`] ?? true;
    if (emailEnabled && recipUser.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipUser.email,
        subject: subjectMap[event_type] || 'New activity in your relationship space',
        body: `Hi ${recipUser.full_name || 'there'},\n\n${bodyMap[event_type] || ''}\n\nhttps://app.base44.app`,
      });
      sent++;
    }
  }

  return Response.json({ success: true, sent });
});