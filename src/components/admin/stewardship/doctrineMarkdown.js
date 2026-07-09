export const doctrineMarkdown = `
## Purpose

Together exists to help people care for the relationships that matter most.

The app is not just a place to record moments, schedules, reflections, or conversations. It is a place where people build a shared record of effort, repair, gratitude, conflict, growth, and memory.

Because of that, Together treats relationship data differently than ordinary app data.

A relationship space is not just a folder. It may contain pieces of more than one person's life.

## Core Belief

Shared history deserves protection.

The cost of accidentally preserving memories is far lower than the cost of accidentally destroying them.

Together should always lean toward preservation, clarity, consent, and reversibility.

## Stewardship, Not Ownership

Together does not own a relationship's history.

One member does not automatically own everything inside a relationship space.

The creator of a space has responsibility for setup and administration, but they do not have unlimited authority over other people's contributions or shared memories.

Together acts as a steward.

That means the product is responsible for protecting the integrity of shared history while respecting each participant's agency over their own data.

## The Five Promises

### 1. Nothing important disappears silently

A person should never lose access to meaningful relationship history without clear explanation.

### 2. Private means private

Private reflections, private notes, and personal coach conversations must remain controlled by the person who created them.

### 3. Shared means protected

Once something has been intentionally shared into a relationship space, it should not be erasable by one person without appropriate consent.

### 4. Leaving is not deleting

Leaving a relationship changes access and membership. It does not automatically erase the shared history that already exists.

### 5. Archive before destroy

Archiving should be the default end state for meaningful relationship spaces. Permanent deletion should be rare, intentional, consent based, and difficult to trigger accidentally.

## Lifecycle Principles

A relationship space can be active, archived, left, or destroyed.

These are different actions.

Active means people can continue contributing.

Archived means the space is inactive and read only. Nothing is deleted.

Leaving means one member exits the relationship space. Their departure should not automatically erase shared history.

Destroying means the relationship container is permanently removed. This should only happen if no one else ever joined, or if all appropriate members explicitly agree.

## Privacy Principles

Every piece of user generated content must have a clear privacy model.

For every entity, Together must know:

1. Who created it.
2. Who can see it.
3. Who can change it.
4. Who can delete it.
5. Whether it is private, shared, or relationship visible.
6. Whether it counts as shared history.

No feature should create content without answering those questions.

## Shared History Principles

A relationship has shared history if more than one person has participated meaningfully.

Participation includes joining the space, creating visible moments, being invited to schedules, completing shared events, or otherwise contributing relationship context.

Once a relationship has shared history, it should never be treated as a solo space again.

Shared history is a one way threshold.

Once true, it remains true.

## Product Design Principle

The app should not overwhelm users with governance language.

The doctrine should shape the product, not dominate the interface.

Most users should feel protected without needing to understand the full policy model.

Use short, human explanations only when needed.

Example:

"Leaving this space does not automatically delete shared history."

That is better than a long policy explanation.

## Engineering Principle

Every new feature must declare its stewardship model before implementation.

For each new entity or workflow, answer:

1. Who owns this?
2. Who can see this?
3. Who can edit this?
4. Who can delete this?
5. What happens if someone leaves?
6. What happens if the space is archived?
7. What happens if deletion is requested?
8. Does this count as shared history?

If those answers are unclear, the feature is not ready to build.

## Decision Rule

When there is uncertainty, choose the option that best protects people from irreversible harm.

Preserve before delete.

Explain before surprise.

Consent before destruction.

Private by default.

Shared by intention.

Accessible with clarity.

Deleted only with rightful authority.
`;