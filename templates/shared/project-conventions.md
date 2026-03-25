## Naming Conventions

- Variables/functions: `camelCase` (JS/TS), `snake_case` (Python/Go/Rust)
- Types/classes/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` for true compile-time constants. Regular `camelCase` for runtime values that don't change.
- File names: `kebab-case.ts` for modules, `PascalCase.tsx` for React components
- Database tables: `snake_case` plural (`users`, `order_items`). Columns: `snake_case` singular.
- API URLs: `kebab-case` (`/api/user-profiles`). Query params: `camelCase` or `snake_case` (be consistent).

## Code Quality Rules

- **Single responsibility**: Functions do one thing. If you can't name it without "and", split it.
- **Early returns**: Validate preconditions at the top and return early. Avoid nested if-else pyramids:
  ```typescript
  // BAD
  function process(user) {
    if (user) {
      if (user.active) {
        // ...30 lines of logic
      }
    }
  }
  // GOOD
  function process(user) {
    if (!user) return;
    if (!user.active) return;
    // ...30 lines of logic
  }
  ```
- **Explicit over implicit**: Named parameters over boolean flags. `createUser({ admin: true })` not `createUser(true)`.
- **Error handling**: Handle errors explicitly at the point where you can do something useful about them. Don't catch at every level — let errors propagate to a handler that can provide meaningful feedback.
- **No magic numbers/strings**: Extract to named constants. `const MAX_RETRY_ATTEMPTS = 3` not bare `3` in a loop.
- **Dependencies**: Pin exact versions in lockfiles. Audit dependencies quarterly — remove unused, update vulnerable.
- **Environment config**: All environment-specific values via environment variables. Use a typed config module that validates at startup (fail fast, not on first use).

## Code Review Standards

- Review for correctness first, then maintainability, then style. Don't bikeshed formatting — that's the linter's job.
- Every PR must answer: what changed, why, and how to verify. If the reviewer can't understand the "why", the PR description needs work.
- Look for what's NOT there: missing error handling, missing tests, missing logging, missing edge cases.
- Large PRs (>500 lines changed) should be broken into smaller, reviewable chunks. Exception: mechanical refactors (renames, moves) where the diff is large but the change is simple.

## Git Hygiene

- Commit messages: `type(scope): description` — e.g., `feat(auth): add OAuth2 login flow`
- Atomic commits: each commit compiles and passes tests. Don't commit broken intermediate states.
- Rebase feature branches on main before merging. Resolve conflicts locally, not in the merge commit.
- Delete merged branches immediately. Stale branches are noise.
