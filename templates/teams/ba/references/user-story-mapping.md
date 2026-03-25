# User Story Mapping

## Story Map Structure

```
User Activities (high-level goals)
├── Activity 1: Browse Products
│   ├── Task 1.1: View product list
│   ├── Task 1.2: Search products
│   ├── Task 1.3: Filter by category
│   └── Task 1.4: View product detail
├── Activity 2: Purchase
│   ├── Task 2.1: Add to cart
│   ├── Task 2.2: Review cart
│   ├── Task 2.3: Enter shipping
│   ├── Task 2.4: Enter payment
│   └── Task 2.5: Confirm order
└── Activity 3: Manage Account
    ├── Task 3.1: Register
    ├── Task 3.2: Login
    ├── Task 3.3: View orders
    └── Task 3.4: Update profile
```

## MVP Slicing

Draw a horizontal line across the story map. Everything above = MVP. Everything below = later.

**MVP rule**: What is the MINIMUM set of tasks that delivers value to the user?

```
                    MVP Line
─────────────────────────────────
Above: View list, View detail, Add to cart, Basic checkout, Register, Login
Below: Search, Filters, Wishlist, Reviews, Order history, Profile editing
```

## Prioritization: RICE Framework

| Factor | How to score |
|--------|-------------|
| **R**each | How many users will this affect? (per quarter) |
| **I**mpact | How much will this move the metric? (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal) |
| **C**onfidence | How sure are we about the estimates? (100%, 80%, 50%) |
| **E**ffort | How many person-weeks? |

**RICE Score** = (Reach × Impact × Confidence) / Effort

Higher score = higher priority.

## Story Splitting Techniques

When a story is too large (> 5 story points):

1. **By workflow step**: Split "Checkout" into "Enter shipping" + "Enter payment" + "Confirm order"
2. **By data variation**: Split "Support all payment methods" into "Credit card" + "PayPal" + "Apple Pay"
3. **By operation**: Split "Manage users" into "Create" + "Read" + "Update" + "Delete"
4. **By user role**: Split "Dashboard" into "Admin dashboard" + "User dashboard"
5. **By happy/sad path**: Split "Login" into "Successful login" + "Failed login + error handling"
6. **By platform**: Split "Mobile support" into "Responsive design" + "Native features"

## Definition of Ready

A story is ready for development when:
- [ ] User story written (As a... I want... So that...)
- [ ] Acceptance criteria defined (Given/When/Then)
- [ ] Edge cases identified and documented
- [ ] API contract proposed (if FE+BE involved)
- [ ] UI mockups or wireframes available (if FE involved)
- [ ] Dependencies identified and resolved
- [ ] Priority assigned (P0-P3)
- [ ] Size estimated by the team
- [ ] Open questions answered by stakeholders
