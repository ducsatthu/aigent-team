---
title: Forms
description: React Hook Form with Zod validation patterns, error handling, and form UX best practices.
whenToRead: When building or reviewing form components and validation logic
tags: [frontend, forms, validation, react-hook-form]
---

# Forms

## Stack: React Hook Form + Zod

Define the Zod schema first — it serves as both validation and TypeScript type:
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
  resolver: zodResolver(loginSchema),
});
```

## Validation UX

- **Field-level**: Validate on blur (when user leaves the field). Show error immediately.
- **Form-level**: Validate on submit. Scroll to first error. Focus the error field.
- **Inline errors**: Show directly below the field, not in a toast or alert banner.
- **Error text**: Explain what's wrong AND how to fix it: "Password must be at least 8 characters" — not just "Invalid password".
- **Submit button**: Never disable for validation. Show errors instead. Disable only during submission (loading state).

## Multi-step Forms

- Persist partial state to sessionStorage or URL params — users who navigate away should not lose data.
- Validate each step before proceeding to next.
- Show progress indicator (step 2 of 4).
- Allow navigation back to previous steps without losing data.
- Final step shows summary for review before submit.

```typescript
// Persist form state to sessionStorage
const { watch, reset } = useForm({ defaultValues: loadFromSession() });

useEffect(() => {
  const subscription = watch((data) => {
    sessionStorage.setItem('checkout-form', JSON.stringify(data));
  });
  return () => subscription.unsubscribe();
}, [watch]);
```

## File Uploads

- Drag-and-drop zone with click-to-browse fallback
- Validate file type and size client-side before upload
- Show upload progress bar (not just spinner)
- Support multiple files if applicable
- Preview for images, file name + size for documents
- Cancel upload action

## Error Handling

- Network error: "Connection failed. Check your internet and try again." + retry button
- Server validation error (422): Map field errors to inline messages
- Timeout: "This is taking longer than expected. Please try again."
- Duplicate submission prevention: Disable submit on click, re-enable on error

## Accessibility

- Every input has a visible `<label>` element (not just placeholder)
- Error messages linked with `aria-describedby`:
  ```tsx
  <input aria-describedby="email-error" aria-invalid={!!errors.email} />
  {errors.email && <span id="email-error" role="alert">{errors.email.message}</span>}
  ```
- Required fields marked with `aria-required="true"` and visible indicator
- Form submission result announced with `aria-live="polite"`
- Tab order follows visual layout — label → input → error → next field
