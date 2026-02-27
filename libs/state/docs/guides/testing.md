---
sidebar_position: 5
title: Testing Strategy
---

# Testing Zustand & XState

Comprehensive testing guide for state management in NasNet.

**Source:** `libs/state/stores/src/` and `libs/state/machines/src/`

## Overview

The state management library has extensive test coverage:

- **22 store test files** across auth, connection, theme, and utility modules
- **4 major machine test suites** (wizard, config pipeline, change set, persistence)
- **800+ total test lines** covering state mutations, async operations, persistence, and edge cases
- **Vitest framework** for fast, native ESM testing
- **Zustand stores** and **XState machines** both tested thoroughly

## Test Setup

### Zustand Store Reset Pattern

Zustand stores persist to localStorage by default. Every test suite must reset store state:

**Source:** `libs/state/stores/src/test-setup.ts`

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state to initial values
    useAuthStore.setState({
      token: null,
      tokenExpiry: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isRefreshing: false,
      refreshAttempts: 0,
      lastActivity: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers(); // Reset fake timers if used
  });
});
```

**Why this matters:**

- Store state is global and persistent across tests
- localStorage carries over between tests without reset
- Fake timers must be restored to prevent test interference
- Each test must start with a clean slate

### XState Machine Test Pattern

XState tests use `createActor` to instantiate and control machines:

**Source:** `libs/state/machines/src/test-setup.ts`

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  // Mock localStorage for persistence tests
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Testing Zustand Stores

### State Mutations

Test that actions properly update state:

```typescript
// Source: libs/state/stores/src/auth/auth.store.test.ts
describe('setAuth', () => {
  it('should set tokens and mark as authenticated', () => {
    const { setAuth } = useAuthStore.getState();
    const user = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    setAuth('access-token', user, expiresAt, 'refresh-token');

    const state = useAuthStore.getState();
    expect(state.token).toBe('access-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('should reset refresh attempts when setting tokens', () => {
    useAuthStore.setState({ refreshAttempts: 5 });

    const { setAuth } = useAuthStore.getState();
    const user = { id: '1', username: 'test', email: 'test@example.com', permissions: [] };
    setAuth('new-token', user, new Date(Date.now() + 3600000), 'new-refresh');

    expect(useAuthStore.getState().refreshAttempts).toBe(0);
  });
});
```

**Key patterns:**

- Use `useAuthStore.getState()` to get current state
- Call actions through `getState()` actions
- Assert state changes immediately
- Test both happy path and side effects

### Testing Selectors

Zustand selectors optimize re-renders by selecting specific fields:

```typescript
// Test selector returns correct value
const token = useAuthStore((state) => state.token);
expect(token).toBe(expectedToken);

// Test combined selector
const { token, isAuthenticated } = useAuthStore((state) => ({
  token: state.token,
  isAuthenticated: state.isAuthenticated,
}));
```

### Testing Persistence/Rehydration

Zustand stores persist to localStorage. Test the full cycle:

**Source:** `libs/state/stores/src/auth/auth.store.test.ts`

```typescript
describe('Persistence', () => {
  it('should persist auth state to localStorage', () => {
    const { setAuth } = useAuthStore.getState();
    const user = { id: '1', username: 'test', email: null, permissions: ['admin'] };

    setAuth('access-token', user, new Date(Date.now() + 3600 * 1000), 'refresh-token');

    const stored = localStorage.getItem('auth-storage');
    expect(stored).toBeTruthy();

    const data = JSON.parse(stored!);
    expect(data.state.token).toBe('access-token');
    expect(data.state.user.username).toBe('test');
  });

  it('should serialize Date objects correctly', () => {
    const { setAuth } = useAuthStore.getState();
    const user = { id: '1', username: 'test', email: null, permissions: [] };
    const expiresAt = new Date('2024-01-01T13:00:00Z');

    setAuth('access-token', user, expiresAt, 'refresh-token');

    const stored = localStorage.getItem('auth-storage');
    const data = JSON.parse(stored!);

    // Check that Date was serialized as ISO string
    expect(typeof data.state.tokenExpiry).toBe('string');
    expect(data.state.tokenExpiry).toContain('2024-01-01');
  });

  it('should NOT persist temporary state', () => {
    useAuthStore.setState({ isRefreshing: true });

    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const data = JSON.parse(stored);
      // isRefreshing should be filtered by partialize function
      expect(data.state.isRefreshing).toBeUndefined();
    }
  });
});
```

**Key patterns:**

- Test persistence to localStorage (check key and format)
- Test date serialization (ISO strings in JSON)
- Test `partialize` function filters sensitive fields
- Verify rehydration format matches store schema

### Testing Async Operations

Use `vi.useFakeTimers()` for time-dependent tests:

**Source:** `libs/state/stores/src/auth/auth.store.test.ts`

```typescript
describe('Token Expiry Helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('isTokenExpiringSoon should return true within threshold', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);

    useAuthStore.setState({
      tokenExpiry: new Date(now.getTime() + 2 * 60 * 1000), // expires in 2 min
      isAuthenticated: true,
    });

    const { isTokenExpiringSoon } = useAuthStore.getState();
    expect(isTokenExpiringSoon()).toBe(true); // Within 5-minute default threshold
  });

  it('getTimeUntilExpiry should return milliseconds remaining', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const expiresInMs = 30 * 60 * 1000; // 30 minutes
    useAuthStore.setState({
      tokenExpiry: new Date(now.getTime() + expiresInMs),
      isAuthenticated: true,
    });

    const { getTimeUntilExpiry } = useAuthStore.getState();
    const timeLeft = getTimeUntilExpiry();
    expect(timeLeft).toBeGreaterThan(0);
    expect(timeLeft).toBeLessThanOrEqual(expiresInMs);
  });
});
```

**Key patterns:**

- Use `vi.useFakeTimers()` to control time
- Set system time with `vi.setSystemTime()`
- Advance time with `vi.advanceTimersByTime(ms)`
- Always call `vi.useRealTimers()` in afterEach
- Test edge cases (expired, expiring, valid)

### Using store.setState() for Setup

For complex test setup, use `setState()` directly:

```typescript
// Set up complex state for test
useConnectionStore.setState({
  wsStatus: 'connecting',
  isReconnecting: true,
  reconnectAttempts: 2,
  activeRouterId: 'router-1',
  routers: {
    'router-1': {
      status: 'connecting',
      protocol: 'api',
      latencyMs: 150,
    },
  },
});

// Now test behavior from that state
const { hasExceededMaxAttempts } = useConnectionStore.getState();
expect(hasExceededMaxAttempts()).toBe(false); // Under limit
```

## Testing XState Machines

### Creating Test Actors

Create actors from machines for testing state transitions:

**Source:** `libs/state/machines/src/__tests__/wizardMachine.test.ts`

```typescript
import { createActor } from 'xstate';
import { createWizardMachine } from '../wizardMachine';

describe('Wizard Machine', () => {
  it('should start at step 1', () => {
    const machine = createWizardMachine<TestData>({
      id: 'test-wizard',
      totalSteps: 3,
      validateStep: async () => ({ valid: true }),
      onSubmit: async () => {},
    });

    const actor = createActor(machine, {});
    actor.start();

    expect(actor.getSnapshot().context.currentStep).toBe(1);
    expect(actor.getSnapshot().matches('step')).toBe(true);
  });
});
```

**Key patterns:**

- Call `createActor(machine, {})` to create instance
- Call `actor.start()` to begin state machine
- Use `actor.getSnapshot()` to inspect current state
- Check `snapshot.value` for state name
- Check `snapshot.context` for data
- Check `snapshot.matches('state')` for state matching
- Call `actor.stop()` in cleanup

### Sending Events and Asserting States

Test transitions by sending events and checking resulting state:

```typescript
it('should go back from step 2 to step 1', async () => {
  const machine = createWizardMachine<TestData>({
    id: 'test',
    totalSteps: 3,
    validateStep: async () => ({ valid: true }),
    onSubmit: async () => {},
  });

  const actor = createActor(machine, {});
  actor.start();

  // Advance to step 2
  actor.send({ type: 'NEXT', data: { name: 'Test' } });

  // Wait for async validation
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Go back
  actor.send({ type: 'BACK' });

  expect(actor.getSnapshot().context.currentStep).toBe(1);
});
```

**Key patterns:**

- Send events with `actor.send({ type: 'EVENT_NAME', ... })`
- Wait for async operations: `await new Promise(resolve => setTimeout(resolve, ms))`
- Use `vi.waitFor()` for better async handling
- Assert state after transitions
- Test error cases and edge conditions

### Testing Guards and Actions

Test conditional transitions with guards:

```typescript
it('should prevent going back from step 1', () => {
  const actor = createActor(machine, {});
  actor.start();

  actor.send({ type: 'BACK' });

  // Still on step 1 (BACK guard prevents transition)
  expect(actor.getSnapshot().context.currentStep).toBe(1);
});

it('should advance step on successful validation', async () => {
  const validateStep = vi.fn().mockResolvedValue({ valid: true });
  const machine = createWizardMachine<TestData>({
    id: 'test',
    totalSteps: 3,
    validateStep,
    onSubmit: async () => {},
  });

  const actor = createActor(machine, {});
  actor.start();

  actor.send({ type: 'NEXT', data: { name: 'Test' } });

  await new Promise((resolve) => setTimeout(resolve, 50));

  // Should have advanced
  expect(actor.getSnapshot().context.currentStep).toBe(2);
  expect(validateStep).toHaveBeenCalledWith(1, { name: 'Test' });
});
```

**Key patterns:**

- Guards prevent unwanted transitions
- Actions modify context during transitions
- Mock service calls with `vi.fn()`
- Assert action was called with correct arguments
- Test both valid and invalid paths

### Testing Async Services

Test machines with async operations (validation, API calls):

**Source:** `libs/state/machines/src/__tests__/changeSetMachine.test.ts`

```typescript
it('should transition to ready on successful validation', async () => {
  const validateFn = vi.fn().mockResolvedValue({
    canApply: true,
    errors: [],
    warnings: [],
    conflicts: [],
    missingDependencies: [],
    circularDependencies: null,
  });

  const config = {
    validateChangeSet: validateFn,
    applyItem: vi.fn().mockResolvedValue({
      confirmedState: { id: 'created-id' },
      resourceUuid: 'uuid-123',
    }),
    rollbackItem: vi.fn().mockResolvedValue(undefined),
    onValidationComplete: vi.fn(),
    onProgress: vi.fn(),
    onComplete: vi.fn(),
    onFailed: vi.fn(),
    onRolledBack: vi.fn(),
  };

  const machine = createChangeSetMachine(config);
  const actor = createActor(machine, {});

  actor.start();
  actor.send({ type: 'LOAD', changeSet, routerId: 'router-1' });
  actor.send({ type: 'START_VALIDATION' });

  // Wait for validation to complete
  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe('ready');
  });

  expect(actor.getSnapshot().context.validationResult?.canApply).toBe(true);
});
```

**Key patterns:**

- Mock service functions with `vi.fn()`
- Use `mockResolvedValue()` for successful async
- Use `mockRejectedValue()` for errors
- Use `vi.waitFor()` to wait for async completion
- Assert final state after async operation completes
- Test error paths with rejection

### Testing Persistence

Test machine state persistence and restoration:

**Source:** `libs/state/machines/src/__tests__/persistence.test.ts`

```typescript
describe('persistMachineState', () => {
  it('should save state to localStorage', () => {
    const context = { step: 1, data: { name: 'Test' } };

    persistMachineState('test-machine', 'step', context);

    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}test-machine`);
    expect(stored).toBeDefined();
    expect(JSON.parse(stored!)).toMatchObject({
      state: 'step',
      context,
      machineId: 'test-machine',
    });
  });

  it('should include timestamp', () => {
    persistMachineState('test-machine', 'step', { data: {} });

    const stored = JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}test-machine`)!);
    expect(stored.timestamp).toBeDefined();
    expect(typeof stored.timestamp).toBe('number');
  });

  it('should restore saved state', () => {
    const context = { step: 2, data: { name: 'Test' } };
    persistMachineState('test-machine', 'validating', context);

    const restored = restoreMachineState('test-machine');

    expect(restored).toBeDefined();
    expect(restored?.context).toEqual(context);
    expect(restored?.state).toBe('validating');
  });

  it('should return null for stale sessions', () => {
    const oldData = {
      state: 'step',
      context: {},
      timestamp: Date.now() - SESSION_TIMEOUT_MS - 1000,
      machineId: 'old-machine',
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}old-machine`, JSON.stringify(oldData));

    const restored = restoreMachineState('old-machine');

    expect(restored).toBeNull();
  });
});
```

**Key patterns:**

- Test save/restore cycle
- Verify localStorage format (key, structure)
- Test timestamp handling
- Test session expiry (stale session cleanup)
- Test corruption recovery

## Mock Patterns

### Mocking localStorage

Most tests need localStorage mocks. Test setup file provides this:

**Source:** `libs/state/machines/src/test-setup.ts`

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

**Usage in tests:**

```typescript
beforeEach(() => {
  localStorageMock.clear();
});

it('test', () => {
  const value = localStorage.getItem('key');
  expect(value).toBeTruthy();
});
```

### Mocking Time

For time-dependent logic, use fake timers:

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('should handle time-based expiry', () => {
  const now = new Date('2024-01-01T12:00:00Z');
  vi.setSystemTime(now);

  // Test time-dependent logic
  const expiry = new Date(now.getTime() + 5000);
  expect(expiry.getTime()).toBeGreaterThan(now.getTime());

  // Advance time
  vi.advanceTimersByTime(3000);
  expect(Date.now()).toBe(now.getTime() + 3000);
});
```

### Mocking Service Functions

Mock async operations in tests:

```typescript
const validateStep = vi
  .fn()
  .mockResolvedValueOnce({ valid: true })
  .mockRejectedValueOnce(new Error('Network error'));

const result1 = await validateStep(1, data);
expect(result1.valid).toBe(true);

const result2 = await validateStep(1, data);
// throws Error: Network error
```

## Best Practices Checklist

### Store Testing

- [ ] Reset store state in `beforeEach`
- [ ] Clear localStorage in `beforeEach`
- [ ] Test state mutations independently
- [ ] Test persistence to localStorage
- [ ] Test Date serialization correctly
- [ ] Test async operations with fake timers
- [ ] Use `getState()` to read current state
- [ ] Call actions through state, not directly
- [ ] Verify `partialize` filters sensitive fields
- [ ] Test error handling in async actions

### Machine Testing

- [ ] Create actor from machine
- [ ] Call `actor.start()` before sending events
- [ ] Call `actor.stop()` in cleanup
- [ ] Use `getSnapshot()` for current state
- [ ] Wait for async operations with `vi.waitFor()`
- [ ] Test guards prevent unwanted transitions
- [ ] Test actions modify context correctly
- [ ] Mock service functions with `vi.fn()`
- [ ] Test error paths and rollback scenarios
- [ ] Test persistence and restoration cycle

### General Testing

- [ ] Reset mocks in `afterEach`
- [ ] Use `vi.useFakeTimers()` and `vi.useRealTimers()`
- [ ] Mock localStorage in test-setup
- [ ] Test both happy path and error cases
- [ ] Test edge conditions (empty, null, invalid)
- [ ] Verify callbacks are called with correct args
- [ ] Use clear, descriptive test names
- [ ] Keep test functions focused and small
- [ ] Test public API, not implementation details
- [ ] Comment on non-obvious test logic

## Common Testing Patterns

### Testing Recovery/Retry

```typescript
it('should retry on failure and succeed', async () => {
  const operation = vi
    .fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce('success');

  const result = await withRetry(operation, { maxRetries: 2 });

  expect(result.success).toBe(true);
  expect(result.data).toBe('success');
  expect(operation).toHaveBeenCalledTimes(2);
});
```

### Testing Backoff

```typescript
it('should apply exponential backoff', () => {
  const backoff0 = calculateBackoff(0);
  const backoff1 = calculateBackoff(1);
  const backoff2 = calculateBackoff(2);

  // Each should be roughly double (with jitter)
  expect(backoff1).toBeGreaterThan(backoff0 * 0.8);
  expect(backoff2).toBeGreaterThan(backoff1 * 0.8);
});
```

### Testing State Machines with Multiple Items

```typescript
it('should apply items in order and rollback on error', async () => {
  const applyFn = vi
    .fn()
    .mockResolvedValueOnce({ confirmedState: {}, resourceUuid: 'uuid-1' })
    .mockRejectedValueOnce(new Error('Second item failed'));

  const changeSet = createChangeSet({
    items: [
      { id: 'item-1', name: 'First' },
      { id: 'item-2', name: 'Second' },
    ],
  });

  // ... test that first item succeeded, then rollback happens
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- auth.store.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Related Documentation

- **Debugging:** See `debugging.md` for state inspection techniques
- **Persistence:** Explore `libs/state/docs/machines/persistence.md` for session recovery
- **Machines:** See individual machine docs (wizard.md, config-pipeline.md, etc.)
