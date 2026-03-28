/**
 * updateAttendance — trusted write path for attendance and post-event notes.
 *
 * Enforces:
 *  1. Caller must be authenticated.
 *  2. Caller must be eligible: event creator OR explicitly listed in attendee_emails
 *     (for visibility_type='invited'). Visibility-only users are rejected.
 *  3. Only the caller's own key in attendance_by_user / post_event_notes_by_user is
 *     written. Cross-user key writes are impossible from this path.
 *  4. Rejected attempts are logged to FunctionAuditLog (safe metadata only, no content).
 *
 * Payload:
 *  { connection_id: string, field: 'attendance' | 'note', value: string | null }
 *
 * field='attendance' → value must be 'attended' | 'did_not_attend' | null (null clears)
 * field='note'       → value is the note text string, null or '' clears the key
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function isEligible(connection, callerEmail) {
  if (!callerEmail) return false;
  if (connection.created_by === callerEmail) return true;
  if (
    connection.visibility_type === 'invited' &&
    Array.isArray(connection.attendee_emails) &&
    connection.attendee_emails.includes(callerEmail)
  ) return true;
  return false;
}

async function logRejection(base44, { connection_id, caller_email, field, reason }) {
  try {
    await base44.asServiceRole.entities.FunctionAuditLog.create({
      function_name: 'updateAttendance',
      trigger_type: 'user_action',
      triggered_by: caller_email || 'unknown',
      status: 'failed',
      error_message: reason,
      records_affected: 0,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        connection_id,
        attempted_field: field,
        denial_reason: reason,
      },
    });
  } catch {
    // Audit log failure must never break the main response
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // 1. Authenticate
  const user = await base44.auth.me();
  if (!user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const callerEmail = user.email.toLowerCase();

  // 2. Parse payload
  let payload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { connection_id, field, value } = payload;

  if (!connection_id || !field) {
    return Response.json({ error: 'Missing required fields: connection_id, field' }, { status: 400 });
  }

  if (!['attendance', 'note'].includes(field)) {
    return Response.json({ error: 'field must be attendance or note' }, { status: 400 });
  }

  if (field === 'attendance' && value !== null && !['attended', 'did_not_attend'].includes(value)) {
    return Response.json({ error: 'Invalid attendance value' }, { status: 400 });
  }

  // 3. Fetch connection server-side — never trust client snapshot
  let connections;
  try {
    connections = await base44.asServiceRole.entities.ScheduledConnection.filter({ id: connection_id });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch connection' }, { status: 500 });
  }

  const connection = connections?.[0];
  if (!connection) {
    return Response.json({ error: 'Connection not found' }, { status: 404 });
  }

  // 4. Enforce eligibility
  if (!isEligible(connection, callerEmail)) {
    await logRejection(base44, {
      connection_id,
      caller_email: callerEmail,
      field,
      reason: 'caller_not_eligible',
    });
    return Response.json({ error: 'You are not eligible to respond to this event' }, { status: 403 });
  }

  // 5. Build safe single-key patch — only the caller's key is touched
  let patch;
  if (field === 'attendance') {
    const existing = connection.attendance_by_user || {};
    const updated = { ...existing };
    if (value === null || value === '') {
      delete updated[callerEmail];
    } else {
      updated[callerEmail] = value;
    }
    patch = { attendance_by_user: updated };
  } else {
    // field === 'note'
    const existing = connection.post_event_notes_by_user || {};
    const updated = { ...existing };
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) {
      delete updated[callerEmail];
    } else {
      updated[callerEmail] = trimmed;
    }
    patch = { post_event_notes_by_user: updated };
  }

  // 6. Write with service role — isolated to this connection's record
  try {
    await base44.asServiceRole.entities.ScheduledConnection.update(connection_id, patch);
  } catch (err) {
    return Response.json({ error: 'Write failed' }, { status: 500 });
  }

  return Response.json({ ok: true });
});