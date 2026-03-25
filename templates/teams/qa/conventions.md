## Test Pyramid Enforcement

- Ratio target: ~70% unit, ~20% integration, ~10% E2E. Measure quarterly.
- If adding an E2E test, ask: "Can this be caught at a lower level?" If yes, write the lower-level test instead.
- E2E tests are reserved for critical user journeys only — login, checkout, core CRUD flow. Not for edge cases.
- Each level has a time budget: unit tests <5ms each, integration <500ms, E2E <30s. Tests exceeding budget must be optimized or re-leveled.

## Test Structure

- Every test follows AAA (Arrange-Act-Assert) with clear visual separation:
  ```typescript
  it('should return 404 when user does not exist', async () => {
    // Arrange
    const nonExistentId = 'user_999';

    // Act
    const response = await api.get(`/users/${nonExistentId}`);

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });
  ```
- One logical assertion per test. Multiple `expect` calls are fine if they assert on the same behavior (e.g., checking status code AND response body).
- Test names must describe expected behavior: `should {expected outcome} when {condition}`. Not `test1`, not `works correctly`, not `user endpoint`.
- Group related tests with `describe` blocks that name the unit under test:
  ```
  describe('UserService.createUser', () => {
    it('should create user and return profile', ...);
    it('should throw ConflictError when email exists', ...);
    it('should hash password before storing', ...);
  });
  ```

## Test Data Management

- **Factories over fixtures**: Use factory functions that generate test data with sensible defaults and allow overrides:
  ```typescript
  const user = createTestUser({ role: 'admin', verified: true });
  ```
- **Faker for realistic data**: Use `@faker-js/faker` for emails, names, addresses. Fixed strings like `"test@test.com"` hide bugs in validation logic.
- **Database isolation**: Each test owns its data. Options:
  - Wrap each test in a transaction that rolls back after assertion
  - Truncate tables in `beforeEach` (slower but simpler)
  - Use unique identifiers per test to avoid collisions
- **Never depend on seed data**: If a test needs a user to exist, the test creates that user. Don't rely on data from migrations or other tests.
- **Test environment parity**: Use the same database engine as production (not SQLite when production is Postgres). Use testcontainers or Docker Compose.

## Mocking Strategy

- **Mock at system boundaries only**:
  - External HTTP APIs → MSW (Mock Service Worker) or nock
  - Database → real test database (not mocked)
  - File system → temp directories
  - Time → `vi.useFakeTimers()` / `freezegun`
  - Random → seed-based PRNG
- **Never mock internal modules** — if you mock a service to test a controller, you're not testing the integration. Use the real service with a test database.
- **Mock behaviors, not implementations**: Mock what the API returns, not how it's called internally.
- **Verify mock contracts**: If you mock an external API, add a contract test that periodically validates your mock matches the real API.

## E2E Testing Standards

- **Page Object Model** — every page/component gets a class that encapsulates selectors and actions:
  ```typescript
  class LoginPage {
    async login(email: string, password: string) {
      await this.page.getByLabel('Email').fill(email);
      await this.page.getByLabel('Password').fill(password);
      await this.page.getByRole('button', { name: 'Sign in' }).click();
      await this.page.waitForURL('/dashboard');
    }
  }
  ```
- **Element selection priority**: `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `data-testid`. CSS classes and XPath are banned.
- **Wait strategy**: Always wait for a specific condition, never a fixed duration.
  - Wait for element: `page.waitForSelector('.result-item')`
  - Wait for network: `page.waitForResponse('/api/search')`
  - Wait for navigation: `page.waitForURL('/dashboard')`
  - Timeout: max 10 seconds. If it needs more, the feature is too slow.
- **Test isolation**: Each test starts with a clean state. Use API calls to create/cleanup test data, not UI interactions.
- **Parallel execution**: Tests must run in parallel safely. No shared accounts, no shared database records, no port conflicts.
- **Retry policy**: Flaky tests get 1 automatic retry in CI. If a test needs >1 retry to pass consistently, it has a bug — fix it.
- **Screenshot on failure**: Automatically capture screenshot + trace on test failure for debugging.

## Flakiness Management

- **Zero tolerance**: A flaky test is a broken test. Fix within 24 hours or quarantine (move to a separate suite that doesn't block PRs).
- **Root cause categories** and fixes:
  - **Timing**: Replace `sleep` with explicit waits. Add retry logic for eventually-consistent operations.
  - **Shared state**: Isolate test data. Use unique identifiers. Don't depend on test execution order.
  - **Environment**: Pin dependency versions. Use Docker for consistent environments. Handle timezone differences.
  - **Race conditions**: Await all async operations. Use `waitForResponse` instead of assuming API is instant.
  - **Resource contention**: Don't share browser instances across tests. Don't share database connections.
- **Detection**: Run full suite 5x nightly with test order randomized. Any inconsistent result = flaky. Track flakiness rate as a team metric (target: <1%).

## Performance Testing Standards

- Performance tests live in a separate directory (`perf/` or `load/`) — not mixed with functional tests.
- Every performance test defines pass/fail thresholds in the script, not just "see what happens":
  ```javascript
  export const options = {
    thresholds: {
      http_req_duration: ['p95<500', 'p99<1000'],
      http_req_failed: ['rate<0.01'],
    },
  };
  ```
- Run against a production-like environment with production-like data volume. Testing against empty databases is meaningless.
- Results tracked over time — store in CI artifacts or a dashboard. Detect regressions by comparing against last 5 runs.
- Types of load tests (must have all four):
  - **Smoke**: 1-5 users, verify basic functionality under load tooling
  - **Load**: Expected peak traffic for 10 minutes
  - **Stress**: 2-3x peak traffic, find the breaking point
  - **Soak**: Normal traffic for 2-4 hours, detect memory leaks and connection exhaustion

## Security Testing

- Run OWASP ZAP or similar DAST tool against staging environment in CI pipeline.
- SQL injection: test all input fields with `'; DROP TABLE users; --` and similar payloads.
- XSS: test all input fields that render output with `<script>alert('xss')</script>` and event handlers.
- IDOR: for every API endpoint that takes a resource ID, verify that user A cannot access user B's resources.
- Auth bypass: test every protected endpoint without a token, with an expired token, with a token for a different role.
- Rate limiting: verify rate limits are enforced by making requests at 2x the limit and confirming 429 responses.

## CI Integration

- **Smoke tests** (<5 min): Run on every PR. Blocks merge. Includes unit tests + critical integration tests.
- **Full regression** (<30 min): Run on merge to main. Includes all unit, integration, and E2E tests.
- **Nightly suite** (<2 hours): Run at midnight. Includes performance tests, security scans, visual regression, mutation testing.
- **Test reports**: Every CI run produces a report (Allure, JUnit XML) with pass/fail, duration, flakiness history. Link in PR comment.
