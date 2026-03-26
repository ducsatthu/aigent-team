# CSS & Styling

## Tailwind Conventions

- Tailwind is the default styling approach. Use utility classes directly in JSX.
- Use `@apply` sparingly — only in base component styles where utilities exceed 6 classes:
  ```css
  /* OK: Complex base style */
  .btn-primary { @apply px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus-visible:ring-2; }

  /* BAD: Simple style that should stay as utilities */
  .my-margin { @apply mt-4; }
  ```
- **Never hardcode colors/spacing** — use Tailwind's design tokens:
  ```tsx
  // BAD
  <div style={{ color: '#3B82F6', padding: '16px' }}>
  // GOOD
  <div className="text-blue-500 p-4">
  ```

## Design Tokens

All visual values come from the design system / Tailwind config:
- Colors: `text-primary`, `bg-surface`, `border-muted` — defined in `tailwind.config`
- Spacing: Tailwind's scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px)
- Typography: `text-sm`, `text-base`, `text-lg` — consistent scale
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg` — predefined elevation
- Radii: `rounded`, `rounded-lg`, `rounded-full` — consistent corner rounding

## Z-Index Scale

Define in Tailwind config, use semantic names:
```javascript
zIndex: {
  dropdown: '100',
  sticky: '200',
  overlay: '300',
  modal: '400',
  toast: '500',
  tooltip: '600',
}
```
**Never use arbitrary z-index** (`z-[9999]`). If you need a new level, add it to the scale.

## Responsive Design

- **Mobile-first**: Write base styles for mobile, add `md:` and `lg:` for larger screens
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)
- **Test at**: 320px (small mobile), 375px (iPhone), 768px (iPad), 1024px (laptop), 1440px (desktop)
- Use `clamp()` for fluid typography: `font-size: clamp(1rem, 2.5vw, 1.5rem)`
- No horizontal scrollbar at any viewport width

## CSS Modules (if not using Tailwind)

- File naming: `Component.module.css`
- Class naming: BEM-like — `.card`, `.card__header`, `.card--highlighted`
- Import as object: `import styles from './Button.module.css'`
- Composition over nesting:
  ```css
  .button { /* base */ }
  .primary { composes: button; /* extends */ }
  ```

## Dark Mode

- Use CSS variables for all colors:
  ```css
  :root { --bg-primary: #ffffff; --text-primary: #111827; }
  .dark { --bg-primary: #111827; --text-primary: #f9fafb; }
  ```
- Tailwind: `dark:bg-gray-900 dark:text-white`
- Test both modes for every component — screenshots in Storybook
- Respect `prefers-color-scheme` for default, allow user override

## Animation

- Respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Use CSS transitions for simple state changes (hover, focus, open/close)
- Use Framer Motion for complex animations (mount/unmount, layout, gestures)
- Animation should serve UX (guide attention, show relationships) — not decoration
