# API Contract Design

## Purpose

An API contract is the agreement between FE and BE about how they communicate. It must be defined BEFORE implementation starts so both can work in parallel against the same spec.

## Contract Template

```yaml
# Endpoint: Create Order
method: POST
path: /api/v1/orders
auth: required (role: user)
rate_limit: 30/min per user

request:
  headers:
    Content-Type: application/json
    Authorization: Bearer {access_token}
  body:
    productId:
      type: string
      required: true
      example: "prod_abc123"
    quantity:
      type: integer
      required: true
      min: 1
      max: 100
    couponCode:
      type: string
      required: false
      maxLength: 20
      example: "SAVE10"

response:
  201 Created:
    description: Order created successfully
    body:
      data:
        id: string (e.g., "ord_xyz789")
        productId: string
        quantity: integer
        unitPrice: integer (cents)
        discount: integer (cents)
        total: integer (cents)
        status: "pending" | "confirmed" | "shipped"
        createdAt: string (ISO 8601)

  400 Bad Request:
    description: Validation error
    body:
      error:
        code: "VALIDATION_ERROR"
        message: string
        details:
          - field: string
            message: string

  401 Unauthorized:
    body:
      error:
        code: "UNAUTHORIZED"
        message: "Authentication required"

  404 Not Found:
    description: Product not found
    body:
      error:
        code: "PRODUCT_NOT_FOUND"
        message: "Product {productId} does not exist"

  409 Conflict:
    description: Insufficient stock
    body:
      error:
        code: "INSUFFICIENT_STOCK"
        message: "Only {available} units available"
```

## Design Principles

1. **BE owns the data model, FE drives the API shape** — FE knows what it needs to render, BE knows how to store/compute it. Meet in the middle.

2. **Response includes everything FE needs** — FE should not make N requests to assemble one view. If a list page needs user name + avatar, include them in the list response.

3. **Consistent patterns across endpoints** — same pagination format, same error format, same date format everywhere.

4. **Version from day one** — `/v1/` prefix. Even if you never make v2, it costs nothing and saves you later.

5. **Error codes are machine-readable** — FE switches on `error.code` (not `error.message`) to decide what to show the user.

## Review Checklist

Before finalizing a contract, verify:
- [ ] All FE views can be rendered with the data in the response
- [ ] All user actions have a corresponding endpoint
- [ ] Error responses cover all failure modes (validation, auth, not-found, conflict)
- [ ] Pagination included for list endpoints
- [ ] Sorting and filtering params defined
- [ ] Response includes `id` for every entity (for FE to use as key/link)
- [ ] Date/time fields are ISO 8601 strings
- [ ] Money fields are integers in smallest unit (cents)
- [ ] Consistent naming (camelCase for JSON, snake_case only if project convention)

## Contract Evolution

- **Non-breaking** (no version bump needed): add optional request field, add response field, add new endpoint
- **Breaking** (requires v2): remove/rename field, change field type, add required request field, change URL
- **Migration path**: support v1 and v2 simultaneously for 3 months, then deprecate v1
