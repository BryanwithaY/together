import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Wave 5: Backfill user_id onto existing entity records that have user_email but no user_id.
 *
 * Admin-only. Idempotent. Processes in controlled batches.
 * Logs each batch to FunctionAuditLog.
 *
 * Payload:
 * {
 *   batch_size?: number,   // default 50, max 200
 *   entities?: string[],   // subset to run, default = all target entities
 *   dry_run?: boolean,     // if true, reports what would be updated without writing
 * }
 */

const TARGET_ENTITIES = [
  'RelationshipMember',
  'FacilitatorRelationship',
  'FacilitatorConsent',
  'UserSubscription',
  'Referral',
];

// Maps entity name → array of { emailField, idField } pairs to backfill
const FIELD_MAP = {
  RelationshipMember:     [{ emailField: 'user_email',          idField: 'user_id' }],
  FacilitatorRelationship:[{ emailField: 'facilitator_email',   idField: 'user_id' }],
  FacilitatorConsent:     [{ emailField: 'member_email',        idField: 'user_id' }],
  UserSubscription:       [{ emailField: 'user_email',          idField: 'user_id' }],
  Referral:               [
    { emailField: 'referred_email',  idField: 'referred_user_id' },
    { emailField: 'referrer_email',  idField: 'referrer_user_id' },
  ],
};

Deno.serve(async (req) => {
  const startMs = Date.now();
  const startedAt = new Date().toISOString();
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(parseInt(body.batch_size) || 50, 200);
    const dryRun = body.dry_run === true;
    const requestedEntities = Array.isArray(body.entities) ? body.entities : TARGET_ENTITIES;
    const entitiesToRun = requestedEntities.filter(e => TARGET_ENTITIES.includes(e));

    if (entitiesToRun.length === 0) {
      return Response.json({ error: 'No valid target entities specified' }, { status: 400 });
    }

    // Build a user-email-to-id lookup cache to avoid redundant User fetches
    // We load all users once and cache them for the duration of this run
    console.log('[backfillUserIds] Loading user email→id cache...');
    const allUsers = await base44.asServiceRole.entities.User.list(undefined, 2000);
    const emailToId = {};
    for (const u of allUsers) {
      if (u.email) {
        emailToId[u.email.toLowerCase()] = u.id;
      }
    }
    console.log(`[backfillUserIds] Cached ${Object.keys(emailToId).length} users`);

    const results = [];

    for (const entityName of entitiesToRun) {
      const fieldPairs = FIELD_MAP[entityName];
      if (!fieldPairs) continue;

      for (const { emailField, idField } of fieldPairs) {
        const entityBatchStart = Date.now();
        let updated = 0;
        let skipped = 0;
        let unmatched = 0;

        // Fetch records missing the idField — process in a single batch per entity/field pair
        // We use list() since filter() doesn't support "field is null" queries
        // We limit to batchSize and process only the first batch (caller re-runs for more)
        let allRecords;
        try {
          allRecords = await base44.asServiceRole.entities[entityName].list(undefined, 1000);
        } catch (e) {
          console.error(`[backfillUserIds] Failed to list ${entityName}: ${e.message}`);
          results.push({ entity: entityName, email_field: emailField, id_field: idField, error: e.message });
          continue;
        }

        // Filter to records that need backfill
        const needsBackfill = allRecords.filter(r => !r[idField] && r[emailField]);
        const batch = needsBackfill.slice(0, batchSize);

        console.log(`[backfillUserIds] ${entityName}.${idField}: ${needsBackfill.length} need backfill, processing ${batch.length}`);

        for (const record of batch) {
          const email = record[emailField]?.toLowerCase();
          if (!email) { skipped++; continue; }

          const userId = emailToId[email];
          if (!userId) {
            unmatched++;
            continue;
          }

          if (!dryRun) {
            try {
              await base44.asServiceRole.entities[entityName].update(record.id, { [idField]: userId });
              updated++;
            } catch (updateErr) {
              console.error(`[backfillUserIds] Update failed for ${entityName} ${record.id}: ${updateErr.message}`);
              skipped++;
            }
          } else {
            updated++; // dry_run: count what would be updated
          }
        }

        const batchResult = {
          entity: entityName,
          email_field: emailField,
          id_field: idField,
          total_needing_backfill: needsBackfill.length,
          batch_processed: batch.length,
          updated,
          skipped,
          unmatched,
          has_more: needsBackfill.length > batchSize,
          dry_run: dryRun,
          duration_ms: Date.now() - entityBatchStart,
        };
        results.push(batchResult);

        // Log to FunctionAuditLog
        try {
          await base44.asServiceRole.entities.FunctionAuditLog.create({
            function_name: 'backfillUserIds',
            trigger_type: 'admin_manual',
            triggered_by: user.email,
            status: 'completed',
            records_affected: updated,
            duration_ms: batchResult.duration_ms,
            metadata: {
              entity: entityName,
              email_field: emailField,
              id_field: idField,
              batch_size: batch.length,
              updated,
              skipped,
              unmatched,
              has_more: batchResult.has_more,
              dry_run: dryRun,
            },
            started_at: startedAt,
            completed_at: new Date().toISOString(),
          });
        } catch (auditErr) {
          console.error(`[backfillUserIds] Audit log failed: ${auditErr.message}`);
        }
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      batch_size: batchSize,
      entities_processed: entitiesToRun.length,
      results,
      total_duration_ms: Date.now() - startMs,
    });

  } catch (error) {
    console.error(`[backfillUserIds] Fatal error: ${error.message}`);
    try {
      await base44.asServiceRole.entities.FunctionAuditLog.create({
        function_name: 'backfillUserIds',
        trigger_type: 'admin_manual',
        triggered_by: 'unknown',
        status: 'failed',
        error_message: error.message,
        duration_ms: Date.now() - startMs,
        metadata: {},
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });
    } catch (_) { /* ignore */ }
    return Response.json({ error: error.message }, { status: 500 });
  }
});