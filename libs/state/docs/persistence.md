---
sidebar_position: 3
title: Persistence
---

# Storage & Persistence

This document maps **all localStorage keys** used by `@nasnet/state` stores and machines, custom
serialization handlers, and hydration/rehydration lifecycle.

## localStorage Keys Reference

| localStorage Key                | Store                         | Persisted Data                                                             | Max Size                    | Lifetime                  |
| ------------------------------- | ----------------------------- | -------------------------------------------------------------------------- | --------------------------- | ------------------------- |
| `nasnet-theme`                  | `useThemeStore`               | `theme: 'light' \| 'dark' \| 'system'`                                     | ~20 bytes                   | Until user changes        |
| `nasnet-sidebar`                | `useSidebarStore`             | `desktopCollapsed: boolean`                                                | ~20 bytes                   | Until user changes        |
| `nasnet-ui`                     | `useUIStore`                  | `compactMode, animationsEnabled, activeTab, defaultNotificationDuration`   | ~100 bytes                  | Until user changes        |
| `nasnet-modal`                  | `useModalStore`               | `activeModal: string \| null, modalData: Record<string, unknown>`          | ~500 bytes                  | Until user closes modal   |
| `nasnet-notification`           | `useNotificationStore`        | `notifications: Notification[]`                                            | ~5KB (max 50 notifications) | Auto-expire by duration   |
| `nasnet-help-mode`              | `useHelpModeStore`            | `mode: 'simple' \| 'technical'`                                            | ~20 bytes                   | Until user changes        |
| `auth-storage`                  | `useAuthStore`                | `token, tokenExpiry, refreshToken, user, isAuthenticated`                  | ~2KB                        | Until logout or expiry    |
| `nasnet-connection`             | `useConnectionStore`          | `routerId, isConnected, lastPing`                                          | ~100 bytes                  | Until disconnect          |
| `nasnet-network`                | `useNetworkStore`             | `isOnline: boolean`                                                        | ~10 bytes                   | Real-time                 |
| `nasnet-router`                 | `useRouterStore`              | `selectedRouterId, recentRouters[]`                                        | ~500 bytes                  | Until user clears         |
| `nasnet-dhcp-ui`                | `useDHCPUIStore`              | `selectedPool, filters, search, wizardDraft`                               | ~1KB                        | Until navigation          |
| `nasnet-service-ui`             | `useServiceUIStore`           | `filters, search, selection, installWizardDraft`                           | ~1KB                        | Until navigation          |
| `nasnet-mangle-ui`              | `useMangleUIStore`            | `selectedChain, expandedRules, filters`                                    | ~500 bytes                  | Until navigation          |
| `nasnet-nat-ui`                 | `useNATUIStore`               | `selectedChain, expandedRules, filters`                                    | ~500 bytes                  | Until navigation          |
| `nasnet-raw-ui`                 | `useRawUIStore`               | `selectedChain, filters, expandedSection`                                  | ~300 bytes                  | Until navigation          |
| `nasnet-port-knock-ui`          | `usePortKnockUIStore`         | `activeTab, filters, selectedRule`                                         | ~300 bytes                  | Until navigation          |
| `nasnet-rate-limiting-ui`       | `useRateLimitingUIStore`      | `activeTab, filters, ruleEditorOpen`                                       | ~300 bytes                  | Until navigation          |
| `nasnet-firewall-log-ui`        | `useFirewallLogUIStore`       | `filters, autoRefresh, sortBy, selectedLogId`                              | ~500 bytes                  | Until navigation          |
| `nasnet-alert-notification`     | `useAlertNotificationStore`   | `alerts: Alert[]`                                                          | ~2KB                        | Persisted across sessions |
| `nasnet-alert-rule-template-ui` | `useAlertRuleTemplateUIStore` | `filters, viewMode, selectedTemplateId, dialogs`                           | ~500 bytes                  | Until navigation          |
| `nasnet-interface-stats`        | `useInterfaceStatsStore`      | `selectedInterfaces, refreshInterval`                                      | ~300 bytes                  | Until user changes        |
| `nasnet-command-registry`       | `useCommandRegistry`          | `recentIds: string[], usageCount: Record<string, number>`                  | ~1KB                        | Until user clears         |
| `nasnet-shortcut-registry`      | `useShortcutRegistry`         | `shortcuts: Record<string, string>`                                        | ~2KB                        | Until user changes        |
| `nasnet-history`                | `useHistoryStore`             | `past: SerializedAction[], future: SerializedAction[]` (global-scope only) | ~5KB                        | Until user clears         |
| `nasnet-machine-{id}`           | XState Machines               | `{ state, context, timestamp, machineId }`                                 | ~5KB per machine            | 24 hours (auto-cleanup)   |

**Total localStorage footprint: ~30KB** (within 10MB limits)

## Custom Storage Handlers

### Auth Store: Date Object Rehydration

**Problem:** JSON serialization converts `Date` objects to ISO strings, losing instanceof checks and
timezone info.

**Solution:** Custom storage handler that rehydrates Date objects:

```typescript
const authStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof localStorage === 'undefined') return null;

    const str = localStorage.getItem(name);
    if (!str) return null;

    try {
      const parsed = JSON.parse(str);

      // Rehydrate Date objects from ISO strings
      if (parsed.state?.tokenExpiry) {
        parsed.state.tokenExpiry = new Date(parsed.state.tokenExpiry);
      }
      if (parsed.state?.lastActivity) {
        parsed.state.lastActivity = new Date(parsed.state.lastActivity);
      }

      return JSON.stringify(parsed);
    } catch {
      return str;
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(name, value);
  },

  removeItem: (name: string): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(name);
  },
};
```

**Usage in auth store:**

```typescript
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        /* ... */
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => authStorage),
        partialize: (state) => ({
          token: state.token,
          tokenExpiry: state.tokenExpiry, // Serialized as ISO string
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
```

**Flow:**

1. **Persist:** `tokenExpiry: Date(2025-03-27T12:00:00Z)` → JSON string
2. **localStorage:** `"2025-03-27T12:00:00Z"` (stored as string)
3. **Rehydrate:** Custom handler converts → `new Date("2025-03-27T12:00:00Z")` → Date object
4. **Usage:** `tokenExpiry.getTime() <= Date.now()` works correctly

**Source:** `libs/state/stores/src/auth/auth.store.ts:191-230`

### History Store: Function Serialization (No-op on Rehydration)

**Problem:** Functions (`execute`, `undo`) cannot be JSON serialized.

**Solution:** Custom storage that provides no-op functions on rehydration (action metadata only):

```typescript
interface SerializedAction {
  id: string;
  type: string;
  description: string;
  timestamp: string;  // ISO string
  scope: 'page' | 'global';
  resourceId?: string;
  resourceType?: string;
  // No execute/undo functions
}

interface UndoableAction extends SerializedAction {
  execute: () => Promise<void>;
  undo: () => Promise<void>;
}

// Custom storage handler
storage: {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const data = JSON.parse(str);

    // Convert serialized actions back to full type with no-op functions
    if (data.state) {
      data.state.past = (data.state.past || []).map((a: SerializedAction) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        execute: () => {
          console.warn('[history-store] Cannot re-execute persisted action');
        },
        undo: () => {
          console.warn('[history-store] Cannot undo persisted action');
        },
      }));

      data.state.future = (data.state.future || []).map((a: SerializedAction) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        execute: () => console.warn('[history-store] Cannot re-execute persisted action'),
        undo: () => console.warn('[history-store] Cannot undo persisted action'),
      }));
    }

    return data;
  },
  setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => localStorage.removeItem(name),
}
```

**Why this design:**

- Only **action metadata** (description, timestamp, scope) is persisted
- Actual `execute()` and `undo()` functions require the original state, which may not exist after
  reload
- History UI displays persisted actions (for audit trail), but full undo/redo requires
  re-registration

**Usage:**

```typescript
// Store persisted actions for display
const pastActions = useHistoryStore((state) => state.past);
pastActions.forEach((action) => {
  console.log(`${action.timestamp}: ${action.description} (${action.scope})`);
});

// Redo on persisted action will warn (can't re-execute after reload)
// This is expected behavior
```

**Source:** `libs/state/stores/src/history/history.store.ts:54-78, 293-335`

### Command Registry: Map Serialization

**Problem:** `Map<string, Command>` and `Map<string, number>` don't JSON serialize.

**Solution:** Convert Map ↔ Record in `partialize` and `merge` functions:

```typescript
export const useCommandRegistry = create<CommandRegistryState & CommandRegistryActions>()(
  persist(
    (set, get) => ({
      /* ... */
    }),
    {
      name: 'nasnet-command-registry',
      version: 1,
      storage: createJSONStorage(() => localStorage),

      // On persist: Convert Map → Record
      partialize: (state) => ({
        recentIds: state.recentIds,
        usageCount: Object.fromEntries(state.usageCount), // Map → Record
      }),

      // On rehydrate: Convert Record → Map
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CommandRegistryState> & {
          usageCount?: Record<string, number>;
        };

        return {
          ...currentState,
          recentIds: persisted.recentIds || [],
          usageCount: new Map(Object.entries(persisted.usageCount || {})), // Record → Map
        };
      },
    }
  ),
  { name: 'command-registry' }
);
```

**Data flow:**

1. **In memory:** `usageCount: Map<string, number>` → `{ 'cmd-1': 3, 'cmd-2': 5, ... }`
2. **In localStorage:** `"usageCount":{"cmd-1":3,"cmd-2":5}`
3. **On reload:** `Object.entries(...)` → `[ ['cmd-1', 3], ['cmd-2', 5] ]` → `new Map(...)`
4. **Usage:** `usageCount.get('cmd-1')` works immediately after rehydration

**Source:** `libs/state/stores/src/command/command-registry.store.ts:280-300`

## Hydration/Rehydration Lifecycle

### Initial Load (App Startup)

```
1. Zustand initializes stores
   ├─ Read localStorage with persist middleware
   ├─ Run custom storage handlers (Date rehydration, Map conversion)
   └─ Merge persisted state with initial state

2. Components mount
   ├─ Selector reads current store state (already hydrated)
   ├─ useEffect triggers (hydration complete)
   └─ Component renders with persisted data

3. DevTools connect (if enabled)
   └─ Can now inspect/replay actions
```

### During User Session

```
1. User action triggers store mutation
   ├─ Reducer updates in-memory state
   ├─ DevTools logs mutation
   ├─ Persist middleware saves to localStorage
   └─ Components with selectors re-render (if selected value changed)

2. persist middleware lifecycle:
   ├─ Call partialize() to extract persistable subset
   ├─ Call custom setItem() to write to localStorage
   ├─ Error handling if quota exceeded
   └─ Silent failure (doesn't throw)
```

### Browser Close → Reopen

```
1. App startup (see "Initial Load" above)

2. Persist middleware rehydration:
   ├─ Check for localStorage key
   ├─ Call custom getItem() to read
   ├─ Custom handlers convert Date strings → Date objects, etc.
   ├─ Call merge() function to combine with initial state
   └─ Update store state with hydrated data

3. onRehydrateStorage hook (if provided):
   ├─ Called after rehydration
   ├─ Can initialize side effects based on hydrated state
   ├─ Example: Auth store uses this to validate token expiry
   └─ Example: Theme store uses this to resolve 'system' theme
```

### Example: Theme Store Rehydration

```typescript
export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      /* ... */
    }),
    {
      name: 'nasnet-theme',
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Failed to hydrate theme:', error);
          }

          // After rehydration, resolve system theme if needed
          if (state && state.theme === 'system') {
            state._setResolvedTheme(getSystemTheme());
          }
        };
      },
    }
  ),
  { name: 'theme-store' }
);
```

**Flow:**

1. User opens app with `theme: 'system'` persisted
2. Rehydrate from localStorage → `theme: 'system'`
3. Call `onRehydrateStorage` hook
4. Detect OS preference: `getSystemTheme()` → `'dark'`
5. Set `resolvedTheme: 'dark'`
6. Components see correct theme immediately

## Machine Persistence: Session Recovery

XState machines use separate persistence API (not Zustand persist middleware):

```typescript
import {
  persistMachineState,
  restoreMachineState,
  hasSavedSession,
  cleanupStaleSessions,
  clearMachineState,
  SESSION_TIMEOUT_MS,
  STORAGE_KEY_PREFIX,
} from '@nasnet/state/machines';

// ===== Persist on state transition =====

machine.onTransition((state) => {
  persistMachineState('vpn-wizard', state.value, state.context);
});

// ===== Restore on component mount =====

function VPNWizardPage() {
  useEffect(() => {
    // Check for saved session
    const saved = restoreMachineState('vpn-wizard');
    if (saved) {
      // Resume wizard
      actor.send({ type: 'RESTORE', data: saved.context });
    }
  }, []);
}

// ===== Cleanup =====

// On logout: clear all machine sessions
useEffect(() => {
  if (!isAuthenticated) {
    clearAllMachineStates();
  }
}, [isAuthenticated]);

// Periodic cleanup: remove stale sessions (24hr+ old)
useEffect(() => {
  const cleaned = cleanupStaleSessions();
  console.log(`Cleaned ${cleaned} stale sessions`);
}, []);
```

### localStorage Key Format for Machines

**Pattern:** `nasnet-machine-{machineId}`

**Examples:**

- `nasnet-machine-vpn-wizard` → VPN setup wizard session
- `nasnet-machine-config-pipeline` → Configuration pipeline session
- `nasnet-machine-router-config` → Router configuration wizard

**Storage structure:**

```typescript
{
  state: 'step2',                    // Current state value
  context: {                         // Machine context (arbitrary)
    vpnType: 'wireguard',
    selectedRouter: 'router-123',
    formData: { ... },
  },
  timestamp: 1709025600000,          // When saved (ms since epoch)
  machineId: 'vpn-wizard',           // For recovery validation
}
```

**Auto-cleanup:**

- Sessions older than 24 hours (default `SESSION_TIMEOUT_MS`)
- Call `cleanupStaleSessions()` on app startup
- Or call `clearMachineState(id)` to manually clear

**Source:** `libs/state/machines/src/persistence.ts`

## Storage Quota & Limits

### Browser localStorage Limits

| Browser | Limit | NasNet Usage |
| ------- | ----- | ------------ |
| Chrome  | ~10MB | ~30KB (0.3%) |
| Firefox | ~10MB | ~30KB (0.3%) |
| Safari  | ~5MB  | ~30KB (0.6%) |
| Edge    | ~10MB | ~30KB (0.3%) |

**Current usage is well within safe limits** (30KB ≪ 5MB).

### What Happens if Quota Exceeded

Zustand persist middleware catches errors silently (doesn't throw). If quota exceeded:

```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (error) {
  console.error('Failed to persist state:', error);
  // State remains in memory, just not persisted
}
```

**Recovery strategies:**

1. Clear old machine sessions: `cleanupStaleSessions()`
2. Clear history: `useHistoryStore.getState().clearHistory()`
3. Clear router cache: `useRouterStore.getState().clearHistory()`
4. Clear command registry: `useCommandRegistry.getState().clearRecent()`

## Privacy & Security

### What's Stored

| Data              | Stored?                | Risk              | Mitigation                                                     |
| ----------------- | ---------------------- | ----------------- | -------------------------------------------------------------- |
| JWT tokens        | Yes (auth-storage)     | Session hijacking | Only valid for 24hr, httpOnly cookies preferred for production |
| User info         | Yes (auth-storage)     | Privacy           | Encrypted in transit, not sensitive (username/email)           |
| Router ID         | Yes (ui stores)        | Privacy           | Non-sensitive, required for UX (recent routers)                |
| Theme preference  | Yes (theme-storage)    | None              | Not sensitive                                                  |
| Command history   | Yes (command-registry) | Privacy (weak)    | Could reveal user behavior, cleared on logout                  |
| Undo/redo history | Yes (history-storage)  | Privacy (weak)    | Could reveal user actions, page-scope cleared on navigation    |

### Best Practices

1. **Clear session data on logout:**

   ```typescript
   // Auth store clears token automatically on logout
   useAuthStore.getState().clearAuth();

   // Also clear all machine sessions
   clearAllMachineStates();
   ```

2. **Clear page-specific history on navigation:**

   ```typescript
   // Called by route guard or layout
   useHistoryStore.getState().clearPageHistory();
   ```

3. **Use httpOnly cookies for production:**
   - Tokens should be stored in httpOnly cookies, not localStorage
   - This prevents XSS from accessing auth tokens

---

**Next Steps:**

- Read [Performance](./performance.md) for selector patterns and re-render optimization
- Read [Architecture](./architecture.md) for custom storage handler implementation details
