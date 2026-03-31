---
title: Requirements Analysis
description: Structured framework for breaking down business requirements into scope, assumptions, and dependencies.
whenToRead: When analyzing a new feature request or breaking down business requirements
tags: [ba, requirements, analysis, scoping]
---

# Requirements Analysis

## Analysis Framework

### Step 1: Understand the "Why"
- What business problem does this solve?
- Who are the users? What are their goals?
- What happens if we don't build this?
- How does this fit into the larger product roadmap?

### Step 2: Define the Scope
- **In scope**: Explicit list of what this feature includes
- **Out of scope**: Explicit list of what it does NOT include (prevents scope creep)
- **Assumptions**: What we're assuming to be true (validate with stakeholders)
- **Dependencies**: What must exist before this can be built

### Step 3: Identify Actors and Actions
Map every user role to their interactions:

| Actor | Action | Expected outcome |
|-------|--------|-----------------|
| Anonymous user | Views product page | Sees price, description, reviews, "Add to cart" |
| Logged-in user | Adds item to cart | Item appears in cart, quantity updated |
| Admin | Views all orders | Paginated list with filters and search |

### Step 4: Edge Cases Inventory

For every feature, systematically check:
- **Empty state**: What does the user see when there's no data?
- **Error state**: What happens when the operation fails? (Network error, validation, server error)
- **Boundary values**: Max length inputs, zero quantity, negative numbers, very long text
- **Concurrent access**: Two users editing the same record simultaneously
- **Permission boundaries**: What happens when an unauthorized user tries to access this?
- **Data integrity**: What if referenced data is deleted? (User deletes account while order is pending)
- **Performance**: What if there are 10,000 items? Will the UI still work?
- **Internationalization**: Special characters, RTL languages, different date formats
- **Accessibility**: Can this be used with keyboard only? Screen reader?

### Step 5: Priority Classification

| Priority | Definition | Example |
|----------|-----------|---------|
| P0 (Must have) | Feature doesn't work without this | Login form, payment processing |
| P1 (Should have) | Important but has workaround | Search filters, bulk actions |
| P2 (Nice to have) | Improves experience but not critical | Animations, shortcuts |
| P3 (Future) | Deferred to later release | Advanced analytics, AI features |

## Requirements Document Template

```markdown
# Feature: [Name]

## Overview
[1-2 sentences: what and why]

## Actors
- [Role 1]: [what they do]
- [Role 2]: [what they do]

## User Stories
1. As a [role], I want to [action], so that [benefit]
   - AC: Given... When... Then...
   - AC: Given... When... Then...

## Data Model Changes
- New table/field: [description]
- Modified: [what changes]

## API Changes
- [New/modified endpoints with schemas]

## UI Changes
- [Mockups or descriptions of new screens/components]

## Edge Cases
- [List of identified edge cases with expected behavior]

## Open Questions
- [Things that need stakeholder input]

## Out of Scope
- [Explicitly excluded items]
```
