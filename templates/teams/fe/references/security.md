---
title: Frontend Security
description: XSS prevention, content sanitization, CSP headers, auth token handling, and client-side security patterns.
whenToRead: When implementing or reviewing security-sensitive frontend code
tags: [frontend, security, xss, authentication]
---

# Frontend Security

## XSS Prevention

**Never use `dangerouslySetInnerHTML` without sanitization:**
```typescript
import DOMPurify from 'dompurify';

// GOOD: Sanitized
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// BAD: Raw user content
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**React auto-escapes JSX** — but watch for:
- `href={userInput}` — can execute `javascript:alert('xss')`. Validate URL scheme.
- `style={userControlledObject}` — can inject CSS expressions in older browsers.
- Template literals in `<script>` tags (SSR) — server-rendered user data must be escaped.

**URL validation:**
```typescript
function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
```

## Authentication Token Handling

- Access tokens: store in memory (variable/React state). Lost on refresh = by design (use refresh flow).
- Refresh tokens: `httpOnly`, `Secure`, `SameSite=Strict` cookie. Never accessible to JavaScript.
- **Never store tokens in**: localStorage, sessionStorage, URL query params, cookies accessible to JS.
- Clear tokens on logout: revoke refresh token server-side, clear in-memory access token.

## CSRF Protection

- All mutation requests (POST, PUT, DELETE) must include CSRF token
- Framework handles this — verify it's configured:
  - Next.js: use `next-csrf` or custom middleware
  - SPA: include token from `X-CSRF-Token` header or cookie
- Same-origin policy + `SameSite=Strict` cookies provide baseline protection

## Content Security Policy (CSP)

Work with DevOps to set strict CSP headers:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';  /* Tailwind needs this */
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
```

- Report violations to a monitoring endpoint: `report-uri /csp-report`
- Start in report-only mode, then enforce after fixing violations

## Sensitive Data

- Never log PII (email, name, phone) to console in production
- Never put sensitive data in URL query params (visible in browser history, logs, analytics)
- Mask sensitive fields in error reports (Sentry: `beforeSend` hook)
- Clear sensitive form data from memory after submission

## Third-party Scripts

- Audit all third-party scripts — each is an XSS vector
- Load analytics/tracking via tag manager, not inline scripts
- Use `integrity` attribute for CDN scripts (SRI — Subresource Integrity)
- Sandbox iframes: `sandbox="allow-scripts allow-same-origin"`

## Open Redirect Prevention

```typescript
// BAD: Redirect to user-controlled URL
const returnUrl = searchParams.get('returnUrl');
router.push(returnUrl); // Could be https://evil.com

// GOOD: Validate against allowed paths
const returnUrl = searchParams.get('returnUrl');
if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
  router.push(returnUrl); // Relative path only
}
```
