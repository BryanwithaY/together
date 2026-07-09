export const matrixMarkdown = `
### Relationship

**Purpose:** The relationship space itself.

**Owner:** The relationship container is administered by the creator or owner, but shared history belongs to the relationship.

**Visible to:** Active members, facilitators with approved access, and admins.

**Editable by:** Owner or admin.

**Deletable by:** Creator only if no one else ever joined and no shared history exists. Multi member spaces require future consent workflow.

**Export behavior:** Relationship level export should be governed by the space policy and member permissions.

**Retention behavior:** Retained unless solo deletion is permitted or future unanimous destruction workflow completes.

**Counts toward shared history:** Yes when more than one member joins or shared content exists.

**Archive behavior:** Can be archived. Archive is read only and reversible.

**Leave behavior:** A member can eventually leave without deleting the relationship.

**Destroy behavior:** Solo only today. Future destruction requires consent.

**Open questions:** Whether trust level and lifecycle policy should become editable, and by whom.

---

### RelationshipMember

**Purpose:** Membership record connecting a user to a relationship.

**Owner:** The member owns their own membership preference fields. The relationship governs role and access.

**Visible to:** Relationship members should see active member summaries.

**Editable by:** Member may edit personal fields such as data preference. Owner or admin may edit role or status.

**Deletable by:** Should not be hard deleted except by admin. Status changes should be used instead.

**Export behavior:** Included in account export as membership history.

**Retention behavior:** Retained for audit and shared history protection.

**Counts toward shared history:** Yes if another member became active.

**Archive behavior:** Membership remains attached to archived spaces.

**Leave behavior:** Status should become left in future phase.

**Destroy behavior:** Preserved until relationship destruction rules are satisfied.

**Open questions:** Need stronger protection so users cannot update their own role, status, or can invite fields directly.

---

### Moment

**Purpose:** Relationship memory, reflection, gratitude, conflict note, or other meaningful entry.

**Owner:** Author owns their contribution. Shared visible moments become part of relationship history.

**Visible to:** Based on relationship membership and moment visibility.

**Editable by:** Author, or possibly relationship admins for moderation in future.

**Deletable by:** Author in future personal deletion workflow, subject to shared history rules.

**Export behavior:** Author can export authored moments. Relationship export depends on space policy.

**Retention behavior:** Retained when a member leaves unless personal data request workflow applies.

**Counts toward shared history:** Yes if visible to the relationship or authored by more than one participant in a space.

**Archive behavior:** Remains readable in archived spaces.

**Leave behavior:** Authored content remains unless future personal data workflow says otherwise.

**Destroy behavior:** Removed only if whole relationship destruction is valid.

**Open questions:** Need explicit canonical fields for owner id, member arrays, visibility, private status, and shared history impact on every write.

---

### ScheduledConnection

**Purpose:** Planned relationship event, check in, date, conversation, or shared activity.

**Owner:** Creator owns the event record. Invited participants have relationship interest in the event.

**Visible to:** Relationship members, invited attendees, or creator only depending visibility type.

**Editable by:** Creator today. Future rules may allow invitee responses.

**Deletable by:** Creator today, but deletion should preserve attendance history carefully.

**Export behavior:** Calendar export includes relevant attendee emails.

**Retention behavior:** Retained as part of relationship history when shared or attended.

**Counts toward shared history:** Yes if another participant is invited, attends, or responds.

**Archive behavior:** Remains visible but should not allow new action if space archived.

**Leave behavior:** Past schedule history remains.

**Destroy behavior:** Removed only through valid relationship destruction.

**Open questions:** Recurring events and attendance notes need canonical ownership rules.

---

### Attendance and Post Event Notes

**Purpose:** Individual response and reflection after a scheduled connection.

**Owner:** The responding user owns their own status and note.

**Visible to:** Attendance counts may be aggregate. Notes should remain private unless explicitly shared.

**Editable by:** Author only.

**Deletable by:** Author through future personal data request.

**Export behavior:** Included in the author's personal export.

**Retention behavior:** Retained privately unless the author requests deletion.

**Counts toward shared history:** Attendance status may count. Private note should not count unless shared.

**Archive behavior:** Remains readable to the author.

**Leave behavior:** Author retains private note access if account level policy allows.

**Destroy behavior:** Removed only if whole relationship destruction is valid or personal deletion applies.

**Open questions:** Server side per key enforcement is preferred later.

---

### CoachConversation

**Purpose:** Coaching conversation with AI relationship coach.

**Owner:** Current implementation appears user scoped. Future implementation should decide whether conversations are personal, relationship scoped, or both.

**Visible to:** Author only unless explicitly shared.

**Editable by:** Author.

**Deletable by:** Author through personal data controls.

**Export behavior:** Included in author's export.

**Retention behavior:** Retained as personal data unless deleted by author.

**Counts toward shared history:** Not today. Could count only if explicitly relationship scoped or shared.

**Archive behavior:** If personal, remains available to author. If relationship scoped in future, read only under archived relationship.

**Leave behavior:** Personal coach history stays with user.

**Destroy behavior:** Should not be destroyed by relationship deletion unless explicitly relationship scoped and consented.

**Open questions:** This is the largest unresolved ownership question.

---

### FacilitatorRelationship

**Purpose:** Link between facilitator and relationship.

**Owner:** Relationship members grant access. Facilitator receives limited access.

**Visible to:** Relationship members and facilitator according to access status.

**Editable by:** Relationship owners or members depending consent workflow.

**Deletable by:** Should be revoked, not hard deleted.

**Export behavior:** Included in relationship audit or admin export.

**Retention behavior:** Retained as access history.

**Counts toward shared history:** Not by itself, but facilitator access affects privacy.

**Archive behavior:** Archived relationships should disable new facilitator actions.

**Leave behavior:** If a member leaves, facilitator consent should be recalculated.

**Destroy behavior:** Removed only when relationship destruction is valid.

**Open questions:** Needs lifecycle audit integration.

---

### FacilitatorConsent

**Purpose:** Member level consent for facilitator access.

**Owner:** Each member owns their consent.

**Visible to:** Member, facilitator in aggregate where appropriate, and admins.

**Editable by:** The consenting member.

**Deletable by:** Should be revoked rather than hard deleted.

**Export behavior:** Included in member privacy export.

**Retention behavior:** Retained for audit.

**Counts toward shared history:** No.

**Archive behavior:** Access should become read only or inactive.

**Leave behavior:** Leaving should revoke future access to that member's data.

**Destroy behavior:** Removed only through valid destruction or privacy workflows.

**Open questions:** Consent revocation history should be audit logged.

---

### FacilitatorNote

**Purpose:** Facilitator private observations or working notes.

**Owner:** Facilitator.

**Visible to:** Facilitator only unless explicitly shared.

**Editable by:** Facilitator.

**Deletable by:** Facilitator subject to professional or legal obligations.

**Export behavior:** Depends on facilitator role and policy.

**Retention behavior:** Retained separately from relationship member data.

**Counts toward shared history:** No unless shared into relationship.

**Archive behavior:** Retained but no new notes should be added if access inactive.

**Leave behavior:** Member leaving does not automatically delete facilitator notes.

**Destroy behavior:** Needs separate policy.

**Open questions:** Important legal and professional boundary.

---

### PartnerInvitation

**Purpose:** Invite flow for partner connection.

**Owner:** Inviter and recipient both have interest.

**Visible to:** Inviter, invitee, admins.

**Editable by:** System and invitee response.

**Deletable by:** Expired or revoked invitations can be removed.

**Export behavior:** Included as account activity.

**Retention behavior:** Short term unless accepted.

**Counts toward shared history:** No until accepted.

**Archive behavior:** Archived spaces should not allow new invitations.

**Leave behavior:** Not applicable.

**Destroy behavior:** Pending invites can be discarded when solo space is deleted.

**Open questions:** Should eventually unify with RelationshipMember pending status.

---

### UserSubscription

**Purpose:** Billing and plan access.

**Owner:** Account holder.

**Visible to:** Account holder and admins.

**Editable by:** Billing flows only.

**Deletable by:** Not user deleted directly.

**Export behavior:** Included in account export.

**Retention behavior:** Retained for financial records.

**Counts toward shared history:** No.

**Archive behavior:** Not applicable.

**Leave behavior:** Not applicable.

**Destroy behavior:** Not tied to relationship destruction.

**Open questions:** None for stewardship.

---

### AppEvent and Audit Logs

**Purpose:** Observability, safety, and administrative history.

**Owner:** System.

**Visible to:** Admins.

**Editable by:** System only.

**Deletable by:** Admin retention policy.

**Export behavior:** Possibly included in admin export, not ordinary user export unless legally required.

**Retention behavior:** Retained for safety and reconciliation.

**Counts toward shared history:** No.

**Archive behavior:** Unchanged.

**Leave behavior:** Unchanged.

**Destroy behavior:** May be retained even after destruction for safety.

**Open questions:** Need lifecycle specific audit log.
`;