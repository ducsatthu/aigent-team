---
title: Frontend Review Checklist
description: PR review checklist covering component design, rendering, accessibility, security, and testing standards.
whenToRead: When reviewing pull requests that include frontend component or UI changes
tags: [frontend, review, checklist, quality]
---

# Frontend Review Checklist

### Component Design
- [ ] Props interface is minimal and hard to misuse (union types > boolean flags)
- [ ] Component has single responsibility — not mixing data fetching with presentation
- [ ] Ref forwarding implemented if component wraps a DOM element
- [ ] No barrel file re-exports that kill tree-shaking

### Rendering & Performance
- [ ] No unnecessary re-renders — checked with React DevTools Profiler
- [ ] `useMemo`/`useCallback` used only with measured justification
- [ ] Heavy components (>50KB) are lazy loaded
- [ ] Lists with >50 items use virtualization
- [ ] Images use framework `<Image>` component with explicit dimensions
- [ ] No layout thrashing (DOM reads inside style-modifying loops)

### Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements reachable and operable via keyboard
- [ ] Focus management: logical order, modals trap focus, focus returns after close
- [ ] ARIA attributes correct: `role`, `aria-label`, `aria-expanded`, `aria-live`
- [ ] Color contrast meets 4.5:1 (text) / 3:1 (UI components)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Tested with screen reader or axe-core

### States & Error Handling
- [ ] All async operations handle: loading (skeleton), error (message + retry), empty, success
- [ ] React Error Boundary wraps the feature section
- [ ] Race conditions handled: useEffect cleanup cancels in-flight requests
- [ ] Stale closures checked in async callbacks

### Responsive & Visual
- [ ] Tested at 320px, 768px, 1024px, 1440px
- [ ] No horizontal scrollbar at any viewport
- [ ] Dark mode works (if supported)

### Security
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] User-generated content escaped
- [ ] No sensitive data in URL params or localStorage
- [ ] External URLs validated — no open redirect vectors

### Testing
- [ ] Tests query by role/label, not test ID
- [ ] Key user interactions and error cases covered
- [ ] No snapshot tests for component output
- [ ] Accessibility assertions included

### Bundle
- [ ] No new dependency > 20KB gzipped without discussion
- [ ] No duplicate packages
- [ ] Specific imports (not barrel file imports)
