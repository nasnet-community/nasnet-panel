---
sidebar_position: 11
title: Selectors Reference
---

# Selectors Reference

Complete API documentation for all selector utilities and pre-built selectors in the Zustand store
ecosystem.

## Overview

Selectors are the primary way to subscribe to specific parts of Zustand stores. They prevent
unnecessary re-renders by allowing components to subscribe to only the state they care about.

**Key Benefits:**

- **Precision subscriptions**: Only re-render when selected values change
- **Memoization options**: Cache computed results to avoid redundant calculations
- **Parameterized lookups**: Efficiently find items by ID or parameter
- **Type-safe**: Full TypeScript support with inferred types

**Source:** `libs/state/stores/src/ui/selectors.ts`

## Memoization Utilities

### shallowEqual

Performs shallow comparison of objects for use as a Zustand equality function.

```typescript
import { shallow } from '@nasnet/state/stores';

// Use shallow comparison for object selectors
const { user, token } = useAuthStore(
  (state) => ({ user: state.user, token: state.token }),
  shallow // Only re-renders if user OR token changed (not the object reference)
);
```

**When to use:**

- Selecting 2-3 fields together
- Need to avoid object reference changes
- Return value from selector is an object literal `{ ... }`

**API:**

```typescript
const shallowEqual: <T extends Record<string, any>>(a: T, b: T) => boolean;
```

**How it works:**

- Compares each property: `prev.user === next.user && prev.token === next.token`
- Returns `true` if all properties match (shallow equality)
- Returns `false` if any property differs
- More efficient than deep equality checks

**Example:**

```typescript
// ✅ GOOD: Only re-renders if user OR token changes
function AuthPanel() {
  const { user, token } = useAuthStore(
    state => ({ user: state.user, token: state.token }),
    shallow
  );
  return <div>{user?.username}</div>;
}

// ❌ BAD: Re-renders on every store update (no equality check)
function AuthPanelBad() {
  const { user, token } = useAuthStore(state => ({
    user: state.user,
    token: state.token,
  }));  // New object every time = re-render every time
  return <div>{user?.username}</div>;
}
```

---

### createMemoizedSelector

Creates a memoized selector that caches computed results and only recomputes when dependencies
change.

**Signature:**

```typescript
export function createMemoizedSelector<State, Deps extends unknown[], Result>(
  getDeps: (state: State) => Deps,
  compute: (deps: Deps) => Result
): (state: State) => Result;
```

**Parameters:**

- `getDeps`: Function that extracts dependencies from state (returns array of values)
- `compute`: Function that computes the result from dependencies

**Returns:** A selector function that takes state and returns the memoized result

**How it works:**

1. On first call: Extract dependencies from state, compute result, cache both
2. On subsequent calls: Check if dependencies changed (using Object.is)
3. If dependencies haven't changed: Return cached result (no recomputation)
4. If dependencies have changed: Recompute and update cache

**When to use:**

- Selector is used in **multiple components** (caches computation across renders)
- Computation is expensive (filtering, sorting, aggregation, string formatting)
- Dependencies change infrequently

**Benefits:**

- Prevents redundant computations across multiple component renders
- Only recomputes when dependencies actually change
- Zero overhead for first-render components
- Perfect for expensive filtering/mapping operations

**Example:**

```typescript
import { createMemoizedSelector } from '@nasnet/state/stores';

// Create memoized selector for filtered notifications
const selectFilteredNotifications = createMemoizedSelector(
  (state: NotificationState) => [state.notifications, state.filter] as const,
  ([notifications, filter]) => {
    // This expensive filter only runs when notifications OR filter changes
    return notifications.filter(n => n.type === filter && !n.archived);
  }
);

function NotificationList() {
  // Selector uses cached result if notifications/filter haven't changed
  const filtered = useNotificationStore(selectFilteredNotifications);
  return <ul>{filtered.map(n => <li key={n.id}>{n.message}</li>)}</ul>;
}

function NotificationBadge() {
  // Same selector, same cache! No recomputation
  const filtered = useNotificationStore(selectFilteredNotifications);
  return <span>({filtered.length})</span>;
}
```

**Performance impact:**

- **Without memoization**: Both components compute filter 2x per notification change = 2
  computations
- **With memoization**: Both components share cache = 1 computation total
- **Improvement**: 50% reduction in computations

**Source:** `libs/state/stores/src/ui/selectors.ts:48-71`

---

### createParameterizedSelector

Creates a selector factory that caches selectors per parameter, useful for ID-based lookups.

**Signature:**

```typescript
export function createParameterizedSelector<State, Param, Result>(
  selector: (state: State, param: Param) => Result
): (param: Param) => (state: State) => Result;
```

**Parameters:**

- `selector`: Function that takes state and a parameter, returns result

**Returns:** A function that takes a parameter and returns a selector function

**How it works:**

1. Call with parameter: `selectById('user-123')` → returns cached selector for that parameter
2. Each unique parameter gets its own cached selector
3. Prevents recreating selector functions on every render
4. Prevents recreating selector for every item in a list

**Cache behavior:**

- Each unique `param` value gets one cached selector function
- Selector functions are never recreated for the same parameter
- Perfect for list items that select by ID

**When to use:**

- Selecting by dynamic parameter (ID, index, key)
- Rendering lists where each item selects by its own ID
- Avoiding redundant lookups in large datasets

**Example:**

```typescript
import { createParameterizedSelector } from '@nasnet/state/stores';

// Create parameterized selector for notification by ID
const selectNotificationById = createParameterizedSelector(
  (state: NotificationState, id: string) =>
    state.notifications.find(n => n.id === id) ?? null
);

// Rendering a list: each item selects its own notification
function NotificationList() {
  const notificationIds = ['alert-1', 'alert-2', 'alert-3'];

  return (
    <ul>
      {notificationIds.map(id => (
        <NotificationItem key={id} notificationId={id} />
      ))}
    </ul>
  );
}

// Each item gets its own cached selector
function NotificationItem({ notificationId }: { notificationId: string }) {
  // selectNotificationById('alert-1') cached ✓
  // selectNotificationById('alert-2') cached ✓
  // selectNotificationById('alert-3') cached ✓
  const notif = useNotificationStore(selectNotificationById(notificationId));

  return (
    <li>
      {notif?.message}
      {notif?.type === 'error' && <span className="badge">Error</span>}
    </li>
  );
}
```

**Performance benefits:**

- **Without parameterized selector**: Each render creates new selector function
- **With parameterized selector**: Selector function cached per parameter
- **Especially important**: In lists with 100+ items (would be 100+ selector recreations without
  caching)

**Cache considerations:**

- Cache persists for lifetime of selector factory
- No automatic eviction (parameters are keys)
- Fine for finite sets of IDs (users, routers)
- For infinite lists, consider alternative approaches

**Source:** `libs/state/stores/src/ui/selectors.ts:87-112`

---

### createCombinedSelector

Combines multiple selectors into a single selector that returns an object with all selected values.

**Signature:**

```typescript
export function createCombinedSelector<
  State,
  Selectors extends Record<string, (state: State) => unknown>,
>(selectors: Selectors): (state: State) => { [K in keyof Selectors]: ReturnType<Selectors[K]> };
```

**Parameters:**

- `selectors`: Object where keys are field names and values are selector functions

**Returns:** A selector function that returns an object with all selected values

**How it works:**

1. Takes an object of selectors: `{ theme: selectTheme, sidebar: selectSidebar, ... }`
2. Returns a single selector that calls all selectors and combines results into object
3. Object reference changes only if **any** selected value changes
4. Use with `shallow` equality to prevent re-renders when reference changes but values don't

**When to use:**

- Combining 4+ pre-built selectors
- Each selector is used together frequently
- Cleaner API than manually combining selectors
- Avoid when selecting just 1-2 fields (use primitive selector instead)

**Example:**

```typescript
import { createCombinedSelector, shallow } from '@nasnet/state/stores';
import {
  selectResolvedTheme,
  selectSidebarCollapsed,
  selectCommandPaletteOpen,
  selectCompactMode,
} from '@nasnet/state/stores';

// Combine multiple selectors
const selectUISnapshot = createCombinedSelector({
  theme: selectResolvedTheme,
  sidebar: selectSidebarCollapsed,
  commandPalette: selectCommandPaletteOpen,
  compact: selectCompactMode,
});

function App() {
  // Single hook with all UI state
  // Only re-renders if any of the 4 values change
  const ui = useUIStore(selectUISnapshot, shallow);

  return (
    <div className={ui.theme === 'dark' ? 'dark' : ''}>
      <Sidebar collapsed={ui.sidebar} />
      <CommandPalette open={ui.commandPalette} />
      <main className={ui.compact ? 'compact' : ''}>
        {/* content */}
      </main>
    </div>
  );
}
```

**Why shallow comparison is needed:**

```typescript
// Without shallow:
const ui = useUIStore(selectUISnapshot);
// Returns new object every store update = always re-renders

// With shallow:
const ui = useUIStore(selectUISnapshot, shallow);
// Compares { theme, sidebar, commandPalette, compact } properties
// Only re-renders if any property actually changed
```

**Performance vs alternatives:**

```typescript
// ❌ BAD: Multiple hooks (each subscription)
function App() {
  const theme = useUIStore(selectResolvedTheme);
  const sidebar = useUIStore(selectSidebarCollapsed);
  const commandPalette = useUIStore(selectCommandPaletteOpen);
  const compact = useUIStore(selectCompactMode);
}

// ✅ GOOD: Single hook with combined selector
function App() {
  const { theme, sidebar, commandPalette, compact } = useUIStore(selectUISnapshot, shallow);
}
```

**Source:** `libs/state/stores/src/ui/selectors.ts:143-158`

---

## Pre-built Selectors Catalog

All stores export ready-to-use selectors for common use cases.

### Auth Store Selectors

Located in `libs/state/stores/src/auth/auth.store.ts`

```typescript
import {
  selectIsAuthenticated, // boolean
  selectUser, // User | null
  selectToken, // string | null
  selectIsRefreshing, // boolean
  selectRefreshAttempts, // number
  selectMaxRefreshExceeded, // boolean
  selectPermissions, // string[]
  selectHasPermission, // (permission: string) => boolean
} from '@nasnet/state/stores';

// Usage examples
const isAuth = useAuthStore(selectIsAuthenticated);
const user = useAuthStore(selectUser);
const hasAdmin = useAuthStore(selectHasPermission('admin'));
const permissions = useAuthStore(selectPermissions);
```

**Common patterns:**

```typescript
// Check if user is authenticated
if (useAuthStore(selectIsAuthenticated)) {
  // Show authenticated UI
}

// Check specific permission
const canDelete = useAuthStore(selectHasPermission('delete-users'));

// Get user info
const { name, email } = useAuthStore(selectUser) ?? {};
```

### Theme Store Selectors

Located in `libs/state/stores/src/ui/theme.store.ts`

```typescript
import {
  selectResolvedTheme, // 'light' | 'dark'
  selectThemeMode, // 'light' | 'dark' | 'system'
  selectIsDarkMode, // boolean (derived)
  selectIsSystemTheme, // boolean (derived)
} from '@nasnet/state/stores';

// Usage
const theme = useThemeStore(selectResolvedTheme); // Always resolved to light/dark
const isDark = useThemeStore(selectIsDarkMode); // Convenience boolean
const mode = useThemeStore(selectThemeMode); // User's selected mode
```

**Difference between selectors:**

- `selectThemeMode`: What the user selected ('light', 'dark', or 'system')
- `selectResolvedTheme`: The actual resolved theme ('light' or 'dark'), following system preference
  if mode is 'system'
- `selectIsDarkMode`: Convenience boolean `selectResolvedTheme === 'dark'`

### Sidebar Store Selectors

Located in `libs/state/stores/src/ui/sidebar.store.ts`

```typescript
import {
  selectSidebarCollapsed, // boolean
  selectSidebarDisplayState, // 'collapsed' | 'expanded'
  selectSidebarToggle, // (action) => void
} from '@nasnet/state/stores';

// Usage
const collapsed = useSidebarStore(selectSidebarCollapsed);
const state = useSidebarStore(selectSidebarDisplayState); // More readable

// Toggle sidebar
const toggle = useSidebarStore(selectSidebarToggle);
toggle(); // or dispatch action
```

### UI Store Selectors

Located in `libs/state/stores/src/ui/ui.store.ts`

```typescript
import {
  selectActiveTab, // string | null
  selectCommandPaletteOpen, // boolean
  selectCompactMode, // boolean
  selectAnimationsEnabled, // boolean
  selectDefaultNotificationDuration, // number (ms)
  selectUIPreferences, // { compactMode, animationsEnabled, duration }
  selectUIPreferencesMemoized, // memoized version
  selectHasOverlayOpen, // boolean
} from '@nasnet/state/stores';

// Usage
const activeTab = useUIStore(selectActiveTab);
const isPaletteOpen = useUIStore(selectCommandPaletteOpen);
const compact = useUIStore(selectCompactMode);

// For multiple preferences (use shallow comparison)
const prefs = useUIStore(selectUIPreferences, shallow);
// or memoized version
const prefsMemo = useUIStore(selectUIPreferencesMemoized);
```

### Modal Store Selectors

Located in `libs/state/stores/src/ui/modal.store.ts`

```typescript
import {
  selectActiveModal, // string | null
  selectModalData, // Record<string, any>
  createSelectIsModalOpen, // (modalId: string) => boolean
  selectIsModalOpenById, // Parameterized selector
} from '@nasnet/state/stores';

// Usage: Check which modal is open
const activeModal = useModalStore(selectActiveModal); // 'auth-dialog' or null

// Usage: Check if specific modal is open
const isAuthDialogOpen = useModalStore(createSelectIsModalOpen('auth-dialog'));

// Usage: With parameterized selector
const isOpen = useModalStore(selectIsModalOpenById('auth-dialog'));

// Usage: Get modal data
const data = useModalStore(selectModalData);
```

### Notification Store Selectors

Located in `libs/state/stores/src/ui/notification.store.ts`

```typescript
import {
  selectNotifications, // Notification[]
  selectHasNotifications, // boolean
  selectNotificationCount, // number
  selectErrorNotifications, // Notification[]
  selectNotificationsByType, // (type: NotificationType) => Notification[]
  selectUrgentNotificationCount, // number (errors only)
  selectProgressNotifications, // Notification[]
  selectErrorCountMemoized, // memoized error count
  selectNotificationById, // Parameterized selector
  selectIsModalOpenById, // Parameterized selector (shared from modal)
} from '@nasnet/state/stores';

// Usage: Get all notifications
const allNotifs = useNotificationStore(selectNotifications);

// Usage: Check if there are any notifications
const hasNotifs = useNotificationStore(selectHasNotifications);

// Usage: Get error count
const errorCount = useNotificationStore(selectUrgentNotificationCount);
// or memoized version
const errorCountMemo = useNotificationStore(selectErrorCountMemoized);

// Usage: Get notifications by type
const errors = useNotificationStore(selectErrorNotifications);
const warnings = useNotificationStore(selectNotificationsByType('warning'));

// Usage: Get specific notification by ID
const notif = useNotificationStore(selectNotificationById('alert-123'));
```

---

## Derived & Combined Selectors

These selectors derive values from state and are exported from `selectors.ts`:

```typescript
import {
  selectHasOverlayOpen, // UIState: boolean
  selectUIPreferences, // UIState: { compactMode, animationsEnabled, duration }
  selectSidebarDisplayState, // SidebarState: 'collapsed' | 'expanded'
  selectIsDarkMode, // ThemeState: boolean
  selectIsSystemTheme, // ThemeState: boolean
  selectUrgentNotificationCount, // NotificationState: number
  selectProgressNotifications, // NotificationState: Notification[]
} from '@nasnet/state/stores';
```

---

## Selector Factories

These functions create new selectors based on parameters:

```typescript
import {
  createSelectIsTabActive, // (tabId: string) => (state: UIState) => boolean
  createSelectNotificationsWithAction, // () => (state: NotificationState) => Notification[]
  selectIsModalOpenById, // Parameterized selector
  selectNotificationById, // Parameterized selector
} from '@nasnet/state/stores';

// Usage: Create selector for specific tab
const selectAuthTabActive = createSelectIsTabActive('auth-settings');
const isActive = useUIStore(selectAuthTabActive);

// Usage: Create selector for notifications with action
const selectNotifWithAction = createSelectNotificationsWithAction();
const notifsWithAction = useNotificationStore(selectNotifWithAction);

// Usage: Parameterized selectors
const isAuthOpen = useModalStore(selectIsModalOpenById('auth-dialog'));
const notif = useNotificationStore(selectNotificationById('alert-123'));
```

---

## Performance Patterns & Gotchas

### When Memoized Selectors Help

**HELPS (worthwhile):**

```typescript
// ✅ Multiple components using same selector
const selectFiltered = createMemoizedSelector(...);
// Component 1 uses it
// Component 2 uses it  ← Caches result from Component 1 = no recomputation
// Component 3 uses it  ← Caches result from Component 2 = no recomputation

// ✅ Expensive computation (filtering, sorting, grouping)
const selectGroupedAlerts = createMemoizedSelector(
  (state) => [state.alerts],
  ([alerts]) => {
    // Expensive O(n log n) sort + O(n) grouping
    return Object.groupBy(alerts.sort(compareFn), (a) => a.severity);
  }
);

// ✅ Frequently changing dependencies but expensive computation
const selectFilteredByStatus = createMemoizedSelector(
  (state) => [state.items, state.filter],
  ([items, filter]) => items.filter(i => i.status === filter)  // Only runs when filter changes
);
```

**HURTS (not worthwhile):**

```typescript
// ❌ Single component using memoized selector
const selectTemp = createMemoizedSelector(...);
// Only used in one place = no benefit from caching

// ❌ Cheap computation (primitive access, simple math)
const selectCount = createMemoizedSelector(
  (state) => [state.items],
  ([items]) => items.length  // O(1) operation = no benefit from memoization
);

// ❌ Always-changing dependency (would recompute every render anyway)
const selectCurrentTime = createMemoizedSelector(
  (state) => [state.timestamp],  // Changes every millisecond!
  ([timestamp]) => new Date(timestamp)  // Recomputes every render
);
```

### Cache Size Considerations

Parameterized selectors cache per-parameter:

```typescript
// Creates one selector per notification ID
const selectById = createParameterizedSelector((state, id: string) => {
  return state.notifications.find((n) => n.id === id);
});

// If rendering 10,000 notification IDs:
// - Cache size: 10,000 selector functions
// - Memory usage: Small but non-zero

// SOLUTION: For very large datasets, consider alternatives:
// 1. Virtual scrolling (only render visible items)
// 2. Use store index for O(1) lookups: state.notificationsById[id]
// 3. Paginate results
```

### Common Mistakes

**Mistake 1: Creating selector in component render**

```typescript
// ❌ BAD: New selector created every render
function Notif() {
  const selectById = createMemoizedSelector(...);  // New function every render!
  const notif = useNotificationStore(selectById);
}

// ✅ CORRECT: Create selector outside component
const selectById = createMemoizedSelector(...);  // Created once
function Notif() {
  const notif = useNotificationStore(selectById);  // Reused
}
```

**Mistake 2: Forgetting shallow comparison**

```typescript
// ❌ BAD: Re-renders even if values didn't change
const { user, token } = useAuthStore(
  (state) => ({ user: state.user, token: state.token })
  // No shallow comparison = new object reference = re-render
);

// ✅ CORRECT: Use shallow comparison
import { shallow } from '@nasnet/state/stores';
const { user, token } = useAuthStore(
  (state) => ({ user: state.user, token: state.token }),
  shallow // Compares properties, not reference
);
```

**Mistake 3: Over-memoizing simple values**

```typescript
// ❌ OVERKILL: Memoizing a simple getter
const selectCount = createMemoizedSelector(
  (state) => [state.items],
  ([items]) => items.length // Simple array length operation
);

// ✅ BETTER: Just use a primitive selector
const selectCount = (state) => state.items.length;
```

**Mistake 4: Expensive computation without memoization**

```typescript
// ❌ BAD: Expensive filter in every selector call
const selectFiltered = (state: NotificationState) =>
  state.notifications.filter((n) => expensiveCheck(n)); // O(n) every render!

// ✅ GOOD: Memoize expensive computation
const selectFiltered = createMemoizedSelector(
  (state) => [state.notifications],
  ([notifications]) => notifications.filter((n) => expensiveCheck(n)) // O(n) only when notifications change
);
```

---

## Quick Reference Table

| Selector Type | Best For              | Overhead | When to Use                          |
| ------------- | --------------------- | -------- | ------------------------------------ |
| Primitive     | Single field          | None     | Most common case                     |
| Shallow       | 2-3 fields            | Low      | Object selectors                     |
| Memoized      | Expensive computation | Low      | Multiple components or expensive ops |
| Parameterized | ID-based lookups      | Low      | List rendering, dynamic IDs          |
| Combined      | 4+ fields             | Low      | Many selectors together              |

---

## Summary

- **Use primitive selectors** as your default (single field)
- **Use shallow comparison** when selecting multiple fields as an object
- **Use memoized selectors** for expensive computations used in multiple places
- **Use parameterized selectors** for dynamic lookups by ID in lists
- **Use combined selectors** to compose 4+ pre-built selectors
- **Avoid** creating selectors inside component renders
- **Always measure** before optimizing—not all selectors need memoization

**For complete patterns and examples, see:**

- `libs/state/docs/performance.md` - Detailed performance optimization guide
- `libs/state/stores/src/ui/selectors.ts` - Full implementation source code
