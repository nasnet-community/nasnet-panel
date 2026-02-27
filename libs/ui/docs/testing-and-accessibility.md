---
sidebar_position: 11
title: Testing & Accessibility
---

# Testing & Accessibility

This document covers the testing infrastructure and WCAG AAA accessibility compliance for
NasNetConnect's UI libraries. Our testing strategy enables rigorous accessibility verification while
supporting rapid iteration through platform-responsive testing utilities.

## Overview

NasNetConnect uses **Vitest** (4x faster than Jest, native ESM) as the test runner with
comprehensive accessibility testing via **axe-core**. All components must pass **WCAG AAA**
compliance (7:1 contrast, 44px touch targets) verified through automated testing.

The testing infrastructure provides three core capabilities:

1. **Accessibility Testing** — Automated WCAG AAA validation via axe-core
2. **Platform-Responsive Testing** — Test components across Mobile, Tablet, and Desktop breakpoints
3. **Touch Target & Keyboard Navigation Verification** — Ensure 44px touch targets and keyboard
   accessibility

## Test Setup & Configuration

### Vitest Configuration

Both `libs/ui/primitives/` and `libs/ui/patterns/` use Vitest configured in `vitest.config.ts`:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
});
```

### Global Setup Files

Two setup files initialize the test environment:

**`libs/ui/primitives/src/test/setup.ts`** — Primitives test setup:

- Extends Vitest with `@testing-library/jest-dom` matchers
- Extends Vitest with `vitest-axe` accessibility matchers (`.toHaveNoViolations()`)
- Mocks `window.matchMedia` for media query testing
- Mocks `ResizeObserver` for responsive component testing

**`libs/ui/patterns/src/test/setup.ts`** — Patterns test setup:

- All of the above, plus:
- Mocks `IntersectionObserver` for lazy-loading components
- Mocks `@nasnet/ui/layouts` platform detection hooks
- Mocks `@nasnet/state/stores` for UI state (theme, connection, sidebar)

### Browser API Mocks

The test environment mocks these browser APIs that aren't available in JSDOM:

| API                    | Purpose                             | Mock Implementation                                  |
| ---------------------- | ----------------------------------- | ---------------------------------------------------- |
| `window.matchMedia`    | Media queries for responsive design | Returns mock MediaQueryList with event handlers      |
| `ResizeObserver`       | Observe element dimension changes   | Mock with `observe()`, `unobserve()`, `disconnect()` |
| `IntersectionObserver` | Lazy-load detection                 | Mock with full API surface                           |

## Test Utilities API

### From `@nasnet/ui/patterns/test/test-utils.tsx`

These utilities wrap `@testing-library/react` with platform detection and provider setup:

#### `renderWithProviders(ui, options?)`

Renders a component with all required test providers and platform context.

**Signature:**

```typescript
function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
): ReturnType<typeof render>;

interface RenderWithProvidersOptions extends RenderOptions {
  platform?: 'mobile' | 'tablet' | 'desktop'; // default: 'desktop'
  theme?: 'light' | 'dark' | 'system'; // applied to document
}
```

**Parameters:**

| Parameter          | Type                                | Purpose                                |
| ------------------ | ----------------------------------- | -------------------------------------- |
| `ui`               | `ReactElement`                      | Component to render                    |
| `options.platform` | `'mobile' \| 'tablet' \| 'desktop'` | Initial platform breakpoint            |
| `options.theme`    | `'light' \| 'dark' \| 'system'`     | Theme for CSS variables                |
| `...renderOptions` | `RenderOptions`                     | Standard React Testing Library options |

**Example:**

```typescript
import { renderWithProviders, screen } from '@nasnet/ui/patterns/test/test-utils';

it('should render on desktop', () => {
  renderWithProviders(<StatusBadge status="online" />, { platform: 'desktop' });
  expect(screen.getByText(/online/i)).toBeInTheDocument();
});

it('should render in dark mode', () => {
  renderWithProviders(<Button>Click</Button>, { theme: 'dark' });
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
```

#### `renderWithPlatform(ui, platform, options?)`

Render a component at a specific platform with optional additional React Testing Library options.

**Signature:**

```typescript
function renderWithPlatform(
  ui: React.ReactElement,
  platform: 'mobile' | 'tablet' | 'desktop',
  options?: RenderOptions
): ReturnType<typeof render>;
```

**Example:**

```typescript
// Test mobile-specific presenter
it('should show bottom tab bar on mobile', () => {
  renderWithPlatform(<NetworkDashboard />, 'mobile');
  const tabBar = screen.getByRole('tablist');
  expect(tabBar).toHaveClass('fixed', 'bottom-0');
});

// Test desktop-specific presenter
it('should show left sidebar on desktop', () => {
  renderWithPlatform(<NetworkDashboard />, 'desktop');
  const sidebar = screen.getByRole('navigation');
  expect(sidebar).toHaveClass('w-64');
});
```

#### `renderWithTheme(ui, theme, options?)`

Render a component with a specific theme applied via CSS classes.

**Signature:**

```typescript
function renderWithTheme(
  ui: React.ReactElement,
  theme: 'light' | 'dark' | 'system',
  options?: RenderOptions
): ReturnType<typeof render>;
```

**Example:**

```typescript
it('should use dark theme colors', () => {
  renderWithTheme(<Card>Content</Card>, 'dark');
  const card = screen.getByText('Content').closest('[class*="bg-"]');
  expect(card).toHaveClass('dark:bg-slate-950');
});
```

#### `mockPlatform(platform)` / `resetPlatformMock()`

Manually control the platform mock for the current test.

**Signature:**

```typescript
function mockPlatform(platform: 'mobile' | 'tablet' | 'desktop'): void;
function resetPlatformMock(): void;
```

**Example:**

```typescript
import { mockPlatform, resetPlatformMock } from '@nasnet/ui/patterns/test/test-utils';

beforeEach(() => resetPlatformMock()); // Reset to desktop

it('should adapt to platform changes', () => {
  const { rerender } = render(<Router />);

  mockPlatform('mobile');
  rerender(<Router />);
  expect(screen.getByRole('tablist')).toBeInTheDocument();

  mockPlatform('desktop');
  rerender(<Router />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

#### `setViewport(width)` / `setViewportByPlatform(platform)`

Simulate viewport dimensions for testing responsive behavior.

**Signature:**

```typescript
function setViewport(width: number): void;
function setViewportByPlatform(platform: 'mobile' | 'tablet' | 'desktop'): void;
```

Platform widths:

- `mobile`: 375px
- `tablet`: 768px
- `desktop`: 1280px

**Example:**

```typescript
import { setViewport, screen } from '@nasnet/ui/patterns/test/test-utils';

it('should respond to resize events', () => {
  render(<ResponsiveComponent />);

  setViewport(375); // Mobile
  expect(screen.getByText('Mobile layout')).toBeInTheDocument();

  setViewport(1280); // Desktop
  expect(screen.getByText('Desktop layout')).toBeInTheDocument();
});
```

#### `hasTouchTargetSize(element)` / `hasTouchTargetClass(element)`

Verify that an element meets 44x44px touch target requirements.

**Signature:**

```typescript
function hasTouchTargetSize(element: HTMLElement): boolean;
function hasTouchTargetClass(element: HTMLElement): boolean;
```

**Example:**

```typescript
import { hasTouchTargetSize, screen } from '@nasnet/ui/patterns/test/test-utils';

it('should have adequate touch target size', () => {
  renderWithProviders(<Button>Add Router</Button>);
  const button = screen.getByRole('button');
  expect(hasTouchTargetSize(button)).toBe(true);
});
```

#### `isKeyboardFocusable(element)`

Check if an element can be focused via keyboard navigation.

**Signature:**

```typescript
function isKeyboardFocusable(element: HTMLElement): boolean;
```

Returns `true` if element is:

- A native interactive element (button, a, input, select, textarea)
- Has `tabindex >= 0`
- Not disabled

**Example:**

```typescript
import { isKeyboardFocusable, screen } from '@nasnet/ui/patterns/test/test-utils';

it('should have keyboard accessible form', () => {
  renderWithProviders(<AddRouterForm />);
  const nameInput = screen.getByLabelText('Router Name');
  const addressInput = screen.getByLabelText('IP Address');

  expect(isKeyboardFocusable(nameInput)).toBe(true);
  expect(isKeyboardFocusable(addressInput)).toBe(true);
});
```

#### Re-exports for Convenience

The test utils also re-export commonly used utilities:

```typescript
export { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
export { renderHook, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { axe } from 'vitest-axe';
```

## Accessibility Testing API

### From `@nasnet/ui/primitives/test/a11y-utils.ts`

Comprehensive WCAG compliance testing utilities powered by axe-core.

#### `testA11y(ui, options?)`

Test a component for accessibility violations at a specific WCAG level.

**Signature:**

```typescript
async function testA11y(ui: ReactElement, options?: TestA11yOptions): Promise<void>;

interface TestA11yOptions {
  axeOptions?: Parameters<typeof axe>[1]; // axe-core config
  rules?: { [ruleId: string]: { enabled: boolean } };
  wcagLevel?: 'A' | 'AA' | 'AAA'; // default: 'AAA'
}
```

**Example:**

```typescript
import { testA11y } from '@nasnet/ui/primitives/test/a11y-utils';

it('should pass WCAG AAA accessibility', async () => {
  await testA11y(<Button>Click me</Button>);
  // Throws AssertionError if violations found
});

it('should pass WCAG AA with specific rules', async () => {
  await testA11y(<MyComponent />, {
    wcagLevel: 'AA',
    rules: {
      'color-contrast': { enabled: false }, // Skip if needed
    },
  });
});
```

#### `getA11yReport(ui, options?)`

Generate a detailed accessibility report without asserting (useful for debugging).

**Signature:**

```typescript
async function getA11yReport(
  ui: ReactElement,
  options?: TestA11yOptions
): Promise<AxeCore.AxeResults>;
```

**Returns:**

```typescript
{
  violations: AxeCore.Result[];      // Failed rules
  passes: AxeCore.Result[];          // Passed rules
  incomplete: AxeCore.Result[];      // Needs manual review
  inapplicable: AxeCore.Result[];    // Not applicable
}
```

**Example:**

```typescript
it('should generate accessibility report', async () => {
  const report = await getA11yReport(<MyComponent />);
  console.log(`Violations: ${report.violations.length}`);
  console.log(`Passes: ${report.passes.length}`);

  report.violations.forEach(violation => {
    console.log(`- ${violation.id}: ${violation.description}`);
    console.log(`  Impact: ${violation.impact}`);
  });
});
```

#### `getTabOrder(container)`

Retrieve keyboard navigation order within a container.

**Signature:**

```typescript
function getTabOrder(container: HTMLElement): HTMLElement[];
```

Returns all focusable elements in tab order (respecting tabindex values).

**Example:**

```typescript
import { getTabOrder, render, screen } from '@nasnet/ui/patterns/test/test-utils';

it('should have correct tab order', () => {
  const { container } = render(<LoginForm />);
  const tabOrder = getTabOrder(container);

  expect(tabOrder[0]).toBe(screen.getByLabelText('Username'));
  expect(tabOrder[1]).toBe(screen.getByLabelText('Password'));
  expect(tabOrder[2]).toBe(screen.getByRole('button', { name: 'Login' }));
});
```

#### `hasMinimumTouchTarget(element, minSize?)` / `getElementsWithSmallTouchTargets(container, minSize?)`

Verify touch target sizes meet 44x44px WCAG AAA requirements.

**Signature:**

```typescript
function hasMinimumTouchTarget(element: HTMLElement, minSize: number = 44): boolean;
function getElementsWithSmallTouchTargets(
  container: HTMLElement,
  minSize: number = 44
): HTMLElement[];
```

**Example:**

```typescript
import { getElementsWithSmallTouchTargets } from '@nasnet/ui/primitives/test/a11y-utils';

it('should have adequate touch targets', () => {
  const { container } = render(<Toolbar />);
  const failingElements = getElementsWithSmallTouchTargets(container);
  expect(failingElements).toHaveLength(0);
});
```

#### `meetsContrastRequirement(fg, bg, level?, isLargeText?)` / `getContrastRatio(fg, bg)`

Validate color contrast meets WCAG requirements.

**Signature:**

```typescript
function meetsContrastRequirement(
  foreground: string,
  background: string,
  level?: 'AA' | 'AAA', // default: 'AAA'
  isLargeText?: boolean
): boolean;

function getContrastRatio(foreground: string, background: string): number;
```

WCAG Requirements:

- **AAA normal text**: 7:1 ratio
- **AAA large text** (18px+ or 14px+ bold): 4.5:1 ratio
- **AA normal text**: 4.5:1 ratio
- **AA large text**: 3:1 ratio

**Example:**

```typescript
import { meetsContrastRequirement, getContrastRatio } from '@nasnet/ui/primitives/test/a11y-utils';

it('should have sufficient contrast', () => {
  const ratio = getContrastRatio('#EFC729', '#FFFFFF');
  expect(ratio).toBeGreaterThan(7); // AAA normal text

  expect(meetsContrastRequirement('#EFC729', '#FFFFFF', 'AAA')).toBe(true);
});
```

#### `assertAriaAttributes(element, attributes)`

Verify ARIA attributes are present and correct.

**Signature:**

```typescript
function assertAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | RegExp>
): void;
```

**Example:**

```typescript
import { assertAriaAttributes, screen } from '@nasnet/ui/primitives/test/a11y-utils';

it('should have proper ARIA labels', () => {
  render(<Modal title="Confirm Action">...</Modal>);
  const dialog = screen.getByRole('dialog');

  assertAriaAttributes(dialog, {
    'aria-modal': 'true',
    'aria-labelledby': /modal-title-/,
    'aria-hidden': 'false',
  });
});
```

## Testing Patterns

### Pattern 1: Testing a Headless Hook

Test the business logic independently of rendering:

```typescript
import { renderHook, act } from '@nasnet/ui/patterns/test/test-utils';
import { useStatusBadge } from '@nasnet/ui/patterns';

it('should calculate correct badge variant', () => {
  const { result } = renderHook(() => useStatusBadge({ status: 'online' }));

  expect(result.current.variant).toBe('success');
  expect(result.current.label).toBe('Online');

  act(() => {
    // Trigger state update if hook has effects
  });

  expect(result.current.variant).toBe('success');
});
```

### Pattern 2: Testing Platform Presenters

Verify each platform variant renders correctly:

```typescript
import { renderWithPlatform, screen } from '@nasnet/ui/patterns/test/test-utils';
import { ResourceCard } from '@nasnet/ui/patterns';

describe('ResourceCard', () => {
  it('should show compact layout on mobile', () => {
    renderWithPlatform(<ResourceCard title="Router1" status="online" />, 'mobile');
    expect(screen.getByRole('button')).toHaveClass('h-12'); // Compact
  });

  it('should show detailed layout on desktop', () => {
    renderWithPlatform(<ResourceCard title="Router1" status="online" />, 'desktop');
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Last seen')).toBeInTheDocument();
  });
});
```

### Pattern 3: Testing Animations with Reduced Motion

Verify components respect user motion preferences:

```typescript
import { renderWithProviders } from '@nasnet/ui/patterns/test/test-utils';

it('should respect prefers-reduced-motion', () => {
  // Mock matchMedia for reduced motion
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  renderWithProviders(<AnimatedComponent />);
  const element = screen.getByTestId('animated');

  // Verify no animation classes applied
  expect(element).not.toHaveClass('animate-spin');
});
```

### Pattern 4: Testing Form Validation

Complete form testing with validation and accessibility:

```typescript
import { renderWithProviders, userEvent, screen, testA11y } from '@nasnet/ui/patterns/test/test-utils';

describe('AddRouterForm', () => {
  it('should validate required fields', async () => {
    renderWithProviders(<AddRouterForm />);

    const submitButton = screen.getByRole('button', { name: /add/i });
    await userEvent.click(submitButton);

    expect(screen.getByText('IP address is required')).toBeInTheDocument();
  });

  it('should be fully accessible', async () => {
    await testA11y(<AddRouterForm />);
  });

  it('should have proper form structure', () => {
    renderWithProviders(<AddRouterForm />);

    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    // All inputs labeled
    expect(screen.getByLabelText('Router Name')).toBeInTheDocument();
    expect(screen.getByLabelText('IP Address')).toBeInTheDocument();
  });
});
```

## WCAG AAA Compliance Checklist

When implementing new components, verify these accessibility requirements:

| Component Type    | Requirement                                | How to Test                                              |
| ----------------- | ------------------------------------------ | -------------------------------------------------------- |
| **Buttons**       | 44x44px min touch target                   | `hasMinimumTouchTarget()` or visual inspection           |
| **Buttons**       | Keyboard focusable                         | `isKeyboardFocusable()` and Tab navigation               |
| **Buttons**       | Sufficient contrast (7:1 AAA)              | `meetsContrastRequirement()`                             |
| **Buttons**       | Clear focus indicator                      | Visual inspection (3px ring)                             |
| **Links**         | 44x44px min touch target                   | `hasMinimumTouchTarget()`                                |
| **Links**         | Underlined or visually distinct            | Visual inspection                                        |
| **Links**         | Keyboard accessible                        | `getTabOrder()` verification                             |
| **Form Inputs**   | Associated labels                          | `screen.getByLabelText()`                                |
| **Form Inputs**   | Error messages linked via aria-describedby | `assertAriaAttributes()`                                 |
| **Form Inputs**   | 44x44px touch target                       | `hasMinimumTouchTarget()`                                |
| **Modals**        | aria-modal="true"                          | `assertAriaAttributes()`                                 |
| **Modals**        | Focus trap                                 | Manual testing with Tab key                              |
| **Modals**        | Dismiss with Escape                        | Manual testing                                           |
| **Tables**        | Proper thead/tbody structure               | DOM inspection                                           |
| **Tables**        | Column headers scope="col"                 | `screen.getByRole('columnheader')`                       |
| **Tables**        | Accessible sort buttons                    | `testA11y()`                                             |
| **Status Badges** | Semantic color + text label                | Visual + `screen.getByText()`                            |
| **Status Badges** | Not color-only indicators                  | Manual inspection                                        |
| **Navigation**    | Proper nav landmarks                       | `screen.getByRole('navigation')`                         |
| **Navigation**    | Active link marked                         | `assertAriaAttributes(link, { 'aria-current': 'page' })` |

## Running Tests

### Run All Tests

```bash
npm run test                  # Run all tests with Vitest
npx nx run-many -t test      # Vitest across all packages
```

### Run Tests for Specific Package

```bash
npx nx test ui-primitives    # Test primitives only
npx nx test ui-patterns      # Test patterns only
```

### Run Tests in Watch Mode

```bash
npm run test:watch           # Watch mode (rerun on file changes)
```

### Run Accessibility Tests Only

```bash
npm run test -- --grep "a11y|accessibility"
```

## Debugging Tests

### View Accessibility Violations

```typescript
import { getA11yReport } from '@nasnet/ui/primitives/test/a11y-utils';

it('debug accessibility', async () => {
  const report = await getA11yReport(<MyComponent />);
  if (report.violations.length > 0) {
    console.table(report.violations.map(v => ({
      rule: v.id,
      impact: v.impact,
      elements: v.nodes.length,
      description: v.description,
    })));
  }
});
```

### View Tab Order

```typescript
import { getTabOrder, render } from '@nasnet/ui/patterns/test/test-utils';

it('debug tab order', () => {
  const { container } = render(<ComplexForm />);
  const tabOrder = getTabOrder(container);
  console.table(tabOrder.map((el, i) => ({
    order: i + 1,
    tag: el.tagName,
    text: el.textContent?.slice(0, 30),
    tabindex: el.getAttribute('tabindex'),
  })));
});
```

### Visual Inspection with screen.debug()

```typescript
import { render, screen } from '@nasnet/ui/patterns/test/test-utils';

it('visual debug', () => {
  render(<MyComponent />);
  screen.debug(); // Print rendered HTML to console
});
```

## Cross-References

- **Design System Guidelines:** [Design Tokens & Animation](tokens-and-animation.md)
- **Form Testing:** [Forms & Inputs Patterns](patterns-forms-and-inputs.md)
- **Platform Hooks:** [Layouts & Platform Detection](layouts-and-platform.md)
- **Design Accessibility Requirements:** See
  `Docs/design/ux-design/8-responsive-design-accessibility.md`
- **Component Checklist:** See `Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md` for
  7-accessibility section
