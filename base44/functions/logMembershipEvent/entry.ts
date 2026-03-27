import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Receives entity automation payloads from RelationshipMember create/update/delete events.
 * Writes a RelationshipMemberEvent audit record.
 * Business logic: NONE. This function only writes to the audit log.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    if (!event || !data) {
      return Response.json({ error: 'Invalid automation payload' }, { status: 400 });
    }

    const eventType = event.type; // 'create', 'update', 'delete'

    // Determine which membership event type this represents
    let memberEventType = null;
    let previousRole = null;
    let newRole = data.role || null;
    let previousStatus = null;
    let newStatus = data.status || null;

    if (eventType === 'create') {
      memberEventType = (data.status === 'pending') ? 'invite_sent' : 'member_added';
    } else if (eventType === 'update' && old_data) {
      if (old_data.role !== data.role) {
        memberEventType = 'role_changed';
        previousRole = old_data.role;
        newRole = data.role;
      } else if (old_data.status !== data.status) {
        memberEventType = (data.status === 'removed') ? 'member_removed' : 'status_changed';
        previousStatus = old_data.status;
        newStatus = data.status;
      } else {
        // No auditable change in this update
        return Response.json({ success: true, skipped: true });
      }
    } else if (eventType === 'delete') {
      memberEventType = 'member_removed';
      if (old_data) {
        previousRole = old_data.role;
        previousStatus = old_data.status;
        newRole = null;
        newStatus = 'removed';
      }
    }

    if (!memberEventType) {
      return Response.json({ success: true, skipped: true });
    }

    await base44.asServiceRole.entities.RelationshipMemberEvent.create({
      relationship_id: data.relationship_id,
      affected_email: data.user_email,
      event_type: memberEventType,
      previous_role: previousRole,
      new_role: newRole,
      previous_status: previousStatus,
      new_status: newStatus,
      initiated_by: data.invited_by || data.created_by || 'unknown',
      occurred_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[logMembershipEvent] failed:', error.message);
    // Return 200 even on error — automation should not retry on audit failures
    return Response.json({ success: false, error: error.message });
  }
});