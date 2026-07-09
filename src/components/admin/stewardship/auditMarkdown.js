export const auditMarkdown = `
## Internal Consistency

The package is consistent around one central idea: Together is a steward of shared history.

The doctrine, matrix, and gap analysis all support the same principles:

Private content belongs to the author.

Shared content belongs to the relationship context.

Archive is preferred.

Deletion is rare.

Consent is required for shared destruction.

Leaving is not deleting.

## Product Fit

The philosophy should mostly remain invisible.

The user interface should show short reassurances only when needed.

The Shared History page should exist for users who want to understand the policy, not interrupt normal use.

## Engineering Fit

The package correctly reflects the current Base44 limitations.

Because backend functions are unavailable on the current plan, the app should rely on denormalized readable fields and avoid advanced destructive workflows until backend verification is possible.

## Risks

The biggest unresolved risks are:

1. Self update on RelationshipMember may be too broad.
2. Coach scoping is unresolved.
3. Archive read only behavior may not be enforced everywhere.
4. New writes must consistently include membership and visibility fields.
5. Legal policy pages must eventually match product behavior.

## Recommendation

Do not add more lifecycle actions until stabilization is complete.

Next build should be:

1. App wide mobile safe select standard.
2. Archive read only enforcement.
3. Canonical ownership field audit for all writes.
4. Coach scoping decision.
`;