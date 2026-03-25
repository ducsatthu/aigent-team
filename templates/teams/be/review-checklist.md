### API Contract
- [ ] URL is RESTful and consistent with existing endpoints
- [ ] HTTP status codes are semantically correct (not just 200 and 500)
- [ ] Request/response schemas are documented (OpenAPI/Swagger updated)
- [ ] Error responses include machine-readable `code` + human-readable `message`
- [ ] Pagination implemented for list endpoints (cursor-based for large datasets)
- [ ] No breaking changes to existing API contracts (or version bumped)

### Data Layer
- [ ] No N+1 queries — checked by enabling query logging during tests
- [ ] Queries use indexes — ran `EXPLAIN ANALYZE` on new/modified queries
- [ ] Transactions scope is correct — covers all related mutations, not too broad
- [ ] Migrations are backward compatible (old code works with new schema during deploy)
- [ ] Large table migrations done in phases (no table locks on tables >100K rows)
- [ ] Soft deletes used instead of hard deletes (unless GDPR erasure required)
- [ ] All new columns have appropriate defaults and constraints (NOT NULL where applicable)

### Security
- [ ] All input validated at API boundary (Zod/Pydantic schema, string length limits, enum checks)
- [ ] No SQL injection vectors — all queries use parameterized statements
- [ ] IDOR check — resource queries scoped by authenticated user's ID/org
- [ ] Auth/authz middleware applied — endpoint requires correct role/permission
- [ ] Rate limiting configured — per-user for authenticated, per-IP for public
- [ ] No PII in logs (emails, tokens, passwords, credit card numbers scrubbed)
- [ ] Secrets from secret manager — not hardcoded or in env files committed to git
- [ ] Mass assignment protection — only whitelisted fields accepted from request body

### Error Handling & Resilience
- [ ] All error paths return appropriate HTTP status codes (no `catch → res.json({ error })`)
- [ ] External service calls have timeouts configured (connect + read)
- [ ] Retries use exponential backoff with jitter — no fixed-interval retries
- [ ] Circuit breaker for non-critical dependencies — failure doesn't cascade
- [ ] Graceful degradation — if recommendation service is down, main flow still works
- [ ] Race conditions considered — concurrent requests to same resource handled (optimistic locking, idempotency keys)

### Observability
- [ ] Structured JSON logs with `request_id`, `user_id`, `duration_ms`
- [ ] Error logs include stack trace and context (not just error message)
- [ ] New metrics exposed for monitoring (request rate, error rate, latency)
- [ ] Distributed trace context propagated in outgoing requests
- [ ] Health check endpoints updated if new dependencies added

### Async Processing
- [ ] Queue jobs are idempotent — safe to retry on failure
- [ ] Dead letter queue configured for failed messages
- [ ] Long-running jobs expose progress/status endpoint
- [ ] Job payloads are minimal (IDs, not full objects) — fetch fresh data in the worker

### Testing
- [ ] Integration tests cover: happy path, validation errors, auth failures, not-found, concurrent access
- [ ] Edge cases tested: empty body, max-length fields, unicode, null vs missing fields
- [ ] Database state isolated per test — no shared data, no ordering dependency
- [ ] Mocks at correct boundary — mock external services, not internal modules
- [ ] Load test results reviewed if endpoint is on the hot path
