import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Wave 5: Read-only validation function that compares email-based vs id-based
 * linkage for target entities and reports mismatches only.
 *
 * Admin-only. Makes NO writes.
 *
 * Payload:
 * {
 *   entities?: string[],   // subset to validate, default = all target entities
 *   sample_size?: number,  // max records to check per entity (default 200)
 * }
 *
 * Returns:
 * {
 *   summary: { entity, total_checked, matched, mismatched, missing_user_id, unresolvable_email }[],
 *   mismatches: { entity, record_id, user_email, user_id, stored_user_id, mismatch_type }[],
 * }
 */

const TARGET_ENTITIES = [
  'RelationshipMember',
  'FacilitatorRelationship',
  'FacilitatorConsent',
  'UserSubscription',
  'Referral',
];

const FIELD_MAP = {
  RelationshipMember:     [{ emailField: 'user_email',         idField: 'user_id' }],
  FacilitatorRelationship:[{ emailField: 'facilitator_email',  idField: 'user_id' }],
  FacilitatorConsent:     [{ emailField: 'member_email',       idField: 'user_id' }],
  UserSubscription:       [{ emailField: 'user_email',         idField: 'user_id' }],
  Referral:               [
    { emailField: 'referred_email',  idField: 'referred_user_id' },
    { emailField: 'referrer_email',  idField: 'referrer_user_id' },
  ],
};

Deno.serve(async (req) => {
  const startMs = Date.now();
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const sampleSize = Math.min(parseInt(body.sample_size) || 200, 500);
  const requestedEntities = Array.isArray(body.entities) ? body.entities : TARGET_ENTITIES;
  const entitiesToCheck = requestedEntities.filter(e => TARGET_ENTITIES.includes(e));

  // Build email→id lookup from canonical User entity
  const allUsers = await base44.asServiceRole.entities.User.list(undefined, 2000);
  const emailToId = {};
  for (const u of allUsers) {
    if (u.email) emailToId[u.email.toLowerCase()] = u.id;
  }

  const summary = [];
  const mismatches = [];

  for (const entityName of entitiesToCheck) {
    const fieldPairs = FIELD_MAP[entityName];
    if (!fieldPairs) continue;

    let allRecords;
    try {
      allRecords = await base44.asServiceRole.entities[entityName].list(undefined, sampleSize);
    } catch (e) {
      summary.push({ entity: entityName, error: e.message });
      continue;
    }

    for (const { emailField, idField } of fieldPairs) {
      let matched = 0;
      let mismatchCount = 0;
      let missingUserId = 0;
      let unresolvableEmail = 0;

      for (const record of allRecords) {
        const email = record[emailField]?.toLowerCase();
        const storedId = record[idField];

        if (!email) {
          // No email to check against — skip silently
          continue;
        }

        const canonicalId = emailToId[email];

        if (!canonicalId) {
          // Email cannot be resolved to any known user
          unresolvableEmail++;
          continue;
        }

        if (!storedId) {
          // Has email but no id stored yet — needs backfill, not a mismatch
          missingUserId++;
          continue;
        }

        if (storedId === canonicalId) {
          matched++;
        } else {
          // Stored id does not match what email resolves to — this is a real mismatch
          mismatchCount++;
          mismatches.push({
            entity: entityName,
            record_id: record.id,
            email_field: emailField,
            id_field: idField,
            user_email: email,   // already lowercased — no full PII exposure
            stored_user_id: storedId,
            canonical_user_id: canonicalId,
            mismatch_type: 'id_email_divergence',
          });
        }
      }

      summary.push({
        entity: entityName,
        email_field: emailField,
        id_field: idField,
        total_checked: allRecords.length,
        matched,
        mismatched: mismatchCount,
        missing_user_id: missingUserId,
        unresolvable_email: unresolvableEmail,
        backfill_needed: missingUserId,
      });
    }
  }

  return Response.json({
    success: true,
    read_only: true,
    sample_size: sampleSize,
    summary,
    mismatches,
    total_mismatches: mismatches.length,
    duration_ms: Date.now() - startMs,
  });
});