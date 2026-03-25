# Authentication & Security

## Authentication

- **JWT tokens**: Short-lived access (15-30 min) + long-lived refresh (7-30 days) in httpOnly Secure SameSite=Strict cookie
- **Password storage**: bcrypt (cost ≥ 12) or Argon2id. Never plain text, never MD5/SHA.
- **API keys**: Service-to-service auth only. Rotate quarterly. Never for user-facing auth.
- **OAuth2/OIDC**: For third-party login (Google, GitHub). Use authorization code flow with PKCE.

## Authorization

- Implement RBAC at minimum. Check permissions in middleware before controller executes.
- **IDOR prevention** — always scope queries by authenticated user:
  ```sql
  -- BAD: anyone can access any order
  SELECT * FROM orders WHERE id = :orderId
  -- GOOD: scoped to user
  SELECT * FROM orders WHERE id = :orderId AND user_id = :currentUserId
  ```
- Test every endpoint: can user A access user B's resources by changing the ID?

## Rate Limiting

| Tier | Limit | Use case |
|------|-------|----------|
| Anonymous | 60/min per IP | Public endpoints |
| Authenticated | 300/min per user | Standard API access |
| Premium | 1000/min per user | Paid tier |
| Login | 5/min per IP | Brute force prevention |
| Password reset | 3/hour per email | Abuse prevention |

- Return `429` with `Retry-After` header
- Use sliding window algorithm (more fair than fixed window)
- Rate limit by user ID for authenticated, by IP for anonymous

## Input Security

- **SQL injection**: Parameterized queries always. Never string concatenation for SQL.
- **Mass assignment**: Whitelist allowed fields from request body. Never pass raw body to ORM create/update.
- **Path traversal**: Validate file paths. Never use user input directly in `fs.readFile()` or similar.
- **ReDoS**: Avoid user-controlled regex patterns. Set timeout on regex matching.

## Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-Request-Id: {unique-id}  (for tracing)
```

## Secrets Management

- Secrets from secret manager (Vault, AWS SSM, GCP Secret Manager)
- Never in code, environment files, or Docker images
- Rotate on: employee offboarding, suspected compromise, quarterly schedule
- Use short-lived credentials where possible (IAM roles, temporary tokens)
