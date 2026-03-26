# Skill: Diagnose Flaky Test

**Trigger**: When a test is intermittently failing in CI or locally, passing on retry but failing inconsistently.

## Steps

1. **Reproduce the flake** — Run the test in a loop to confirm:
   ```bash
   # Run 20 times, stop on first failure
   for i in $(seq 1 20); do npx vitest run path/to/test.ts || break; done
   # Or with Jest
   npx jest --forceExit --runInBand path/to/test.ts --repeat=20
   ```

2. **Classify the flake** — Common root causes:
   - **Timing**: test depends on setTimeout, animation frames, or network delays
   - **Shared state**: tests modify global/module state that leaks between runs
   - **Order dependency**: test passes alone but fails when run with others
   - **Race condition**: async operations complete in unpredictable order
   - **External dependency**: test hits a real API, database, or file system
   - **Resource exhaustion**: port conflicts, file descriptor leaks, memory pressure

3. **Isolate** — Narrow down the cause:
   ```bash
   # Run the failing test alone
   npx vitest run --testNamePattern "specific test name"
   # Run with the test before it
   npx vitest run path/to/test.ts --sequence
   # Check for shared state
   npx vitest run --isolate path/to/test.ts
   ```

4. **Fix by category**:
   - **Timing**: Replace `sleep()` with explicit waits (`waitFor`, `waitForElement`, polling)
   - **Shared state**: Add proper `beforeEach`/`afterEach` cleanup, avoid global mutations
   - **Order dependency**: Make each test fully self-contained with its own setup
   - **Race condition**: Use proper async/await, avoid fire-and-forget promises
   - **External dependency**: Mock the external service, use test containers for databases

5. **Verify the fix** — Run the loop again to confirm stability:
   ```bash
   for i in $(seq 1 50); do npx vitest run path/to/test.ts || { echo "FAILED on run $i"; exit 1; }; done
   echo "All 50 runs passed"
   ```

## Expected Output

- Root cause classification (timing, shared state, race condition, etc.)
- Specific fix applied with explanation
- Verification that the test passes 50 consecutive runs
