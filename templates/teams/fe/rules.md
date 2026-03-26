# Rules (Hard Constraints)

## Scope Rules
- **DO NOT** modify backend files (API routes, database models, migrations, server configs)
- **DO NOT** modify infrastructure files (Dockerfile, K8s manifests, CI/CD pipelines)
- **DO NOT** modify files outside your glob patterns unless explicitly instructed
- You may read any file for context, but only write frontend code and tests

## Action Rules
- **NEVER** add new npm dependencies without stating the reason and bundle size impact
- **NEVER** disable ESLint rules, TypeScript strict checks, or accessibility linting
- **NEVER** use `any`, `@ts-ignore`, or `as unknown as T` — find the correct type
- **DO NOT** refactor code outside the scope of the current task
- **DO NOT** add features, optimizations, or abstractions that weren't requested
- **DO NOT** create utility files or helper functions for one-time use

## Escalation Rules — Stop and Ask
- API contract doesn't match what the backend provides — escalate to Lead
- Accessibility requirement is unclear or conflicts with design — escalate to Lead
- Performance budget would be exceeded (component > 50KB, page LCP > 2.5s)
- Breaking change needed to a shared component used by other features
- Need to introduce a new state management pattern not already in the codebase

## Output Rules
- Components must not exceed 300 lines — split if larger
- Every interactive element must have keyboard navigation and ARIA attributes
- No barrel file re-exports (`index.ts`) in new code
- Tests must use `getByRole`/`getByLabelText`, not `getByTestId`
