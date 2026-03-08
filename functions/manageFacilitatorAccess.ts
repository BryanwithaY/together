import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Handles all facilitator access flows:
 * - request_access: facilitator or member initiates
 * - approve_consent: a member approves their consent
 * - decline_consent: a member declines
 * - revoke_access: relationship admin revokes all access
 * - update_consent_prefs: member updates visibility preferences
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ── REQUEST ACCESS ─────────────────────────────────────────────
    if (action === 'request_access') {
      const { relationship_id, facilitator_email, initiated_by_type } = body;

      // Verify the relationship exists and initiator is authorized
      const members = await base44.asServiceRole.entities.RelationshipMember.filter({
        relationship_id,
        status: 'active'
      });

      // If initiated by facilitator, check they have facilitator role
      if (initiated_by_type === 'facilitator') {
        if (user.role !== 'facilitator' && user.role !== 'admin') {
          return Response.json({ error: 'Must be an approved facilitator to request access' }, { status: 403 });
        }
      } else {
        // Initiated by member — check they are an owner/admin of the relationship
        const myMembership = members.find(m => m.user_email?.toLowerCase() === user.email?.toLowerCase());
        if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
          return Response.json({ error: 'Only relationship owners/admins can invite a facilitator' }, { status: 403 });
        }
      }

      // Check no existing active/pending connection
      const existing = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
        facilitator_email: facilitator_email || user.email,
        relationship_id
      });
      const active = existing.filter(r => ['pending_approval', 'active'].includes(r.status));
      if (active.length > 0) {
        return Response.json({ error: 'A facilitator connection already exists or is pending for this relationship' }, { status: 409 });
      }

      // Check facilitator relationship limit based on tier
      if (initiated_by_type === 'facilitator') {
        const facilitatorUser = await base44.asServiceRole.entities.User.filter({ email: user.email });
        const fUser = facilitatorUser[0];
        const tier = fUser?.facilitator_tier || 'free';
        const allFacRels = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
          facilitator_email: user.email,
          status: 'active'
        });
        const limits = { free: 2, pro: 10, professional: 9999 };
        if (allFacRels.length >= (limits[tier] || 2)) {
          return Response.json({ 
            error: `Your ${tier} plan allows up to ${limits[tier]} active relationships. Upgrade to add more.`,
            tier_limit: true
          }, { status: 403 });
        }
      }

      // Create the FacilitatorRelationship record
      const relationship = await base44.asServiceRole.entities.Relationship.filter({ id: relationship_id });
      const relName = relationship[0]?.name || 'Unknown Relationship';

      const facRel = await base44.asServiceRole.entities.FacilitatorRelationship.create({
        facilitator_email: initiated_by_type === 'facilitator' ? user.email : facilitator_email,
        relationship_id,
        relationship_name: relName,
        initiated_by: user.email,
        initiated_by_type: initiated_by_type || 'facilitator',
        status: 'pending_approval',
        all_approved: false
      });

      // Create consent records for each active member
      const consentPromises = members
        .filter(m => m.status === 'active')
        .map(m => base44.asServiceRole.entities.FacilitatorConsent.create({
          facilitator_relationship_id: facRel.id,
          facilitator_email: facRel.facilitator_email,
          relationship_id,
          member_email: m.user_email,
          status: 'pending',
          hide_self_reflections: false,
          hidden_moment_ids: []
        }));

      await Promise.all(consentPromises);

      return Response.json({ success: true, facilitator_relationship: facRel });
    }

    // ── APPROVE CONSENT ───────────────────────────────────────────
    if (action === 'approve_consent') {
      const { consent_id, hide_self_reflections } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent record not found' }, { status: 404 });

      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized to approve this consent' }, { status: 403 });
      }

      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        status: 'approved',
        hide_self_reflections: !!hide_self_reflections,
        approved_at: new Date().toISOString()
      });

      // Check if all consents for this FacilitatorRelationship are now approved
      const allConsents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
        facilitator_relationship_id: c.facilitator_relationship_id
      });
      const allApproved = allConsents.every(con => con.id === c.id ? true : con.status === 'approved');

      if (allApproved) {
        await base44.asServiceRole.entities.FacilitatorRelationship.update(c.facilitator_relationship_id, {
          status: 'active',
          all_approved: true,
          access_granted_at: new Date().toISOString()
        });
      }

      return Response.json({ success: true, all_approved: allApproved });
    }

    // ── DECLINE CONSENT ────────────────────────────────────────────
    if (action === 'decline_consent') {
      const { consent_id } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent not found' }, { status: 404 });

      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        status: 'declined',
        declined_at: new Date().toISOString()
      });

      // Mark the FacilitatorRelationship as declined
      await base44.asServiceRole.entities.FacilitatorRelationship.update(c.facilitator_relationship_id, {
        status: 'declined'
      });

      return Response.json({ success: true });
    }

    // ── UPDATE CONSENT PREFS ──────────────────────────────────────
    if (action === 'update_consent_prefs') {
      const { consent_id, hide_self_reflections, hidden_moment_ids } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent not found' }, { status: 404 });
      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        hide_self_reflections: !!hide_self_reflections,
        hidden_moment_ids: hidden_moment_ids || c.hidden_moment_ids || []
      });

      return Response.json({ success: true });
    }

    // ── REVOKE ACCESS ─────────────────────────────────────────────
    if (action === 'revoke_access') {
      const { facilitator_relationship_id } = body;

      const facRel = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
        id: facilitator_relationship_id
      });
      if (!facRel.length) return Response.json({ error: 'Not found' }, { status: 404 });
      const fr = facRel[0];

      // Must be relationship owner/admin or the facilitator themselves
      const members = await base44.asServiceRole.entities.RelationshipMember.filter({
        relationship_id: fr.relationship_id,
        user_email: user.email,
        status: 'active'
      });
      const isMemberAdmin = members.some(m => ['owner', 'admin'].includes(m.role));
      const isFacilitator = fr.facilitator_email?.toLowerCase() === user.email?.toLowerCase();
      if (!isMemberAdmin && !isFacilitator && user.role !== 'admin') {
        return Response.json({ error: 'Not authorized to revoke access' }, { status: 403 });
      }

      await base44.asServiceRole.entities.FacilitatorRelationship.update(fr.id, { status: 'revoked' });
      return Response.json({ success: true });
    }

    // ── GET MY CONSENTS (for relationship settings) ───────────────
    if (action === 'get_my_consents') {
      const { relationship_id } = body;
      const consents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
        member_email: user.email,
        relationship_id
      });

      // Enrich with facilitator relationship info
      const enriched = await Promise.all(consents.map(async (c) => {
        const frList = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
          id: c.facilitator_relationship_id
        });
        return { ...c, facilitator_relationship: frList[0] || null };
      }));

      return Response.json({ success: true, consents: enriched });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});