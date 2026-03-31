---
title: Quality Gates
description: Definition of done checklists and feature completeness criteria for validating subtask and release readiness.
whenToRead: When reviewing whether a subtask or feature meets completion criteria before sign-off.
tags: [lead, quality, definition-of-done, checklist]
---

# Quality Gates

## Definition of Done (per subtask)

A subtask is "done" when:
- [ ] Code compiles and passes all linters
- [ ] Unit tests pass (new tests written for new code)
- [ ] Integration tests pass (if applicable)
- [ ] Code reviewed by the appropriate team agent
- [ ] Acceptance criteria from BA specs are met
- [ ] No known bugs introduced
- [ ] Documentation updated (if public API changed)

## Feature Completeness Checklist

Before declaring a feature "ready for release":

### Functional
- [ ] All acceptance criteria verified (happy path + edge cases)
- [ ] Error handling covers: validation, auth, not-found, network failure, timeout
- [ ] Cross-browser/device testing (if frontend)
- [ ] Accessibility compliance (if frontend)

### Non-functional
- [ ] Performance meets targets (page load < 2s, API < 200ms p95)
- [ ] No N+1 queries or unbounded data fetching
- [ ] Rate limiting configured on new endpoints
- [ ] Caching strategy defined for read-heavy operations

### Observability
- [ ] Structured logging for key operations
- [ ] Metrics/traces instrumented
- [ ] Alerts configured for new failure modes
- [ ] Dashboard updated (if new service or significant change)

### Security
- [ ] Input validation on all new endpoints
- [ ] Auth/authz enforced
- [ ] No sensitive data in logs, URLs, or client-side storage
- [ ] Secrets managed via secret manager

### Deployment
- [ ] Database migration tested (up and down)
- [ ] Feature flag configured (if gradual rollout needed)
- [ ] Rollback plan documented
- [ ] Monitoring ready for post-deploy verification

## Release Readiness Review

Lead agent performs this review before approving release:

1. **All subtasks complete** — every agent reports "done"
2. **No open blockers** — all issues resolved or explicitly deferred with justification
3. **Test coverage adequate** — QA agent confirms acceptance criteria are covered by automated tests
4. **Cross-team alignment verified** — FE+BE contracts match, no integration gaps
5. **Deployment plan ready** — DevOps confirms pipeline, rollback plan, monitoring

## Post-Release Verification

After deployment to production:
1. **Smoke test** — verify core flows work (automated or manual)
2. **Monitor for 30 minutes** — error rate, latency, resource utilization
3. **Verify feature flags** — if gradual rollout, check metrics per cohort
4. **Rollback if**: error rate > 1% increase, p99 latency > 2x baseline, data integrity issue
