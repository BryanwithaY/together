import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Admin-only: returns a comprehensive product health snapshot.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const day14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const day28 = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch everything in parallel
    const [
      allUsers,
      allMoments,
      allRelationships,
      allMembers,
      bugReports,
      deletedUsers,
      allEvents,
      allComments,
      allFacilitatorRels,
      allFacilitatorApps,
    ] = await Promise.all([
      base44.asServiceRole.entities.User.list(undefined, 500),
      base44.asServiceRole.entities.Moment.list('-created_date', 500),
      base44.asServiceRole.entities.Relationship.list(undefined, 200),
      base44.asServiceRole.entities.RelationshipMember.list(undefined, 500),
      base44.asServiceRole.entities.BugReport.list('-created_date', 100),
      base44.asServiceRole.entities.DeletedUser.list('-deleted_at', 100),
      base44.asServiceRole.entities.AppEvent.list('-occurred_at', 500),
      base44.asServiceRole.entities.Comment.list(undefined, 500),
      base44.asServiceRole.entities.FacilitatorRelationship.list(undefined, 200),
      base44.asServiceRole.entities.FacilitatorApplication.list('-created_date', 100),
    ]);

    // ── User stats ──────────────────────────────────────────────────────────
    // Active = users who triggered any AppEvent in the period
    const usersActive7d  = new Set(allEvents.filter(e => e.occurred_at >= day7).map(e => e.user_email).filter(Boolean));
    const usersActive30d = new Set(allEvents.filter(e => e.occurred_at >= day30).map(e => e.user_email).filter(Boolean));
    const newUsers7d  = allUsers.filter(u => u.created_date >= day7).length;
    const newUsers30d = allUsers.filter(u => u.created_date >= day30).length;

    // ── Moment stats ─────────────────────────────────────────────────────────
    const moments7d  = allMoments.filter(m => m.created_date >= day7);
    const moments30d = allMoments.filter(m => m.created_date >= day30);

    // Feature usage breakdown (all time + 30d)
    const buildFeatureUsage = (moments) => moments.reduce((acc, m) => {
      const key = m.type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      if (m.type === 'ego_aside' && m.subtype) {
        const subkey = `ego_aside:${m.subtype}`;
        acc[subkey] = (acc[subkey] || 0) + 1;
      }
      if (m.is_favorite) acc['favorited'] = (acc['favorited'] || 0) + 1;
      if (m.is_saved)    acc['saved']     = (acc['saved']     || 0) + 1;
      if (m.media_url)   acc['photos_videos'] = (acc['photos_videos'] || 0) + 1;
      return acc;
    }, {});

    const featureUsage    = buildFeatureUsage(allMoments);
    const featureUsage30d = buildFeatureUsage(moments30d);

    // ── Engagement ───────────────────────────────────────────────────────────
    const commentCount       = allComments.length;
    const comments7d         = allComments.filter(c => c.created_date >= day7).length;
    const comments30d        = allComments.filter(c => c.created_date >= day30).length;
    const momentsWithComments = allMoments.filter(m => m.has_comments).length;
    const momentsShared      = allMoments.filter(m => m.shared_with_partner).length;
    const momentsReviewed    = allMoments.filter(m => m.reviewed_by || (m.reviews && m.reviews.length > 0)).length;

    // ── Relationship stats ────────────────────────────────────────────────────
    // IMPORTANT: define activeRels before using it
    const activeRels = allRelationships.filter(r => !r.is_deleted && !r.is_archived);
    const multiMemberRels = allMembers.reduce((acc, mb) => {
      if (mb.status === 'active') acc[mb.relationship_id] = (acc[mb.relationship_id] || 0) + 1;
      return acc;
    }, {});
    const connectedPairs = Object.values(multiMemberRels).filter(n => n >= 2).length;

    const userRelationshipCount = allMembers
      .filter(m => m.status === 'active')
      .reduce((acc, m) => {
        acc[m.user_email] = (acc[m.user_email] || 0) + 1;
        return acc;
      }, {});
    const usersWithMultipleRels = Object.values(userRelationshipCount).filter(n => n > 1).length;
    const avgRelsPerUser = allUsers.length > 0
      ? (Object.values(userRelationshipCount).reduce((a, b) => a + b, 0) / allUsers.length).toFixed(2)
      : 0;

    // ── Profiles & invites ────────────────────────────────────────────────────
    const usersWithProfilePics   = allUsers.filter(u => u.photo_url).length;
    const relsWithPhotos         = activeRels.filter(r => r.photo_url).length;
    const invitesSentToJoinApp   = allEvents.filter(e => e.event_type === 'member_invited').length;
    const joinsFromInvites       = allEvents.filter(e => e.event_type === 'member_joined').length;

    // ── Bug reports ───────────────────────────────────────────────────────────
    const openBugs   = bugReports.filter(b => b.status === 'open').length;
    const bugs7d     = bugReports.filter(b => b.created_date >= day7).length;
    const bugsByType = bugReports.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});

    // ── Churn (derived from AppEvent data, no last_active_at dependency) ─────
    const deleted7d  = deletedUsers.filter(u => u.deleted_at >= day7).length;
    const deleted30d = deletedUsers.filter(u => u.deleted_at >= day30).length;

    // Wave 6: pre-index moments by creator email once — avoids O(users×moments) scan below
    const momentCountByCreator = allMoments.reduce((acc, m) => {
      if (m.created_by) acc[m.created_by] = (acc[m.created_by] || 0) + 1;
      return acc;
    }, {});

    // Last event per user from AppEvent log
    const lastEventByUser = allEvents.reduce((acc, e) => {
      if (!e.user_email) return acc;
      if (!acc[e.user_email] || e.occurred_at > acc[e.user_email]) {
        acc[e.user_email] = e.occurred_at;
      }
      return acc;
    }, {});

    // Users who have logged at least one event ever but haven't been seen recently
    const userEmailsWithActivity = Object.keys(lastEventByUser);
    const churned = userEmailsWithActivity
      .filter(email => lastEventByUser[email] < day14)
      .map(email => {
        const u = allUsers.find(u => u.email === email);
        return {
          email,
          name: u?.full_name || null,
          last_active_at: lastEventByUser[email],
          total_moments: momentCountByCreator[email] || 0,  // Wave 6: O(1) lookup
        };
      });

    const atRisk = userEmailsWithActivity
      .filter(email => lastEventByUser[email] >= day28 && lastEventByUser[email] < day7)
      .map(email => {
        const u = allUsers.find(u => u.email === email);
        return {
          email,
          name: u?.full_name || null,
          last_active_at: lastEventByUser[email],
          total_moments: momentCountByCreator[email] || 0,  // Wave 6: O(1) lookup
        };
      });

    const recentlyDeleted = deletedUsers
      .filter(u => u.deleted_at >= day30)
      .map(u => ({
        email: u.user_email,
        name: u.user_name,
        deleted_at: u.deleted_at,
        days_as_user: u.days_since_signup,
        total_moments: u.total_moments_logged,
        had_partner: u.had_partner,
        reason: u.reason || null,
      }));

    // ── Facilitator stats ────────────────────────────────────────────────────
    const facilitatorStats = {
      total_applications: allFacilitatorApps.length,
      pending_applications: allFacilitatorApps.filter(a => a.status === 'pending').length,
      approved_applications: allFacilitatorApps.filter(a => a.status === 'approved').length,
      rejected_applications: allFacilitatorApps.filter(a => a.status === 'rejected').length,
      by_type: allFacilitatorApps.reduce((acc, a) => {
        acc[a.facilitator_type] = (acc[a.facilitator_type] || 0) + 1;
        return acc;
      }, {}),
      active_relationships: allFacilitatorRels.filter(r => r.status === 'active').length,
      pending_consent: allFacilitatorRels.filter(r => r.status === 'pending_approval').length,
      revoked: allFacilitatorRels.filter(r => r.status === 'revoked').length,
      new_applications_7d: allFacilitatorApps.filter(a => a.created_date >= day7).length,
    };

    // ── Event feed (last 50) ─────────────────────────────────────────────────
    const eventFeed = allEvents.slice(0, 50).map(e => ({
      event_type: e.event_type,
      user_email: e.user_email,
      relationship_id: e.relationship_id,
      moment_type: e.moment_type,
      occurred_at: e.occurred_at,
    }));

    return Response.json({
      success: true,
      generated_at: now.toISOString(),
      users: {
        total: allUsers.length,
        active_7d: usersActive7d.size,
        active_30d: usersActive30d.size,
        new_7d: newUsers7d,
        new_30d: newUsers30d,
        deleted_total: deletedUsers.length,
        deleted_7d: deleted7d,
        deleted_30d: deleted30d,
      },
      moments: {
        total: allMoments.length,
        last_7d: moments7d.length,
        last_30d: moments30d.length,
        feature_usage_all_time: featureUsage,
        feature_usage_30d: featureUsage30d,
      },
      relationships: {
        total_active: activeRels.length,
        connected_pairs: connectedPairs,
        solo_spaces: activeRels.length - connectedPairs,
        users_with_multiple: usersWithMultipleRels,
        avg_per_user: avgRelsPerUser,
      },
      engagement: {
        comments_total: commentCount,
        comments_7d: comments7d,
        comments_30d: comments30d,
        moments_with_comments: momentsWithComments,
        moments_shared: momentsShared,
        moments_reviewed: momentsReviewed,
        moments_favorited: allMoments.filter(m => m.is_favorite).length,
        moments_saved: allMoments.filter(m => m.is_saved).length,
        moments_with_media: allMoments.filter(m => m.media_url).length,
      },
      profiles: {
        users_with_profile_pics: usersWithProfilePics,
        relationships_with_photos: relsWithPhotos,
      },
      invites: {
        sent_to_app: invitesSentToJoinApp,
        joined_from_invites: joinsFromInvites,
      },
      bugs: {
        total: bugReports.length,
        open: openBugs,
        last_7d: bugs7d,
        by_type: bugsByType,
        recent: bugReports.slice(0, 10).map(b => ({
          id: b.id,
          title: b.title,
          type: b.type,
          status: b.status,
          priority: b.priority,
          reporter_email: b.reporter_email,
          created_date: b.created_date,
        })),
      },
      churn: {
        summary: {
          churned_count: churned.length,
          at_risk_count: atRisk.length,
          deleted_last_30_days: deleted30d,
          deleted_last_7_days: deleted7d,
        },
        churned,
        at_risk: atRisk,
        recently_deleted: recentlyDeleted,
      },
      event_feed: eventFeed,
      facilitators: facilitatorStats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});