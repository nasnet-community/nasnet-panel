# Accessibility (a11y) Provider

The A11y Provider detects and provides user accessibility preferences throughout the application. It implements WCAG 2.1 AAA guidelines and tracks user input method (keyboard vs mouse) for smart focus management.

**Source:** `libs/state/stores/src/a11y/a11y-provider.tsx`

## Overview

The A11y Provider wraps your app and detects:
- **Reduced Motion**: User prefers `prefers-reduced-motion: reduce` (respects motion sensitivity)
- **High Contrast**: User prefers `prefers-contrast: more` (for accessibility/visibility)
- **Keyboard User**: User navigates with Tab key (for focus ring visibility)
- **Screen Reader Support**: Aria-live announcements for screen readers

## Setup

### Wrap App in A11yProvider

```typescript
// apps/connect/src/routes/__root.tsx
import { A11yProvider } from '@nasnet/state/stores';

export function RootLayout() {
  return (
    <A11yProvider>
      <AppHeader />
      <AppSidebar />
      <MainContent />
    </A11yProvider>
  );
}
```

## API Reference

### A11yContextValue Interface

```typescript
interface A11yContextValue {
  /**
   * User prefers reduced motion (true = disable animations)
   * Based on `prefers-reduced-motion: reduce` media query
   * @example
   * if (reducedMotion) {
   *   disableAnimation();
   * }
   */
  reducedMotion: boolean;

  /**
   * User prefers high contrast mode (true = use high contrast)
   * Based on `prefers-contrast: more` media query
   * @example
   * className={highContrast ? 'high-contrast' : 'normal-contrast'}
   */
  highContrast: boolean;

  /**
   * User is navigating with keyboard (Tab key)
   * False when mouse or touch is used
   * @example
   * className={keyboardUser ? 'show-focus-ring' : ''}
   */
  keyboardUser: boolean;

  /**
   * Announce a message to screen readers via aria-live region
   * @param message - Message text
   * @param priority - 'polite' (waits) or 'assertive' (interrupts)
   * @example
   * announce('Loading complete', 'assertive');
   */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}
```

## Hooks

### useA11y() - Complete Context

Access all accessibility state and functions:

```typescript
import { useA11y } from '@nasnet/state/stores';

function AnimatedButton({ children }) {
  const { reducedMotion, keyboardUser, announce } = useA11y();

  return (
    <motion.button
      whileHover={reducedMotion ? {} : { scale: 1.05 }}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      className={keyboardUser ? 'show-focus-ring' : ''}
      onClick={() => announce('Button clicked')}
    >
      {children}
    </motion.button>
  );
}
```

**Throws error if used outside A11yProvider.** Use `useA11yOptional()` if component might not be wrapped.

### useA11yOptional() - Safe Hook

Returns context or null if outside provider:

```typescript
import { useA11yOptional } from '@nasnet/state/stores';

function OptionalA11y() {
  const a11y = useA11yOptional();

  if (!a11y) {
    return <div>Using default behavior (not wrapped in A11yProvider)</div>;
  }

  return <div>Reduced motion: {a11y.reducedMotion}</div>;
}
```

### useReducedMotion() - Optimized Selector

Get reduced motion state only (avoids re-render on other changes):

```typescript
import { useReducedMotion } from '@nasnet/state/stores';

function SmoothTransition() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      style={{
        transition: reducedMotion ? 'none' : 'opacity 0.3s ease-in-out',
      }}
    >
      Content
    </div>
  );
}
```

### useKeyboardUser() - Optimized Selector

Detect keyboard-only navigation:

```typescript
import { useKeyboardUser } from '@nasnet/state/stores';

function SmartFocusRing() {
  const keyboardUser = useKeyboardUser();

  // Focus ring visible only for keyboard users (WCAG AAA)
  return (
    <button
      className={keyboardUser ? 'focus-ring-visible' : 'focus-ring-hidden'}
    >
      Click me
    </button>
  );
}
```

### useHighContrast() - Optimized Selector

Detect high contrast mode:

```typescript
import { useHighContrast } from '@nasnet/state/stores';

function ContrastAwareText() {
  const highContrast = useHighContrast();

  return (
    <span
      className={highContrast ? 'text-high-contrast' : 'text-normal'}
    >
      Accessible text
    </span>
  );
}
```

### useAnnounce() - Optimized Selector

Access screen reader announcements:

```typescript
import { useAnnounce } from '@nasnet/state/stores';

function NotificationBadge({ count }) {
  const announce = useAnnounce();

  useEffect(() => {
    if (count > 0) {
      // Announce immediately to screen readers
      announce(`${count} new notifications`, 'assertive');
    }
  }, [count, announce]);

  return <span aria-label={`${count} notifications`}>{count}</span>;
}
```

## Use Cases

### 1. Respecting Reduced Motion

```typescript
import { useReducedMotion } from '@nasnet/state/stores';
import { motion } from 'framer-motion';

function LoadingSpinner() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={
        reducedMotion
          ? { duration: 0 }  // No animation
          : { duration: 1, repeat: Infinity }
      }
    >
      <Spinner />
    </motion.div>
  );
}
```

### 2. Smart Focus Rings

```typescript
import { useKeyboardUser } from '@nasnet/state/stores';

function InteractiveButton() {
  const keyboardUser = useKeyboardUser();

  // Only show focus ring for keyboard users (WCAG AAA)
  // Avoids "ugly" focus ring for mouse users
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        keyboardUser && 'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      )}
    >
      Action
    </button>
  );
}
```

### 3. High Contrast Styling

```typescript
import { useHighContrast } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/utils';

function StatusIndicator({ status }) {
  const highContrast = useHighContrast();

  return (
    <span
      className={cn(
        'px-3 py-1 rounded text-sm font-medium',
        status === 'online'
          ? highContrast
            ? 'bg-black text-lime-300' // High contrast
            : 'bg-green-100 text-green-800' // Normal contrast
          : highContrast
          ? 'bg-black text-red-300'
          : 'bg-red-100 text-red-800'
      )}
    >
      {status}
    </span>
  );
}
```

### 4. Screen Reader Announcements

```typescript
import { useAnnounce } from '@nasnet/state/stores';
import { useEffect } from 'react';

function ConfigurationSaved({ isSuccess, message }) {
  const announce = useAnnounce();

  useEffect(() => {
    if (isSuccess) {
      // Immediately announce success to screen readers
      announce(message, 'assertive');
    }
  }, [isSuccess, message, announce]);

  return (
    <Alert type={isSuccess ? 'success' : 'error'}>
      {message}
    </Alert>
  );
}
```

### 5. Combined Accessibility

```typescript
import { useA11y } from '@nasnet/state/stores';
import { motion } from 'framer-motion';

function DataTable() {
  const { reducedMotion, keyboardUser, announce } = useA11y();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
      className={keyboardUser ? 'focus-visible-rows' : ''}
      role="region"
      aria-live="polite"
      aria-label="Data table"
      onLoad={() => announce('Table loaded with 50 rows', 'polite')}
    >
      <table>
        {/* Table content */}
      </table>
    </motion.div>
  );
}
```

## How It Works

### Media Query Detection

The A11y Provider detects user OS/browser settings:

```typescript
// Reduced motion (respects motion sensitivity)
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
reducedMotion = mq.matches; // true if user enabled

// High contrast (accessibility/visibility preference)
const mq = window.matchMedia('(prefers-contrast: more)');
highContrast = mq.matches; // true if user enabled
```

### Keyboard User Detection

Tracks user input method:

```typescript
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    setKeyboardUser(true); // User pressed Tab = keyboard navigation
  }
});

window.addEventListener('mousedown', () => {
  setKeyboardUser(false); // User clicked mouse = reset to mouse user
});

window.addEventListener('touchstart', () => {
  setKeyboardUser(false); // User touched = reset to touch user
});
```

### Data Attributes for CSS

The provider sets document attributes for CSS targeting:

```typescript
// When keyboard user
document.documentElement.setAttribute('data-keyboard-user', 'true');

// When reduced motion
document.documentElement.setAttribute('data-reduced-motion', 'true');

// When high contrast
// (managed by media query, CSS reads via prefers-contrast)
```

### Screen Reader Announcements

Uses aria-live region for screen readers:

```tsx
<div
  role="status"
  aria-live={announcement?.priority ?? 'polite'}
  aria-atomic="true"
  className="sr-only" // Visually hidden
>
  {announcement?.message}
</div>
```

## CSS Integration

### Data Attributes

```css
/* Apply styles based on keyboard user */
[data-keyboard-user='true'] button:focus {
  outline: 3px solid #4f46e5;
  outline-offset: 2px;
}

/* Disable animations for reduced motion users */
[data-reduced-motion='true'] * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Media queries for high contrast */
@media (prefers-contrast: more) {
  .badge {
    border: 2px solid currentColor;
  }

  .text {
    font-weight: 600;
  }
}
```

## WCAG AAA Compliance

The A11y Provider helps achieve WCAG AAA compliance:

| Criterion | How A11y Provider Helps |
|-----------|------------------------|
| **2.3.3 Animation from Interactions** | `reducedMotion` hook disables animations |
| **2.4.7 Focus Visible** | `keyboardUser` hook shows focus only for keyboard |
| **1.4.3 Contrast** | `highContrast` hook enables high-contrast styles |
| **1.4.11 Non-text Contrast** | Implement using `highContrast` state |
| **4.1.3 Status Messages** | `announce()` function for aria-live announcements |

## Browser Support

| Feature | Browser Support |
|---------|-----------------|
| `prefers-reduced-motion` | Modern browsers (Chrome 74+, Firefox 63+, Safari 10.1+) |
| `prefers-contrast` | Modern browsers (Chrome 96+, Firefox 101+, Safari 15.4+) |
| Media queries API | All modern browsers |
| Keyboard/mouse detection | All modern browsers |

## Testing

### Test Reduced Motion

```typescript
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '@nasnet/state/stores';
import { A11yProvider } from '@nasnet/state/stores';

test('detects reduced motion preference', () => {
  // Mock matchMedia
  window.matchMedia = jest.fn((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));

  const { result } = renderHook(() => useReducedMotion(), {
    wrapper: A11yProvider,
  });

  expect(result.current).toBe(true);
});
```

### Test Keyboard User Detection

```typescript
test('detects keyboard user', () => {
  const { result } = renderHook(() => useKeyboardUser(), {
    wrapper: A11yProvider,
  });

  // Initially not keyboard user
  expect(result.current).toBe(false);

  // Simulate Tab key
  fireEvent.keyDown(window, { key: 'Tab' });

  // Now keyboard user
  expect(result.current).toBe(true);

  // Simulate mouse click
  fireEvent.mouseDown(window);

  // Back to mouse user
  expect(result.current).toBe(false);
});
```

### Test Screen Reader Announcements

```typescript
test('announces messages to screen readers', () => {
  const { result } = renderHook(() => useAnnounce(), {
    wrapper: A11yProvider,
  });

  const announce = result.current;

  // Announce message
  announce('Loading complete', 'assertive');

  // Check aria-live region updated
  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toHaveTextContent('Loading complete');
  expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
});
```

## Summary

The A11y Provider:

1. **Detects preferences** via `prefers-reduced-motion` and `prefers-contrast` media queries
2. **Tracks input method** (keyboard vs mouse) for smart focus rings
3. **Provides hooks** (`useA11y`, `useReducedMotion`, `useKeyboardUser`, `useAnnounce`)
4. **Enables WCAG AAA compliance** through accessible styling and screen reader support
5. **Respects user choices** by integrating with OS/browser accessibility settings

Use it to build applications that are accessible to users with motion sensitivity, visual impairment, or those who prefer keyboard navigation.
