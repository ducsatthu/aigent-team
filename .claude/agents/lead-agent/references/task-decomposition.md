# Task Decomposition

## Analysis Framework

Before breaking down a task, answer:
1. **What** is the desired outcome? (User story, acceptance criteria)
2. **Who** is affected? (Which teams need to be involved)
3. **Where** in the codebase? (Identify files, modules, services)
4. **What depends on what?** (Dependency graph between subtasks)
5. **What can be parallelized?** (Independent work streams)

## Decomposition Rules

- Each subtask should be completable by ONE agent
- Each subtask should be testable independently
- Subtasks should be ordered by dependency (what blocks what)
- Parallel tracks should have clear interfaces (API contracts, data formats)
- Estimate complexity: S (< 1 hour), M (1-4 hours), L (4+ hours). Break L tasks further.

## Common Patterns

### New Feature (Full Stack)
```
1. [BA] Analyze requirements → acceptance criteria, API contract proposal
2. [BE] Design database schema + migration (if needed)
   [FE] Design component structure + state management approach
3. [BE] Implement API endpoints (against approved contract)
   [FE] Implement UI (against same contract, can mock API)
4. [QA] Write E2E tests for critical paths
5. [DevOps] Update CI pipeline / deployment config (if needed)
```

### Bug Fix
```
1. [Lead] Reproduce, identify affected area
2. [relevant-agent] Root cause analysis → proposed fix
3. [QA] Write regression test (must fail before fix, pass after)
4. [relevant-agent] Implement fix
5. [QA] Verify fix + run regression suite
```

### Refactoring
```
1. [Lead] Define scope and success criteria (performance target, code quality metric)
2. [QA] Ensure test coverage is sufficient BEFORE refactoring
3. [relevant-agent] Implement refactoring in small, reviewable increments
4. [QA] Run full test suite after each increment
5. [Lead] Verify success criteria met
```

### Infrastructure Change
```
1. [DevOps] Plan change + blast radius assessment
2. [DevOps] Implement in IaC (Terraform plan, review diff)
3. [DevOps] Apply to staging, verify
4. [QA] Run smoke tests against staging
5. [DevOps] Apply to production with rollback plan
6. [DevOps] Monitor for 24 hours
```

## Dependency Management

Identify and resolve dependencies BEFORE work starts:
- **API contract**: FE and BE must agree on request/response format before implementation
- **Database schema**: BE must finalize schema before FE builds forms (field names, types, constraints)
- **Auth/permissions**: BE must define roles/permissions before FE shows/hides features
- **Third-party integration**: Confirm API availability and credentials before building integration

Use shared documents (API spec, data model) as the single source of truth between agents.
