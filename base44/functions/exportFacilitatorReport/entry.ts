import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Consent-aware, date-range export for facilitators.
 * Returns moments, stats, and notes for a given period.
 * Wave 1: FunctionAuditLog added. No business logic changed.
 */
Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const base44 = createClientFromRequest(req);

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

    // Verify active facilitator access
    const facRels = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
      facilitator_email: user.email,
      relationship_id,
      status: 'active'
    });
    if (!facRels.length) return Response.json({ error: 'No active access to this relationship' }, { status: 403 });
    const facRel = facRels[0];

    // Build consent map
    const consents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
      facilitator_relationship_id: facRel.id
    });
    const consentMap = {};
    consents.forEach(c => {
      consentMap[c.member_email] = {
        status: c.status,
        hide_self_reflections: c.hide_self_reflections || false,
        hidden_moment_ids: c.hidden_moment_ids || []
      };
    });

    const startISO = new Date(start_date).toISOString();
    const endISO = new Date(end_date + 'T23:59:59').toISOString();

    // Fetch all moments, filter by date + consent
    const allMoments = await base44.asServiceRole.entities.Moment.filter({
      relationship_id,
      visibility: 'relationship'
    }, '-date', 500);

    const filteredMoments = allMoments.filter(m => {
      if (!m.date || m.date < startISO || m.date > endISO) return false;
      const consent = consentMap[m.created_by];
      if (!consent || consent.status !== 'approved') return m.type !== 'self_reflection';
      if (consent.hidden_moment_ids.includes(m.id)) return false;
      if (consent.hide_self_reflections && m.type === 'self_reflection') return false;
      return true;
    });

    const members = await base44.asServiceRole.entities.RelationshipMember.filter({
      relationship_id,
      status: 'active'
    });

    const conflictSubtypes = ['reacted_poorly', 'shut_down', 'was_dismissive', 'unkind', 'not_present'];
    const conflictCount = filteredMoments.filter(m => conflictSubtypes.includes(m.subtype)).length;

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
    const filteredNotes = allNotes.filter(n =>
      n.session_date && n.session_date >= startISO && n.session_date <= endISO
    );

    // ── AUDIT: completed ───────────────────────────────────────────
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
          notes_returned: filteredNotes.length
        },
        started_at: startedAt,
        completed_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('[FunctionAuditLog] write failed:', e.message);
    }

    return Response.json({
      success: true,
      relationship_name: facRel.relationship_name,
      facilitator_email: user.email,
      period: { start_date, end_date },
      moments: filteredMoments,
      members,
      stats,
      notes: filteredNotes
    });

  } catch (error) {
    // ── AUDIT: failed ──────────────────────────────────────────────
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