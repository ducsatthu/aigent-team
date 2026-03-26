# Backend Review Checklist

### API Contract
- [ ] URL is RESTful and consistent with existing endpoints
- [ ] HTTP status codes semantically correct (not just 200 and 500)
- [ ] Request/response schemas documented (OpenAPI/Swagger updated)
- [ ] Error responses include machine-readable `code` + human-readable `message`
- [ ] Pagination for list endpoints (cursor-based for large datasets)
- [ ] No breaking changes to existing API contracts

### Data Layer
- [ ] No N+1 queries — verified with query logging
- [ ] Queries use indexes — ran `EXPLAIN ANALYZE` on new queries
- [ ] Transactions scoped correctly (cover related mutations, not too broad)
- [ ] Migrations backward compatible (old code works with new schema during deploy)
- [ ] Large table migrations done in phases (no locks on tables > 100K rows)
- [ ] Soft deletes used (unless GDPR erasure required)

### Security
- [ ] All input validated at API boundary (schema validation, string length limits)
- [ ] No SQL injection vectors — parameterized queries only
- [ ] IDOR check — resource queries scoped by authenticated user
- [ ] Auth/authz middleware applied with correct role/permission
- [ ] Rate limiting configured
- [ ] No PII in logs
- [ ] Secrets from secret manager, not hardcoded

### Error Handling & Resilience
- [ ] All error paths return appropriate HTTP status codes
- [ ] External service calls have timeouts (connect + read)
- [ ] Retries use exponential backoff with jitter
- [ ] Circuit breaker for non-critical dependencies
- [ ] Race conditions considered (optimistic locking, idempotency keys)

### Observability
- [ ] Structured JSON logs with `request_id`, `user_id`, `duration_ms`
- [ ] Error logs include stack trace and context
- [ ] New metrics exposed if applicable
- [ ] Distributed trace context propagated

### Async Processing
- [ ] Queue jobs are idempotent
- [ ] Dead letter queue configured
- [ ] Job payloads minimal (IDs, not full objects)

### Testing
- [ ] Integration tests: happy path, validation, auth, not-found, concurrent
- [ ] Edge cases: empty body, max-length, unicode, null vs missing
- [ ] Database state isolated per test
- [ ] Mocks at correct boundary (external services, not internal modules)
