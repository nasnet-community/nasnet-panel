---
sidebar_position: 12
title: Accessibility Patterns
---

# Accessibility Patterns in NasNetConnect

**Reference:** `libs/state/stores/src/a11y/a11y-provider.tsx` | `libs/core/utils/src/hooks/useReducedMotion.ts` | WCAG 2.1 AAA Compliance

NasNetConnect implements a comprehensive accessibility (a11y) system that detects and respects user preferences for reduced motion, high contrast, and keyboard navigation. This guide documents the accessibility infrastructure, available hooks, and compliance patterns.

## Table of Contents

- [A11yProvider Architecture](#a11yprovider-architecture)
- [A11yContextValue Interface](#a11ycontextvalue-interface)
- [Available Hooks](#available-hooks)
- [Standalone useReducedMotion Hook](#standalone-usereducedmotion-hook)
- [WCAG AAA Compliance Checklist](#wcag-aaa-compliance-checklist)
- [Data Attributes for CSS Targeting](#data-attributes-for-css-targeting)
- [Testing Accessibility](#testing-accessibility)
- [Code Examples](#code-examples)

---

## A11yProvider Architecture

The `A11yProvider` is a React context provider that wraps the entire application tree and provides accessibility state to all components. It detects user preferences at runtime and maintains reactive state for motion, contrast, and keyboard usage.

### Setup

The provider must be placed at your application root:

```typescript
// apps/connect/src/routes/__root.tsx
import { A11yProvider } from '@nasnet/state/stores';

function Root() {
  return (
    <A11yProvider>
      <YourApp />
    </A11yProvider>
  );
}
```

### Context Architecture

The provider uses React Context (`createContext`) with a null default to enforce provider presence:

```typescript
const A11yContext = createContext<A11yContextValue | null>(null);
```

This architecture ensures:
- **Type safety**: Null context forces provider usage
- **SSR compatibility**: `isBrowser()` checks prevent hydration errors
- **Performance**: Context value is memoized to prevent unnecessary re-renders
- **Error handling**: Helpful error message if hooks are used outside provider

### SSR Safety

All browser APIs are guarded with `isBrowser()` checks to support Server-Side Rendering:

```typescript
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getInitialReducedMotion(): boolean {
  if (!isBrowser()) return false;  // Safe default during SSR
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

---

## A11yContextValue Interface

The context provides five key properties and methods:

```typescript
export interface A11yContextValue {
  reducedMotion: boolean;
  highContrast: boolean;
  keyboardUser: boolean;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}
```

### reducedMotion: boolean

**Detection:** Based on `prefers-reduced-motion: reduce` media query

Indicates whether the user has enabled reduced motion in their operating system settings (System Preferences > Accessibility > Display on macOS, Settings > Ease of Access > Display on Windows).

When `true`, animations should be disabled or significantly reduced:

```typescript
function AnimatedButton() {
  const { reducedMotion } = useA11y();

  return (
    <motion.button
      animate={reducedMotion ? {} : { scale: 1.05 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      Click Me
    </motion.button>
  );
}
```

**Reactive:** Updated in real-time if user changes system preferences while app is running.

### highContrast: boolean

**Detection:** Based on `prefers-contrast: more` media query

Indicates whether the user has enabled high contrast mode in their operating system accessibility settings.

When `true`, use enhanced contrast colors from design tokens:

```typescript
function TextBlock() {
  const { highContrast } = useA11y();

  return (
    <p className={highContrast ? 'text-high-contrast' : 'text-normal'}>
      Content
    </p>
  );
}
```

### keyboardUser: boolean

**Detection:** Tab key pressed → `true` | Mouse/touch used → `false`

Tracks whether the user is navigating with keyboard only or using mouse/touch. Useful for showing focus rings only when needed (avoid "keyboard user, no focus ring" problem).

```typescript
function FocusableElement() {
  const { keyboardUser } = useA11y();

  return (
    <button
      className={keyboardUser ? 'show-focus-ring' : ''}
      onKeyDown={() => /* handle keyboard */}
    >
      Button
    </button>
  );
}
```

**CSS Example:**

```css
/* Only show focus ring for keyboard users */
[data-keyboard-user] button:focus {
  outline: 3px solid var(--focus-ring-color);
  outline-offset: 2px;
}

/* Mouse users don't see focus ring */
button:focus {
  outline: none;
}
```

### announce: (message, priority?) => void

**Screen Reader Announcements**

Sends messages to screen readers via an aria-live region. Use for dynamic content changes:

```typescript
function FormWithAsync() {
  const { announce } = useA11y();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    announce('Validating form, please wait...', 'polite');

    try {
      await submitForm();
      announce('Form submitted successfully', 'assertive');
    } catch {
      announce('Form submission failed', 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

**Priority Levels:**
- `'polite'` (default): Waits for screen reader to finish reading current content
- `'assertive'`: Interrupts screen reader immediately (use for critical errors)

---

## Available Hooks

### useA11y() — Full Context Access

Provides access to the entire accessibility context. Throws an error if used outside `A11yProvider`.

```typescript
import { useA11y } from '@nasnet/state/stores';

function Component() {
  const { reducedMotion, highContrast, keyboardUser, announce } = useA11y();

  return <div>All accessibility features</div>;
}
```

**Error Handling:**

```typescript
// This will throw:
// "useA11y must be used within an A11yProvider"
function ComponentOutsideProvider() {
  const a11y = useA11y();  // ❌ Error
}
```

### useA11yOptional() — Nullable Access

Returns the full context or `null` if outside provider. Useful for optional accessibility features:

```typescript
function OptionalA11yComponent() {
  const a11y = useA11yOptional();

  if (!a11y) {
    // Provider not available, use defaults
    return <div>Default behavior</div>;
  }

  return <div>Enhanced a11y features</div>;
}
```

### useReducedMotion() — Selector Hook

Returns only the `reducedMotion` boolean. Optimized for components that only need this one value:

```typescript
import { useReducedMotion } from '@nasnet/state/stores';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <div className={reducedMotion ? 'no-animation' : 'animated'}>
      Content
    </div>
  );
}
```

**Performance Note:** Selector hooks reduce re-render churn by only subscribing to the specific value they need.

### useKeyboardUser() — Selector Hook

Returns only the `keyboardUser` boolean:

```typescript
import { useKeyboardUser } from '@nasnet/state/stores';

function FocusRingComponent() {
  const keyboardUser = useKeyboardUser();

  return (
    <button className={keyboardUser ? 'show-focus' : ''}>
      Keyboard Accessible Button
    </button>
  );
}
```

### useHighContrast() — Selector Hook

Returns only the `highContrast` boolean:

```typescript
import { useHighContrast } from '@nasnet/state/stores';

function HighContrastComponent() {
  const highContrast = useHighContrast();

  return (
    <div className={highContrast ? 'high-contrast-mode' : 'normal-mode'}>
      Content
    </div>
  );
}
```

### useAnnounce() — Selector Hook

Returns only the `announce` function:

```typescript
import { useAnnounce } from '@nasnet/state/stores';

function AlertComponent() {
  const announce = useAnnounce();

  const handleAlert = () => {
    announce('Important alert message', 'assertive');
  };

  return <button onClick={handleAlert}>Trigger Alert</button>;
}
```

---

## Standalone useReducedMotion Hook

The `@nasnet/core/utils` package exports a standalone `useReducedMotion` hook that does NOT require a provider. This is useful for utility libraries or non-React contexts.

### useReducedMotion() — React Hook

```typescript
import { useReducedMotion } from '@nasnet/core/utils/hooks';

function Component() {
  const prefersReducedMotion = useReducedMotion();

  // This hook sets up an event listener and returns true/false
  // Safe to use without A11yProvider
  return <div>Uses media query directly</div>;
}
```

**Key Differences from A11yProvider version:**
- No provider required
- Sets up its own event listeners
- Safe to use in utility libraries
- Returns false during SSR (default)

### getReducedMotionPreference() — Static Check

```typescript
import { getReducedMotionPreference } from '@nasnet/core/utils/hooks';

// Use at module level or outside React
const prefersReduced = getReducedMotionPreference();
const animationDuration = prefersReduced ? 0 : 300;

// Define animation config
const animationConfig = {
  duration: animationDuration,
  easing: prefersReduced ? 'linear' : 'cubic-bezier(0.4, 0, 0.2, 1)',
};
```

**When to Use:**
- CSS-in-JS configuration at module level
- Non-React contexts (event handlers, utility functions)
- One-time checks (not reactive)
- Browser polyfills

**Browser Compatibility:**

Both modern (`addEventListener`) and legacy (`addListener`/`removeListener`) media query APIs are supported:

```typescript
if (mediaQuery.addEventListener) {
  mediaQuery.addEventListener('change', handler);
} else {
  // Fallback for older browsers
  mediaQuery.addListener(handler);
}
```

---

## WCAG AAA Compliance Checklist

When using `libs/core` in your components, ensure you meet these WCAG 2.1 Level AAA requirements:

### Color Contrast (7:1 ratio)

- Use semantic design tokens (not raw color values)
- Test contrast with tools like WebAIM Contrast Checker
- Verify all interactive elements pass 7:1 contrast ratio

```typescript
// Good - uses semantic tokens with guaranteed contrast
<button className="bg-primary text-primary-foreground">
  Accessible Button
</button>

// Bad - arbitrary color values may not meet WCAG AAA
<button className="bg-blue-400 text-blue-50">
  May fail contrast check
</button>
```

### Touch Target Size (44px minimum)

- All interactive elements must be at least 44x44 pixels
- Account for padding, not just the content
- Use platform presenters to ensure mobile components meet this

```typescript
// Mobile: 44px touch target
<button className="p-3 h-11 w-11">Icon Button</button>

// Desktop: Can be smaller
<button className="p-1 h-6 w-6">Desktop Icon</button>
```

### Focus Indicators (3px ring)

- Show focus ring only for keyboard users
- Use consistent focus color across all components
- Ensure 3px outline or ring

```typescript
// Use data attribute set by A11yProvider
[data-keyboard-user] button:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Semantic HTML + ARIA Labels

- Use semantic elements: `<button>`, `<nav>`, `<article>`, etc.
- Add ARIA labels for icon-only buttons
- Use aria-live for dynamic content

```typescript
function IconButton() {
  return (
    <button aria-label="Close menu">
      <XIcon />
    </button>
  );
}
```

### Full Keyboard Navigation

- All interactive elements must be reachable via Tab key
- Implement focus management in modals/menus
- Use tabindex strategically (avoid tabindex > 0)

### Reduced Motion Support

- Use the `useReducedMotion()` hook to disable animations
- Provide keyboard alternatives to gesture interactions
- Test with `prefers-reduced-motion: reduce` enabled

```typescript
function MotionComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={reducedMotion ? {} : { scale: 1.1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

---

## Data Attributes for CSS Targeting

The provider automatically sets data attributes on `document.documentElement` for CSS-based accessibility:

### data-keyboard-user

Set to `"true"` when user presses Tab key, removed when mouse/touch is used:

```html
<!-- When keyboard user -->
<html data-keyboard-user="true">

<!-- When mouse/touch user -->
<html>
```

**CSS Usage:**

```css
/* Show focus ring only for keyboard users */
[data-keyboard-user] :focus-visible {
  outline: 3px solid var(--color-focus);
}

/* Hide focus ring for mouse users */
:focus-visible {
  outline: none;
}
```

### data-reduced-motion

Set to `"true"` when user has `prefers-reduced-motion: reduce` enabled, removed otherwise:

```html
<!-- When reduced motion is preferred -->
<html data-reduced-motion="true">

<!-- When animations are allowed -->
<html>
```

**CSS Usage:**

```css
[data-reduced-motion] * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

---

## Testing Accessibility

### Mocking prefers-reduced-motion in Tests

```typescript
import { useReducedMotion } from '@nasnet/state/stores';
import { render } from '@testing-library/react';
import { A11yProvider } from '@nasnet/state/stores';

describe('Reduced Motion', () => {
  it('disables animations when reduced motion is preferred', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { getByRole } = render(
      <A11yProvider>
        <AnimatedComponent />
      </A11yProvider>
    );

    const button = getByRole('button');
    // Assert animation is disabled
    expect(button).toHaveClass('no-animation');
  });
});
```

### axe-core Testing

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { A11yProvider } from '@nasnet/state/stores';

expect.extend(toHaveNoViolations);

it('passes accessibility audit', async () => {
  const { container } = render(
    <A11yProvider>
      <YourComponent />
    </A11yProvider>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Code Examples

### Complete Accessible Form Example

```typescript
import { A11yProvider, useA11y } from '@nasnet/state/stores';
import { useFormPersistence } from '@nasnet/core/forms';

function AccessibleForm() {
  const { announce } = useA11y();
  const form = useZodForm({ schema, defaultValues });
  const { clearPersistence } = useFormPersistence({
    form,
    storageKey: 'accessible-form',
  });

  const onSubmit = async (data) => {
    announce('Submitting form...', 'polite');
    try {
      await submitForm(data);
      announce('Form submitted successfully', 'assertive');
      clearPersistence();
    } catch (error) {
      announce(`Error: ${error.message}`, 'assertive');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label htmlFor="name">Name *</label>
      <input
        id="name"
        type="text"
        aria-required="true"
        {...form.register('name')}
      />
      {form.formState.errors.name && (
        <span role="alert">{form.formState.errors.name.message}</span>
      )}

      <button type="submit" aria-label="Submit form">
        Submit
      </button>
    </form>
  );
}

// Root component
function App() {
  return (
    <A11yProvider>
      <AccessibleForm />
    </A11yProvider>
  );
}
```

### Responsive Animation Component

```typescript
import { useReducedMotion } from '@nasnet/state/stores';
import { motion } from 'framer-motion';

function StatusIndicator({ status }: { status: 'online' | 'offline' }) {
  const reducedMotion = useReducedMotion();

  const pulseVariants = reducedMotion
    ? {}
    : {
        animate: { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] },
        transition: {
          duration: 2,
          repeat: Infinity,
        },
      };

  return (
    <motion.div
      className={`status-indicator ${status}`}
      {...pulseVariants}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
}
```

### Screen Reader Announcement on Data Change

```typescript
import { useAnnounce } from '@nasnet/state/stores';
import { useQuery } from '@apollo/client';

function RealTimeDataComponent() {
  const announce = useAnnounce();
  const { data, refetch } = useQuery(QUERY);

  useEffect(() => {
    if (data?.hasUpdates) {
      announce(`New data available: ${data.updateCount} items updated`, 'polite');
    }
  }, [data?.hasUpdates, announce]);

  return <div>{/* Component UI */}</div>;
}
```

---

## Related Guides

- **WCAG AAA Compliance:** See `Docs/design/ux-design/8-responsive-design-accessibility.md`
- **Design Tokens:** See `Docs/design/DESIGN_TOKENS.md` for semantic color tokens
- **Platform Presenters:** See `Docs/design/PLATFORM_PRESENTER_GUIDE.md` for responsive design patterns
