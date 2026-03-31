---
title: Mocking
description: Guidelines for mocking at system boundaries only, using MSW for HTTP mocks, and verifying mock-to-production contract fidelity.
whenToRead: When deciding what to mock, setting up MSW handlers, or reviewing tests that use mocks.
tags: [qa, mocking, msw, test-doubles]
---

# Mocking Reference

## Core Rule: Mock at System Boundaries Only

A mock replaces something your code *cannot control* during a test:

- **HTTP requests** to external services
- **System clock** (`Date.now`, timers)
- **Randomness** (`Math.random`, `crypto.randomUUID`)
- **File system** (only when testing I/O behaviour, not business logic)

Everything else — internal modules, utility functions, class methods — should
use the real implementation. If you feel the need to mock an internal module,
it is a design smell: extract an interface and inject the dependency.

### Why Not Mock Internals?

```typescript
// BAD — mocking internal module
vi.mock('../utils/calculateTax', () => ({
  calculateTax: vi.fn(() => 5.00),
}));

test('order total includes tax', () => {
  // This test proves nothing. You mocked the very thing
  // that computes the value you're asserting on.
  expect(getOrderTotal(items)).toBe(105.00);
});

// GOOD — test the real calculation
test('order total includes tax', () => {
  const items = [buildOrderItem({ unitPrice: 100, quantity: 1 })];
  // Real calculateTax runs; test verifies actual behaviour
  expect(getOrderTotal(items)).toBe(105.00);
});
```

---

## MSW (Mock Service Worker) Setup

MSW intercepts HTTP requests at the network level. Your application code
uses real `fetch` / `axios` — no patching required.

### Installation

```bash
npm install -D msw
```

### Handler Definition

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 'order-123', ...body, status: 'created' },
      { status: 201 },
    );
  }),

  http.get('/api/inventory/:sku', () => {
    return HttpResponse.json({ sku: 'WIDGET-1', stock: 42 });
  }),
];
```

### Server Setup (Node — Vitest / Jest)

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// tests/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Critical**: `onUnhandledRequest: 'error'` ensures no real HTTP requests
leak through. If a test makes an unmocked request, it fails loudly.

### Per-Test Override

```typescript
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

test('shows error when API returns 500', async () => {
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }),
  );

  render(<UserProfile userId="1" />);
  await expect(screen.findByText('Something went wrong')).resolves.toBeInTheDocument();
});
```

### Browser Setup (Playwright / Cypress)

For E2E tests, prefer Playwright's built-in route interception over MSW
browser worker:

```typescript
// Playwright route mock
await page.route('**/api/external-service/**', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' }),
  });
});
```

---

## Never Mock What You Don't Own (Without a Contract)

If you mock a third-party API, your mock can drift from reality. Protect
against this:

### Strategy 1: Record and Replay

Record real API responses once, replay in tests.

```typescript
// Record phase (run manually):
const response = await fetch('https://api.stripe.com/v1/charges');
fs.writeFileSync('tests/fixtures/stripe-charges.json', await response.text());

// Test phase:
server.use(
  http.get('https://api.stripe.com/v1/charges', () => {
    const data = JSON.parse(fs.readFileSync('tests/fixtures/stripe-charges.json', 'utf-8'));
    return HttpResponse.json(data);
  }),
);
```

Refresh recordings periodically (monthly or on API version bump).

### Strategy 2: Schema Validation

Validate your mock responses against the provider's OpenAPI spec:

```typescript
import Ajv from 'ajv';
import stripeSpec from './fixtures/stripe-openapi.json';

test('mock matches Stripe schema', () => {
  const ajv = new Ajv();
  const schema = stripeSpec.paths['/v1/charges'].get.responses['200'].content['application/json'].schema;
  const valid = ajv.validate(schema, mockChargesResponse);
  expect(valid).toBe(true);
});
```

### Strategy 3: Contract Tests

For services you own, use Pact (see `test-strategy.md` > Contract Testing).

---

## Verifying Mock Contracts Match Real APIs

Every mock handler should be traceable to a real API endpoint. Maintain a
mapping:

```typescript
// tests/mocks/contract-map.ts
/**
 * Maps mock handlers to real API documentation.
 * Review this file when upgrading API versions.
 *
 * Handler: GET /api/users/:id
 * Real endpoint: https://api.example.com/v2/users/{id}
 * Schema: docs/openapi/users.yaml#/paths/~1users~1{id}/get
 * Last verified: 2025-12-01
 */
```

### Detecting Drift

Add a CI job (weekly) that:

1. Fetches the latest OpenAPI spec from the provider.
2. Validates all mock response fixtures against the spec.
3. Fails if any fixture is invalid — forces update.

---

## Clock and Random Mocking

### Vitest Clock

```typescript
import { vi } from 'vitest';

test('token expires after 1 hour', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-06-15T10:00:00Z'));

  const token = createToken();
  expect(token.isExpired()).toBe(false);

  vi.advanceTimersByTime(60 * 60 * 1000); // 1 hour
  expect(token.isExpired()).toBe(true);

  vi.useRealTimers();
});
```

### Deterministic Random

```typescript
test('generates reproducible IDs', () => {
  const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.42);

  const id = generateShortId();
  expect(id).toBe('expected-id-based-on-0.42');

  mockRandom.mockRestore();
});
```

Always restore mocks after the test — use `afterEach(() => vi.restoreAllMocks())`
globally.
