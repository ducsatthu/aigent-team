---
title: Component Architecture
description: Props interface design, file structure conventions, composition patterns, and component responsibility boundaries.
whenToRead: When designing new components or refactoring existing component structure
tags: [frontend, components, architecture, react]
---

# Component Architecture

## Props Interface Design

- Props interface is the component's contract. Design it like a public API:
  - Use discriminated unions for variants: `type ButtonVariant = 'primary' | 'secondary' | 'ghost'` — not `isPrimary`, `isSecondary` booleans
  - Required props first, optional with sensible defaults
  - Callback props follow `onAction` naming: `onClick`, `onChange`, `onSubmit`
  - Avoid `children` prop when the content structure is predictable — use named slots/props
- Use `React.forwardRef` if the component wraps a DOM element consumers may need to reference
- Spread remaining props onto the root element: `{...rest}` for flexibility (className, data-*, aria-*)

## Component File Structure

```
Button/
├── Button.tsx           # Component implementation
├── Button.test.tsx      # Tests (behavior-based, not snapshot)
├── Button.stories.tsx   # Storybook stories for all states
├── Button.module.css    # Styles (if not using Tailwind)
└── index.ts             # Public export only — never re-export internals
```

## Component Layers — Enforce Separation

**Primitives** (design system atoms):
- Button, Input, Modal, Tooltip, Badge, Avatar
- No business logic. No API calls. No domain knowledge.
- Accept generic props. Fully configurable via props.

**Composites** (domain-agnostic patterns):
- SearchBar, DataTable, FormField, Pagination, FileUpload
- Combine primitives for reusable UI patterns
- Still no domain knowledge — works in any project

**Features** (domain-specific):
- UserProfile, InvoiceList, CheckoutForm, DashboardWidget
- Can fetch data, contain business logic
- Use primitives and composites internally

**Rules**:
- Primitives never import composites or features
- Composites never import features
- Features can import anything below them

## Visual States — Every Component Must Handle

1. **Default**: Normal interactive state
2. **Loading**: Skeleton placeholder, not spinner (preserves layout, reduces CLS)
3. **Error**: Inline error message with retry action. Not just red text — explain what went wrong.
4. **Empty**: Meaningful empty state — illustration + call to action, not blank space
5. **Disabled**: Visually distinct, not interactive, cursor: not-allowed, aria-disabled
6. **Focused**: Visible focus ring (2px solid, high contrast). Never `outline: none` without replacement.
7. **Hover**: Subtle visual feedback. Must not be the only way to discover functionality.

## Composition Patterns

**Compound Components** (for complex UI with shared state):
```tsx
<Select>
  <Select.Trigger>Choose option</Select.Trigger>
  <Select.Content>
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select>
```

**Render Props** (for customizable rendering):
```tsx
<DataTable
  data={users}
  renderRow={(user) => <UserRow key={user.id} user={user} />}
/>
```

**Slot Props** (named content areas):
```tsx
<Card
  header={<h3>Title</h3>}
  footer={<Button>Save</Button>}
>
  Body content
</Card>
```

Prefer these over single mega-component with 20+ props.
