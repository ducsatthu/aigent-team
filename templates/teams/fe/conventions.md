## Component Architecture

- Use functional components exclusively. Class components are legacy — migrate when touching existing ones.
- Props interface is the component's contract. Design it like a public API:
  - Use discriminated unions for variants: `type ButtonVariant = 'primary' | 'secondary' | 'ghost'` — not `isPrimary`, `isSecondary` booleans
  - Required props first, optional with sensible defaults
  - Callback props follow `onAction` naming: `onClick`, `onChange`, `onSubmit`
  - Avoid `children` prop when the content structure is predictable — use named slots/props instead
- Co-locate everything for a component in one directory:
  ```
  Button/
  ├── Button.tsx           # Component
  ├── Button.test.tsx      # Tests
  ├── Button.stories.tsx   # Storybook
  ├── Button.module.css    # Styles (if not using Tailwind)
  └── index.ts             # Public export (only export what consumers need)
  ```
- Component layers — enforce separation:
  - **Primitives**: Design system atoms (Button, Input, Modal). No business logic. No API calls.
  - **Composites**: Combine primitives for generic patterns (SearchBar, DataTable, FormField). Still no domain knowledge.
  - **Features**: Domain-specific components (UserProfile, InvoiceList). Can fetch data, contain business logic.

## State Management

- **Local state** (`useState`): UI-only state (open/closed, active tab, form input). This is the default.
- **Server state** (React Query/TanStack Query): All data from APIs. Never store server data in useState/Zustand. React Query handles caching, revalidation, and deduplication.
- **Global client state** (Zustand/Jotai): Cross-component UI state (theme, sidebar collapsed, toast queue). Keep this minimal — if it comes from the server, it belongs in React Query.
- **URL state** (search params): Anything the user should be able to bookmark or share (filters, pagination, selected tab). Use `useSearchParams` or a URL state library.
- **Never** duplicate server state into client stores. This causes sync bugs that are extremely hard to debug in production.

## Performance Rules

- **Measure first, optimize second.** Don't add `useMemo`/`useCallback` prophylactically. Add them when React DevTools Profiler shows a measurable problem (>16ms render).
- Lazy load routes with `React.lazy()` + Suspense. Every route should be a separate chunk.
- Heavy components (charts, rich text editors, maps) get `dynamic(() => import(...), { ssr: false })` in Next.js.
- Images: Always use the framework's `<Image>` component. Set explicit `width`/`height` to prevent CLS. Use `priority` only for above-the-fold hero images.
- Fonts: Use `next/font` or `@fontsource`. Preload only the weights/subsets you actually use. `font-display: swap` always.
- Lists with >50 items must use virtualization (`react-window` or `@tanstack/react-virtual`). No exceptions.
- Avoid layout thrashing: batch DOM reads and writes. Never read `offsetHeight` inside a loop that modifies styles.

## CSS & Styling

- Tailwind is preferred. Use `@apply` sparingly — only in base component styles where utility classes become unreadable (>6 classes).
- If using CSS modules, follow BEM-like naming: `.card`, `.card__header`, `.card--highlighted`.
- Never use inline `style={{}}` for layout or spacing. Only for truly dynamic values (calculated positions, user-selected colors).
- Design tokens (colors, spacing, typography) come from the design system / Tailwind config. Never hardcode hex values or pixel sizes.
- Z-index scale: define in a central config. Use semantic names (dropdown: 100, modal: 200, toast: 300, tooltip: 400). Never use arbitrary z-index values.

## Forms

- Use React Hook Form + Zod for all forms. Define the Zod schema first — it serves as both validation and TypeScript type.
- Validate on blur for individual fields, on submit for the full form. Show inline errors immediately after blur.
- Disable submit button only during submission (not for validation). Show validation errors instead of hiding the submit action.
- Multi-step forms: persist partial state to sessionStorage or URL params. Users who accidentally navigate away should not lose data.
- File uploads: show progress, support drag-and-drop, validate file type/size client-side before upload.

## Error Handling

- Wrap feature sections with React Error Boundaries. A chart crashing should not take down the entire page.
- API errors: distinguish between 4xx (show user-actionable message) and 5xx (show generic "something went wrong" + retry).
- Network errors: detect offline state (`navigator.onLine` + `online`/`offline` events). Show persistent banner when offline. Queue mutations for retry.
- Race conditions: cancel in-flight requests on component unmount (`AbortController` in useEffect cleanup). Cancel previous search requests on new input (debounce + abort).
- Never show raw error messages to users. Map API error codes to human-readable messages. Log raw errors to monitoring (Sentry/DataDog).

## Testing

- Test from the user's perspective. Query by role (`getByRole('button', { name: 'Submit' })`), not by test ID.
- Test behavior, not implementation: "when user clicks submit, success message appears" — not "when submit handler is called, setState is invoked".
- Snapshot tests are banned for component output. They break on every style change and catch nothing meaningful. Use visual regression (Chromatic/Percy) instead.
- Test keyboard navigation for all interactive components.
- Mock network requests with MSW (Mock Service Worker), not by mocking fetch/axios directly.
- Every bug fix must include a test that would have caught the bug.

## Security

- Never use `dangerouslySetInnerHTML` without sanitizing with DOMPurify first.
- Never construct URLs from user input without validation. Use `URL` constructor and whitelist allowed origins.
- CSRF: ensure all mutation requests include the CSRF token. Framework should handle this — verify it's configured.
- Sensitive data (tokens, PII) must never appear in URL query params, localStorage, or client-side logs.
- Content Security Policy: work with DevOps to set strict CSP headers. Report violations to a monitoring endpoint.
