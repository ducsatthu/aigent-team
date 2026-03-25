### Test Level & Strategy
- [ ] Tests are at the correct pyramid level (not E2E for logic that could be unit tested)
- [ ] Risk-proportional coverage: high-risk paths (auth, payment, data mutation) have more tests
- [ ] Both happy path and failure paths are tested (not just "it works" but "it fails gracefully")
- [ ] Edge cases covered: null, empty, max-length, unicode, concurrent access, expired session

### Test Quality
- [ ] Tests follow AAA pattern (Arrange-Act-Assert) with clear separation
- [ ] Test names describe expected behavior: `should {outcome} when {condition}`
- [ ] One logical assertion per test (no mega-tests that assert 10 unrelated things)
- [ ] Tests are independent — pass when run alone, in any order, in parallel
- [ ] No snapshot tests for HTML/JSON output (use visual regression for UI instead)
- [ ] Parameterized tests (`test.each`) used for data-driven scenarios instead of copy-paste

### Test Data
- [ ] Uses factories/fixtures with realistic data (Faker, not `"test"/"test"`)
- [ ] No hardcoded IDs or magic values that depend on external state
- [ ] Test data is self-contained — each test creates what it needs, cleans up after
- [ ] No dependency on test execution order or shared mutable state

### Mocking
- [ ] Mocks only at system boundaries (HTTP APIs, time, randomness) — not internal modules
- [ ] Mock behavior matches real API (response format, error codes, edge cases)
- [ ] No over-mocking — if >3 mocks are needed, consider an integration test instead
- [ ] MSW/nock used for HTTP mocking (not monkey-patching fetch/axios)

### E2E Specific
- [ ] Page Object Model or component abstraction used (no raw selectors in tests)
- [ ] Elements selected by role/label/text — not CSS class, not complex XPath
- [ ] Explicit waits for conditions — no `sleep()`/`wait()` with fixed duration
- [ ] Test data setup via API/seed — not through UI interactions
- [ ] Passes 10/10 runs locally before merge (flakiness check)
- [ ] Screenshot/trace captured on failure for debugging
- [ ] Tests parallelizable — no shared accounts, no port conflicts

### Flakiness Prevention
- [ ] No timing-dependent assertions (exact timestamps, animation states)
- [ ] No shared state between tests (global variables, database records, file system)
- [ ] Async operations properly awaited — no "fire and forget" in test code
- [ ] Retry logic only for eventually-consistent operations, not to mask bugs
- [ ] Environment-agnostic — passes on macOS, Linux, CI (timezone, locale, filesystem)

### Performance Tests (if applicable)
- [ ] Pass/fail thresholds defined in the test script (not just "observe the numbers")
- [ ] Tests run against production-like environment with realistic data volume
- [ ] Baseline recorded for comparison
- [ ] All four load types covered: smoke, load, stress, soak

### CI Integration
- [ ] New tests added to the correct CI stage (smoke vs regression vs nightly)
- [ ] Test execution time within budget (unit <5ms, integration <500ms, E2E <30s)
- [ ] Test report generated (JUnit XML / Allure) for CI visibility
- [ ] No `@skip` / `.only` / `xit` left in committed code
