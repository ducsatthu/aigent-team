---
title: Backend Testing
description: Test level guidelines covering unit, integration, and end-to-end testing strategies for backend services.
whenToRead: When writing or reviewing backend tests at any level of the test pyramid
tags: [be, testing, unit-tests, integration-tests]
---

# Backend Testing

## Test Levels

**Unit tests** (service layer business logic):
- Test in isolation. Mock repositories and external services.
- Focus on business rules, edge cases, error paths.
- Fast: < 5ms per test.

**Integration tests** (API endpoints — most valuable):
- Test real HTTP request → response with a real database.
- Use testcontainers or Docker Compose for database.
- Each test creates its own data, cleans up after.
- Cover: happy path, validation errors, auth failures, not-found, concurrent access.

**Contract tests** (service boundaries):
- Use Pact for consumer-driven contracts between services.
- Each service tests its own contracts independently.
- Runs in CI — breaks the build if contract violated.

**Load tests** (performance):
- Run before every release touching data path.
- Baseline: system must handle 2x current peak traffic.
- Use k6 or Artillery with realistic data patterns.

## Database Test Isolation

**Option 1: Transaction rollback** (fastest)
```typescript
beforeEach(async () => {
  await db.beginTransaction();
});
afterEach(async () => {
  await db.rollback();
});
```

**Option 2: Truncate tables** (simpler)
```typescript
afterEach(async () => {
  await db.query('TRUNCATE users, orders, payments CASCADE');
});
```

**Option 3: Unique identifiers** (for parallel tests)
```typescript
const testId = crypto.randomUUID();
const user = await createUser({ email: `${testId}@test.com` });
```

Rules:
- Same database engine as production (not SQLite when prod is Postgres)
- Each test creates what it needs — no shared seed data
- Tests must pass in any order, in parallel

## Test Structure

```typescript
describe('POST /api/orders', () => {
  it('should create order and return 201', async () => {
    const user = await createTestUser();
    const product = await createTestProduct({ price: 2999 });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ productId: product.id, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.data.total).toBe(5998);
    expect(response.body.data.status).toBe('pending');
  });

  it('should return 400 when quantity is zero', async () => {
    const user = await createTestUser();
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ productId: 'prod_1', quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ productId: 'prod_1', quantity: 1 });

    expect(response.status).toBe(401);
  });
});
```

## What to Test

- **Always**: Happy path, validation errors, auth/authz, not-found, edge cases (empty, max, unicode)
- **Important**: Concurrent access (two users modify same resource), race conditions
- **For data mutations**: Verify database state changed correctly (not just API response)
- **For async operations**: Verify job was enqueued with correct payload
