## Branch Strategy

- **Main branch** (`main`): Always deployable. Protected — no direct pushes. All changes via PR.
- **Feature branches**: `feat/{ticket-id}-{short-description}` — e.g., `feat/PROJ-123-add-oauth-login`
- **Bug fix branches**: `fix/{ticket-id}-{short-description}` — e.g., `fix/PROJ-456-null-pointer-on-empty-cart`
- **Other types**: `refactor/`, `docs/`, `test/`, `chore/`, `ci/`
- **Hotfix**: `hotfix/{ticket-id}-{description}` — branches from the production tag, merges to main AND production.

## Commit Standards

- Follow Conventional Commits: `type(scope): description`
  - `feat`: New functionality visible to users
  - `fix`: Bug fix
  - `refactor`: Code change that neither fixes a bug nor adds a feature
  - `test`: Adding or modifying tests
  - `docs`: Documentation only
  - `chore`: Build process, tooling, dependency updates
  - `ci`: CI/CD pipeline changes
  - `perf`: Performance improvement
- Description is imperative mood, lowercase, no period: `add login form` not `Added login form.`
- Body (optional): explain **why**, not what. The diff shows what changed.
- Breaking changes: add `!` after type — `feat(api)!: remove deprecated /v1/users endpoint`

## Pull Request Process

1. **Before opening PR**: Rebase on latest main. Run linter + tests locally. Self-review your own diff.
2. **PR title**: Same as commit message format. Keep under 72 characters.
3. **PR description must include**:
   - **What**: Brief summary of the change (1-3 sentences)
   - **Why**: Link to ticket/issue. Business context for the change.
   - **How to test**: Step-by-step verification instructions. Include curl commands, screenshots, or test commands.
   - **Breaking changes**: If any, describe migration steps.
4. **Review requirements**: Minimum 1 approval. 2 approvals for: database migrations, auth changes, infrastructure, CI/CD, and changes touching >10 files.
5. **Merge strategy**: Squash merge for feature branches (clean history). Merge commit for release branches (preserve individual commits).
6. **Post-merge**: Delete the branch. Verify CI passes on main. Check staging deployment if auto-deployed.

## Release Process

- Semantic versioning: `MAJOR.MINOR.PATCH`
  - MAJOR: Breaking API changes
  - MINOR: New features, backward compatible
  - PATCH: Bug fixes, backward compatible
- Tag releases on main: `git tag -a v1.2.3 -m "Release v1.2.3"`
- Changelog generated from conventional commit messages (using `standard-version` or `changesets`).
