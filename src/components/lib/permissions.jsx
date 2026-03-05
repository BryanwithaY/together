/**
 * Relationship permission helpers.
 * member  = RelationshipMember record for the current user
 * relationship = the Relationship record
 */

export function getMemberRole(member) {
  return member?.role ?? 'member';
}

export function isOwner(member) {
  return getMemberRole(member) === 'owner';
}

export function isAdmin(member) {
  const r = getMemberRole(member);
  return r === 'owner' || r === 'admin';
}

export function canInvite(member) {
  const r = getMemberRole(member);
  return r === 'owner' || r === 'admin' || (r === 'member' && member?.can_invite === true);
}

export function canPost(member) {
  const r = getMemberRole(member);
  return r === 'owner' || r === 'admin' || r === 'member';
}

export function canComment(member) {
  return canPost(member);
}

export function canRemoveMembers(member) {
  return isAdmin(member);
}

export function canDeleteRelationship(member) {
  return isOwner(member);
}

export function canTransferOwnership(member) {
  return isOwner(member);
}

export function canChangeSettings(member) {
  return isAdmin(member);
}

export function canToggleExport(member) {
  return isOwner(member);
}

/**
 * Can this viewer email see a given moment?
 */
export function canViewMoment(moment, viewerEmail) {
  if (!moment) return false;
  const email = viewerEmail?.toLowerCase();
  const author = moment.created_by?.toLowerCase();
  if (email === author) return true;

  if (moment.visibility === 'private' || moment.is_private) {
    return !!moment.shared_with_partner;
  }
  if (moment.visibility === 'tagged_only') {
    const tagged = (moment.tagged_users || []).map(e => e.toLowerCase());
    return tagged.includes(email);
  }
  return true;
}

export function canEditMoment(moment, viewerEmail) {
  if (!moment) return false;
  if (moment.has_comments) return false;
  return moment.created_by?.toLowerCase() === viewerEmail?.toLowerCase();
}

export function canEditTags(moment, viewerEmail) {
  if (!moment) return false;
  if (moment.visibility === 'private' || moment.is_private) return false;
  return canEditMoment(moment, viewerEmail);
}

export function isTaggingRequired(memberCount) {
  return memberCount > 2;
}

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  read_only: 'Read Only',
};