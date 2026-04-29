import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Wave 2 — Centralized facilitator consent filter.
 *
 * Accepts: { relationship_id, facilitator_email, start_date?, end_date?, limit? }
 * Returns: { filtered_moments, consent_map, facRel, total_fetched, total_returned,
 *            consent_summary }
 *
 * Wave 2 hotfix additions:
 *   - Caller identity verified: caller must be admin OR caller.email === facilitator_email
 *   - Denial attempts are audit-logged (safe metadata only, no content)
 *   - consent_summary field distinguishes "no moments" from "consent missing/blocked"
 *
 * Canonical resolver precedence (matches utils/momentPrivacyResolver.js):
 *   1. is_private === true                        → 'private'
 *   2. type === 'self_reflection' AND
 *      shared_with_partner !== true               → 'private'
 *   3. visibility field value                     → use as-is
 *   4. fallback                                   → 'relationship'
 *
 * Consent filter rules (applied after resolver):
 *   A. Resolved visibility === 'private'          → always exclude
 *   B. Member consent status !== 'approved'       → exclude all their moments
 *   C. consent.hide_self_reflections === true     → exclude type === 'self_reflection'
 *   D. consent.hidden_moment_ids includes id      → exclude that specific moment
 */

// ── Canonical resolver ────────────────────────────────────────────────────────
function resolveVisibility(moment) {
  if (moment.is_private === true) return 'private';
  if (moment.type === 'self_reflection' && moment.shared_with_partner !== true) return 'private';
  return moment.visibility || 'relationship';
}

// ── Safe denial audit log (fire-and-forget, never throws) ─────────────────────
async function logDenial(base44, { caller_email, facilitator_email, relationship_id, reason }) {
  try {
    await base44.asServiceRole.entities.FunctionAuditLog.create({
      function_name: 'filterMomentsForFacilitator',
      trigger_type: 'user_action',
      triggered_by: caller_email || 'unknown',
      status: 'failed',
      error_message: reason,
      metadata: {
        caller_email: caller_email || null,
        requested_facilitator_email: facilitator_email || null,
        relationship_id: relationship_id || null,
        denial_reason: reason
      },
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: 0
    });
  } catch (e) {
    console.error('[filterMomentsForFacilitator] denial audit log failed:', e.message);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { relationship_id, facilitator_email, start_date, end_date, limit } = body;

    if (!relationship_id || !facilitator_email) {
      return Response.json({ error: 'relationship_id and facilitator_email are required' }, { status: 400 });
    }

    // ── A. Caller identity verification ──────────────────────────────────────
    // Must be authenticated. Must be admin OR must be the facilitator themselves.
    // This covers three invocation patterns safely:
    //   1. Direct call by a facilitator user: user.email === facilitator_email ✅
    //   2. Service-role call from getFacilitatorData / exportFacilitatorReport:
    //      those functions call via asServiceRole which presents as admin ✅
    //   3. Impersonation attempt by non-admin non-matching user: 403 ✅
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callerIsAdmin = user.role === 'admin';
    const callerIsFacilitator = user.role === 'facilitator';
    const callerEmailMatches = user.email === facilitator_email;

    if (!callerIsAdmin && !(callerIsFacilitator && callerEmailMatches)) {
      await logDenial(base44, {
        caller_email: user.email,
        facilitator_email,
        relationship_id,
        reason: 'caller_email_does_not_match_facilitator_email'
      });
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          details: 'Caller is not authorized to request this facilitator view'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ── Verify active facilitator access for the requested facilitator ────────
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

    // ── B. Consent summary — distinguishes missing consent from "no moments" ──
    // Fetch expected members for this relationship to check coverage.
    const members = await base44.asServiceRole.entities.RelationshipMember.filter({
      relationship_id,
      status: 'active'
    });

    const membersWithApprovedConsent = members.filter(m => {
      const c = consentMap[m.user_email];
      return c && c.status === 'approved';
    });
    const membersWithoutApprovedConsent = members.filter(m => {
      const c = consentMap[m.user_email];
      return !c || c.status !== 'approved';
    });
    const consentRecordsFound = consents.length;
    const allConsentMissing = consentRecordsFound === 0 && members.length > 0;
    const someConsentMissing = membersWithoutApprovedConsent.length > 0 && members.length > 0;

    // ── Fetch moments (DB pre-filter for efficiency) ──────────────────────────
    const fetchLimit = limit || 500;
    const allMoments = await base44.asServiceRole.entities.Moment.filter({
      relationship_id,
      visibility: 'relationship'
    }, '-date', fetchLimit);

    const startISO = start_date ? new Date(start_date).toISOString() : null;
    const endISO   = end_date   ? new Date(end_date + 'T23:59:59').toISOString() : null;

    // ── Apply canonical resolver + consent rules ──────────────────────────────
    const filteredMoments = allMoments.filter(moment => {
      if (startISO && (!moment.date || moment.date < startISO)) return false;
      if (endISO   && (!moment.date || moment.date > endISO))   return false;

      // Rule A: canonical resolver — private moments never reach facilitators
      if (resolveVisibility(moment) === 'private') return false;

      // Rule B: member must have approved consent
      const consent = consentMap[moment.created_by];
      if (!consent || consent.status !== 'approved') return false;

      // Rule C: hide_self_reflections
      if (consent.hide_self_reflections && moment.type === 'self_reflection') return false;

      // Rule D: specific hidden moment IDs
      if (consent.hidden_moment_ids.includes(moment.id)) return false;

      return true;
    });

    // ── Build consent summary ─────────────────────────────────────────────────
    const consent_summary = {
      consent_records_found: consentRecordsFound,
      members_total: members.length,
      members_with_approved_consent: membersWithApprovedConsent.length,
      members_without_approved_consent: membersWithoutApprovedConsent.length,
      filtered_to_zero_due_to_consent: filteredMoments.length === 0 && allMoments.length > 0 && someConsentMissing,
      all_consent_records_missing: allConsentMissing,
      warning_code: allConsentMissing
        ? 'NO_CONSENT_RECORDS'
        : someConsentMissing
          ? 'PARTIAL_CONSENT'
          : null
    };

    return Response.json({
      success: true,
      filtered_moments: filteredMoments,
      consent_map: consentMap,
      facRel,
      total_fetched: allMoments.length,
      total_returned: filteredMoments.length,
      consent_summary
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});