# State Management

## Decision Tree

```
Is this data from an API?
  YES → React Query / TanStack Query (server state)
  NO → Is it shared across multiple components?
    YES → Is it UI-only (theme, sidebar, modal)?
      YES → Zustand / Jotai (global client state)
      NO → Should user be able to bookmark/share this?
        YES → URL search params (useSearchParams)
        NO → Lift state to common parent
    NO → useState (local state)
```

## Server State (React Query / TanStack Query)

**Rule: Never store server data in useState or Zustand.** React Query handles caching, revalidation, deduplication, and stale-while-revalidate out of the box.

```typescript
// GOOD: React Query manages server state
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => api.getUsers(filters),
  staleTime: 5 * 60 * 1000, // 5 min
});

// BAD: Manual state management for server data
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  api.getUsers(filters).then(setUsers).finally(() => setLoading(false));
}, [filters]); // Missing error handling, no caching, no dedup
```

**Optimistic updates** for mutations that affect UI immediately:
```typescript
const mutation = useMutation({
  mutationFn: api.updateUser,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['user', id] });
    const previous = queryClient.getQueryData(['user', id]);
    queryClient.setQueryData(['user', id], newData); // Optimistic
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['user', id], context?.previous); // Rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['user', id] }); // Refetch truth
  },
});
```

## Local State (useState)

For UI-only state that belongs to a single component:
- Form input values (before submission)
- Open/closed state (dropdowns, modals, accordions)
- Active tab, selected item
- Animation/transition state

**Anti-pattern: Derived state in useState**
```typescript
// BAD: Storing derived value
const [filteredUsers, setFilteredUsers] = useState([]);
useEffect(() => {
  setFilteredUsers(users.filter(u => u.active));
}, [users]);

// GOOD: Compute during render
const filteredUsers = useMemo(
  () => users.filter(u => u.active),
  [users]
);
```

## Global Client State (Zustand / Jotai)

Only for cross-component UI state that is NOT from the server:
- Theme (light/dark)
- Sidebar collapsed/expanded
- Toast notification queue
- Global modal state

Keep stores small and focused. One store per concern, not one mega-store.

```typescript
// Zustand store — minimal, focused
const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
```

## URL State (Search Params)

For anything the user should be able to bookmark, share, or navigate back to:
- Search query, filters, sort order
- Pagination (current page)
- Selected tab
- Modal open with specific item (`?modal=edit&id=123`)

```typescript
const [searchParams, setSearchParams] = useSearchParams();
const page = Number(searchParams.get('page')) || 1;
const sort = searchParams.get('sort') || 'created_at:desc';
```

## Common Bugs to Watch

1. **Stale closures**: Reading state inside async callbacks or event listeners that captured an old value. Fix: use `useRef` for mutable values or functional updates `setState(prev => ...)`.
2. **State sync**: Two stores holding the same data that drift apart. Fix: single source of truth.
3. **Unnecessary re-renders**: Parent state change re-renders all children. Fix: move state closer to where it's used, split context, use selectors.
4. **Race conditions**: Multiple rapid state updates (search-as-you-type) causing stale results. Fix: `AbortController` + debounce.
