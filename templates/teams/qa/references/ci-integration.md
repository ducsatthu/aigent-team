---
title: CI Integration
description: Pipeline stage design, time budgets, test reporting, and failure response strategies for continuous integration.
whenToRead: When configuring CI pipeline test stages or troubleshooting test reporting and pipeline performance.
tags: [qa, ci, pipeline, reporting]
---

# CI Integration Reference

## Pipeline Stages

Design your CI pipeline with distinct test stages. Each stage has a purpose,
a time budget, and a failure response.

### Stage Design

```
PR opened / push to branch
  │
  ├─ Stage 1: Lint + Type Check (< 1 min)
  │    Fail fast on syntax and type errors.
  │
  ├─ Stage 2: Unit Tests (< 2 min)
  │    Run full unit suite in parallel.
  │    Gate: must pass to proceed.
  │
  ├─ Stage 3: Integration Tests (< 5 min)
  │    Run with test database (Docker).
  │    Gate: must pass to proceed.
  │
  ├─ Stage 4: E2E Smoke (< 10 min)
  │    Critical user journeys only.
  │    Gate: must pass to merge.
  │
  └─ Stage 5: Performance Smoke (< 2 min)
       k6 smoke test against ephemeral environment.
       Gate: warn on regression, block on threshold breach.

Nightly (schedule: '0 2 * * *')
  │
  ├─ Full E2E Suite (< 30 min)
  │    All E2E tests, all browsers.
  │
  ├─ Full Performance Suite (< 45 min)
  │    Load + stress scenarios.
  │
  └─ Security Scan (< 15 min)
       ZAP baseline scan.

Weekly
  │
  ├─ Soak Test (2-8 hours)
  │
  └─ Mutation Testing (varies)
       Stryker on Tier 1 modules.
```

### Time Budgets

| Stage | Budget | Action if exceeded |
|---|---|---|
| Unit tests | 2 min | Profile slow tests; check for I/O leaks |
| Integration tests | 5 min | Parallelise; batch DB operations |
| E2E smoke | 10 min | Reduce test count; check for slow waits |
| Full E2E | 30 min | Shard across machines; remove redundant tests |
| Performance smoke | 2 min | Reduce VUs / duration |

---

## GitHub Actions Examples

### PR Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: test-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --reporter=junit --outputFile=results/unit.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: unit-results
          path: results/

  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: unit
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --project=integration --reporter=junit --outputFile=results/integration.xml
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-results
          path: results/

  e2e-smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test --project=smoke --reporter=junit,html
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results
          path: |
            playwright-report/
            test-results/
```

### Nightly Pipeline

```yaml
# .github/workflows/nightly.yml
name: Nightly Tests
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  e2e-full:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test --shard=${{ matrix.shard }}/4 --reporter=junit,html
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-shard-${{ matrix.shard }}
          path: |
            playwright-report/
            test-results/
```

---

## Test Reporting

### JUnit XML (Universal)

All major CI systems parse JUnit XML. Configure reporters:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: ['default', 'junit'],
    outputFile: { junit: 'results/vitest.xml' },
  },
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['junit', { outputFile: 'results/playwright.xml' }],
    ['html', { open: 'never' }],
  ],
});
```

### Allure Reporting

Allure provides rich HTML reports with history, categories, and trends.

```bash
# Install
npm install -D allure-vitest allure-playwright

# Vitest config
# vitest.config.ts
export default defineConfig({
  test: {
    reporters: ['default', 'allure-vitest'],
  },
});

# Playwright config
# playwright.config.ts
export default defineConfig({
  reporter: [['list'], ['allure-playwright']],
});
```

```yaml
# CI step to generate and upload Allure report
- run: npx allure generate allure-results --clean -o allure-report
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: allure-report
    path: allure-report/
```

### PR Comment with Results

```yaml
- name: Test Report Summary
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Test Results
    path: 'results/*.xml'
    reporter: java-junit
    fail-on-error: true
```

---

## Flakiness Tracking

### Detection

1. **Retry-based**: If a test passes on retry but failed initially, it is
   flaky. Playwright and Vitest both support `--retries`.

2. **Repeat-based**: Run tests with `--repeat-each=5` in nightly CI. Any
   test that fails at least once is flaky.

3. **Historical**: Track pass/fail per test across runs. A test that fails
   > 1 % of the time is flaky.

### Tracking Process

```
Test fails in CI
  │
  ├─ Passed on retry?
  │    YES → Flag as flaky, add to tracking board
  │    NO  → Genuine failure, investigate normally
  │
  Flaky test flagged
  │
  ├─ Add label: "flaky-test" in issue tracker
  ├─ Quarantine: move to `@flaky` tag, run separately
  ├─ Set SLA: fix within 48 hours
  │
  Fixed?
  │
  ├─ YES → Remove quarantine, monitor for 1 week
  └─ NO within 48h → Delete the test (a flaky test is worse than no test)
```

### Quarantine Implementation (Playwright)

```typescript
// Tag flaky tests for separate execution
test('sometimes fails due to animation @flaky', async ({ page }) => {
  // ...
});

// playwright.config.ts — run flaky tests in a separate project
export default defineConfig({
  projects: [
    {
      name: 'stable',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*@flaky.*/,
    },
    {
      name: 'quarantine',
      grep: /@flaky/,
      retries: 3,
    },
  ],
});
```

### Metrics to Track

| Metric | Target | Frequency |
|---|---|---|
| Flaky test count | 0 | Daily |
| Flakiness rate (flaky runs / total runs) | < 1 % | Weekly |
| Mean time to fix flaky test | < 48 h | Per incident |
| Tests in quarantine | 0 | Daily |
