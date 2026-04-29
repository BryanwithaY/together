import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled job: updates relationship-level health signals.
 * Adds last_moment_at, total_moments, member_count to each Relationship record.
 * Should run daily.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isScheduled = req.headers.get('x-base44-scheduled') === 'true';
    const user = isScheduled ? null : await base44.auth.me().catch(() => null);
    if (!isScheduled && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [relationships, allMoments, allMembers] = await Promise.all([
      base44.asServiceRole.entities.Relationship.list(undefined, 200),
      base44.asServiceRole.entities.Moment.list('-date', 1000),
      base44.asServiceRole.entities.RelationshipMember.list(undefined, 500),
    ]);

    const activeRels = relationships.filter(r => !r.is_deleted && !r.is_archived);

    // Group moments and members by relationship_id
    const momentsByRel = allMoments.reduce((acc, m) => {
      if (!acc[m.relationship_id]) acc[m.relationship_id] = [];
      acc[m.relationship_id].push(m);
      return acc;
    }, {});

    const membersByRel = allMembers.reduce((acc, mb) => {
      if (mb.status === 'active') {
        acc[mb.relationship_id] = (acc[mb.relationship_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Update each relationship in parallel (batched to avoid rate limits)
    const updates = activeRels.map(rel => {
      const relMoments = momentsByRel[rel.id] || [];
      const lastMoment = relMoments[0]; // already sorted by -date
      return base44.asServiceRole.entities.Relationship.update(rel.id, {
        last_moment_at: lastMoment?.date || null,
        total_moments: relMoments.length,
        member_count: membersByRel[rel.id] || 1,
      });
    });

    // Process in chunks of 20 to be safe
    const chunkSize = 20;
    for (let i = 0; i < updates.length; i += chunkSize) {
      await Promise.all(updates.slice(i, i + chunkSize));
    }

    return Response.json({
      success: true,
      updated: activeRels.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});