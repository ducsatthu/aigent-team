# Accessibility (WCAG 2.1 AA)

## Keyboard Navigation

Every interactive element must be operable via keyboard:
- **Tab**: Move focus to next interactive element
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate buttons, links, checkboxes
- **Escape**: Close modals, dropdowns, tooltips
- **Arrow keys**: Navigate within lists, menus, tabs, radio groups
- **Home/End**: Jump to first/last item in list

**Focus management rules:**
- Focus order must match visual order (no `tabindex > 0`)
- Modals trap focus — Tab cycles within modal, cannot escape to background
- After modal closes, focus returns to the element that opened it
- After deleting an item, focus moves to next item or parent container
- Skip links: first Tab stop on page should be "Skip to main content"

**Visible focus indicator:**
```css
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
/* Never: *:focus { outline: none; } */
```

## ARIA Attributes

**Use semantic HTML first** — ARIA is a last resort when HTML semantics are insufficient:
```html
<!-- GOOD: semantic HTML, no ARIA needed -->
<button>Submit</button>
<nav><ul>...</ul></nav>

<!-- BAD: div with ARIA role -->
<div role="button" tabindex="0" onclick="...">Submit</div>
```

**Common ARIA patterns:**
- `aria-label`: Label for elements without visible text (icon buttons)
- `aria-labelledby`: Reference another element as label
- `aria-describedby`: Additional description (error messages, help text)
- `aria-expanded`: Toggle state for accordions, dropdowns
- `aria-live="polite"`: Announce dynamic content changes (toast, status)
- `aria-hidden="true"`: Hide decorative elements from screen readers
- `role="alert"`: Immediately announce urgent messages

**Dynamic content announcement:**
```tsx
// Status messages read by screen reader
<div aria-live="polite" aria-atomic="true">
  {submitStatus === 'success' && 'Form submitted successfully'}
  {submitStatus === 'error' && 'Submission failed. Please try again.'}
</div>
```

## Color & Contrast

- Text contrast: minimum 4.5:1 ratio (3:1 for large text ≥ 24px)
- UI component contrast: minimum 3:1 against background
- Never rely on color alone to convey information — add icons, text, or patterns
- Test with color blindness simulators (Chrome DevTools → Rendering → Emulate vision deficiency)

## Touch Targets

- Minimum 44x44px for all interactive elements on mobile
- Adequate spacing between targets (minimum 8px gap)
- Inline links within text paragraphs are exempt but should have generous padding

## Testing

**Automated (catches ~30% of issues):**
- axe-core: `npm run test:a11y` or Storybook axe addon
- Lighthouse accessibility audit (target: 100 score)
- eslint-plugin-jsx-a11y for static analysis

**Manual (catches remaining ~70%):**
- **Keyboard test**: Unplug mouse, navigate entire feature with keyboard only
- **Screen reader test**: VoiceOver (Mac), NVDA (Windows), or TalkBack (Android)
- **Zoom test**: 200% browser zoom — no content clipped or overlapping
- **Reduced motion**: `prefers-reduced-motion` media query respected — no essential animations

## Common Mistakes

- `<div onClick>` instead of `<button>` — div has no keyboard support, no role, no focus
- Placeholder text as the only label — disappears on input, not announced by all screen readers
- Auto-playing video/audio without controls or mute option
- Form errors only shown on submit — show inline on blur
- Modal without focus trap — user tabs into background content
- Image carousel without pause control and keyboard navigation
