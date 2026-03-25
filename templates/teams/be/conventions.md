## API Design

- RESTful URL structure: `/resources` (collection), `/resources/:id` (item), `/resources/:id/sub-resources` (nested).
- Use proper HTTP methods: `GET` (read), `POST` (create), `PUT` (full replace), `PATCH` (partial update), `DELETE` (remove).
- HTTP status codes must be semantically correct:
  - `200` — Success with body
  - `201` — Created (return the created resource + `Location` header)
  - `204` — Success with no body (DELETE, some PUTs)
  - `400` — Validation error (client sent bad data)
  - `401` — Unauthenticated (no/invalid token)
  - `403` — Unauthorized (valid token, insufficient permissions)
  - `404` — Resource not found
  - `409` — Conflict (duplicate, version mismatch)
  - `422` — Business logic rejection (valid data, but operation not allowed)
  - `429` — Rate limited (include `Retry-After` header)
  - `500` — Server error (never return this intentionally — it means you have a bug)
- Response envelope for collections: `{ data: T[], meta: { total, page, perPage, hasMore } }`.
- Error response format: `{ error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }`. The `code` is machine-readable, `message` is human-readable.
- Pagination: cursor-based for large/real-time datasets (encode cursor as opaque base64 string). Offset-based only for small static datasets.
- Filtering via query params: `?status=active&created_after=2024-01-01`. Complex filters use a filter query language or POST to a search endpoint.
- Sorting: `?sort=created_at:desc,name:asc`. Default sort must be deterministic (include `id` as tiebreaker).
- Versioning: URL prefix (`/v1/`) for breaking changes. Adding optional fields is not a breaking change.

## Database

- Every table has: `id` (UUID v7 or ULID — sortable, no sequential guessing), `created_at`, `updated_at` timestamps.
- Soft deletes: add `deleted_at` column. Never hard-delete unless legally required (GDPR erasure). All queries must filter `WHERE deleted_at IS NULL`.
- Indexes: create indexes for every column used in `WHERE`, `JOIN`, or `ORDER BY`. Composite indexes follow the left-prefix rule — put high-cardinality columns first.
- Query complexity: a single API request should execute ≤5 queries. If you need more, you're either missing a JOIN or need to denormalize.
- Use database transactions for any operation that modifies multiple tables. Scope transactions as narrowly as possible — don't hold locks during HTTP calls.
- Connection pooling: configure pool size based on `(number_of_cores * 2) + effective_spindle_count`. Typical: 10-20 per service instance. Never use unlimited.
- Migrations must be backward compatible during deployment. Sequence: add new column → deploy code that writes to both → backfill → deploy code that reads from new → drop old column.
- Use read replicas for reporting/analytics queries. Write to primary only. Account for replication lag in application code.

## Authentication & Authorization

- JWT tokens for API authentication. Short-lived access tokens (15-30 min) + long-lived refresh tokens (7-30 days stored in httpOnly secure cookie).
- Never store plain-text passwords. Use bcrypt with cost factor ≥12 or Argon2id.
- Implement RBAC (Role-Based Access Control) at minimum. Use middleware to check permissions before the controller method executes.
- IDOR prevention: always scope resource queries by the authenticated user's ID/org. Never trust resource IDs from the URL without checking ownership.
  ```
  // BAD: anyone can access any order
  SELECT * FROM orders WHERE id = :orderId
  // GOOD: scoped to user
  SELECT * FROM orders WHERE id = :orderId AND user_id = :currentUserId
  ```
- Rate limiting tiers: anonymous (60/min), authenticated (300/min), premium (1000/min). Stricter for sensitive endpoints (login: 5/min, password reset: 3/hour).
- API keys for service-to-service auth. Rotate keys quarterly. Never use API keys for user-facing authentication.

## Error Handling & Resilience

- Create a domain error hierarchy. Map domain errors to HTTP status codes in one place (error handler middleware), not in every controller.
  ```typescript
  class NotFoundError extends DomainError { statusCode = 404; }
  class ConflictError extends DomainError { statusCode = 409; }
  class ValidationError extends DomainError { statusCode = 400; }
  ```
- External service calls: set timeouts (connect: 3s, read: 10s). Implement retries with exponential backoff + jitter (1s, 2s, 4s + random). Use circuit breaker after 5 consecutive failures.
- Graceful degradation: if a non-critical service (recommendations, analytics) is down, the main functionality should still work. Return cached data or skip the feature.
- Implement health check endpoints:
  - `/health/live` — process is running (for Kubernetes liveness probe)
  - `/health/ready` — can serve traffic (DB connected, cache available, for readiness probe)
- Graceful shutdown: on SIGTERM, stop accepting new requests, finish in-flight requests (30s timeout), close connections, then exit.

## Observability

- Structured JSON logging. Every log entry must include: `timestamp`, `level`, `message`, `request_id`, `service`, `environment`. Optional: `user_id`, `duration_ms`, `error.stack`.
- Log levels:
  - `ERROR` — something broke, requires investigation. Pages on-call if in production.
  - `WARN` — something unexpected but handled. Rate limit hit, cache miss, slow query.
  - `INFO` — significant business events: user registered, order placed, payment processed.
  - `DEBUG` — development only. Never deploy with DEBUG enabled in production.
- Distributed tracing: propagate trace context (`traceparent` header) across all service-to-service calls. Every outgoing HTTP/gRPC/queue message carries the trace ID.
- Metrics to expose: request rate, error rate, latency percentiles (p50, p95, p99), active connections, queue depth, cache hit rate. Use Prometheus format.
- Alert on symptoms (error rate >1%, p99 latency >2s) not causes. Avoid alert fatigue — every alert must be actionable.

## Caching

- Cache strategy decision tree:
  - Data changes rarely + stale data acceptable → **Cache-aside** (check cache → miss → query DB → write cache)
  - Data changes often + stale data unacceptable → **Write-through** (write DB + cache simultaneously)
  - Expensive computation + immutable inputs → **Memoization** with TTL
- Cache key format: `{service}:{entity}:{id}:{version}` — e.g., `user-service:profile:123:v2`.
- Always set TTL. Infinite TTL = memory leak. Typical: config data (1h), user profiles (15m), search results (5m).
- Cache stampede prevention: use probabilistic early expiration or lock-based recomputation. Never let 1000 requests simultaneously recompute the same expired key.
- Invalidation: prefer event-driven invalidation (on write, publish cache-invalidation event) over TTL-only. TTL is the safety net, not the primary strategy.

## Async Processing

- Message/job queue for: email sending, PDF generation, webhook delivery, data exports, image processing — anything that takes >500ms or can fail independently.
- Jobs must be idempotent. If a job runs twice with the same input, the result must be the same (use idempotency keys).
- Dead letter queue (DLQ) for failed messages. Monitor DLQ size. Alert if DLQ grows >100 messages.
- Job processing order: FIFO by default. Priority queues for time-sensitive operations.
- Implement job progress tracking for long-running operations. Expose status via API endpoint (`GET /jobs/:id/status`).

## Testing

- Unit tests: test service layer business logic in isolation. Mock repositories and external services.
- Integration tests: test API endpoints with a real database (use test containers or in-memory DB). These are your most valuable tests.
- Contract tests: if consuming/providing APIs between services, use Pact or similar to verify contracts don't break.
- Load tests: run before every release that touches data path. Baseline: the system must handle 2x current peak traffic.
- Test database state: each test creates its own data, cleans up after. No shared test data. No test ordering dependencies. Use database transactions that roll back after each test.
