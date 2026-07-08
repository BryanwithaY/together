// Sensible lifecycle defaults derived from relationship type / trust level.
// Additive-only helpers — never mutate stored data, just compute fallbacks
// for relationships created before these fields existed.

const PERMANENT_TYPES = ['co_parents', 'family', 'parent_adult_child'];
const TEMPORARY_TYPES = ['business_partners', 'cofounders', 'other'];

export function getDefaultTrustLevel(type) {
  if (PERMANENT_TYPES.includes(type)) return 'permanent_record';
  if (TEMPORARY_TYPES.includes(type)) return 'temporary';
  return 'shared_memory';
}

export function getDefaultLifecyclePolicy(trustLevel) {
  if (trustLevel === 'permanent_record') return 'archive_only';
  if (trustLevel === 'temporary') return 'destroy_solo_only';
  return 'destroy_with_consent';
}

export const TRUST_LEVEL_LABELS = {
  temporary: 'Temporary',
  shared_memory: 'Shared Memory',
  permanent_record: 'Permanent Record',
};

export const TRUST_LEVEL_DESCRIPTIONS = {
  temporary: 'A short-lived space (e.g. travel, a project, an event). Deletion is allowed while it stays solo.',
  shared_memory: 'An ongoing personal relationship (friends, partners, family). Archiving is preferred; destruction requires consent.',
  permanent_record: 'A high-stakes, durable record (marriage, co-parenting, family, medical, legal). Archive only — never destroyed unilaterally.',
};

export const LIFECYCLE_POLICY_LABELS = {
  archive_only: 'Archive Only',
  destroy_with_consent: 'Destroy — Requires Unanimous Consent',
  destroy_solo_only: 'Destroy — Solo Spaces Only',
  never_destroy: 'Never Destroy',
};

export const DATA_PREFERENCE_LABELS = {
  delete_on_leave: 'Delete my contributions if I leave',
  retain_on_leave: 'My contributions may remain after I leave',
  require_approval: 'Require my approval before any deletion',
  ask_later: 'Ask me later',
};