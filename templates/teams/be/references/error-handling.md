---
title: Error Handling & Resilience
description: Patterns for domain error hierarchies, HTTP status mapping, and building resilient backend services.
whenToRead: When implementing error handling, retry logic, or resilience patterns
tags: [be, error-handling, resilience, reliability]
---

# Error Handling & Resilience

## Domain Error Hierarchy

Create typed errors that map to HTTP status codes in one place:
```typescript
abstract class DomainError extends Error {
  abstract statusCode: number;
  abstract code: string;
}

class NotFoundError extends DomainError {
  statusCode = 404;
  code = 'NOT_FOUND';
}

class ConflictError extends DomainError {
  statusCode = 409;
  code = 'CONFLICT';
}

class ValidationError extends DomainError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  constructor(public details: Array<{ field: string; message: string }>) {
    super('Validation failed');
  }
}
```

Map in error handler middleware, not in every controller:
```typescript
app.use((err, req, res, next) => {
  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  // Unknown error = 500, log full stack
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});
```

## External Service Resilience

**Timeouts:**
- Connect timeout: 3 seconds (can't establish connection = service is down)
- Read timeout: 10 seconds (waiting for response)
- Total timeout: 15 seconds max

**Retries with exponential backoff + jitter:**
```
Attempt 1: immediate
Attempt 2: 1s + random(0-500ms)
Attempt 3: 2s + random(0-500ms)
Attempt 4: 4s + random(0-500ms)
Max: 3 retries
```
Only retry on 5xx and network errors. Never retry 4xx (client error).

**Circuit breaker:**
- **Closed** (normal): requests pass through. Track failure rate.
- **Open** (failing): requests fail immediately without calling the service. Timer starts.
- **Half-open** (testing): allow one request through. If it succeeds → close. If it fails → open again.
- Trigger: 5 consecutive failures or >50% failure rate in 10-second window.

**Graceful degradation:**
- Non-critical service down (recommendations, analytics) → main flow continues, skip the feature
- Critical service down (auth, payment) → fail with clear error, retry mechanism
- Return cached data when possible for degraded responses

## Health Checks

```
GET /health/live   → { status: "ok" }     // Process alive (K8s liveness probe)
GET /health/ready  → { status: "ok",      // Can serve traffic (K8s readiness)
                       checks: {
                         database: "ok",
                         cache: "ok",
                         queue: "ok"
                       }}
```
- Liveness: never check dependencies (prevents cascade restarts)
- Readiness: check all critical dependencies

## Graceful Shutdown

On SIGTERM:
1. Stop accepting new requests (remove from load balancer)
2. Finish in-flight requests (30 second timeout)
3. Close database connections
4. Close queue connections
5. Exit process

```typescript
process.on('SIGTERM', async () => {
  server.close(); // Stop accepting
  await Promise.race([
    finishInFlightRequests(),
    new Promise(resolve => setTimeout(resolve, 30000)), // 30s max
  ]);
  await db.disconnect();
  process.exit(0);
});
```
