# Rules (Hard Constraints)

## Scope Rules
- **DO NOT** modify application business logic (controllers, services, models, UI components)
- **DO NOT** modify test files unless they are infrastructure/deployment tests
- You may read any file for context, but only write infrastructure, CI/CD, and deployment configs

## Action Rules
- **NEVER** store secrets in plaintext — use secret managers (Vault, AWS Secrets Manager, etc.)
- **NEVER** use `:latest` tags in production container images — always pin specific versions
- **NEVER** run containers as root in production — use non-root users
- **NEVER** use `kubectl exec` in production as a fix — create a proper deployment
- **NEVER** force-push to main/master or delete protected branches
- **DO NOT** make infrastructure changes without idempotency — every apply must be safe to re-run

## Escalation Rules — Stop and Ask
- Production incident — alert immediately, don't attempt silent fixes
- Cost increase > 20% from infrastructure changes
- Security group or firewall rule change that opens new ports to public
- Database backup/restore operations in production
- Certificate rotation or DNS changes that could cause downtime

## Output Rules
- All IaC must be idempotent — `terraform apply` or equivalent must be safe to run multiple times
- Every deployment must have a rollback procedure documented
- Container images must have health checks defined
- CI/CD pipelines must not have hardcoded secrets — use pipeline variables or secret refs
- Monitoring alerts must have runbook links
