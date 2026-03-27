import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Wave 2 — Centralized facilitator consent filter.
 *
 * Accepts: { relationship_id, facilitator_email, start_date?, end_date?, limit? }
 * Returns: { filtered_moments, consent_map, facRel, total_fetched, total_returned }
 *
 * This function is intentionally called service-to-service (via asServiceRole.functions.invoke)
 * from getFacilitatorData and exportFacilitatorReport. It does NOT require its own user auth
 * context — the calling function is responsible for authenticating the facilitator first.
 *
 * Canonical resolver precedence:
 *   1. is_private === true                        → 'private'
 *   2. type === 'self_reflection' AND
 *      shared_with_partner !== true               → 'private'
 *   3. visibility field value                     → use as-is
 *   4. fallback                                   → 'relationship'
 *
 * Consent filter rules (applied after resolver):
 *   A. Resolved visibility === 'private'          → always exclude (even from approved members)
 *   B. Member consent status !== 'approved'       → exclude all their moments
 *   C. consent.hide_self_reflections === true     → exclude type === 'self_reflection'
 *   D. consent.hidden_moment_ids includes id      → exclude that specific moment
 */

// ── Canonical resolver (single source of truth for server side) ─────────────
function resolveVisibility(moment) {
  if (moment.is_private === true) return 'private';
  if (moment.type === 'self_reflection' && moment.shared_with_partner !== true) return 'private';
  return moment.visibility || 'relationship';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { relationship_id, facilitator_email, start_date, end_date, limit } = body;

    if (!relationship_id || !facilitator_email) {
      return Response.json({ error: 'relationship_id and facilitator_email are required' }, { status: 400 });
    }

    // ── Verify active facilitator access ─────────────────────────────────────
    const facRels = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
      facilitator_email,
      relationship_id,
      status: 'active'
    });
    if (!facRels.length) {
      return Response.json({ error: 'No active facilitator access for this relationship' }, { status: 403 });
    }
    const facRel = facRels[0];

    // ── Fetch consent records → build consent map ─────────────────────────────
    const consents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
      facilitator_relationship_id: facRel.id
    });

    const consentMap = {};
    consents.forEach(c => {
      consentMap[c.member_email] = {
        status: c.status,
        consent_id: c.id,
        hide_self_reflections: c.hide_self_reflections || false,
        hidden_moment_ids: c.hidden_moment_ids || []
      };
    });

    // ── Fetch moments (DB pre-filter: only relationship-visible, not private at storage level) ─
    // We keep this pre-filter for query efficiency, then apply canonical resolver as second pass.
    const fetchLimit = limit || 500;
    const allMoments = await base44.asServiceRole.entities.Moment.filter({
      relationship_id,
      visibility: 'relationship'
    }, '-date', fetchLimit);

    // Apply date range if provided
    const startISO = start_date ? new Date(start_date).toISOString() : null;
    const endISO   = end_date   ? new Date(end_date + 'T23:59:59').toISOString() : null;

    // ── Apply canonical resolver + consent rules ──────────────────────────────
    const filteredMoments = allMoments.filter(moment => {
      // Date range guard
      if (startISO && (!moment.date || moment.date < startISO)) return false;
      if (endISO   && (!moment.date || moment.date > endISO))   return false;

      // Rule A: canonical resolver — private effective visibility is always excluded
      const effectiveVisibility = resolveVisibility(moment);
      if (effectiveVisibility === 'private') return false;

      // Rule B: member consent must be approved
      const consent = consentMap[moment.created_by];
      if (!consent || consent.status !== 'approved') return false;

      // Rule C: hide_self_reflections
      if (consent.hide_self_reflections && moment.type === 'self_reflection') return false;

      // Rule D: specific hidden moment IDs
      if (consent.hidden_moment_ids.includes(moment.id)) return false;

      return true;
    });

    return Response.json({
      success: true,
      filtered_moments: filteredMoments,
      consent_map: consentMap,
      facRel,
      total_fetched: allMoments.length,
      total_returned: filteredMoments.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});