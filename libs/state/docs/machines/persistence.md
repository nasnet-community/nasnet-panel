# State Persistence API

The **State Persistence API** provides localStorage-based persistence for XState machines, enabling session recovery after browser close/crash. It's used by wizards, config pipelines, and other long-running workflows to let users resume from where they left off.

**Source:** `libs/state/machines/src/persistence.ts`

## Overview

The persistence module provides utilities for:

- **Saving machine state** - Automatically on every transition
- **Restoring machine state** - Resume from previous session
- **Session timeout** - Default: 24 hours (configurable)
- **Cleanup** - Automatically remove stale sessions
- **Type safety** - Full TypeScript support

## Core Functions

### `persistMachineState()`

Saves the current machine state to localStorage.

```typescript
export function persistMachineState<TContext>(
  machineId: string,
  stateValue: string,
  context: TContext
): void
```

**Parameters:**
- `machineId` - Unique identifier for the machine (e.g., `'vpn-wizard'`)
- `stateValue` - Current state value (e.g., `'step'`, `'validating'`)
- `context` - Current machine context (all state data)

**Example:**

```typescript
import { persistMachineState } from '@nasnet/state/machines';

// In a machine action or side effect
persistMachineState('vpn-setup', 'step', {
  currentStep: 2,
  totalSteps: 3,
  data: { provider: 'wireguard' },
  errors: {},
  sessionId: 'uuid-123',
});

// Stored as:
// localStorage['nasnet-machine-vpn-setup'] = {
//   state: 'step',
//   context: { currentStep: 2, ... },
//   timestamp: 1234567890,
//   machineId: 'vpn-setup'
// }
```

**When to use:**
- In machine action: `actions: { saveMachine: () => persistMachineState(...) }`
- In useEffect hook: Auto-persist on state changes
- Manually on critical transitions

### `restoreMachineState()`

Restores machine state from localStorage.

```typescript
export function restoreMachineState<TContext>(
  machineId: string,
  maxAge: number = SESSION_TIMEOUT_MS  // 24 hours default
): PersistedMachineState<TContext> | null
```

**Returns:**
- `PersistedMachineState` - Saved state if valid and not expired
- `null` - If no saved state, expired, or corrupted

**Example:**

```typescript
import { restoreMachineState } from '@nasnet/state/machines';

const saved = restoreMachineState<WizardContext>('vpn-wizard');

if (saved) {
  // Resume from saved state
  send({ type: 'RESTORE', savedContext: saved.context });
} else {
  // No saved session, start fresh
  console.log('Starting new wizard session');
}
```

**Automatic cleanup:**
- Expired sessions (older than maxAge) are deleted automatically
- Corrupted data is deleted automatically
- Returns `null` for safety

### `clearMachineState()`

Deletes saved state for a machine.

```typescript
export function clearMachineState(machineId: string): void
```

**Example:**

```typescript
// After wizard completion
clearMachineState('vpn-wizard');

// After user logout
clearMachineState('vpn-wizard');
clearMachineState('device-pairing');
```

### `hasSavedSession()`

Checks if a machine has a valid saved session.

```typescript
export function hasSavedSession(
  machineId: string,
  maxAge: number = SESSION_TIMEOUT_MS
): boolean
```

**Example:**

```tsx
function VPNSetupPage() {
  const hasSaved = hasSavedSession('vpn-setup');

  if (hasSaved) {
    return <ResumePrompt />;
  }

  return <WizardForm />;
}
```

### `getSessionAge()`

Gets the age of a saved session in milliseconds.

```typescript
export function getSessionAge(machineId: string): number | null
```

**Returns:**
- `number` - Age in milliseconds
- `null` - If no session exists

**Example:**

```typescript
const ageMs = getSessionAge('vpn-setup');

if (ageMs && ageMs > 3600000) {  // 1 hour
  console.log('Session is older than 1 hour');
}
```

### `formatSessionAge()`

Formats session age for human display.

```typescript
export function formatSessionAge(ageMs: number): string
```

**Returns:** Human-readable age string (e.g., `"2 hours ago"`, `"just now"`)

**Example:**

```tsx
const ageMs = getSessionAge('vpn-setup');

{ageMs && (
  <p>Your previous setup was {formatSessionAge(ageMs)}</p>
)}
```

### `clearAllMachineStates()`

Clears all saved machine states (useful for logout).

```typescript
export function clearAllMachineStates(): void
```

**Example:**

```typescript
// On user logout
function handleLogout() {
  clearAllMachineStates();
  navigate('/login');
}
```

### `cleanupStaleSessions()`

Removes sessions older than specified age (default: 24 hours).

```typescript
export function cleanupStaleSessions(
  maxAge: number = SESSION_TIMEOUT_MS
): number  // Returns count of cleaned sessions
```

**Example:**

```typescript
// On app startup
useEffect(() => {
  const cleaned = cleanupStaleSessions();
  console.log(`Cleaned up ${cleaned} stale sessions`);
}, []);
```

### `getSavedMachineIds()`

Gets all machine IDs with saved sessions.

```typescript
export function getSavedMachineIds(): string[]
```

**Example:**

```typescript
const saved = getSavedMachineIds();
console.log('Machines with saved sessions:', saved);
// Output: ['vpn-setup', 'device-pairing', 'dns-config']
```

### `createSessionRecoveryOptions()`

Creates session recovery options with defaults.

```typescript
export function createSessionRecoveryOptions(
  options: Partial<SessionRecoveryOptions> = {}
): Required<SessionRecoveryOptions>
```

**Example:**

```typescript
const recovery = createSessionRecoveryOptions({
  maxAge: 3600000,  // 1 hour
  promptBeforeRestore: true,
  onRestore: () => console.log('Session restored!'),
});
```

## Types

### `PersistedMachineState`

```typescript
interface PersistedMachineState<TContext = unknown> {
  /** Current state value (e.g., 'step', 'validating') */
  state: string;

  /** Machine context with all data */
  context: TContext;

  /** When state was saved (milliseconds since epoch) */
  timestamp: number;

  /** Machine ID for identification */
  machineId: string;
}
```

### `SessionRecoveryOptions`

```typescript
interface SessionRecoveryOptions {
  /** Maximum age of session before stale (default: 24 hours) */
  maxAge?: number;

  /** Prompt before restoring? (default: true) */
  promptBeforeRestore?: boolean;

  /** Callback when session is restored */
  onRestore?: () => void;

  /** Callback when session is discarded */
  onDiscard?: () => void;
}
```

## Constants

```typescript
/** localStorage key prefix for all machines */
export const STORAGE_KEY_PREFIX = 'nasnet-machine-';

/** Default session timeout: 24 hours in milliseconds */
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
```

**Storage format:**
```
nasnet-machine-vpn-setup
nasnet-machine-device-pairing
nasnet-machine-dns-config
```

## Integration with Hooks

### useWizard Hook

```tsx
import { useWizard } from '@nasnet/state/machines';

function VPNSetup() {
  const wizard = useWizard(config, {
    autoPersist: true,      // Auto-save on every state change
    autoRestore: false,     // Show resume prompt (not auto-restore)
    onRestore: () => {
      toast.info('Resuming previous setup...');
    },
  });

  // Hook automatically:
  // - Saves state on mount/updates (if autoPersist)
  // - Checks for saved session on mount
  // - Shows restore prompt (if !autoRestore)
  // - Clears state on completion

  if (wizard.canRestore) {
    return (
      <ResumePrompt
        onResume={wizard.restore}
        onDiscard={wizard.discardSession}
        age={wizard.savedSessionAge}
      />
    );
  }

  return <WizardForm {...wizard} />;
}
```

### Manual Integration

```tsx
import {
  persistMachineState,
  restoreMachineState,
  clearMachineState,
} from '@nasnet/state/machines';
import { useMachine } from '@xstate/react';

function CustomWizard() {
  const machine = useMemo(() => createWizardMachine(config), []);
  const [state, send] = useMachine(machine);

  // Auto-persist on state changes
  useEffect(() => {
    const stateValue = typeof state.value === 'string'
      ? state.value
      : JSON.stringify(state.value);

    persistMachineState('my-wizard', stateValue, state.context);
  }, [state]);

  // Restore on mount
  useEffect(() => {
    const saved = restoreMachineState('my-wizard');
    if (saved) {
      send({ type: 'RESTORE', savedContext: saved.context });
    }
  }, []);

  // Clear on completion
  useEffect(() => {
    if (state.matches('completed')) {
      clearMachineState('my-wizard');
    }
  }, [state.matches('completed')]);

  return <div>{/* ... */}</div>;
}
```

## Storage Structure

```typescript
// Saved in localStorage as:
{
  "nasnet-machine-vpn-setup": {
    "state": "step",
    "context": {
      "currentStep": 2,
      "totalSteps": 3,
      "data": {
        "provider": "wireguard",
        "serverAddress": "vpn.example.com"
      },
      "errors": {},
      "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    "timestamp": 1676234567890,
    "machineId": "vpn-setup"
  }
}
```

**Key insights:**
- Each machine ID has its own storage entry
- Timestamp allows timeout detection
- Full context is serialized (must be JSON-compatible)
- MachineId is stored for validation

## Best Practices

### 1. Unique Machine IDs

Use descriptive, unique IDs:

```typescript
// Good
'vpn-setup'
'device-pairing'
'dns-config'
'firewall-rule-editor'

// Bad (too generic)
'wizard'
'form'
'modal'
```

### 2. Exclude Non-Serializable Data

Don't store functions, refs, or complex objects in context:

```typescript
// Bad - functions not serializable
context: {
  validateStep: (step) => { /* ... */ },  // ❌ Won't serialize
  data: { /* ... */ }
}

// Good - only store data
context: {
  data: { provider: 'wireguard' },        // ✓ JSON-safe
  errors: {},
}
```

### 3. Clear on Logout

```typescript
function useAuth() {
  const logout = useCallback(async () => {
    await api.logout();
    clearAllMachineStates();  // Clear all wizard sessions
    navigate('/login');
  }, []);

  return { logout };
}
```

### 4. Cleanup on App Startup

```typescript
function App() {
  useEffect(() => {
    // Remove sessions older than 24 hours
    cleanupStaleSessions();
  }, []);

  return <Routes>{/* ... */}</Routes>;
}
```

### 5. Handle Corrupted Data

The persistence API automatically handles corruption (deletes and returns null). For safety:

```typescript
const saved = restoreMachineState('wizard-id');

if (saved) {
  // Data is guaranteed valid
  send({ type: 'RESTORE', savedContext: saved.context });
} else {
  // Start fresh (safe fallback)
  console.log('Starting new session');
}
```

## Testing Persistence

```typescript
import { persistMachineState, restoreMachineState, clearMachineState } from '@nasnet/state/machines';

describe('Machine Persistence', () => {
  afterEach(() => {
    clearMachineState('test-machine');
  });

  it('should persist and restore state', () => {
    // Persist
    const context = { step: 1, data: { name: 'Test' } };
    persistMachineState('test-machine', 'active', context);

    // Restore
    const saved = restoreMachineState('test-machine');
    expect(saved?.context).toEqual(context);
    expect(saved?.state).toBe('active');
  });

  it('should return null for non-existent session', () => {
    const saved = restoreMachineState('nonexistent');
    expect(saved).toBeNull();
  });

  it('should expire old sessions', () => {
    // Persist with old timestamp
    const oldContext = { step: 1 };
    persistMachineState('test-machine', 'active', oldContext);

    // Restore with 1ms max age (forces expiration)
    const saved = restoreMachineState('test-machine', 1);
    expect(saved).toBeNull();
  });
});
```

## Storage Limits

localStorage has limits:
- **Chrome/Firefox:** ~5-10MB per domain
- **Safari:** ~5MB per domain
- **IE:** ~10MB per domain

**To stay safe:**
- Keep context objects small (< 100KB each)
- Don't store large binary data
- Periodically clean old sessions
- Monitor localStorage usage

```typescript
function getStorageUsage() {
  const keys = getSavedMachineIds();
  let total = 0;

  keys.forEach(key => {
    const stored = localStorage.getItem(`nasnet-machine-${key}`);
    if (stored) {
      total += stored.length;
    }
  });

  return {
    used: `${(total / 1024).toFixed(2)} KB`,
    machines: keys.length,
  };
}
```

## Related Documentation

- **Wizard:** See `wizard.md` for useWizard integration
- **Overview:** See `overview.md` for machine catalog
- **Config Pipeline:** See `config-pipeline.md` for long-running operations
