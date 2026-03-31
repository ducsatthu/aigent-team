---
title: API Design
description: Standards for RESTful URL structure, HTTP status codes, and API endpoint conventions.
whenToRead: When designing or implementing REST API endpoints
tags: [be, api, rest, http]
---

# API Design

## RESTful URL Structure

- Collections: `GET /users`, `POST /users`
- Items: `GET /users/:id`, `PUT /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`
- Nested: `GET /users/:id/orders`, `POST /users/:id/orders`
- Actions (non-CRUD): `POST /orders/:id/cancel`, `POST /users/:id/verify`

## HTTP Status Codes

Use semantically correct codes — not just 200 and 500:

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Success with body |
| 201 | Created | Resource created (+ `Location` header) |
| 204 | No Content | Success, no body (DELETE, some PUTs) |
| 400 | Bad Request | Validation error (malformed input) |
| 401 | Unauthenticated | No token or invalid token |
| 403 | Forbidden | Valid token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate, version mismatch |
| 422 | Unprocessable | Valid data, business logic rejection |
| 429 | Too Many Requests | Rate limited (include `Retry-After` header) |
| 500 | Server Error | Never intentional — means you have a bug |

## Response Formats

**Collections:**
```json
{
  "data": [...],
  "meta": { "total": 150, "page": 1, "perPage": 20, "hasMore": true }
}
```

**Errors:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "This field is required" }
    ]
  }
}
```
`code` is machine-readable (for client logic), `message` is human-readable (for display).

## Pagination

- **Cursor-based** (recommended for large/real-time data): Opaque cursor token, no count query.
  ```
  GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20
  → { data: [...], meta: { nextCursor: "eyJpZCI6MTIwfQ", hasMore: true } }
  ```
- **Offset-based** (simple, for small static data): `?page=2&perPage=20`
- Default sort must be deterministic — include `id` as tiebreaker.

## Filtering & Sorting

```
GET /users?status=active&role=admin&created_after=2024-01-01
GET /users?sort=created_at:desc,name:asc
```

Complex filters: POST to a search endpoint with filter body, not mega query strings.

## Versioning

- URL prefix: `/v1/users`, `/v2/users` for breaking changes
- Adding optional response fields = NOT breaking
- Removing/renaming fields, changing types, adding required params = BREAKING

## Input Validation

Validate everything at the API boundary:
```typescript
const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});
```
- String length limits on all fields
- Enum validation for constrained values
- Nested object validation
- Array length limits
- Reject unknown fields (`z.strict()`)
