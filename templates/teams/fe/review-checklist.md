### Component Design
- [ ] Props interface is minimal and hard to misuse (union types > boolean flags)
- [ ] Component has single responsibility — not mixing data fetching with presentation
- [ ] Ref forwarding implemented if component wraps a DOM element
- [ ] No barrel file re-exports that kill tree-shaking

### Rendering & Performance
- [ ] No unnecessary re-renders — checked with React DevTools Profiler
- [ ] `useMemo`/`useCallback` used only with measured justification, not prophylactically
- [ ] Heavy components (>50KB) are lazy loaded with `React.lazy` or `dynamic()`
- [ ] Lists with >50 items use virtualization
- [ ] Images use framework `<Image>` component with explicit dimensions (prevents CLS)
- [ ] No layout thrashing (DOM reads inside style-modifying loops)

### Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements reachable and operable via keyboard (Tab, Enter, Space, Escape, Arrows)
- [ ] Focus management: focus moves logically; modals trap focus; focus returns after modal closes
- [ ] ARIA attributes correct: `role`, `aria-label`, `aria-expanded`, `aria-live` for dynamic content
- [ ] Color contrast meets 4.5:1 ratio for text, 3:1 for large text and UI components
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Tested with at least one screen reader (VoiceOver, NVDA, or axe-core automated scan)

### States & Error Handling
- [ ] All async operations handle: loading (skeleton), error (message + retry), empty, success states
- [ ] React Error Boundary wraps the feature section — one component crash doesn't kill the page
- [ ] Offline state detected and communicated to user
- [ ] Race conditions handled: useEffect cleanup cancels in-flight requests (`AbortController`)
- [ ] Stale closures checked: no reading stale state inside async callbacks or event listeners

### Responsive & Visual
- [ ] Tested at 320px (small mobile), 768px (tablet), 1024px (desktop), 1440px (large desktop)
- [ ] No horizontal scrollbar at any viewport width
- [ ] Typography scales appropriately (clamp() or responsive breakpoints)
- [ ] Dark mode works if project supports it (no hardcoded colors, uses design tokens)

### Security
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] User-generated content escaped before rendering
- [ ] No sensitive data in URL params, localStorage, or console.log
- [ ] External URLs validated with URL constructor — no open redirect vectors

### Testing
- [ ] Tests query by role/label, not by test ID or CSS class
- [ ] Key user interactions covered (click, type, submit, navigate)
- [ ] Error and edge cases tested (network failure, empty data, max-length input)
- [ ] No snapshot tests for component output (use visual regression instead)
- [ ] Accessibility assertions included (e.g., `toBeAccessible()` or axe-core integration)

### Bundle & Dependencies
- [ ] No new dependency >20KB gzipped without team discussion
- [ ] No duplicate packages (check with `npm ls <package>`)
- [ ] Imports are specific (`import { Button } from './Button'`), not barrel file imports
- [ ] Tree-shakeable: no side effects in module scope
