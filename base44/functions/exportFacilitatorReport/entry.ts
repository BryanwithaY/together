import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Consent-aware, date-range export for facilitators.
 * Returns moments, stats, and notes for a given period.
 *
 * Wave 1: FunctionAuditLog added.
 * Wave 2: Moment filtering now routes through the centralized
 * `filterMomentsForFacilitator` function for canonical privacy enforcement.
 */
Deno.serve(async (req) => {
  const startMs   = Date.now();
  const startedAt = new Date().toISOString();
  const base44    = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'facilitator' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { relationship_id, start_date, end_date } = await req.json();

    if (!relationship_id || !start_date || !end_date) {
      return Response.json({ error: 'relationship_id, start_date, and end_date are required' }, { status: 400 });
    }

    // ── Central privacy filter (Wave 2) ──────────────────────────────────────
    const filterResult = await base44.asServiceRole.functions.invoke('filterMomentsForFacilitator', {
      relationship_id,
      facilitator_email: user.email,
      start_date,
      end_date,
      limit: 500
    });

    if (!filterResult?.success) {
      const status = filterResult?.error?.includes('active') ? 403 : 500;
      return Response.json({ error: filterResult?.error || 'Filter failed' }, { status });
    }

    const filteredMoments = filterResult.filtered_moments || [];
    const facRel          = filterResult.facRel;
    const consentSummary  = filterResult.consent_summary || null;

    // Members
    const members = await base44.asServiceRole.entities.RelationshipMember.filter({
      relationship_id,
      status: 'active'
    });

    // Stats
    const conflictSubtypes = ['reacted_poorly', 'shut_down', 'was_dismissive', 'unkind', 'not_present'];
    const conflictCount    = filteredMoments.filter(m => conflictSubtypes.includes(m.subtype)).length;

    const stats = {
      total_moments: filteredMoments.length,
      ego_aside_count: filteredMoments.filter(m => m.type === 'ego_aside').length,
      gratitude_count: filteredMoments.filter(m => m.type === 'gratitude').length,
      self_reflection_count: filteredMoments.filter(m => m.type === 'self_reflection').length,
      conflict_count: conflictCount,
      member_activity: {}
    };

    members.forEach(m => {
      const memberMoments = filteredMoments.filter(mo => mo.created_by === m.user_email);
      stats.member_activity[m.user_email] = {
        total: memberMoments.length,
        display_name: m.display_name || m.user_email,
        last_activity: memberMoments[0]?.date || null
      };
    });

    const allNotes = await base44.entities.FacilitatorNote.filter({
      facilitator_email: user.email,
      relationship_id
    }, '-session_date', 100);

    const startISO = new Date(start_date).toISOString();
    const endISO   = new Date(end_date + 'T23:59:59').toISOString();
    const filteredNotes = allNotes.filter(n =>
      n.session_date && n.session_date >= startISO && n.session_date <= endISO
    );

    // ── FunctionAuditLog (Wave 1 pattern) ────────────────────────────────────
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'exportFacilitatorReport',
        trigger_type: 'user_action',
        triggered_by: user.email,
        status: 'completed',
        records_affected: filteredMoments.length,
        duration_ms: Date.now() - startMs,
        metadata: {
          relationship_id,
          start_date,
          end_date,
          moments_returned: filteredMoments.length,
          notes_returned: filteredNotes.length,
          total_fetched: filterResult.total_fetched
        },
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }

    return Response.json({
      success: true,
      relationship_name: facRel?.relationship_name,
      facilitator_email: user.email,
      period: { start_date, end_date },
      moments: filteredMoments,
      members,
      stats,
      notes: filteredNotes
    });

  } catch (error) {
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'exportFacilitatorReport',
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