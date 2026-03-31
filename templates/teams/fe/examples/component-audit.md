---
name: Component Audit Example
description: Example output of a frontend component audit report
skillRef: component-audit
tags: [fe, performance, accessibility]
---

# Example: Component Audit Report

## Component: `<DataTable>`

### Summary
| Metric | Status | Notes |
|--------|--------|-------|
| Bundle size | ⚠️ Warning | 42 KB gzipped (target: <30 KB) |
| Render performance | ✅ Pass | 16ms initial, 4ms re-render (1000 rows) |
| Accessibility | ❌ Fail | Missing `aria-sort` on sortable columns |
| Test coverage | ✅ Pass | 87% line coverage |

### Issues Found

1. **[P1] Missing aria-sort on sortable columns**
   - Impact: Screen readers cannot convey sort state
   - Fix: Add `aria-sort="ascending|descending|none"` to `<th>` elements
   - Effort: Small (< 1 hour)

2. **[P2] Bundle size exceeds target**
   - Impact: Adds ~12 KB over budget to page load
   - Root cause: Inline SVG icons (14 KB) not tree-shaken
   - Fix: Replace inline SVGs with icon sprite or lazy-load
   - Effort: Medium (2-4 hours)

### Recommendations
- Address P1 before next release (accessibility compliance)
- Schedule P2 for next sprint (performance budget)
