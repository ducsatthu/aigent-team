# Security Testing Reference

## OWASP Top 10 — Test Coverage

### SQL Injection

Test every user-controlled input that reaches a database query.

```typescript
const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1; SELECT * FROM users",
  "' UNION SELECT username, password FROM users --",
  "1' AND SLEEP(5) --",
];

test.each(sqlInjectionPayloads)('rejects SQL injection: %s', async (payload) => {
  const res = await request(app)
    .get('/api/users')
    .query({ search: payload });

  // Should NOT return 500 (indicates unhandled query error)
  expect(res.status).not.toBe(500);
  // Should NOT return other users' data
  expect(res.body).not.toContainEqual(
    expect.objectContaining({ email: expect.stringContaining('@') }),
  );
});
```

**Prevention**: Use parameterised queries exclusively. Never concatenate user
input into SQL strings. ORM usage does not guarantee safety — verify raw
queries and `whereRaw` calls.

### Cross-Site Scripting (XSS)

```typescript
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '"><svg onload=alert("xss")>',
  "javascript:alert('xss')",
  '<div onmouseover="alert(\'xss\')">hover</div>',
];

test.each(xssPayloads)('sanitises XSS in user input: %s', async (payload) => {
  // Submit payload via API
  await request(app)
    .post('/api/comments')
    .send({ body: payload });

  // Retrieve and verify output is escaped
  const res = await request(app).get('/api/comments');
  const comment = res.body[res.body.length - 1];
  expect(comment.body).not.toContain('<script');
  expect(comment.body).not.toContain('onerror');
  expect(comment.body).not.toContain('onload');
  expect(comment.body).not.toContain('onmouseover');
});
```

**Prevention**: Escape output by default (React does this). Sanitise HTML
input with a strict allowlist (DOMPurify). Set `Content-Security-Policy`
headers.

### Insecure Direct Object Reference (IDOR)

Test that users cannot access resources belonging to other users by
manipulating IDs.

```typescript
test('user cannot access another user\'s order', async () => {
  // Create order as user A
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ items: [{ sku: 'WIDGET-1', qty: 1 }] });
  const orderId = orderRes.body.id;

  // Attempt access as user B
  const res = await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Authorization', `Bearer ${userBToken}`);

  expect(res.status).toBe(403);
});

test('user cannot update another user\'s profile', async () => {
  const res = await request(app)
    .patch(`/api/users/${userAId}`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({ name: 'Hacked' });

  expect(res.status).toBe(403);
});
```

**Prevention**: Always check resource ownership in the authorization layer.
Never rely on obscured IDs (UUIDs) as a security mechanism.

### Authentication Bypass

```typescript
describe('Auth bypass checks', () => {
  const protectedEndpoints = [
    { method: 'GET', path: '/api/users/me' },
    { method: 'POST', path: '/api/orders' },
    { method: 'DELETE', path: '/api/users/123' },
    { method: 'GET', path: '/api/admin/dashboard' },
  ];

  test.each(protectedEndpoints)(
    '$method $path returns 401 without token',
    async ({ method, path }) => {
      const res = await request(app)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
    },
  );

  test('expired token is rejected', async () => {
    const expiredToken = signToken({ userId: '1' }, { expiresIn: '-1h' });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('tampered token is rejected', async () => {
    const token = signToken({ userId: '1', role: 'member' });
    // Modify payload to escalate role
    const [header, , signature] = token.split('.');
    const tamperedPayload = btoa(JSON.stringify({ userId: '1', role: 'admin' }));
    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tamperedToken}`);
    expect(res.status).toBe(401);
  });
});
```

---

## DAST with OWASP ZAP

Dynamic Application Security Testing scans a running application for
vulnerabilities.

### Automated Scan in CI

```yaml
# .github/workflows/security.yml
name: DAST Scan
on:
  schedule:
    - cron: '0 3 * * 1'  # Weekly Monday 3 AM
  workflow_dispatch:

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    services:
      app:
        image: your-app:latest
        ports: ['3000:3000']
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a -j'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-report
          path: report_html.html
```

### Custom Rules File

```tsv
# .zap/rules.tsv — customize alert thresholds
# ID	Action	(IGNORE, WARN, FAIL)
10010	IGNORE	# Cookie No HttpOnly Flag (handled by framework)
10011	FAIL	# Cookie Without Secure Flag
10015	FAIL	# Incomplete or No Cache-control Header
10021	FAIL	# X-Content-Type-Options Header Missing
10038	FAIL	# Content Security Policy Header Not Set
40012	FAIL	# Cross Site Scripting (Reflected)
40014	FAIL	# Cross Site Scripting (Persistent)
90022	FAIL	# Application Error Disclosure
```

### Authenticated Scan

For scanning behind login, provide ZAP with auth context:

```yaml
- name: ZAP Full Scan
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: 'http://localhost:3000'
    cmd_options: >
      -z "-config auth.method=2
          -config auth.method.loginindicator=Dashboard
          -config auth.method.logoutindicator=Sign in"
```

---

## Rate Limit Verification

Test that rate limits are enforced and return proper responses.

```typescript
describe('Rate limiting', () => {
  test('login endpoint rate-limits after 5 attempts', async () => {
    const results = [];

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });
      results.push(res.status);
    }

    // First 5 should be 401 (wrong password)
    expect(results.slice(0, 5).every((s) => s === 401)).toBe(true);
    // Remaining should be 429 (rate limited)
    expect(results.slice(5).every((s) => s === 429)).toBe(true);
  });

  test('rate limit returns Retry-After header', async () => {
    // Exhaust rate limit
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' });

    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(parseInt(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  test('rate limit resets after window', async () => {
    // This test requires clock mocking or a short rate limit window in test config
    // Exhaust limit, advance time, verify access restored
  });
});
```

### Additional Security Checks

- **CORS**: Verify `Access-Control-Allow-Origin` does not include `*` on
  authenticated endpoints.
- **Headers**: Verify `X-Content-Type-Options: nosniff`,
  `Strict-Transport-Security`, `X-Frame-Options`.
- **Sensitive data in URLs**: Verify tokens and passwords are never in query
  strings (they appear in logs).
- **Error messages**: Verify error responses do not leak stack traces,
  database schema, or internal paths.
