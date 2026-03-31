---
name: User Story Quality Rubric
description: Self-validation checklist for BA agent user story output
format: checklist
tags: [ba, quality]
---

# Output Contract: User Story

Before delivering a user story, validate against this rubric:

## Structure (all required)
- [ ] Follows "As a [role], I want [goal], so that [benefit]" format
- [ ] Has a unique story ID
- [ ] Includes priority (P0/P1/P2/P3)
- [ ] Includes estimated complexity (S/M/L/XL)

## Acceptance Criteria (all required)
- [ ] At least 2 acceptance criteria per story
- [ ] Each AC uses Given/When/Then format
- [ ] Covers the happy path
- [ ] Covers at least one error/edge case
- [ ] No implementation details in AC (behavior only)

## Completeness
- [ ] Dependencies on other stories are listed
- [ ] Out-of-scope items are explicitly noted
- [ ] Non-functional requirements are included if applicable (performance, security)

## Quality Signals
- [ ] Story is independently testable
- [ ] Story delivers user-visible value
- [ ] AC are specific enough that two developers would implement the same behavior
