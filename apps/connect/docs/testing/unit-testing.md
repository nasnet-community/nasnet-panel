# Unit Testing

Unit tests cover pure functions, custom hooks, and utilities in isolation. They are the fastest tier — each test runs in milliseconds — and form the base of the testing pyramid. The test runner is **Vitest**, chosen for its native ESM support and Vite-native speed.

---

## Vitest Configuration

`apps/connect/vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // describe/it/expect available without import
    environment: 'jsdom',    // Browser-like DOM in Node.js
    setupFiles: [
      '@testing-library/jest-dom/vitest',  // DOM matchers
      './src/test/setup.ts',               // MSW + browser API mocks
    ],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/', 'e2e/'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 75,
        statements: 80,
      },
    },

    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nasnet/core/types': path.resolve(__dirname, '../../libs/core/types/src'),
      // ... all library aliases mirror vite.config.ts
    },
  },
});
```

### Key settings

- **`globals: true`** — `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. are available without importing from `vitest`
- **`environment: 'jsdom'`** — DOM APIs available, but no real browser rendering
- **`setupFiles`** — MSW server is started before each test file; `matchMedia`, `ResizeObserver`, `IntersectionObserver` are mocked
- **`pool: 'forks'`** with `singleFork: true` — runs all tests in one worker process, avoids test isolation overhead for this codebase size

---

## Global Test Setup

`apps/connect/src/test/setup.ts` runs before every test file:

```typescript
import { server } from '../mocks/server';

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();           // Unmount React components
  vi.clearAllMocks();  // Reset all vi.fn() and vi.spyOn() calls
  server.resetHandlers(); // Remove test-specific handler overrides
});
afterAll(() => server.close());

// Browser API stubs (jsdom doesn't implement these)
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}));
```

---

## Testing Pure Functions

Pure utility functions are the simplest case — no DOM, no React, just input → output.

```typescript
// libs/core/i18n/src/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { isRTLLanguage, getLanguageDirection } from './i18n';

describe('isRTLLanguage', () => {
  it('should return true for Persian', () => {
    expect(isRTLLanguage('fa')).toBe(true);
  });

  it('should return false for English', () => {
    expect(isRTLLanguage('en')).toBe(false);
  });

  it('should return false for unknown languages', () => {
    expect(isRTLLanguage('unknown')).toBe(false);
  });
});

describe('getLanguageDirection', () => {
  it('should return rtl for Persian', () => {
    expect(getLanguageDirection('fa')).toBe('rtl');
  });

  it('should return ltr for English', () => {
    expect(getLanguageDirection('en')).toBe('ltr');
  });
});
```

---

## Testing Custom Hooks

Use `renderHook` from React Testing Library to test hooks in isolation. Wrap with providers when the hook depends on context.

```typescript
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '@nasnet/core/utils';

describe('useReducedMotion', () => {
  it('should return false when matchMedia is not available', () => {
    // jsdom doesn't implement matchMedia — it's mocked to return { matches: false }
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when user prefers reduced motion', () => {
    // Override the mock to simulate reduced motion preference
    vi.mocked(window.matchMedia).mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

---

## Testing Components

### Simple Component Tests

Components without external dependencies can be tested directly with `render` from `@testing-library/react`. No custom wrapper needed.

```tsx
// apps/connect/src/app/pages/network/components/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('should render "Running" for running status', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should apply green styles for running status', () => {
    const { container } = render(<StatusBadge status="running" />);
    expect(container.firstChild).toHaveClass('bg-success/20');
  });

  it('should apply gray styles for disabled status', () => {
    const { container } = render(<StatusBadge status="disabled" />);
    expect(container.firstChild).toHaveClass('bg-muted/20');
  });
});
```

### Components with External Hook Dependencies

When a component calls hooks from `@nasnet/api-client/queries` or other external packages, mock those hooks with `vi.mock`:

```tsx
// apps/connect/src/app/pages/network/components/InterfaceCard.test.tsx
import * as queries from '@nasnet/api-client/queries';
import { InterfaceCard } from './InterfaceCard';

// Partial mock — only mock the hooks we need, keep the rest real
vi.mock('@nasnet/api-client/queries', async () => {
  const actual = await vi.importActual('@nasnet/api-client/queries');
  return {
    ...actual,
    useInterfaceTraffic: vi.fn(),
  };
});

describe('InterfaceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (queries.useInterfaceTraffic as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  it('should render interface name', () => {
    render(<InterfaceCard interface={mockInterface} />);
    expect(screen.getByText('ether1')).toBeInTheDocument();
  });

  it('should show traffic statistics when expanded', async () => {
    const user = userEvent.setup();
    (queries.useInterfaceTraffic as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockTrafficStats,
      isLoading: false,
      error: null,
    });

    render(<InterfaceCard interface={mockInterface} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Traffic Statistics')).toBeInTheDocument();
    });
  });
});
```

---

## Mocking Strategies

### vi.fn() — Mock a function

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: [] }); // For async
```

### vi.mock() — Mock an entire module

```typescript
vi.mock('@nasnet/api-client/queries', () => ({
  useRouters: vi.fn().mockReturnValue({
    data: { routers: [] },
    loading: false,
    error: null,
  }),
}));
```

Partial mocks preserve the real implementation for unmocked exports:

```typescript
vi.mock('@nasnet/api-client/queries', async () => {
  const actual = await vi.importActual('@nasnet/api-client/queries');
  return { ...actual, useInterfaceTraffic: vi.fn() };
});
```

### vi.spyOn() — Spy on an existing method

```typescript
const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
// ... test code that should call console.warn
expect(spy).toHaveBeenCalledWith(expect.stringContaining('Missing translation'));
spy.mockRestore();
```

### server.use() — Override MSW handlers in specific tests

```typescript
it('should show error state when API fails', async () => {
  server.use(errorHandler); // Override default success handler for this test
  render(<RouterPanel routerId="r1" />);
  expect(await screen.findByText(/connection failed/i)).toBeInTheDocument();
});
// Handler resets automatically after the test via server.resetHandlers()
```

---

## Testing Async Operations

### waitFor

Use `waitFor` for assertions that depend on async state updates:

```typescript
import { waitFor } from '@testing-library/react';

it('should load traffic data on expand', async () => {
  const user = userEvent.setup();
  render(<InterfaceCard interface={mockInterface} />);

  await user.click(screen.getByRole('button'));

  await waitFor(() => {
    expect(screen.getByText('Traffic Statistics')).toBeInTheDocument();
  });
});
```

### findBy queries

`findBy*` queries are async versions of `getBy*` — they wait up to 1 second:

```typescript
// Equivalent to waitFor + getByText
const element = await screen.findByText('Traffic Statistics');
expect(element).toBeInTheDocument();
```

---

## Test Data Factories

Create typed fixtures with `Partial<T>` overrides to keep tests concise:

```typescript
import { type NetworkInterface } from '@nasnet/core/types';

function makeInterface(overrides: Partial<NetworkInterface> = {}): NetworkInterface {
  return {
    id: 'ether1',
    name: 'ether1',
    type: 'ether',
    status: 'running',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    linkStatus: 'up',
    mtu: 1500,
    comment: undefined,
    ...overrides,
  };
}

// In tests
const disabledInterface = makeInterface({ status: 'disabled', linkStatus: 'down' });
const wirelessInterface = makeInterface({ type: 'wireless', name: 'wlan1' });
```

---

## Import Aliases in Tests

The vitest config mirrors the Vite aliases from `vite.config.ts`. Use the same import paths in test files:

```typescript
import { type NetworkInterface } from '@nasnet/core/types';
import { useInterfaceTraffic } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import { StatusBadge } from '@nasnet/ui/patterns';
```

---

## Common Matchers

From `@testing-library/jest-dom`:

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveClass('bg-success/20');
expect(element).toHaveAttribute('aria-label', 'Close');
expect(element).toHaveTextContent('Running');
expect(element).toHaveFocus();
expect(input).toHaveValue('ether1');
```

From Vitest:

```typescript
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith('fa');
expect(fn).toHaveBeenCalledTimes(1);
expect(promise).resolves.toBe(42);
expect(promise).rejects.toThrow('error');
```

---

## See Also

- `apps/connect/vitest.config.ts` — Full Vitest configuration
- `apps/connect/src/test/setup.ts` — Global setup (MSW, browser mocks)
- `10-testing/component-testing.md` — Testing with providers via `test-utils.tsx`
- `10-testing/mocking.md` — MSW handler patterns
