import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Weekly digest for facilitators — sends a summary email of all
 * active relationships they oversee with pattern highlights.
 * Scheduled to run weekly. Only sends to facilitators on pro/professional tiers.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active facilitator relationships grouped by facilitator
    const allFacRels = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
      status: 'active'
    }, '-created_date', 500);

    // Get all facilitator users on pro/professional tier
    const facilitatorUsers = await base44.asServiceRole.entities.User.filter({ role: 'facilitator' });
    const eligibleFacilitators = facilitatorUsers.filter(u =>
      u.facilitator_tier === 'pro' || u.facilitator_tier === 'professional'
    );

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let sent = 0;

    for (const facilitator of eligibleFacilitators) {
      const myRels = allFacRels.filter(r => r.facilitator_email === facilitator.email);
      if (myRels.length === 0) continue;

      let summaryLines = [];

      for (const fr of myRels) {
        // Get recent moments (consent-aware not needed for summary counts only)
        const consents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
          facilitator_relationship_id: fr.id,
          status: 'approved'
        });
        const approvedMembers = consents.map(c => c.member_email);

        const recentMoments = await base44.asServiceRole.entities.Moment.filter({
          relationship_id: fr.relationship_id,
          visibility: 'relationship'
        }, '-date', 100);

        const weekMoments = recentMoments.filter(m =>
          m.date >= oneWeekAgo && approvedMembers.includes(m.created_by)
        );

        const conflictTypes = ['reacted_poorly', 'shut_down', 'was_dismissive', 'unkind', 'not_present'];
        const conflicts = weekMoments.filter(m => conflictTypes.includes(m.subtype)).length;
        const positives = weekMoments.filter(m => m.type === 'gratitude' || m.type === 'ego_aside').length;

        const trend = conflicts > positives * 2 ? '⚠️ Needs attention'
          : positives > conflicts * 2 ? '✅ Doing well'
          : '➡️ Stable';

        summaryLines.push(`• ${fr.relationship_name || 'Unnamed'}: ${weekMoments.length} moments this week ${trend}`);
        if (conflicts >= 3) {
          summaryLines.push(`  → ${conflicts} conflict moments flagged`);
        }
      }

      const subject = `Your Facilitator Weekly Summary — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const body = `
Hi ${facilitator.full_name || facilitator.email},

Here's your weekly overview of the relationships you're facilitating:

${summaryLines.join('\n')}

Log in to Together to view detailed insights and prepare for upcoming sessions.

━━━━━━━━━━━━━━
Together Facilitator Portal
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: facilitator.email,
        subject,
        body
      });
      sent++;
    }

    return Response.json({ success: true, digests_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});