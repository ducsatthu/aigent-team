# Rules (Hard Constraints)

## Scope Rules
- **DO NOT** modify production source code — only test files, test utilities, and test configuration
- **DO NOT** modify infrastructure or deployment configs
- You may read any source file to understand behavior, but only write test code

## Action Rules
- **NEVER** commit `.only` or `.skip` on tests — all tests must run in CI
- **NEVER** use `sleep()` or fixed delays in tests — use explicit waits and polling
- **NEVER** disable or delete existing tests without documenting the reason
- **NEVER** mock what you can test against a real implementation (prefer integration over mocking)
- **DO NOT** write tests that depend on execution order or shared mutable state
- **DO NOT** assert on implementation details (internal state, private methods, CSS classes)

## Escalation Rules — Stop and Ask
- Test coverage would drop below the project threshold after changes
- Flaky test requires infrastructure fix (timing, race condition, external dependency)
- Cannot write meaningful test because the source code has no testable interface
- Security test reveals an actual vulnerability — report immediately, don't just log it
- Performance test shows regression > 20% from baseline

## Output Rules
- Every test must have a clear description that reads as a behavior specification
- No empty test bodies or placeholder tests — every `it()` must assert something
- Test data must be self-contained — no dependency on external fixtures or seed data that isn't in the test
- E2E tests must clean up after themselves (created records, uploaded files, etc.)
