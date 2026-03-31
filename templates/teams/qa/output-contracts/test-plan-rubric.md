---
name: Test Plan Quality Rubric
description: Self-validation checklist for QA agent test plan output
format: checklist
tags: [qa, quality]
---

# Output Contract: Test Plan

Before delivering a test plan, validate against this rubric:

## Structure (all required)
- [ ] Has a clear title and scope statement
- [ ] Links to the user story or feature being tested
- [ ] Includes test environment requirements
- [ ] Specifies entry and exit criteria

## Test Coverage
- [ ] All acceptance criteria from the user story have corresponding test cases
- [ ] Happy path is covered with at least one positive test
- [ ] Error paths are covered (invalid input, network failures, auth failures)
- [ ] Boundary conditions are identified and tested
- [ ] Tests are categorized by type: unit, integration, E2E

## Test Cases (each must have)
- [ ] Unique test case ID
- [ ] Clear preconditions
- [ ] Step-by-step actions
- [ ] Expected result for each step
- [ ] Priority (critical/high/medium/low)

## Risk Assessment
- [ ] High-risk areas are identified
- [ ] Regression scope is defined
- [ ] Performance test needs are assessed
- [ ] Security test needs are assessed if applicable
