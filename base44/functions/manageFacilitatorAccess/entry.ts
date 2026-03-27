import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Handles all facilitator access flows:
 * - request_access: facilitator or member initiates
 * - approve_consent: a member approves their consent
 * - decline_consent: a member declines
 * - revoke_access: relationship admin revokes all access
 * - update_consent_prefs: member updates visibility preferences
 *
 * Wave 1 additions (additive only, no business logic changed):
 * - FacilitatorAccessEvent written after each state-changing operation
 * - FunctionAuditLog written on caught exceptions
 */

// ── Audit helpers ──────────────────────────────────────────────────────────────
// Both helpers are fire-and-forget: they log on internal failure but never throw.

async function logFacilitatorEvent(base44, data) {
  try {
    await base44.asServiceRole.entities.FacilitatorAccessEvent.create({
      ...data,
      occurred_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('[FacilitatorAccessEvent] write failed:', e.message);
  }
}

async function logFunctionAudit(base44, data) {
  try {
    await base44.asServiceRole.entities.FunctionAuditLog.create(data);
  } catch (e) {
    console.error('[FunctionAuditLog] write failed:', e.message);
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();

  // Initialize base44 outside try so it is available in catch for audit logging
  const base44 = createClientFromRequest(req);
  let user = null;
  let actionType = 'unknown';

  try {
    user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    actionType = body.action || 'unknown';

    // ── REQUEST ACCESS ─────────────────────────────────────────────
    if (actionType === 'request_access') {
      const { relationship_id, facilitator_email, initiated_by_type } = body;

      const members = await base44.asServiceRole.entities.RelationshipMember.filter({
        relationship_id,
        status: 'active'
      });

      if (initiated_by_type === 'facilitator') {
        if (user.role !== 'facilitator' && user.role !== 'admin') {
          return Response.json({ error: 'Must be an approved facilitator to request access' }, { status: 403 });
        }
      } else {
        const myMembership = members.find(m => m.user_email?.toLowerCase() === user.email?.toLowerCase());
        if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
          return Response.json({ error: 'Only relationship owners/admins can invite a facilitator' }, { status: 403 });
        }
      }

      const existing = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
        facilitator_email: facilitator_email || user.email,
        relationship_id
      });
      const active = existing.filter(r => ['pending_approval', 'active'].includes(r.status));
      if (active.length > 0) {
        return Response.json({ error: 'A facilitator connection already exists or is pending for this relationship' }, { status: 409 });
      }

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

      // ── AUDIT: access_requested ────────────────────────────────────
      await logFacilitatorEvent(base44, {
        event_type: 'access_requested',
        facilitator_email: facRel.facilitator_email,
        relationship_id,
        initiated_by: user.email,
        facilitator_relationship_id: facRel.id,
        previous_status: null,
        new_status: 'pending_approval'
      });

      return Response.json({ success: true, facilitator_relationship: facRel });
    }

    // ── APPROVE CONSENT ───────────────────────────────────────────
    if (actionType === 'approve_consent') {
      const { consent_id, hide_self_reflections } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent record not found' }, { status: 404 });

      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized to approve this consent' }, { status: 403 });
      }

      const prevStatus = c.status;
      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        status: 'approved',
        hide_self_reflections: !!hide_self_reflections,
        approved_at: new Date().toISOString()
      });

      // ── AUDIT: consent_approved ────────────────────────────────────
      await logFacilitatorEvent(base44, {
        event_type: 'consent_approved',
        facilitator_email: c.facilitator_email,
        relationship_id: c.relationship_id,
        member_email: c.member_email,
        initiated_by: user.email,
        facilitator_relationship_id: c.facilitator_relationship_id,
        facilitator_consent_id: c.id,
        previous_status: prevStatus,
        new_status: 'approved'
      });

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

        // ── AUDIT: access_granted (all consents now approved) ──────────
        await logFacilitatorEvent(base44, {
          event_type: 'access_granted',
          facilitator_email: c.facilitator_email,
          relationship_id: c.relationship_id,
          initiated_by: 'system',
          facilitator_relationship_id: c.facilitator_relationship_id,
          previous_status: 'pending_approval',
          new_status: 'active'
        });
      }

      return Response.json({ success: true, all_approved: allApproved });
    }

    // ── DECLINE CONSENT ────────────────────────────────────────────
    if (actionType === 'decline_consent') {
      const { consent_id } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent not found' }, { status: 404 });

      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const prevStatus = c.status;
      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        status: 'declined',
        declined_at: new Date().toISOString()
      });

      await base44.asServiceRole.entities.FacilitatorRelationship.update(c.facilitator_relationship_id, {
        status: 'declined'
      });

      // ── AUDIT: consent_declined ────────────────────────────────────
      await logFacilitatorEvent(base44, {
        event_type: 'consent_declined',
        facilitator_email: c.facilitator_email,
        relationship_id: c.relationship_id,
        member_email: c.member_email,
        initiated_by: user.email,
        facilitator_relationship_id: c.facilitator_relationship_id,
        facilitator_consent_id: c.id,
        previous_status: prevStatus,
        new_status: 'declined'
      });

      return Response.json({ success: true });
    }

    // ── UPDATE CONSENT PREFS ──────────────────────────────────────
    if (actionType === 'update_consent_prefs') {
      const { consent_id, hide_self_reflections, hidden_moment_ids } = body;

      const consent = await base44.asServiceRole.entities.FacilitatorConsent.filter({ id: consent_id });
      if (!consent.length) return Response.json({ error: 'Consent not found' }, { status: 404 });
      const c = consent[0];
      if (c.member_email?.toLowerCase() !== user.email?.toLowerCase()) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }

      const prevHideSelfReflections = c.hide_self_reflections || false;
      const prevHiddenIds = c.hidden_moment_ids || [];
      const newHiddenIds = hidden_moment_ids || prevHiddenIds;

      await base44.asServiceRole.entities.FacilitatorConsent.update(c.id, {
        hide_self_reflections: !!hide_self_reflections,
        hidden_moment_ids: newHiddenIds
      });

      // ── AUDIT: self_reflections visibility change ──────────────────
      const newHideSelfReflections = !!hide_self_reflections;
      if (newHideSelfReflections !== prevHideSelfReflections) {
        await logFacilitatorEvent(base44, {
          event_type: newHideSelfReflections ? 'self_reflections_hidden' : 'self_reflections_unhidden',
          facilitator_email: c.facilitator_email,
          relationship_id: c.relationship_id,
          member_email: c.member_email,
          initiated_by: user.email,
          facilitator_relationship_id: c.facilitator_relationship_id,
          facilitator_consent_id: c.id,
          previous_status: String(prevHideSelfReflections),
          new_status: String(newHideSelfReflections)
        });
      }

      // ── AUDIT: hidden_moment_ids changes ──────────────────────────
      const addedIds = newHiddenIds.filter(id => !prevHiddenIds.includes(id));
      const removedIds = prevHiddenIds.filter(id => !newHiddenIds.includes(id));
      if (addedIds.length > 0) {
        await logFacilitatorEvent(base44, {
          event_type: 'moment_hidden',
          facilitator_email: c.facilitator_email,
          relationship_id: c.relationship_id,
          member_email: c.member_email,
          initiated_by: user.email,
          facilitator_relationship_id: c.facilitator_relationship_id,
          facilitator_consent_id: c.id,
          metadata: { count: addedIds.length }
        });
      }
      if (removedIds.length > 0) {
        await logFacilitatorEvent(base44, {
          event_type: 'moment_unhidden',
          facilitator_email: c.facilitator_email,
          relationship_id: c.relationship_id,
          member_email: c.member_email,
          initiated_by: user.email,
          facilitator_relationship_id: c.facilitator_relationship_id,
          facilitator_consent_id: c.id,
          metadata: { count: removedIds.length }
        });
      }

      return Response.json({ success: true });
    }

    // ── REVOKE ACCESS ─────────────────────────────────────────────
    if (actionType === 'revoke_access') {
      const { facilitator_relationship_id } = body;

      const facRel = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
        id: facilitator_relationship_id
      });
      if (!facRel.length) return Response.json({ error: 'Not found' }, { status: 404 });
      const fr = facRel[0];

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

      const prevStatus = fr.status;
      await base44.asServiceRole.entities.FacilitatorRelationship.update(fr.id, { status: 'revoked' });

      // ── AUDIT: access_revoked ──────────────────────────────────────
      await logFacilitatorEvent(base44, {
        event_type: 'access_revoked',
        facilitator_email: fr.facilitator_email,
        relationship_id: fr.relationship_id,
        initiated_by: user.email,
        facilitator_relationship_id: fr.id,
        previous_status: prevStatus,
        new_status: 'revoked'
      });

      return Response.json({ success: true });
    }

    // ── GET MY CONSENTS ───────────────────────────────────────────
    if (actionType === 'get_my_consents') {
      const { relationship_id } = body;
      const consents = await base44.asServiceRole.entities.FacilitatorConsent.filter({
        member_email: user.email,
        relationship_id
      });

      const enriched = await Promise.all(consents.map(async (c) => {
        const frList = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
          id: c.facilitator_relationship_id
        });
        return { ...c, facilitator_relationship: frList[0] || null };
      }));

      return Response.json({ success: true, consents: enriched });
    }

    // ── INVITE TO APP ──────────────────────────────────────────────
    if (actionType === 'invite_to_app') {
      const { invitee_email, role_for_invitee, relationship_id, message } = body;
      if (!invitee_email || !role_for_invitee) {
        return Response.json({ error: 'invitee_email and role_for_invitee are required' }, { status: 400 });
      }
      const normalizedEmail = invitee_email.trim().toLowerCase();

      if (role_for_invitee === 'facilitator') {
        if (relationship_id) {
          const inviterMembership = await base44.asServiceRole.entities.RelationshipMember.filter({
            relationship_id, user_email: user.email, status: 'active'
          });
          if (!inviterMembership.some(m => ['owner', 'admin'].includes(m.role))) {
            return Response.json({ error: 'Only relationship owners/admins can invite a facilitator' }, { status: 403 });
          }
        }

        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
        const inviteeUser = existingUsers[0];
        if (inviteeUser && (inviteeUser.role === 'facilitator' || inviteeUser.role === 'admin') && relationship_id) {
          const existing = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
            facilitator_email: normalizedEmail, relationship_id
          });
          if (existing.filter(r => ['pending_approval', 'active'].includes(r.status)).length > 0) {
            return Response.json({ error: 'A facilitator connection already exists or is pending' }, { status: 409 });
          }
          const relationship = await base44.asServiceRole.entities.Relationship.filter({ id: relationship_id });
          const relName = relationship[0]?.name || 'Unknown';
          const members = await base44.asServiceRole.entities.RelationshipMember.filter({ relationship_id, status: 'active' });
          const facRel = await base44.asServiceRole.entities.FacilitatorRelationship.create({
            facilitator_email: normalizedEmail, relationship_id, relationship_name: relName,
            initiated_by: user.email, initiated_by_type: 'relationship_member',
            status: 'pending_approval', all_approved: false
          });
          await Promise.all(members.map(m => base44.asServiceRole.entities.FacilitatorConsent.create({
            facilitator_relationship_id: facRel.id, facilitator_email: normalizedEmail,
            relationship_id, member_email: m.user_email,
            status: 'pending', hide_self_reflections: false, hidden_moment_ids: []
          })));

          // ── AUDIT: access_requested (direct invite path) ──────────────
          await logFacilitatorEvent(base44, {
            event_type: 'access_requested',
            facilitator_email: normalizedEmail,
            relationship_id,
            initiated_by: user.email,
            facilitator_relationship_id: facRel.id,
            previous_status: null,
            new_status: 'pending_approval'
          });

          return Response.json({ success: true, outcome: 'connected' });
        }

        const existingInvites = await base44.asServiceRole.entities.FacilitatorInvitation.filter({
          invitee_email: normalizedEmail, inviter_email: user.email, status: 'pending'
        });
        if (existingInvites.length > 0) {
          return Response.json({ error: 'An invitation has already been sent to this person' }, { status: 409 });
        }
        await base44.asServiceRole.entities.FacilitatorInvitation.create({
          inviter_email: user.email, invitee_email: normalizedEmail,
          role_for_invitee: 'facilitator', relationship_id: relationship_id || null,
          status: 'pending', message: message || null
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: normalizedEmail,
          subject: `${user.full_name || user.email} invited you to be a relationship facilitator on Together`,
          body: `Hi,\n\n${user.full_name || user.email} would like you to be a facilitator for their relationship on Together — a relationship wellness app.\n\nAs a facilitator you can view shared moments, track progress, and provide guidance.\n\nTo get started:\n1. Create your account on the Together app\n2. Apply to become a facilitator in the Facilitator Portal\n3. Once approved, you'll be automatically linked to their relationship space\n\n${message ? `Message from ${user.full_name || user.email}: "${message}"\n\n` : ''}You're receiving this because someone wants you as their relationship guide.`
        });
        return Response.json({ success: true, outcome: 'invited' });
      }

      if (role_for_invitee === 'member') {
        if (user.role !== 'facilitator' && user.role !== 'admin') {
          return Response.json({ error: 'Must be an approved facilitator to invite clients' }, { status: 403 });
        }
        const existingInvites = await base44.asServiceRole.entities.FacilitatorInvitation.filter({
          invitee_email: normalizedEmail, inviter_email: user.email, status: 'pending'
        });
        if (existingInvites.length > 0) {
          return Response.json({ error: 'An invitation has already been sent to this person' }, { status: 409 });
        }
        await base44.asServiceRole.entities.FacilitatorInvitation.create({
          inviter_email: user.email, invitee_email: normalizedEmail,
          role_for_invitee: 'member', relationship_id: relationship_id || null,
          status: 'pending', message: message || null
        });
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: normalizedEmail,
          subject: `${user.full_name || 'Your facilitator'} invited you to Together`,
          body: `Hi,\n\n${user.full_name || user.email} (your facilitator) has invited you to Together — an app for nurturing meaningful relationships.\n\nTogether helps you and your partner log moments of growth, gratitude, and connection. Your facilitator will be there to guide your journey once you join and approve their access.\n\nTo get started, create your account on the Together app and set up your relationship space. Your facilitator will then be able to connect with you.\n\n${message ? `Message from ${user.full_name || user.email}: "${message}"\n\n` : ''}Looking forward to supporting your relationship journey!`
        });
        return Response.json({ success: true, outcome: 'invited' });
      }

      return Response.json({ error: 'Invalid role_for_invitee' }, { status: 400 });
    }

    // ── CHECK & AUTO-LINK PENDING INVITATIONS ─────────────────────
    if (actionType === 'check_pending_invitations') {
      if (user.role !== 'facilitator' && user.role !== 'admin') {
        return Response.json({ success: true, processed: 0 });
      }
      const pendingInvites = await base44.asServiceRole.entities.FacilitatorInvitation.filter({
        invitee_email: user.email.toLowerCase(),
        role_for_invitee: 'facilitator',
        status: 'pending'
      });

      let processed = 0;
      for (const invite of pendingInvites) {
        if (!invite.relationship_id) continue;
        const existing = await base44.asServiceRole.entities.FacilitatorRelationship.filter({
          facilitator_email: user.email.toLowerCase(), relationship_id: invite.relationship_id
        });
        if (!existing.filter(r => ['pending_approval', 'active'].includes(r.status)).length) {
          const relationship = await base44.asServiceRole.entities.Relationship.filter({ id: invite.relationship_id });
          const relName = relationship[0]?.name || 'Unknown';
          const members = await base44.asServiceRole.entities.RelationshipMember.filter({ relationship_id: invite.relationship_id, status: 'active' });
          const facRel = await base44.asServiceRole.entities.FacilitatorRelationship.create({
            facilitator_email: user.email.toLowerCase(), relationship_id: invite.relationship_id,
            relationship_name: relName, initiated_by: invite.inviter_email,
            initiated_by_type: 'relationship_member', status: 'pending_approval', all_approved: false
          });
          await Promise.all(members.map(m => base44.asServiceRole.entities.FacilitatorConsent.create({
            facilitator_relationship_id: facRel.id, facilitator_email: user.email.toLowerCase(),
            relationship_id: invite.relationship_id, member_email: m.user_email,
            status: 'pending', hide_self_reflections: false, hidden_moment_ids: []
          })));

          // ── AUDIT: access_requested (auto-link from pending invite) ───
          await logFacilitatorEvent(base44, {
            event_type: 'access_requested',
            facilitator_email: user.email.toLowerCase(),
            relationship_id: invite.relationship_id,
            initiated_by: invite.inviter_email,
            facilitator_relationship_id: facRel.id,
            previous_status: null,
            new_status: 'pending_approval'
          });
        }
        await base44.asServiceRole.entities.FacilitatorInvitation.update(invite.id, { status: 'accepted' });
        processed++;
      }
      return Response.json({ success: true, processed });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    // ── AUDIT: function failure ────────────────────────────────────
    await logFunctionAudit(base44, {
      function_name: 'manageFacilitatorAccess',
      trigger_type: 'user_action',
      triggered_by: user?.email || 'unknown',
      status: 'failed',
      error_message: error.message,
      metadata: { action: actionType },
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startMs
    });
    return Response.json({ error: error.message }, { status: 500 });
  }
});