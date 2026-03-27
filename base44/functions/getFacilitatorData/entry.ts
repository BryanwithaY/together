import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Consent-aware data fetching for facilitators.
 * Returns moments filtered by each member's consent preferences.
 *
 * Wave 2: Moment filtering now routes through the centralized
 * `filterMomentsForFacilitator` function for canonical privacy enforcement.
 * The old inline filter path is retained as a commented reference but is
 * no longer the active path. Remove after Wave 2 validation is confirmed.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'facilitator' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Facilitator access required' }, { status: 403 });
    }

    const body = await req.json();
    const { relationship_id, action } = body;

    // --- Get all facilitator relationships for this facilitator ---
    if (action === 'list_relationships') {
      const facRels = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
        facilitator_email: user.email
      }, '-created_date', 50);
      return Response.json({ success: true, facilitator_relationships: facRels });
    }

    // --- Get detailed data for a specific relationship ---
    if (!relationship_id) {
      return Response.json({ error: 'relationship_id required' }, { status: 400 });
    }

    // ── Central privacy filter (Wave 2) ──────────────────────────────────────
    // Route through filterMomentsForFacilitator for canonical consent enforcement.
    const filterResult = await base44.asServiceRole.functions.invoke('filterMomentsForFacilitator', {
      relationship_id,
      facilitator_email: user.email,
      limit: 200
    });

    if (!filterResult?.success) {
      // Propagate access errors (e.g. no active facRel)
      const status = filterResult?.error?.includes('active') ? 403 : 500;
      return Response.json({ error: filterResult?.error || 'Filter failed' }, { status });
    }

    const filteredMoments = filterResult.filtered_moments || [];
    const consentMap      = filterResult.consent_map || {};
    const facRel          = filterResult.facRel;

    // Fetch members
    const members = await base44.asServiceRole.entities.RelationshipMember.filter({
      relationship_id,
      status: 'active'
    });

    // Compute stats
    const now = Date.now();
    const oneWeekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const recentMoments = filteredMoments.filter(m => m.date >= oneWeekAgo);

    const stats = {
      total_moments: filteredMoments.length,
      ego_aside_count: filteredMoments.filter(m => m.type === 'ego_aside').length,
      gratitude_count: filteredMoments.filter(m => m.type === 'gratitude').length,
      self_reflection_count: filteredMoments.filter(m => m.type === 'self_reflection').length,
      last_activity: filteredMoments[0]?.date || null,
      recent_count_7d: recentMoments.length,
      member_activity: {}
    };

    members.forEach(member => {
      const memberMoments = filteredMoments.filter(m => m.created_by === member.user_email);
      const memberRecent  = recentMoments.filter(m => m.created_by === member.user_email);
      stats.member_activity[member.user_email] = {
        total: memberMoments.length,
        recent_7d: memberRecent.length,
        last_activity: memberMoments[0]?.date || null,
        display_name: member.display_name || member.user_email
      };
    });

    // Flag concerning patterns
    const concerns = [];
    const conflictSubtypes = ['reacted_poorly', 'shut_down', 'was_dismissive', 'unkind', 'not_present'];
    const conflictMoments  = recentMoments.filter(m => conflictSubtypes.includes(m.subtype));

    if (conflictMoments.length >= 3) {
      concerns.push({
        type: 'high_conflict',
        message: `${conflictMoments.length} conflict-related moments logged in the past 7 days`,
        severity: 'high'
      });
    }

    members.forEach(member => {
      const memberAllTime = filteredMoments.filter(m => m.created_by === member.user_email);
      const memberRecent  = recentMoments.filter(m => m.created_by === member.user_email);
      if (memberAllTime.length >= 5 && memberRecent.length === 0) {
        concerns.push({
          type: 'disengagement',
          message: 'A member has not logged any moments in 7+ days after previously active engagement',
          severity: 'medium',
          member_email: member.user_email
        });
      }
    });

    if (members.length >= 2) {
      const memberTotals = members.map(m => ({
        email: m.user_email,
        total: filteredMoments.filter(mo => mo.created_by === m.user_email).length
      }));
      const total = memberTotals.reduce((sum, m) => sum + m.total, 0);
      if (total >= 10) {
        const maxMember = memberTotals.reduce((a, b) => a.total > b.total ? a : b);
        if (maxMember.total / total > 0.75) {
          concerns.push({
            type: 'contribution_imbalance',
            message: 'One member is contributing significantly more than others (>75% of all moments)',
            severity: 'medium'
          });
        }
      }
    }

    const twoWeekMoments  = filteredMoments.filter(m => m.date >= twoWeeksAgo);
    const twoWeekPositive = twoWeekMoments.filter(m => m.type === 'gratitude' || m.type === 'ego_aside').length;
    const twoWeekConflict = twoWeekMoments.filter(m => conflictSubtypes.includes(m.subtype)).length;
    if (twoWeekConflict >= 3 && twoWeekPositive < twoWeekConflict / 3) {
      concerns.push({
        type: 'positivity_deficit',
        message: `Low positive-to-conflict ratio over 14 days (${twoWeekPositive} positive vs ${twoWeekConflict} conflict)`,
        severity: 'medium'
      });
    }

    const notes = await base44.asServiceRole.entities.FacilitatorNote.filter({
      facilitator_email: user.email,
      relationship_id
    }, '-session_date', 20);

    return Response.json({
      success: true,
      facilitator_relationship: facRel,
      moments: filteredMoments,
      members,
      stats,
      concerns,
      consent_map: consentMap,
      notes
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});