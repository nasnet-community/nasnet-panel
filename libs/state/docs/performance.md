---
sidebar_position: 4
title: Performance
---

# Performance & Optimization

This guide covers selector patterns, memoization strategies, and best practices for preventing unnecessary re-renders when consuming Zustand stores.

> **Deep Dive:** For complete API documentation on all selector utilities (`createMemoizedSelector`, `createParameterizedSelector`, `createCombinedSelector`, `shallowEqual`), pre-built selector catalog, and advanced patterns, see the **[Selectors Reference](./stores/selectors-reference.md)**.

## The Re-render Problem

Without selectors, **every component subscribes to the entire store** and re-renders whenever ANY property changes:

```typescript
// ❌ BAD: Component re-renders on ANY store mutation
function UserProfile() {
  // Subscribe to entire store
  const { user, token, isRefreshing, refreshAttempts } = useAuthStore();

  // Component re-renders if:
  // - user changes ✓
  // - token changes ✓
  // - isRefreshing changes ✓
  // - refreshAttempts changes ✓
  // - ANY mutation to auth store ✗✗✗

  return <div>{user?.username}</div>;
}
```

When auth store updates `isRefreshing: false` → `true`, this component re-renders **even though `user` didn't change**.

## Selector Patterns: Optimized Re-renders

### Pattern 1: Primitive Selector (Single Value)

**Best for:** Simple fields you care about

```typescript
// ✅ BEST: Only re-renders when isAuthenticated changes
function LoginButton() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return <button>{isAuthenticated ? 'Logout' : 'Login'}</button>;
}
```

**Why it works:**
- Zustand compares the selected value using strict equality (`===`)
- If `isAuthenticated` doesn't change, selector returns same value
- Component doesn't re-render

**Performance:** Nearly zero overhead, Zustand optimizes this internally

### Pattern 2: Shallow Comparison (Multiple Fields)

**Best for:** Multiple unrelated fields

```typescript
import { shallow } from 'zustand/shallow';

// ✅ GOOD: Only re-renders when user OR token changes
function UserProfile() {
  const { user, token } = useAuthStore(
    state => ({ user: state.user, token: state.token }),
    shallow  // Shallow comparison
  );

  return <div>{user?.username}</div>;
}
```

**Why it works:**
- Selector returns a new object `{ user, token }` on every call
- Without shallow comparison, this would cause re-render (new object != old object)
- `shallow` compares properties: `prev.user === next.user && prev.token === next.token`
- Only re-renders if actual values changed

**When to use:**
- Selecting 2-3 fields max
- Fields are frequently accessed together
- Don't want to create a reusable selector

**When NOT to use:**
- More than 3 fields (use `createCombinedSelector` instead)
- Same field selection repeated in multiple components (use `createMemoizedSelector`)

### Pattern 3: Memoized Selector (Computed Values)

**Best for:** Expensive computations, derived values, repeated selectors

```typescript
import { createMemoizedSelector } from '@nasnet/state/stores';

// Create memoized selector (computed once per dependency change)
const selectUIPreferencesMemoized = createMemoizedSelector(
  (state: UIState) => [
    state.compactMode,
    state.animationsEnabled,
    state.defaultNotificationDuration,
  ] as const,
  ([compactMode, animationsEnabled, duration]) => ({
    compactMode,
    animationsEnabled,
    duration,
  })
);

function SettingsPanel() {
  // Selector only recomputes when deps change
  const prefs = useUIStore(selectUIPreferencesMemoized);

  return (
    <div>
      Compact: {prefs.compactMode}
      Animations: {prefs.animationsEnabled}
    </div>
  );
}
```

**Implementation detail:**

```typescript
export function createMemoizedSelector<State, Deps extends unknown[], Result>(
  getDeps: (state: State) => Deps,
  compute: (deps: Deps) => Result
): (state: State) => Result {
  let cachedDeps: Deps | null = null;
  let cachedResult: Result;

  return (state: State): Result => {
    const deps = getDeps(state);

    // Check if deps changed (shallow comparison)
    const depsChanged =
      cachedDeps === null ||
      deps.length !== cachedDeps.length ||
      deps.some((dep, i) => !Object.is(dep, cachedDeps![i]));

    if (depsChanged) {
      cachedDeps = deps;
      cachedResult = compute(deps);  // Recompute only if deps changed
    }

    return cachedResult;
  };
}
```

**When to use:**
- Selector is used in multiple components
- Computation is expensive (filtering, sorting, aggregation)
- Dependencies change infrequently

**Performance gains:**
- First component: Same cost as non-memoized
- Second component with same selector: Cache hit, zero computation
- Prevents 3 components from redundantly computing the same thing

**Source:** `libs/state/stores/src/ui/selectors.ts:48-71`

### Pattern 4: Parameterized Selector (ID-based Lookups)

**Best for:** Searching by ID/parameter, lookup tables, large lists

```typescript
import { createParameterizedSelector } from '@nasnet/state/stores';

// Create factory for parameterized selectors
const selectNotificationById = createParameterizedSelector(
  (state: NotificationState, id: string) =>
    state.notifications.find(n => n.id === id) ?? null
);

function NotificationBadge() {
  // Each parameter gets its own cached selector
  const notif1 = useNotificationStore(selectNotificationById('alert-123'));
  const notif2 = useNotificationStore(selectNotificationById('warning-456'));

  return (
    <div>
      {notif1?.message}
      {notif2?.message}
    </div>
  );
}
```

**Implementation detail:**

```typescript
export function createParameterizedSelector<State, Param, Result>(
  selector: (state: State, param: Param) => Result
): (param: Param) => (state: State) => Result {
  const cache = new Map<Param, (state: State) => Result>();

  return (param: Param) => {
    let cachedSelector = cache.get(param);

    if (!cachedSelector) {
      // First time with this param: create new selector
      let lastState: State | null = null;
      let lastResult: Result;

      cachedSelector = (state: State): Result => {
        if (state !== lastState) {
          lastState = state;
          lastResult = selector(state, param);
        }
        return lastResult;
      };

      cache.set(param, cachedSelector);
    }

    return cachedSelector;
  };
}
```

**When to use:**
- Selecting by dynamic parameter (ID, index, key)
- Avoiding redundant array/object lookups
- Rendering lists with per-item subscriptions

**Cache behavior:**
- Each unique `param` gets its own cached selector
- Prevents recreating the same selector function on every render
- Perfect for list items, detail panels with dynamic IDs

**Example: List items with per-item selection:**

```typescript
interface NotificationListProps {
  notifications: string[];  // Array of notification IDs
}

function NotificationList({ notifications }: NotificationListProps) {
  return (
    <ul>
      {notifications.map(id => (
        <NotificationItem key={id} notificationId={id} />
      ))}
    </ul>
  );
}

// Each item selects its own notification by ID
function NotificationItem({ notificationId }: { notificationId: string }) {
  const selectById = createParameterizedSelector(...);
  const notif = useNotificationStore(selectById(notificationId));

  return <li>{notif?.message}</li>;
}
```

**Source:** `libs/state/stores/src/ui/selectors.ts:87-112`

### Pattern 5: Combined Selector (Multiple Unrelated Fields)

**Best for:** Selecting many fields (4+) from different store sections

```typescript
import { createCombinedSelector, shallow } from '@nasnet/state/stores';

// Combine multiple selectors elegantly
const selectUISnapshot = createCombinedSelector({
  theme: selectResolvedTheme,
  sidebar: selectSidebarCollapsed,
  commandPalette: selectCommandPaletteOpen,
  notifications: selectNotifications,
  compact: selectCompactMode,
});

function App() {
  // Single selector returns all UI state
  const ui = useUIStore(selectUISnapshot, shallow);

  return (
    <div className={ui.theme === 'dark' ? 'dark' : ''}>
      <Sidebar collapsed={ui.sidebar} />
      <CommandPalette open={ui.commandPalette} />
    </div>
  );
}
```

**Implementation detail:**

```typescript
export function createCombinedSelector<
  State,
  Selectors extends Record<string, (state: State) => unknown>
>(
  selectors: Selectors
): (state: State) => { [K in keyof Selectors]: ReturnType<Selectors[K]> } {
  const keys = Object.keys(selectors) as (keyof Selectors)[];

  return (state: State) => {
    const result = {} as { [K in keyof Selectors]: ReturnType<Selectors[typeof key]> };
    for (const key of keys) {
      result[key] = selectors[key](state) as ReturnType<Selectors[typeof key]>;
    }
    return result;
  };
}
```

**When to use:**
- Combining 4+ pre-built selectors
- Each selector is used together frequently
- Cleaner than inline selector with multiple conditions

**Source:** `libs/state/stores/src/ui/selectors.ts:143-158`

## Pre-built Selectors

All stores export ready-to-use selectors:

### Auth Store Selectors

```typescript
import {
  selectIsAuthenticated,      // boolean
  selectUser,                  // User | null
  selectToken,                 // string | null
  selectIsRefreshing,          // boolean
  selectRefreshAttempts,       // number
  selectMaxRefreshExceeded,    // boolean
  selectPermissions,           // string[]
  selectHasPermission,         // (permission: string) => boolean
} from '@nasnet/state/stores';

// Usage
const isAuth = useAuthStore(selectIsAuthenticated);
const hasAdmin = useAuthStore(selectHasPermission('admin'));
```

**Source:** `libs/state/stores/src/auth/auth.store.ts:390-433`

### Theme Store Selectors

```typescript
import {
  selectResolvedTheme,   // 'light' | 'dark'
  selectThemeMode,       // 'light' | 'dark' | 'system'
  selectIsDarkMode,      // boolean
  selectIsSystemTheme,   // boolean
} from '@nasnet/state/stores';

// Usage
const isDark = useThemeStore(selectResolvedTheme) === 'dark';
```

### Sidebar Store Selectors

```typescript
import {
  selectSidebarCollapsed,      // boolean
  selectSidebarDisplayState,   // 'collapsed' | 'expanded'
} from '@nasnet/state/stores';

// Usage
const sidebarOpen = !useThemeStore(selectSidebarCollapsed);
```

### Notification Store Selectors

```typescript
import {
  selectNotifications,              // Notification[]
  selectHasNotifications,           // boolean
  selectNotificationCount,          // number
  selectErrorNotifications,         // Notification[]
  selectNotificationsByType,        // (type: NotificationType) => Notification[]
  selectUrgentNotificationCount,    // number (errors only)
  selectProgressNotifications,      // Notification[]
} from '@nasnet/state/stores';

// Usage
const allNotifs = useNotificationStore(selectNotifications);
const errorCount = useNotificationStore(selectUrgentNotificationCount);
const warningNotifs = useNotificationStore(selectNotificationsByType('warning'));
```

## Re-render Prevention Strategies

### Strategy 1: Use Selectors (Primary)

```typescript
// ✅ PRIMARY: Always use selectors
const isAuth = useAuthStore(state => state.isAuthenticated);
const { user, token } = useAuthStore(
  state => ({ user: state.user, token: state.token }),
  shallow
);
```

### Strategy 2: useMemo for Selector Functions

```typescript
// If creating inline selector with closures:
const selectUserPermissions = useMemo(
  () => (state: AuthState) => state.user?.permissions ?? [],
  []
);

const perms = useAuthStore(selectUserPermissions);
```

### Strategy 3: Extract to Component

```typescript
// ❌ BAD: Multiple hooks, redundant selectors
function ComplexComponent() {
  const user = useAuthStore(state => state.user);
  const theme = useThemeStore(state => state.resolvedTheme);
  const sidebar = useSidebarStore(state => state.desktopCollapsed);

  return <UserProfile user={user} theme={theme} sidebar={sidebar} />;
}

// ✅ GOOD: Extract to sub-component with single selector
function UserProfileContainer() {
  const user = useAuthStore(state => state.user);
  return <UserProfile user={user} />;
}

function ThemeContainer() {
  const theme = useThemeStore(state => state.resolvedTheme);
  return <div className={theme}><UserProfileContainer /></div>;
}
```

### Strategy 4: useCallback for Handlers

```typescript
// ✅ Memoize handlers to prevent re-renders of child components
function CommandPalette() {
  const toggleOpen = useCallback(() => {
    useUIStore.getState().toggleCommandPalette();
  }, []);

  return <CommandPaletteUI onToggle={toggleOpen} />;
}
```

## Anti-patterns to Avoid

```typescript
// ❌ ANTI-PATTERN 1: Destructuring entire store
const store = useAuthStore();  // Subscribes to EVERY change
const { user } = store;

// ✅ CORRECT:
const user = useAuthStore(state => state.user);

// ❌ ANTI-PATTERN 2: Selector in conditional
const isSub = canSub ? useAuthStore(state => state.isAuthenticated) : false;

// ✅ CORRECT:
const isAuth = useAuthStore(state => state.isAuthenticated);
const isSub = canSub ? isAuth : false;

// ❌ ANTI-PATTERN 3: Creating selector in every render
function MyComponent() {
  // This creates a new selector function EVERY render (bad!)
  const user = useAuthStore(state => state.user);
  // ...
}

// ✅ CORRECT: (above code is fine - inline selectors are light)
// But if using closures over props:
function MyComponent({ userId }: { userId: string }) {
  const user = useAuthStore(
    useMemo(
      () => (state) => state.users.find(u => u.id === userId),
      [userId]
    )
  );
}

// ❌ ANTI-PATTERN 4: Using entire store when only need one field
const { isAuthenticated } = useAuthStore();  // Bad!
const isAuthFromUnrelatedStore = useThemeStore().resolvedTheme;  // Cascading re-renders

// ✅ CORRECT:
const isAuthenticated = useAuthStore(state => state.isAuthenticated);
const theme = useThemeStore(state => state.resolvedTheme);
```

## Performance Best Practices

### 1. Use React DevTools Profiler

```typescript
// Identify re-renders with React DevTools:
// 1. Open DevTools → Profiler tab
// 2. Record interaction
// 3. Check which components re-rendered and why
// 4. Look for "unnecessary" re-renders (component function re-ran, but props didn't change)
```

### 2. Use Zustand DevTools for Store Changes

```typescript
// Inspect store mutations:
// 1. Open Redux DevTools
// 2. Select store from dropdown
// 3. Watch state changes as you interact
// 4. Identify which mutations cause component re-renders
```

### 3. Use shallowEqual for Object Selectors

```typescript
// ✅ GOOD: Shallow compare object properties
const { user, token } = useAuthStore(
  state => ({ user: state.user, token: state.token }),
  shallow
);

// ❌ BAD: New object reference every time
const { user, token } = useAuthStore(state => ({
  user: state.user,
  token: state.token,
}));  // New object != old object, causes re-render
```

### 4. Avoid Expensive Computations in Selectors

```typescript
// ❌ BAD: Expensive filter on every selector call
const selectExpensiveList = (state: State) =>
  state.items.filter(i => expensiveCheck(i));  // O(n) every time!

// ✅ GOOD: Use memoized selector for expensive computation
const selectExpensiveList = createMemoizedSelector(
  (state: State) => [state.items] as const,
  ([items]) => items.filter(i => expensiveCheck(i))  // O(n) only when items change
);
```

### 5. Prefer Primitive Selectors

```typescript
// ✅ BEST: Primitive selector (zero overhead)
const isOpen = useModalStore(state => state.activeModal === 'auth');

// ✅ GOOD: Shallow compare (minimal overhead)
const { activeModal, data } = useModalStore(
  state => ({ activeModal: state.activeModal, data: state.data }),
  shallow
);

// ⚠️ OKAY: Memoized (only for expensive computations)
const selectFiltered = createMemoizedSelector(...);
```

## Performance Checklist

- [ ] Use selectors instead of destructuring full store
- [ ] Use primitive selectors for single fields
- [ ] Use `shallow` for 2-3 fields together
- [ ] Use `createMemoizedSelector` for expensive computations
- [ ] Use `createParameterizedSelector` for ID-based lookups
- [ ] Avoid creating new selectors in component render
- [ ] Avoid expensive computations inside selectors
- [ ] Check Redux DevTools for unexpected mutations
- [ ] Profile with React DevTools Profiler
- [ ] Consider component extraction for isolated concerns

---

**Example: Before & After Optimization**

```typescript
// ❌ BEFORE: Unnecessary re-renders on auth store changes
function AuthPanel() {
  const { user, token, isRefreshing, refreshAttempts, lastActivity } = useAuthStore();

  return (
    <div>
      User: {user?.username}
      {/* Re-renders whenever isRefreshing OR refreshAttempts changes */}
    </div>
  );
}

// ✅ AFTER: Only re-renders when user changes
function AuthPanel() {
  const user = useAuthStore(state => state.user);

  return (
    <div>
      User: {user?.username}
      {/* Only re-renders when user object changes */}
    </div>
  );
}
```

**Before optimization:**
- Component re-renders: 10 times (on every auth store mutation)
- Wasted renders: 9 times (when fields besides `user` changed)

**After optimization:**
- Component re-renders: 1 time (only when user actually changes)
- Wasted renders: 0
- Performance gain: 10x fewer re-renders

---

**Next Steps:**
- Apply selector patterns to your components
- Use React DevTools Profiler to measure improvements
- Review [Selectors Reference](./stores/selectors-reference.md) for complete API and pre-built selector catalog
- Review [Architecture](./architecture.md) for integration patterns
