---
title: Test Strategy
description: Test pyramid enforcement ratios, time budgets per CI level, and mutation testing configuration guidance.
whenToRead: When planning a new test suite, reviewing pyramid balance, or setting up mutation testing.
tags: [qa, strategy, test-pyramid, mutation-testing]
---

# Test Strategy Reference

## Test Pyramid Enforcement

### Target Ratios (by test count)

| Level | Share | Max execution time | Typical tools |
|---|---|---|---|
| Unit | 70 % | < 10 s total suite | Vitest, Jest, Pytest |
| Integration | 20 % | < 2 min total suite | Testing Library, Supertest, MSW |
| E2E | 10 % | < 10 min smoke, < 30 min full | Playwright |

### Time Budgets

Every CI run has a wall-clock budget. If a level exceeds its budget,
optimise before adding more tests:

- **Unit**: 10 s. If exceeded, check for I/O leaks (unmocked network, file
  system) or heavy setup. Vitest's `--reporter=verbose --bail=1` helps triage.
- **Integration**: 2 min. Parallelise with `--pool=forks`. Ensure database
  truncation is batched, not per-test.
- **E2E smoke**: 10 min. Run only critical journeys. Full suite runs nightly.

### Pyramid Inversion Detection

Run a quarterly audit:

```bash
# Count tests per level (adjust globs to your project)
echo "Unit:        $(find . -name '*.test.ts' -not -path '*/e2e/*' | xargs grep -c 'it\|test(' | awk -F: '{s+=$2} END{print s}')"
echo "Integration: $(find . -path '*/__tests__/integration/*' -name '*.test.ts' | xargs grep -c 'it\|test(' | awk -F: '{s+=$2} END{print s}')"
echo "E2E:         $(find . -path '*/e2e/*' -name '*.spec.ts' | xargs grep -c 'it\|test(' | awk -F: '{s+=$2} END{print s}')"
```

If E2E > 15 % of total test count, investigate which E2E tests duplicate
integration-level coverage and demote them.

---

## Risk-Based Testing Prioritisation

Not all features carry equal risk. Allocate test effort proportionally:

### Risk Matrix

| Factor | Weight | Examples |
|---|---|---|
| Revenue impact | High | Checkout, payment, subscription |
| User frequency | High | Login, search, navigation |
| Data sensitivity | High | PII handling, auth, export |
| Change velocity | Medium | Features under active development |
| Complexity | Medium | State machines, concurrent workflows |
| Blast radius | Medium | Shared libraries, core APIs |

### Prioritisation Process

1. List all features/modules.
2. Score each on the factors above (1-3 scale).
3. Weighted total determines test investment tier:
   - **Tier 1** (score >= 12): Full coverage — unit, integration, E2E, contract,
     performance, security.
   - **Tier 2** (score 7-11): Unit + integration + smoke E2E.
   - **Tier 3** (score <= 6): Unit tests only; integration on critical paths.

---

## Contract Testing (Microservices)

When services communicate over HTTP/gRPC, use consumer-driven contract tests
to prevent integration breakage without running all services.

### Pact Workflow

```
Consumer writes contract (Pact test)
  → Publishes pact to Pact Broker
  → Provider verifies contract in its own CI
  → Broker records verification result
  → Consumer deploy gated on "can-i-deploy" check
```

### Consumer Side (TypeScript + Pact)

```typescript
import { PactV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'InventoryService',
});

describe('Inventory API contract', () => {
  it('returns stock for a product', async () => {
    await provider
      .given('product ABC exists with stock 42')
      .uponReceiving('a request for product stock')
      .withRequest({ method: 'GET', path: '/api/inventory/ABC' })
      .willRespondWith({
        status: 200,
        body: { productId: 'ABC', stock: 42 },
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/api/inventory/ABC`);
        const data = await res.json();
        expect(data.stock).toBe(42);
      });
  });
});
```

### Provider Side

```typescript
const { Verifier } = require('@pact-foundation/pact');

new Verifier({
  providerBaseUrl: 'http://localhost:3001',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  provider: 'InventoryService',
  providerStatesSetupUrl: 'http://localhost:3001/_pact/setup',
}).verifyProvider();
```

---

## Visual Regression Testing

Use Chromatic (Storybook) or Playwright screenshots for UI drift detection.

### Strategy

- **Component level** (Chromatic): Every Storybook story is a visual test.
  Run on every PR. Chromatic handles diffing and approval workflow.
- **Page level** (Playwright): Capture full-page screenshots for critical
  pages. Compare against baselines.

### Playwright Visual Comparison

```typescript
test('homepage visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

### Guidelines

- Always set a `maxDiffPixelRatio` or `maxDiffPixels` — pixel-perfect
  comparison is too brittle across environments.
- Run visual tests in a single browser/OS combination in CI for consistency.
- Use `toHaveScreenshot` with `fullPage: true` for layout regression.
- Hide dynamic content (timestamps, avatars) with CSS or masking.

---

## Mutation Testing

Code coverage tells you what code was *executed* by tests. Mutation testing
tells you what code is actually *verified* by assertions.

### How It Works

Stryker (JS/TS) or mutmut (Python) injects small changes ("mutants") into
your source code — flipping operators, removing calls, changing return values.
If your tests still pass, the mutant "survived" and your tests are weak.

### Setup (Stryker)

```json
// stryker.conf.json
{
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "testRunner": "vitest",
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

### Interpretation

| Metric | Target | Action if below |
|---|---|---|
| Mutation score | >= 70 % | Add assertions; tests execute code but don't verify it |
| Survived mutants | Review top 10 | Prioritise mutants in Tier 1 modules |

### When to Run

- **Not on every PR** — mutation testing is slow (minutes to hours).
- Run nightly or weekly on critical modules.
- Gate releases on mutation score for Tier 1 code.
