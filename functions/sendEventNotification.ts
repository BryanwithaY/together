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

function getFirstName(user) {
  const name = user.full_name || '';
  const cleaned = name.includes('@') ? name.split('@')[0] : name;
  const first = cleaned.split(/[\s.+_-]/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : 'there';
}

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

  // Fetch recipient users in parallel
  const recipientEmails = recipients.map(r => r.user_email).filter(Boolean);
  const recipientUsers = (await Promise.all(
    recipientEmails.map(email => base44.asServiceRole.entities.User.filter({ email }))
  )).flat();

  const subjectMap = {
    partner_logs:     'Your partner logged a new moment 💛',
    partner_comments: 'Your partner left a comment 💬',
    partner_reviews:  'Your partner reviewed a moment ✓',
  };

  // Do NOT include moment content (context) in email bodies — it contains private relationship text
  const bodyMap = {
    partner_logs:     `Your partner recorded a new moment in your shared space.\n\nOpen the app to see it.`,
    partner_comments: `Your partner left a comment on a moment.\n\nOpen the app to reply.`,
    partner_reviews:  `Your partner marked a moment as reviewed.\n\nOpen the app to view it.`,
  };

  const prefKey = event_type; // matches notification_partner_logs etc.
  const emailPrefKey = `${event_type}_email`; // e.g. notification_partner_logs_email

  // Send all emails in parallel
  const emailTasks = recipientUsers
    .filter(u => {
      const notifEnabled = u[`notification_${prefKey}`] ?? true;
      const emailEnabled = u[`notification_${emailPrefKey}`] ?? true;
      return notifEnabled && emailEnabled && u.email;
    })
    .map(u => base44.asServiceRole.integrations.Core.SendEmail({
      to: u.email,
      subject: subjectMap[event_type] || 'New activity in your relationship space',
      body: `Hi ${getFirstName(u)},\n\n${bodyMap[event_type] || 'You have new activity in your relationship space.'}\n\nhttps://app.base44.app`,
    }));

  await Promise.all(emailTasks);

  return Response.json({ success: true, sent: emailTasks.length });
});