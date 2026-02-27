# Debugging Zustand & XState

Essential debugging techniques for state management in development and production.

**Source:** `libs/state/stores/src/` and `libs/state/machines/src/`

## Zustand DevTools

### Setup DevTools Integration

Zustand has built-in DevTools support:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useMyStore = create<MyState>()(
  devtools(
    (set) => ({
      // Implementation
    }),
    {
      name: 'myStore', // Show in DevTools
      enabled: import.meta.env.DEV, // Only in development
    }
  )
);
```

Most stores already have DevTools integrated - it's automatic!

### Using Redux DevTools Extension

1. **Install browser extension**

   - Chrome: [Redux DevTools](https://chrome.google.com/webstore)
   - Firefox: [Redux DevTools](https://addons.mozilla.org/firefox)

2. **Open DevTools in browser**

   - Right-click → Inspect → DevTools → Redux tab

3. **Watch state changes**
   - Every action appears as a timestamped action
   - Jump to any past state (time travel)
   - Inspect diff between states

### Features

| Feature            | Purpose                                 |
| ------------------ | --------------------------------------- |
| **Action History** | See every state mutation with timestamp |
| **Time Travel**    | Jump to any previous state              |
| **Diff View**      | See what changed between states         |
| **Export/Import**  | Save and restore state snapshots        |
| **Dispatch Test**  | Send actions to test state changes      |
| **Persist**        | Save state between sessions             |

### Console Debugging

```typescript
// Log full store state
console.log(useMyStore.getState());

// Watch specific field
useMyStore.subscribe(
  (state) => state.searchQuery,
  (searchQuery) => console.log('Search changed:', searchQuery)
);

// Log all actions
useMyStore.subscribe((state, previousState) => {
  console.log('State changed:', {
    previous: previousState,
    current: state,
    changed: Object.entries(state).filter(([key, value]) => value !== previousState[key]),
  });
});
```

## XState Debugging

### Inspect Machine Transitions

```typescript
import { createMyMachine } from '@nasnet/state/machines';

const machine = createMyMachine();
const actor = machine.start();

// Log every transition
actor.subscribe((snapshot) => {
  console.log('State:', snapshot.value);
  console.log('Context:', snapshot.context);
  console.log('Can transition:', {
    NEXT: snapshot.can({ type: 'NEXT' }),
    BACK: snapshot.can({ type: 'BACK' }),
    SUBMIT: snapshot.can({ type: 'SUBMIT' }),
  });
});
```

### Stately Visualizer

Visualize state machine diagrams:

```typescript
// 1. Go to https://stately.ai/viz
// 2. Create new
// 3. Paste machine definition:

import { createMyMachine } from '@nasnet/state/machines';

const machine = createMyMachine();
console.log(machine.toJSON());
```

Copy the JSON output and paste into Stately Visualizer to see:

- State diagram
- Transitions
- Guards
- Final states

### Console Debugging

```typescript
import { useMyWorkflow } from '@nasnet/state/machines';

function MyComponent() {
  const { state, context, send } = useMyWorkflow({ userId: 'user-1' });

  // Log state and context
  useEffect(() => {
    console.log('Machine state:', state);
    console.log('Machine context:', context);
  }, [state, context]);

  // Log before sending event
  const handleNext = () => {
    console.log('Sending NEXT from', state);
    send({ type: 'NEXT' });
  };

  return <button onClick={handleNext}>Next</button>;
}
```

## localStorage Debugging

### View All Persisted State

```typescript
// Show all localStorage entries
Object.keys(localStorage).forEach((key) => {
  if (key.includes('store') || key.includes('storage')) {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    console.log(`${key}:`, value);
  }
});
```

### Full localStorage Reference

| Store               | localStorage Key                     | Persisted Fields                                                   |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| **Auth**            | `nasnet-auth-store`                  | token, user, roles                                                 |
| **Connection**      | `nasnet-connection-store`            | currentRouterId, preferences                                       |
| **Theme**           | `nasnet-theme-store`                 | isDark, colorMode                                                  |
| **Sidebar**         | `nasnet-sidebar-store`               | isCollapsed                                                        |
| **DHCP**            | `dhcp-ui-store`                      | wizardDraft, showPoolVisualization                                 |
| **Service**         | `service-ui-store`                   | wizardDraft, viewMode, showResourceMetrics                         |
| **Firewall Log**    | `firewall-log-ui-store`              | filters, autoRefresh, refreshInterval, sortBy, sortOrder           |
| **Mangle**          | `mangle-ui-storage`                  | selectedChain, compactMode                                         |
| **NAT**             | `nat-ui-storage`                     | selectedChain, compactMode                                         |
| **RAW**             | `raw-ui-storage`                     | selectedChain, performanceSectionExpanded, compactMode             |
| **Port Knock**      | `port-knock-ui-storage`              | activeTab, compactMode, autoRefreshLog                             |
| **Rate Limiting**   | `nasnet-rate-limiting-ui`            | selectedTab, showDisabledRules, actionFilter, statsPollingInterval |
| **Alerts**          | `alert-notification-store`           | settings only (notifications are memory-only)                      |
| **Alert Templates** | `alert-rule-template-ui-storage`     | viewMode only                                                      |
| **Interface Stats** | `nasnet-interface-stats-preferences` | pollingInterval                                                    |

### Clear Specific Store

```typescript
// Clear one store
localStorage.removeItem('dhcp-ui-store');

// Clear all stores
Object.keys(localStorage)
  .filter((key) => key.includes('store') || key.includes('storage'))
  .forEach((key) => localStorage.removeItem(key));

// Reload page to reset
location.reload();
```

### Inspect Persisted Data

```typescript
// Pretty print store data
function inspectStore(key) {
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  console.log(`${key}:`, JSON.stringify(data, null, 2));
}

// Example
inspectStore('dhcp-ui-store');
// Output:
// {
//   "state": {
//     "wizardDraft": { ... },
//     "showPoolVisualization": true
//   },
//   "version": 0
// }
```

### Restore Previous State

```typescript
// Save current state before making changes
const backup = localStorage.getItem('my-store');

// Make your changes...

// Restore if needed
if (backup) {
  localStorage.setItem('my-store', backup);
  location.reload();
}
```

## Common Issues & Solutions

### Store Not Updating in Component

**Problem:** Component doesn't re-render when store changes.

**Solution:** Use selector hooks, not whole store object.

```typescript
// ❌ Won't re-render when other fields change
const { search, selectedIds } = useMyStore();

// ✅ Will only re-render when search changes
const search = useMyStore((state) => state.search);
```

**Debug:** Check DevTools to see if action fired.

```typescript
// Verify action was dispatched
useMyStore.subscribe((state) => {
  console.log('Store updated:', state);
});
```

### Stale State from getState()

**Problem:** `getState()` returns old state.

**Solution:** Don't cache state - call `getState()` when needed.

```typescript
// ❌ Wrong - captures state once
const initialState = useMyStore.getState();
useMyStore.subscribe(() => {
  console.log(initialState); // Always the same!
});

// ✅ Right - calls getState() each time
useMyStore.subscribe(() => {
  console.log(useMyStore.getState()); // Current state
});
```

### Persistence Not Working

**Problem:** State not saved to localStorage.

**Solution:** Check `partialize` function is correct.

```typescript
// ❌ Missing partialize - nothing is persisted
const store = create((set) => ({
  /* ... */
}));

// ✅ Correct - specifies what to persist
const store = create(
  (set) => ({
    /* ... */
  }),
  {
    name: 'my-store',
    partialize: (state) => ({
      viewMode: state.viewMode, // Persist only this
    }),
  }
);
```

**Debug:** Check localStorage:

```typescript
console.log(localStorage.getItem('my-store'));
// Should see persisted fields
```

### Machine State Stuck

**Problem:** Machine won't transition out of a state.

**Solution:** Check guards and conditions.

```typescript
// Debug machine state
const { state, context } = useMyWorkflow({ userId: 'user-1' });

// Check what transitions are available
if (state === 'step1') {
  const canNext = context.step1Data?.length > 0;
  console.log('Can go NEXT?', canNext);
  console.log('Step 1 data:', context.step1Data);
}
```

### Auth Token Expired

**Problem:** Apollo requests fail with 401, but store not updated.

**Solution:** Error link should clear auth:

```typescript
// Verify error link is working
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    console.log('Auth status changed:', isAuthenticated);
  }
);

// Check if 401 errors clear auth
fetch('/api/protected').catch((error) => {
  console.log('Auth cleared?', useAuthStore.getState().isAuthenticated);
});
```

### Memory Leaks

**Problem:** Event listeners/subscriptions accumulate.

**Solution:** Always unsubscribe in useEffect cleanup.

```typescript
// ❌ Leak - no cleanup
useEffect(() => {
  useMyStore.subscribe((state) => {
    console.log('Store changed:', state);
  });
}, []);

// ✅ Correct - unsubscribe on cleanup
useEffect(() => {
  const unsubscribe = useMyStore.subscribe((state) => {
    console.log('Store changed:', state);
  });
  return () => unsubscribe();
}, []);
```

**Debug:** Check if subscriptions accumulate:

```typescript
// Monitor store subscriber count (internal)
let subscriptionCount = 0;
useMyStore.subscribe(() => {
  subscriptionCount++;
  console.log('Total subscriptions:', subscriptionCount);
});
```

## Debug Console Utilities

### Create Debug Functions

```typescript
// Add to src/utils/debug.ts

export const storeDebug = {
  // Show all stores
  all: () => {
    const stores = [
      ['auth', useAuthStore],
      ['connection', useConnectionStore],
      ['dhcp', useDHCPUIStore],
      ['service', useServiceUIStore],
    ];

    stores.forEach(([name, store]) => {
      console.group(name);
      console.log(store.getState());
      console.groupEnd();
    });
  },

  // Clear all stores
  clear: () => {
    Object.keys(localStorage)
      .filter((key) => key.includes('store'))
      .forEach((key) => localStorage.removeItem(key));
    location.reload();
  },

  // Watch specific store
  watch: (name, store) => {
    store.subscribe((state) => {
      console.log(`[${name}]`, state);
    });
  },

  // Get store by name
  get: (name) => {
    const stores = {
      auth: useAuthStore,
      connection: useConnectionStore,
      dhcp: useDHCPUIStore,
    };
    return stores[name]?.getState();
  },
};

// Usage in console:
// storeDebug.all()          - See all stores
// storeDebug.get('auth')    - Get auth store
// storeDebug.watch('dhcp', useDHCPUIStore)  - Watch changes
// storeDebug.clear()        - Clear all
```

### Browser Console Integration

```typescript
// Make debug util available globally
if (import.meta.env.DEV) {
  (window as any).__debug = {
    stores: {
      auth: () => useAuthStore.getState(),
      connection: () => useConnectionStore.getState(),
      dhcp: () => useDHCPUIStore.getState(),
    },
    clearAll: () => {
      Object.keys(localStorage)
        .filter((k) => k.includes('store'))
        .forEach((k) => localStorage.removeItem(k));
      location.reload();
    },
  };
}

// In console:
// __debug.stores.auth()
// __debug.stores.connection()
// __debug.clearAll()
```

## Performance Debugging

### Track Re-renders

```typescript
// Count component renders
let renderCount = 0;

function MyComponent() {
  renderCount++;
  console.log(`MyComponent rendered ${renderCount} times`);

  const { search } = useMyStore((state) => state.search);
  return <div>{search}</div>;
}

// Check DevTools Performance tab to see if renders match state changes
```

### Monitor Store Updates

```typescript
// See if store is updating too frequently
useMyStore.subscribe(
  (state) => state.searchQuery,
  (searchQuery) => {
    console.log('Search updated:', searchQuery, new Date().getTime());
  }
);

// Look for spam updates every millisecond (indicates bug)
```

## Summary

**Key debugging techniques:**

1. **Redux DevTools** - Visual time travel debugging
2. **Console logs** - Simple debugging with `getState()`
3. **localStorage** - Inspect persisted state
4. **Stately Visualizer** - Understand machine flows
5. **Subscriptions** - Monitor state changes
6. **Error logs** - Check auth/network errors
7. **Dev utilities** - Custom debug functions

**Quick checklist when debugging:**

- [ ] Check Redux DevTools for action history
- [ ] Verify selector hooks (not whole store)
- [ ] Inspect localStorage keys
- [ ] Log `getState()` at problem point
- [ ] Check for unsubscribed listeners (memory leak)
- [ ] Review `partialize` for persistence
- [ ] Check guards in XState machines
- [ ] Verify error link updates stores

## Next Steps

- Run `storeDebug.all()` in console to explore
- Open Redux DevTools to watch state changes
- Check browser DevTools → Application → localStorage
- Refer to [Quickstart](./quickstart.md) for store patterns
