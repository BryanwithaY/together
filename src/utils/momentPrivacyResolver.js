/**
 * Wave 2 — Canonical moment privacy resolver (frontend).
 *
 * Single source of truth for resolving a moment's effective visibility
 * from potentially contradictory field values.
 *
 * Precedence (matches server-side logic in filterMomentsForFacilitator.js):
 *   1. is_private === true                        → 'private'
 *   2. type === 'self_reflection' AND
 *      shared_with_partner !== true               → 'private'
 *   3. visibility field value                     → use as-is
 *   4. fallback                                   → 'relationship'
 *
 * Usage:
 *   import { resolveVisibility, isVisibleTo } from '@/utils/momentPrivacyResolver';
 *   const visibility = resolveVisibility(moment);
 *   const canSee = isVisibleTo(moment, currentUserEmail);
 */

/**
 * Returns the canonical effective visibility string for a moment.
 * @param {object} moment
 * @returns {'private' | 'relationship' | 'tagged_only'}
 */
export function resolveVisibility(moment) {
  if (!moment) return 'private';

  // is_private is the highest-precedence flag
  if (moment.is_private === true) return 'private';

  // Self-reflections are private unless explicitly shared
  if (moment.type === 'self_reflection' && moment.shared_with_partner !== true) {
    return 'private';
  }

  // Fall through to the visibility enum field
  return moment.visibility || 'relationship';
}

/**
 * Returns true if a given user is permitted to see the moment.
 * Does not account for facilitator consent — use server-side filter for that.
 *
 * @param {object} moment
 * @param {string} currentUserEmail  — the viewing user's email
 * @param {string} momentAuthorEmail — the moment's created_by email
 * @returns {boolean}
 */
export function isVisibleTo(moment, currentUserEmail, momentAuthorEmail) {
  const effective = resolveVisibility(moment);

  // Author always sees their own moment
  if (currentUserEmail && momentAuthorEmail &&
      currentUserEmail.toLowerCase() === momentAuthorEmail.toLowerCase()) {
    return true;
  }

  if (effective === 'private') return false;

  if (effective === 'tagged_only') {
    const tagged = moment.tagged_users || [];
    return tagged.some(e => e?.toLowerCase() === currentUserEmail?.toLowerCase());
  }

  // 'relationship' — visible to all relationship members
  return true;
}