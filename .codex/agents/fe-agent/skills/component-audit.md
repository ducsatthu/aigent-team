# Skill: Component Audit

**Trigger**: When reviewing component library health, finding duplicates, or preparing for a design system migration.

## Steps

1. **Inventory components** — List all component files:
   ```bash
   find src/components -name "*.tsx" -o -name "*.jsx" | sort
   ```

2. **Check for duplicates** — Find components with similar names or functionality:
   - Search for components with overlapping names (e.g., `Button`, `Btn`, `ActionButton`)
   - Compare prop interfaces for similarity
   - Check for copy-pasted components across feature directories

3. **Measure usage** — For each component, count imports:
   ```bash
   grep -r "from.*ComponentName" src/ --include="*.tsx" --include="*.ts" | wc -l
   ```

4. **Assess quality** — For each component check:
   - Has proper TypeScript props interface (no `any`)
   - Has `ref` forwarding where appropriate
   - Handles all visual states (loading, error, empty, disabled)
   - Has ARIA attributes for interactive elements
   - Has tests

5. **Identify dead components** — Components with 0 imports (excluding entry points and stories)

6. **Generate report** — Categorize components as:
   - **Healthy**: typed, tested, accessible, used
   - **Needs attention**: missing tests, missing a11y, or partial types
   - **Candidate for removal**: unused or duplicated

## Expected Output

- Component inventory table (name, location, import count, quality score)
- List of duplicate/overlapping components with merge recommendations
- List of dead components safe to remove
- Priority list of components needing quality improvements
