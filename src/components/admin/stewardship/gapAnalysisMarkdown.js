export const gapAnalysisMarkdown = `
## Critical Findings

### 1. Backend functions are unavailable on current plan

**Current behavior:** Some trust sensitive operations are handled in client logic.

**Desired behavior:** Destructive and permission sensitive actions should be server verified.

**Risk:** A client side bug can expose or hide the wrong data.

**Suggested implementation:** Until backend functions are available, use denormalized fields on readable parent records and avoid destructive workflows beyond solo deletion.

**Complexity:** Medium.

**Dependencies:** Builder plan or equivalent backend support.

---

### 2. RelationshipMember role and status updates may be too broad

**Current behavior:** RelationshipMember update rules allow a user to update their own row.

**Desired behavior:** Users should only update personal preference fields. They should not update role, status, or can invite.

**Risk:** Privilege escalation or accidental membership corruption.

**Suggested implementation:** Avoid exposing any UI that writes role, status, or can invite using self update. Later move preference update into a safe backend function.

**Complexity:** Medium.

**Dependencies:** Backend functions preferred.

---

### 3. Coach ownership model is unresolved

**Current behavior:** Coach conversations appear user scoped, not relationship scoped.

**Desired behavior:** Decide whether coach is personal, relationship scoped, or hybrid.

**Risk:** Multi space users may see conversations from the wrong relationship context.

**Suggested implementation:** Add relationship id metadata to new coach conversations and filter by active relationship. Clearly mark coach history as private unless shared.

**Complexity:** Medium.

**Dependencies:** Agent conversation metadata support.

---

### 4. Moment visibility depends on denormalized fields and backfills

**Current behavior:** RLS requires membership fields on moments.

**Desired behavior:** Every new moment write must consistently include member user ids and member emails.

**Risk:** New moments may become invisible if fields are missed.

**Suggested implementation:** Centralize moment creation payload construction so all visibility and RLS fields are written every time.

**Complexity:** Medium.

**Dependencies:** Current MomentForm and any future moment creation flows.

## High Findings

### 5. Leave Relationship is not implemented

**Current behavior:** Members cannot leave a relationship.

**Desired behavior:** Members should be able to leave without deleting shared history.

**Risk:** Users may feel trapped or may ask for destructive deletion instead.

**Suggested implementation:** Add leave action in separate phase with strong validation.

**Complexity:** Medium.

**Dependencies:** Stable membership display and access revocation.

---

### 6. Archive read only enforcement is incomplete

**Current behavior:** Some settings are disabled when archived, but other creation flows may not check archive status.

**Desired behavior:** Archived spaces should be consistently read only.

**Risk:** Users may add moments or schedules to archived spaces.

**Suggested implementation:** Centralize \`isArchived\` checks in creation actions.

**Complexity:** Low.

**Dependencies:** None.

---

### 7. Personal data request workflow is missing

**Current behavior:** Users can state preference but cannot act on it.

**Desired behavior:** Users should eventually export, review, anonymize, or request deletion of their own contributions.

**Risk:** Preference without action may create expectation gap.

**Suggested implementation:** Add personal data request workflow later.

**Complexity:** High.

**Dependencies:** Entity level ownership matrix.

---

### 8. Lifecycle audit log is missing

**Current behavior:** Lifecycle changes are displayed as future feature.

**Desired behavior:** Archive, unarchive, leave, policy changes, deletion requests, and approvals should be logged.

**Risk:** Disputes cannot be reconstructed.

**Suggested implementation:** Add RelationshipLifecycleEvent entity.

**Complexity:** Medium.

**Dependencies:** Lifecycle actions.

## Medium Findings

### 9. Trust level and lifecycle policy are not yet editable

**Current behavior:** Defaults are assigned or computed.

**Desired behavior:** Owner may eventually propose policy changes.

**Risk:** Existing spaces may have inappropriate defaults.

**Suggested implementation:** Add proposal and consent workflow before allowing edits on shared spaces.

**Complexity:** Medium.

**Dependencies:** Approval workflow.

---

### 10. PartnerInvitation is separate from RelationshipMember

**Current behavior:** There are parallel invitation models.

**Desired behavior:** One invitation and membership model.

**Risk:** Drift and inconsistent lifecycle behavior.

**Suggested implementation:** Gradually migrate to RelationshipMember pending status.

**Complexity:** Medium.

**Dependencies:** Current invite flow audit.

---

### 11. Shared History page may expose too much language if overused

**Current behavior:** Page is informative but could feel heavy.

**Desired behavior:** Keep it available but not intrusive.

**Risk:** Users may feel overwhelmed.

**Suggested implementation:** Keep page in Settings, use small contextual education elsewhere.

**Complexity:** Low.

**Dependencies:** Product copy.

## Low Findings

### 12. Existing relationships use computed lifecycle defaults

**Current behavior:** Old spaces may not have stored trust level or lifecycle policy.

**Desired behavior:** Backfill stored values eventually.

**Risk:** Labels could change if default logic changes.

**Suggested implementation:** One time backfill after defaults are finalized.

**Complexity:** Low.

**Dependencies:** Stable policy mapping.

---

### 13. Placeholder member rows may lack role detail

**Current behavior:** Fallback member display may show generic member when RelationshipMember row is not readable.

**Desired behavior:** Backend member read function later.

**Risk:** Minor display inaccuracy.

**Suggested implementation:** Use backend function when available.

**Complexity:** Low to medium.

**Dependencies:** Backend support.
`;