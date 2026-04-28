import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Logs a structured domain event to the AppEvent entity.
 * Also updates the User's last_active_at and relevant counters.
 *
 * Expected payload:
 * {
 *   event_type: string,           // required
 *   relationship_id?: string,
 *   moment_type?: string,
 *   moment_subtype?: string,
 *   metadata?: object,            // no PII, no content
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_type, relationship_id, moment_type, moment_subtype, metadata } = await req.json();

    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Allowlist — prevents arbitrary event_types from being written
    const ALLOWED_EVENT_TYPES = [
      'moment_created', 'moment_edited', 'moment_deleted', 'moment_reviewed',
      'comment_posted', 'moment_favorited', 'moment_bookmarked', 'moment_shared',
      'partner_invite_sent', 'member_invited', 'member_joined',
      'page_viewed', 'app_tour_started', 'app_tour_completed',
      'connection_scheduled', 'connection_deleted',
      'upgrade_button_tapped', 'subscription_upgraded', 'subscription_cancelled',
    ];
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      // Silently succeed for unknown event types — don't break callers, just don't store
      return Response.json({ success: true, skipped: true });
    }

    // Strip any PII/content that may have accidentally been included in metadata
    const safeMetadata = {};
    if (metadata && typeof metadata === 'object') {
      const ALLOWED_META_KEYS = ['moment_type', 'moment_subtype', 'has_media', 'action',
        'source', 'plan', 'price', 'previous_plan', 'relationship_type', 'referral_completed',
        'referred_by', 'days_as_user', 'total_moments', 'had_partner'];
      for (const key of ALLOWED_META_KEYS) {
        if (metadata[key] !== undefined) safeMetadata[key] = metadata[key];
      }
    }

    const now = new Date().toISOString();

    // Determine which user counter to increment
    const userUpdate = { last_active_at: now };
    if (event_type === 'moment_created') {
      userUpdate.total_moments_logged = (user.total_moments_logged || 0) + 1;
    } else if (event_type === 'comment_posted') {
      userUpdate.total_comments_posted = (user.total_comments_posted || 0) + 1;
    } else if (event_type === 'moment_reviewed') {
      userUpdate.total_moments_reviewed = (user.total_moments_reviewed || 0) + 1;
    }

    // Log the event + update user in parallel
    await Promise.all([
      base44.asServiceRole.entities.AppEvent.create({
        user_email: user.email,
        user_id: user.id,
        event_type,
        relationship_id: relationship_id || null,
        moment_type: moment_type || null,
        moment_subtype: moment_subtype || null,
        metadata: safeMetadata,
        occurred_at: now,
      }),
      base44.auth.updateMe(userUpdate),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});