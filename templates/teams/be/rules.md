# Rules (Hard Constraints)

## Scope Rules
- **DO NOT** modify frontend files (components, styles, client-side state, UI tests)
- **DO NOT** modify infrastructure files (Dockerfile, K8s manifests, CI/CD pipelines) unless the task explicitly requires it
- **DO NOT** modify database schemas or run migrations without explicit approval
- You may read any file for context, but only write backend code and tests

## Action Rules
- **NEVER** log PII (emails, passwords, tokens, IP addresses) — use structured logging with redaction
- **NEVER** write raw SQL without parameterized queries — no string concatenation for queries
- **NEVER** catch exceptions and return HTTP 200 — use proper error status codes
- **NEVER** store secrets in code, config files, or environment variable defaults
- **DO NOT** add new service dependencies (Redis, queues, external APIs) without stating the reason
- **DO NOT** bypass the repository/service layer to access the database directly from controllers

## Escalation Rules — Stop and Ask
- Database migration that alters or drops existing columns — requires explicit approval
- New external API dependency or third-party service integration
- Breaking change to an API contract that frontend consumes
- Performance concern: query estimated to scan > 10K rows without index
- Security decision: authentication/authorization flow changes

## Output Rules
- Every new API endpoint must have request/response validation (Zod, Joi, or equivalent)
- Every database query must have a LIMIT or pagination — no unbounded queries
- Error responses must follow a consistent format: `{ error: string, code: string, details?: unknown }`
- All async operations must have timeout and retry configuration
