# Frontend Testing

## Testing Philosophy

- Test **behavior**, not implementation. "When user clicks Submit, success message appears" — not "when handler fires, setState is called".
- Query by **role/label** (`getByRole('button', { name: 'Submit' })`), not test ID or CSS class.
- **Snapshot tests are banned** for component output. They break on every style change and catch nothing. Use visual regression (Chromatic/Percy) instead.
- Every **bug fix** must include a test that would have caught the bug.

## Test Structure (AAA Pattern)

```typescript
it('should show error message when login fails', async () => {
  // Arrange
  server.use(
    http.post('/api/login', () => HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
  );

  // Act
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
  await userEvent.type(screen.getByLabelText('Password'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  // Assert
  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
});
```

## What to Test at Each Level

**Unit tests** (fastest, most):
- Pure utility functions (formatDate, calculateTotal, validateEmail)
- Custom hooks (useDebounce, useLocalStorage)
- State reducers and store logic

**Integration tests** (most valuable):
- Component renders correctly with props
- User interactions trigger correct behavior
- Form submission with validation
- Data fetching and display (mock API with MSW)
- Error states and loading states

**E2E tests** (fewest, critical paths only):
- Login → Dashboard flow
- Complete purchase/checkout
- Multi-step form submission
- Cross-page navigation with state persistence

## Mocking Strategy

**Use MSW (Mock Service Worker)** for API mocking — intercepts at network level:
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => HttpResponse.json([
    { id: 1, name: 'Alice' },
  ])),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Never mock**:
- React itself (useState, useEffect)
- Internal component methods
- CSS/styles
- The component you're testing

**Do mock**:
- External API calls (MSW)
- Browser APIs (IntersectionObserver, ResizeObserver, matchMedia)
- Time (`vi.useFakeTimers()`)
- Navigation (`vi.mock('next/navigation')`)

## Accessibility Testing in Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<UserProfile />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Testing Async Behavior

```typescript
// Wait for element to appear (API response, animation)
expect(await screen.findByText('User loaded')).toBeInTheDocument();

// Wait for element to disappear (loading state)
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

// Assert something does NOT appear (use queryBy, not getBy)
expect(screen.queryByText('Error')).not.toBeInTheDocument();
```

## Common Testing Mistakes

- `getByTestId` when `getByRole` or `getByLabelText` works — test IDs don't verify accessibility
- Testing implementation: `expect(mockFn).toHaveBeenCalledWith(...)` for every internal call
- Not testing keyboard navigation for interactive components
- Hardcoded delays: `await new Promise(r => setTimeout(r, 1000))` — use `findBy` queries
- Testing third-party library behavior instead of your integration with it
