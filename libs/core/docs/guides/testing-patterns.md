---
sidebar_position: 10
title: Testing Patterns
---

# Testing Patterns

This guide documents the testing patterns and best practices used across `libs/core` in the NasNetConnect project.

## Vitest Setup

NasNetConnect uses **Vitest** as the test runner of choice, offering:

- **4x faster** than Jest with native ESM support
- Native TypeScript support without transpilation overhead
- Compatible with Jest APIs (easy migration path)
- Parallel test execution by default
- Better watch mode performance

### Configuration

The Vitest configuration is located at `apps/connect/vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest', './src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 75,
        statements: 80,
      },
    },
  },
});
```

**Key settings:**
- `environment: 'jsdom'` — Simulates browser environment for React components
- `globals: true` — Enables `describe()`, `it()`, `expect()` without imports
- **Coverage thresholds:** 80% lines, 75% branches (enforced in CI)

### Running Tests

```bash
# Run all tests once
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Run specific test file
npx vitest libs/core/utils/src/network/ip.test.ts

# Generate coverage report
npx vitest --coverage
```

---

## Testing Pure Utility Functions

Pure functions are the simplest to test — no mocks, no side effects, no global state.

### Example: Network Validators

Located in `libs/core/utils/src/network/ip.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isValidIPv4,
  isValidSubnet,
  compareIPv4,
  isValidMACAddress,
  formatMACAddress
} from './ip';

describe('IP Utilities', () => {
  describe('isValidIPv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
      expect(isValidIPv4('10.0.0.0')).toBe(true);
      expect(isValidIPv4('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false);
      expect(isValidIPv4('192.168.1')).toBe(false);
      expect(isValidIPv4('invalid')).toBe(false);
    });
  });

  describe('isValidSubnet', () => {
    it('should validate correct CIDR notation', () => {
      expect(isValidSubnet('192.168.1.0/24')).toBe(true);
      expect(isValidSubnet('10.0.0.0/8')).toBe(true);
      expect(isValidSubnet('172.16.0.0/12')).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(isValidSubnet('192.168.1.0')).toBe(false);  // Missing prefix
      expect(isValidSubnet('192.168.1.0/33')).toBe(false);  // Invalid prefix
      expect(isValidSubnet('256.1.1.1/24')).toBe(false);  // Invalid IP
    });
  });

  describe('compareIPv4', () => {
    it('should compare IP addresses numerically', () => {
      expect(compareIPv4('192.168.1.1', '192.168.1.2')).toBeLessThan(0);
      expect(compareIPv4('192.168.1.10', '192.168.1.2')).toBeGreaterThan(0);
      expect(compareIPv4('192.168.1.1', '192.168.1.1')).toBe(0);
    });

    it('should sort IP addresses correctly', () => {
      const ips = ['192.168.1.10', '192.168.1.2', '192.168.1.1', '10.0.0.1'];
      const sorted = ips.sort(compareIPv4);
      expect(sorted).toEqual(['10.0.0.1', '192.168.1.1', '192.168.1.2', '192.168.1.10']);
    });
  });

  describe('isValidMACAddress', () => {
    it('should validate MAC addresses with various separators', () => {
      expect(isValidMACAddress('AA:BB:CC:DD:EE:FF')).toBe(true);
      expect(isValidMACAddress('AA-BB-CC-DD-EE-FF')).toBe(true);
      expect(isValidMACAddress('AABBCCDDEEFF')).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(isValidMACAddress('AA:BB:CC:DD:EE')).toBe(false);  // Too short
      expect(isValidMACAddress('GG:HH:II:JJ:KK:LL')).toBe(false);  // Invalid hex
      expect(isValidMACAddress('')).toBe(false);  // Empty
    });
  });

  describe('formatMACAddress', () => {
    it('should format with consistent separators', () => {
      expect(formatMACAddress('AABBCCDDEEFF')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('AA-BB-CC-DD-EE-FF')).toBe('AA:BB:CC:DD:EE:FF');
      expect(formatMACAddress('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('should handle mixed case normalization', () => {
      expect(formatMACAddress('AaBbCcDdEeFf')).toBe('AA:BB:CC:DD:EE:FF');
    });
  });
});
```

**Pattern:** Test both valid and invalid inputs, edge cases, and common use cases.

### Example: Formatters

Located in `libs/core/utils/src/formatters/formatters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatUptime,
  formatNumber,
} from './index';

describe('Formatter Utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes to human readable size', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds to human readable duration', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m');
      expect(formatDuration(3600000)).toBe('1h');
      expect(formatDuration(86400000)).toBe('1d');
    });

    it('should format combined durations', () => {
      const duration = (1 * 86400 + 2 * 3600 + 30 * 60 + 45) * 1000;
      const formatted = formatDuration(duration);
      expect(formatted).toContain('d');
      expect(formatted).toContain('h');
      expect(formatted).toContain('m');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime in seconds', () => {
      expect(formatUptime(60)).toBe('1m');
      expect(formatUptime(3600)).toBe('1h');
      expect(formatUptime(86400)).toBe('1d');
    });
  });
});
```

**Pattern:** Test boundary conditions, edge cases (0, null, empty), and typical inputs.

### Example: Dependency Graph

Located in `libs/core/utils/src/graph/dependency-graph.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { topologicalSort, buildDependencyGraph } from './dependency-graph';

describe('Dependency Graph Utilities', () => {
  describe('topologicalSort', () => {
    it('should sort items respecting dependencies', () => {
      const items = [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['a', 'b'] },
      ];
      const sorted = topologicalSort(items);
      expect(sorted[0].id).toBe('a');
      expect(sorted[1].id).toBe('b');
      expect(sorted[2].id).toBe('c');
    });

    it('should handle circular dependencies', () => {
      const items = [
        { id: 'a', dependencies: ['b'] },
        { id: 'b', dependencies: ['a'] },
      ];
      expect(() => topologicalSort(items)).toThrow('Circular dependency detected');
    });

    it('should handle independent items', () => {
      const items = [
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: [] },
      ];
      const sorted = topologicalSort(items);
      expect(sorted).toHaveLength(2);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build graph structure from dependencies', () => {
      const graph = buildDependencyGraph([
        { id: 'a', dependencies: [] },
        { id: 'b', dependencies: ['a'] },
      ]);
      expect(graph.get('a')).toBeDefined();
      expect(graph.get('b')).toContain('a');
    });
  });
});
```

**Pattern:** Algorithm tests verify ordering, handle edge cases (cycles, empty inputs).

### Example: Status Calculators

```typescript
import { describe, it, expect } from 'vitest';
import { calculateStatus, mergeStatuses } from '@nasnet/core/utils';

describe('Status Calculators', () => {
  describe('calculateStatus', () => {
    it('should return online when all checks pass', () => {
      const status = calculateStatus({
        latency: 50,
        packetLoss: 0,
        uptime: 99.9,
        isConnected: true,
      });
      expect(status).toBe('online');
    });

    it('should return degraded when latency is high', () => {
      const status = calculateStatus({
        latency: 2000,  // High latency
        packetLoss: 0,
        uptime: 99.9,
        isConnected: true,
      });
      expect(status).toBe('degraded');
    });

    it('should return offline when disconnected', () => {
      const status = calculateStatus({
        latency: 0,
        packetLoss: 100,
        uptime: 0,
        isConnected: false,
      });
      expect(status).toBe('offline');
    });
  });

  describe('mergeStatuses', () => {
    it('should merge multiple statuses (worst wins)', () => {
      expect(mergeStatuses(['online', 'online', 'degraded'])).toBe('degraded');
      expect(mergeStatuses(['online', 'degraded', 'offline'])).toBe('offline');
      expect(mergeStatuses(['online', 'online'])).toBe('online');
    });
  });
});
```

---

## Testing React Hooks

React hooks require `renderHook` from `@testing-library/react` to test in isolation.

### useReducedMotion (Accessibility Hook)

Located in `libs/core/utils/src/hooks/useReducedMotion.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return false when prefers-reduced-motion is not set', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when user prefers reduced motion', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should update when preference changes', () => {
    let changeHandler: ((event: any) => void) | null = null;

    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (event: string, handler: (e: any) => void) => {
        if (event === 'change') changeHandler = handler;
      },
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate preference change
    act(() => {
      changeHandler?.({ matches: true });
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const removeListener = vi.fn();
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: removeListener,
    }));

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeListener).toHaveBeenCalled();
  });
});
```

**Key patterns:**
1. Mock `matchMedia` using `vi.fn()` and `vi.stubGlobal()`
2. Test both "not set" and "set" cases
3. Simulate user preference changes with `act()`
4. Verify cleanup with `unmount()`

### useAutoScroll (Scroll Container Hook)

Located in `libs/core/utils/src/hooks/useAutoScroll.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useAutoScroll } from './useAutoScroll';

describe('useAutoScroll', () => {
  let scrollContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a mock scroll container with scroll properties
    scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      writable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      writable: true,
      value: 500,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });
    scrollContainer.scrollTo = vi.fn();
  });

  it('should detect when scrolled to bottom', async () => {
    const { result } = renderHook(() => {
      const scrollRef = useRef<HTMLDivElement>(scrollContainer);
      return useAutoScroll({ scrollRef, data: [], threshold: 100 });
    });

    // Scroll to bottom: scrollTop + clientHeight >= scrollHeight - threshold
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 500,  // 500 + 500 = 1000 >= (1000 - 100)
    });

    act(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(result.current.isAtBottom).toBe(true);
    });
  });

  it('should detect when scrolled up from bottom', async () => {
    const { result } = renderHook(() => {
      const scrollRef = useRef<HTMLDivElement>(scrollContainer);
      return useAutoScroll({ scrollRef, data: [], threshold: 100 });
    });

    // Scroll up significantly
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 200,  // 200 + 500 = 700 < 900 (1000 - 100)
    });

    act(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(result.current.isAtBottom).toBe(false);
    });
  });

  it('should track new entries count while scrolled up', () => {
    const { result, rerender } = renderHook(
      ({ data }) => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data });
      },
      { initialProps: { data: [1, 2, 3] } }
    );

    // Scroll up
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });

    act(() => {
      scrollContainer.dispatchEvent(new Event('scroll'));
    });

    // Add new entries
    act(() => {
      rerender({ data: [1, 2, 3, 4, 5] });
    });

    expect(result.current.newEntriesCount).toBe(2);
  });

  it('should provide scrollToBottom function', () => {
    const { result } = renderHook(() => {
      const scrollRef = useRef<HTMLDivElement>(scrollContainer);
      return useAutoScroll({ scrollRef, data: [] });
    });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth',
    });
  });

  it('should not track when disabled', () => {
    const { rerender } = renderHook(
      ({ data, enabled }) => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data, enabled });
      },
      { initialProps: { data: [1, 2, 3], enabled: false } }
    );

    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });

    act(() => {
      rerender({ data: [1, 2, 3, 4, 5], enabled: false });
    });

    expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
  });
});
```

**Key patterns:**
1. Mock DOM element properties with `Object.defineProperty()`
2. Simulate scroll events with `dispatchEvent(new Event('scroll'))`
3. Use `act()` to wrap state updates
4. Use `rerender()` to test hook responses to prop changes
5. Test edge cases: disabled state, threshold configuration

### useRelativeTime (Time Formatting Hook)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRelativeTime } from './useRelativeTime';

describe('useRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format time relative to now', () => {
    const now = new Date();
    const { result } = renderHook(() => useRelativeTime(now));
    expect(result.current).toBe('just now');
  });

  it('should update when time advances', async () => {
    const now = new Date();
    const { result } = renderHook(() => useRelativeTime(now));
    expect(result.current).toBe('just now');

    // Advance time by 1 minute
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(result.current).toBe('1 minute ago');
    });
  });

  it('should handle different time intervals', () => {
    const testCases = [
      { ms: 1000, expected: 'just now' },
      { ms: 60000, expected: '1 minute ago' },
      { ms: 3600000, expected: '1 hour ago' },
    ];

    testCases.forEach(({ ms, expected }) => {
      const pastDate = new Date(Date.now() - ms);
      const { result } = renderHook(() => useRelativeTime(pastDate));
      expect(result.current).toBe(expected);
    });
  });
});
```

**Key patterns:**
1. Use `vi.useFakeTimers()` to control time
2. Use `vi.advanceTimersByTime()` to simulate passage of time
3. Test multiple time intervals with parameterized tests
4. Clean up with `vi.restoreAllMocks()`

---

## Testing Zod Schemas and Validators

Zod schemas are tested by verifying both valid and invalid inputs.

### Example: Network Configuration Schemas

Located in `libs/core/utils/src/validation/index.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  ipAddressSchema,
  cidrSchema,
  portSchema,
  macAddressSchema,
  routerConnectionConfigSchema,
} from '@nasnet/core/utils';

describe('Zod Validation Schemas', () => {
  describe('ipAddressSchema', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(ipAddressSchema.safeParse('192.168.1.1').success).toBe(true);
      expect(ipAddressSchema.safeParse('10.0.0.0').success).toBe(true);
      expect(ipAddressSchema.safeParse('255.255.255.255').success).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(ipAddressSchema.safeParse('999.999.999.999').success).toBe(false);
      expect(ipAddressSchema.safeParse('192.168.1').success).toBe(false);
      expect(ipAddressSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('cidrSchema', () => {
    it('should validate CIDR notation', () => {
      expect(cidrSchema.safeParse('192.168.1.0/24').success).toBe(true);
      expect(cidrSchema.safeParse('10.0.0.0/8').success).toBe(true);
      expect(cidrSchema.safeParse('172.16.0.0/12').success).toBe(true);
    });

    it('should reject invalid CIDR notation', () => {
      expect(cidrSchema.safeParse('192.168.1.0').success).toBe(false);  // Missing prefix
      expect(cidrSchema.safeParse('192.168.1.0/33').success).toBe(false);  // Invalid prefix
      expect(cidrSchema.safeParse('256.1.1.1/24').success).toBe(false);  // Invalid IP
    });
  });

  describe('portSchema', () => {
    it('should validate port numbers (1-65535)', () => {
      expect(portSchema.safeParse(80).success).toBe(true);
      expect(portSchema.safeParse(443).success).toBe(true);
      expect(portSchema.safeParse(65535).success).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(portSchema.safeParse(0).success).toBe(false);  // Min is 1
      expect(portSchema.safeParse(70000).success).toBe(false);  // Max is 65535
      expect(portSchema.safeParse(-1).success).toBe(false);  // Negative
    });
  });

  describe('macAddressSchema', () => {
    it('should validate MAC addresses', () => {
      expect(macAddressSchema.safeParse('AA:BB:CC:DD:EE:FF').success).toBe(true);
      expect(macAddressSchema.safeParse('AA-BB-CC-DD-EE-FF').success).toBe(true);
      expect(macAddressSchema.safeParse('aabbccddeeff').success).toBe(true);
    });

    it('should reject invalid MAC addresses', () => {
      expect(macAddressSchema.safeParse('AA:BB:CC:DD:EE').success).toBe(false);  // Too short
      expect(macAddressSchema.safeParse('GG:HH:II:JJ:KK:LL').success).toBe(false);  // Invalid hex
    });
  });

  describe('routerConnectionConfigSchema', () => {
    it('should validate router connection config', () => {
      const result = routerConnectionConfigSchema.safeParse({
        address: '192.168.1.1',
        username: 'admin',
        password: 'secret',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.port).toBe(80);  // Default
        expect(result.data.timeout).toBe(5000);  // Default
      }
    });

    it('should use defaults for optional fields', () => {
      const result = routerConnectionConfigSchema.safeParse({
        address: '192.168.1.1',
        username: 'admin',
        password: 'secret',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.port).toBe(80);
        expect(result.data.useTLS).toBe(false);
      }
    });

    it('should reject invalid config', () => {
      const result = routerConnectionConfigSchema.safeParse({
        address: 'invalid',
        username: '',  // Empty not allowed
        password: 'secret',
      });
      expect(result.success).toBe(false);
    });

    it('should validate timeout bounds', () => {
      const result = routerConnectionConfigSchema.safeParse({
        address: '192.168.1.1',
        username: 'admin',
        password: 'secret',
        timeout: 100,  // Too low (min: 1000)
      });
      expect(result.success).toBe(false);
    });
  });
});
```

**Pattern:**
1. Use `safeParse()` which returns `{ success: boolean; data?: T; error?: ZodError }`
2. Test both valid and invalid cases
3. Test default values with optional fields
4. Test bounds and constraints (min, max, regex)
5. Test composed schemas with nested objects

---

## Testing Async Validation

The validation pipeline supports 7 stages of async validation for complex workflows.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncValidation } from '@nasnet/core/utils';

describe('Async Validation', () => {
  const mockValidatorFn = vi.fn().mockResolvedValue({
    valid: true,
    errors: [],
  });

  beforeEach(() => {
    mockValidatorFn.mockClear();
  });

  it('should debounce validation calls', async () => {
    const { result } = renderHook(() =>
      useAsyncValidation(mockValidatorFn, { debounceMs: 300 })
    );

    // Trigger validation 3 times rapidly
    act(() => {
      result.current.validate({ field: 'value1' });
      result.current.validate({ field: 'value2' });
      result.current.validate({ field: 'value3' });
    });

    // Only the last call should execute
    await waitFor(() => {
      expect(mockValidatorFn).toHaveBeenCalledTimes(1);
      expect(mockValidatorFn).toHaveBeenCalledWith({ field: 'value3' });
    });
  });

  it('should cancel pending validations on new request', async () => {
    const slowValidator = vi.fn(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { result } = renderHook(() =>
      useAsyncValidation(slowValidator)
    );

    act(() => {
      result.current.validate({ attempt: 1 });
    });

    // Cancel and start new validation
    act(() => {
      result.current.cancel();
      result.current.validate({ attempt: 2 });
    });

    await waitFor(() => {
      expect(slowValidator).toHaveBeenCalledWith({ attempt: 2 });
    });
  });

  it('should handle validation errors', async () => {
    const errorValidator = vi.fn().mockRejectedValue(
      new Error('Validation failed')
    );

    const { result } = renderHook(() =>
      useAsyncValidation(errorValidator)
    );

    act(() => {
      result.current.validate({ field: 'value' });
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Validation failed');
    });
  });

  it('should track validation state', async () => {
    const { result } = renderHook(() =>
      useAsyncValidation(mockValidatorFn)
    );

    expect(result.current.isValidating).toBe(false);

    act(() => {
      result.current.validate({ field: 'value' });
    });

    expect(result.current.isValidating).toBe(true);

    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
      expect(result.current.result).toBeDefined();
    });
  });
});
```

---

## Mock Strategies

### Mocking Router Responses

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { useGetDHCPLeases } from '@nasnet/api-client/queries';

describe('Router Query Mocks', () => {
  it('should handle successful router query', async () => {
    const mocks = [
      {
        request: {
          query: GET_DHCP_LEASES,
          variables: { routerId: 'router-1' },
        },
        result: {
          data: {
            dhcpLeases: [
              { id: '1', address: '192.168.1.100', hostname: 'device-1' },
              { id: '2', address: '192.168.1.101', hostname: 'device-2' },
            ],
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useGetDHCPLeases('router-1'),
      {
        wrapper: ({ children }) => (
          <MockedProvider mocks={mocks} addTypename={false}>
            {children}
          </MockedProvider>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.dhcpLeases).toHaveLength(2);
    });
  });

  it('should handle router query errors', async () => {
    const mocks = [
      {
        request: {
          query: GET_DHCP_LEASES,
          variables: { routerId: 'router-1' },
        },
        error: new Error('Connection timeout'),
      },
    ];

    const { result } = renderHook(
      () => useGetDHCPLeases('router-1'),
      {
        wrapper: ({ children }) => (
          <MockedProvider mocks={mocks} addTypename={false}>
            {children}
          </MockedProvider>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Connection timeout');
    });
  });
});
```

### Mocking i18n

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock i18n module
vi.mock('@nasnet/core/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, ...args: any[]) => key,  // Return key as-is for testing
  }),
  useFormatters: () => ({
    formatNumber: (n: number) => n.toLocaleString(),
    formatDate: (d: Date) => d.toLocaleDateString(),
  }),
}));

describe('i18n Mocks', () => {
  it('should provide mocked translation function', () => {
    const { useTranslation } = require('@nasnet/core/i18n');
    const { t } = useTranslation();
    expect(t('common.save')).toBe('common.save');
  });
});
```

### Mocking Storage

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Storage Mocks', () => {
  beforeEach(() => {
    // Create in-memory storage mock
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  it('should mock localStorage.setItem and getItem', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
  });

  it('should mock localStorage.removeItem', () => {
    localStorage.setItem('key', 'value');
    localStorage.removeItem('key');
    expect(localStorage.getItem('key')).toBe(null);
  });
});
```

---

## Fixture Patterns

Test data factories for creating consistent test fixtures:

```typescript
// libs/core/utils/src/__fixtures__/router.fixtures.ts
export const createMockRouter = (overrides = {}) => ({
  id: 'router-1',
  address: '192.168.1.1',
  hostname: 'MikroTik',
  version: '7.10',
  uptime: 86400,
  cpu: 45,
  memory: 67,
  ...overrides,
});

export const createMockDHCPLease = (overrides = {}) => ({
  id: 'lease-1',
  address: '192.168.1.100',
  hostname: 'device-1',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  expiresAt: new Date(Date.now() + 86400000),
  ...overrides,
});

export const createMockFirewallRule = (overrides = {}) => ({
  id: 'rule-1',
  name: 'Allow SSH',
  protocol: 'tcp',
  destPort: 22,
  action: 'accept',
  enabled: true,
  ...overrides,
});

// Usage in tests
describe('Router Operations', () => {
  it('should update router config', () => {
    const router = createMockRouter({ address: '10.0.0.1' });
    expect(router.address).toBe('10.0.0.1');
  });
});
```

---

## Coverage Requirements

Target coverage: **80%+ for lines and statements, 75%+ for branches and functions**.

### Running Coverage Reports

```bash
# Generate coverage report
npx vitest --coverage

# View HTML report
open coverage/index.html

# Check coverage for specific file
npx vitest --coverage libs/core/utils/src/network/ip.ts
```

### Coverage Configuration

From `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/types/**',
    '**/__mocks__/**',
  ],
  thresholds: {
    lines: 80,
    branches: 75,
    functions: 75,
    statements: 80,
  },
},
```

**Excluding from coverage:**
- Type-only files (`**/*.d.ts`, `**/types/**`)
- Configuration files (`**/*.config.*`)
- Test setup files (`src/test/**`)
- Mock files (`**/__mocks__/**`)

### Tips for Reaching Coverage

1. **Add missing edge cases** — Boundary values, null/undefined, empty collections
2. **Test error paths** — Throw statements, validation failures
3. **Test async flows** — Promises, callbacks, timeouts
4. **Test hook cleanup** — `unmount()`, event listener removal
5. **Test accessibility** — `vi.stubGlobal('matchMedia', ...)` for a11y tests

---

## Summary

| Category | Pattern | Tool |
|----------|---------|------|
| Pure functions | Simple `expect(func(input)).toBe(output)` | Vitest |
| Validators/Schemas | `safeParse()` with valid/invalid cases | Zod + Vitest |
| React hooks | `renderHook()` + `act()` + mocking | @testing-library/react |
| Async operations | `vi.fn().mockResolvedValue()` + `waitFor()` | Vitest + @testing-library |
| DOM/Timers | `vi.useFakeTimers()`, `vi.stubGlobal()` | Vitest |
| Test data | Factory functions in `__fixtures__/` | Fixtures |

---

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Zod Documentation](https://zod.dev/)
- `Docs/architecture/implementation-patterns/18-testing-strategy-patterns.md` — Full testing architecture guide
