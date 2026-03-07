/**
 * Centralized analytics tracking for Together app.
 * Wraps base44.analytics.track with consistent event names and properties.
 * All events follow: {noun}_{verb} naming convention.
 */
import { base44 } from '@/api/base44Client';

const track = (eventName, properties = {}) => {
  base44.analytics.track({ eventName, properties });
};

export const Analytics = {

  // ─── Moments ────────────────────────────────────────────────────
  momentLogged: (type, subtype, hasMedia = false) =>
    track('moment_logged', { moment_type: type, moment_subtype: subtype, has_media: hasMedia }),

  momentEdited: (type) =>
    track('moment_edited', { moment_type: type }),

  momentDeleted: (type) =>
    track('moment_deleted', { moment_type: type }),

  momentFavorited: (type, isFavoriting) =>
    track('moment_favorited', { moment_type: type, action: isFavoriting ? 'add' : 'remove' }),

  momentSaved: (isSaving) =>
    track('moment_bookmarked', { action: isSaving ? 'add' : 'remove' }),

  momentReviewed: (momentType) =>
    track('moment_reviewed', { moment_type: momentType }),

  momentSharedWithPartner: () =>
    track('moment_shared_with_partner'),

  // ─── Comments ───────────────────────────────────────────────────
  commentPosted: (momentType) =>
    track('comment_posted', { moment_type: momentType }),

  commentThreadOpened: (momentType) =>
    track('comment_thread_opened', { moment_type: momentType }),

  // ─── Navigation / Page Views ────────────────────────────────────
  pageViewed: (pageName) =>
    track('page_viewed', { page: pageName }),

  // ─── Onboarding / Engagement ────────────────────────────────────
  newMomentButtonTapped: () =>
    track('new_moment_button_tapped'),

  momentTypeSelected: (type) =>
    track('moment_type_selected', { moment_type: type }),

  filterChanged: (filterType, value) =>
    track('feed_filter_changed', { filter_type: filterType, value }),

  // ─── Support / Help ─────────────────────────────────────────────
  bugReportSubmitted: (type) =>
    track('bug_report_submitted', { report_type: type }),

  appTourStarted: () =>
    track('app_tour_started'),

  appTourCompleted: () =>
    track('app_tour_completed'),

  // ─── Settings & Subscription ────────────────────────────────────
  upgradeButtonTapped: (source) =>
    track('upgrade_button_tapped', { source }),

  subscriptionCancelled: () =>
    track('subscription_cancelled'),
};