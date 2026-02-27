---
sidebar_position: 2
title: Router Store (useRouterStore)
---

# Router Store

Deep-dive into router discovery, management, and selection state.

**Source:** `libs/state/stores/src/router/router.store.ts`

## State Shape

```typescript
interface RouterStore {
  // Router inventory
  routers: Record<string, Router>; // All routers indexed by ID
  selectedRouterId: string | null; // Currently selected router
  lastConnectedRouterId: string | null; // Last successful connection

  // Discovery progress
  scanProgress: ScanProgress | null; // Current scan progress (null if not scanning)

  // Configuration tracking
  configurationCheckedRouters: string[]; // Routers checked for config import
}
```

### Router Interface

```typescript
interface Router {
  id: string; // Unique identifier (UUID)
  ipAddress: string; // IP address or hostname
  name: string; // Display name
  connectionStatus: 'unknown' | 'online' | 'offline' | 'unreachable';
  discoveryMethod: 'manual' | 'broadcast'; // How router was discovered
  createdAt: Date; // When router was added
  lastConnected?: Date; // Last successful connection time
}
```

### Scan Progress Interface

```typescript
interface ScanProgress {
  totalAddresses: number; // Total addresses being scanned
  scannedAddresses: number; // Addresses scanned so far
  discoveredRouters: Router[]; // Routers found during scan
  isScanning: boolean; // Scan in progress flag
  error?: string; // Error message (if scan failed)
}
```

## Actions API

### Router CRUD Operations

**`addRouter(router: Router)`** - Add a new router

```typescript
const { addRouter } = useRouterStore();

addRouter({
  id: crypto.randomUUID(),
  ipAddress: '192.168.88.1',
  name: 'Main Router',
  connectionStatus: 'unknown',
  discoveryMethod: 'manual',
  createdAt: new Date(),
});
```

**`updateRouter(id: string, updates: Partial<Router>)`** - Update router fields

```typescript
const { updateRouter } = useRouterStore();

// Update status after connection attempt
updateRouter(routerId, {
  connectionStatus: 'online',
  lastConnected: new Date(),
});

// Update name
updateRouter(routerId, { name: 'Backup Router' });
```

**`removeRouter(id: string)`** - Remove router from store

```typescript
const { removeRouter } = useRouterStore();

removeRouter(routerId);
// Automatically clears selection if this was the selected router
// Automatically clears lastConnectedRouterId if this was that router
```

**`getRouter(id: string): Router | undefined`** - Get specific router

```typescript
const { getRouter } = useRouterStore();

const router = getRouter(routerId);
if (router) {
  console.log(`Router ${router.name} is ${router.connectionStatus}`);
}
```

**`getAllRouters(): Router[]`** - Get all routers as array

```typescript
const { getAllRouters } = useRouterStore();

const routers = getAllRouters();
console.log(`Found ${routers.length} routers`);

// Sort by name
const sorted = routers.sort((a, b) => a.name.localeCompare(b.name));
```

### Selection Management

**`selectRouter(id: string)`** - Select router for connection attempt

```typescript
const { selectRouter } = useRouterStore();

// User clicks router in list
selectRouter(routerId);
// Now attempting to connect to this router
```

**`clearSelection()`** - Clear current selection

```typescript
const { clearSelection } = useRouterStore();

// After successful connection or when user cancels
clearSelection();
```

### Scan Progress Tracking

**`setScanProgress(progress: ScanProgress | null)`** - Update scan progress

```typescript
const { setScanProgress } = useRouterStore();

// Start scan
setScanProgress({
  totalAddresses: 256,
  scannedAddresses: 0,
  discoveredRouters: [],
  isScanning: true,
});

// Update during scan
setScanProgress((prev) => ({
  ...prev,
  scannedAddresses: prev.scannedAddresses + 1,
  discoveredRouters: [...prev.discoveredRouters, newRouter],
}));

// Complete scan
setScanProgress(null);
```

### Connection Tracking

**`setLastConnected(id: string)`** - Mark router as last successfully connected

```typescript
const { setLastConnected } = useRouterStore();

// After successful authentication
setLastConnected(routerId);
// Automatically updates:
// - lastConnectedRouterId
// - router.connectionStatus to 'online'
// - router.lastConnected to now
```

**`getLastConnectedRouter(): Router | undefined`** - Get the last connected router

```typescript
const { getLastConnectedRouter } = useRouterStore();

const lastRouter = getLastConnectedRouter();
if (lastRouter) {
  console.log(`Last connected to ${lastRouter.name}`);
}
```

### Configuration Tracking

**`isConfigurationChecked(routerId: string): boolean`** - Check if router has been checked for
config import

```typescript
const { isConfigurationChecked } = useRouterStore();

if (!isConfigurationChecked(routerId)) {
  // Show configuration import wizard
}
```

**`markConfigurationChecked(routerId: string)`** - Mark router as checked for configuration

```typescript
const { markConfigurationChecked } = useRouterStore();

// After showing wizard (or user skips)
markConfigurationChecked(routerId);
// Prevents showing wizard again
```

**`clearConfigurationChecked(routerId: string)`** - Clear configuration check status

```typescript
const { clearConfigurationChecked } = useRouterStore();

// User wants to re-import configuration
clearConfigurationChecked(routerId);
```

### Utility

**`clearAll()`** - Clear entire store (testing/reset)

```typescript
const { clearAll } = useRouterStore();

// Testing only - resets all state
clearAll();
```

## Persistence

The router store automatically persists to localStorage under key `'nasnet-router-store'`.

**Persisted fields:**

- `routers` - All discovered/added routers
- `lastConnectedRouterId` - For auto-reconnect
- `configurationCheckedRouters` - To avoid repeated wizard

**NOT persisted (session-only):**

- `selectedRouterId` - Clears on page reload
- `scanProgress` - Clears on page reload

This ensures routers are remembered across sessions, but transient UI state resets.

## Common Usage Patterns

### Router Discovery Flow

```tsx
function DiscoveryComponent() {
  const { scanProgress, setScanProgress, addRouter } = useRouterStore();

  const startScan = async () => {
    setScanProgress({
      totalAddresses: 256,
      scannedAddresses: 0,
      discoveredRouters: [],
      isScanning: true,
    });

    try {
      // Scan network
      for (let i = 1; i <= 256; i++) {
        const ip = `192.168.1.${i}`;

        // Try to reach router
        const isRouter = await checkIfRouter(ip);

        setScanProgress((prev) => ({
          ...prev,
          scannedAddresses: i,
          discoveredRouters:
            isRouter ?
              [
                ...prev.discoveredRouters,
                {
                  id: crypto.randomUUID(),
                  ipAddress: ip,
                  name: `Router ${i}`,
                  connectionStatus: 'unknown',
                  discoveryMethod: 'broadcast',
                  createdAt: new Date(),
                },
              ]
            : prev.discoveredRouters,
        }));
      }

      // Add discovered routers to store
      scanProgress?.discoveredRouters.forEach(addRouter);
    } finally {
      setScanProgress(null);
    }
  };

  return (
    <div>
      {scanProgress && (
        <ProgressBar
          current={scanProgress.scannedAddresses}
          total={scanProgress.totalAddresses}
          discovered={scanProgress.discoveredRouters.length}
        />
      )}
      <Button
        onClick={startScan}
        disabled={scanProgress?.isScanning}
      >
        Scan Network
      </Button>
    </div>
  );
}
```

### Router Selection & Connection

```tsx
function RouterSelectionPanel() {
  const routers = useRouterStore((state) => state.getAllRouters());
  const selectedRouterId = useRouterStore((state) => state.selectedRouterId);
  const selectRouter = useRouterStore((state) => state.selectRouter);
  const setLastConnected = useRouterStore((state) => state.setLastConnected);

  const handleConnect = async (routerId: string) => {
    selectRouter(routerId);

    try {
      // Attempt connection
      const result = await connectToRouter(routerId);

      // Mark as connected
      setLastConnected(routerId);

      // Proceed to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Connection failed:', error);
      // Show error message
    }
  };

  return (
    <div>
      {routers.map((router) => (
        <RouterCard
          key={router.id}
          router={router}
          isSelected={selectedRouterId === router.id}
          onConnect={() => handleConnect(router.id)}
        />
      ))}
    </div>
  );
}
```

### Auto-Reconnect on App Start

```tsx
function AppInitializer() {
  const getLastConnectedRouter = useRouterStore((state) => state.getLastConnectedRouter);

  useEffect(() => {
    const lastRouter = getLastConnectedRouter();

    if (lastRouter) {
      // Auto-reconnect to last used router
      reconnectToRouter(lastRouter.id);
    }
  }, []);

  return null;
}
```

### Configuration Import Flow

```tsx
function ConfigurationCheck() {
  const selectedRouterId = useRouterStore((state) => state.selectedRouterId);
  const isConfigurationChecked = useRouterStore((state) => state.isConfigurationChecked);
  const markConfigurationChecked = useRouterStore((state) => state.markConfigurationChecked);

  useEffect(() => {
    if (!selectedRouterId) return;

    // Check if we need to show config wizard
    if (!isConfigurationChecked(selectedRouterId)) {
      // Show wizard
      showConfigWizard(selectedRouterId);

      // Mark as checked
      markConfigurationChecked(selectedRouterId);
    }
  }, [selectedRouterId]);

  return null;
}
```

## Selectors

Optimized selectors for minimal re-renders:

| Selector                      | Returns                | Usage                                  |
| ----------------------------- | ---------------------- | -------------------------------------- |
| `selectAllRouters()`          | `Router[]`             | Get all routers                        |
| `selectSelectedRouter()`      | `Router \| undefined`  | Get currently selected router          |
| `selectLastConnectedRouter()` | `Router \| undefined`  | Get last successfully connected router |
| `selectRouterCount()`         | `number`               | Get total router count                 |
| `selectScanProgress()`        | `ScanProgress \| null` | Get current scan progress              |
| `selectIsScanning()`          | `boolean`              | Check if scan in progress              |

**Example:**

```typescript
// ✅ Good: Only re-renders when routers change
const routers = useRouterStore((state) => state.getAllRouters());

// ✅ Good: Only re-renders when selection changes
const selectedRouter = useRouterStore((state) => state.routers[state.selectedRouterId ?? '']);

// ❌ Bad: Re-renders on ANY store change
const { routers, selectedRouterId, scanProgress } = useRouterStore();
```

## Out-of-React Access

```typescript
// Get current routers without hook
const { routers } = useRouterStore.getState();

// Subscribe outside React
const unsubscribe = useRouterStore.subscribe(
  (state) => state.lastConnectedRouterId,
  (routerId) => {
    console.log('Last connected router changed:', routerId);
  }
);

// Later
unsubscribe();
```

## Integration with Connection Store

The router store works in conjunction with `useConnectionStore`:

- **Router Store**: Manages router inventory, discovery, selection
- **Connection Store**: Manages WebSocket connection state, status, latency

**Typical flow:**

1. User selects router → `useRouterStore.selectRouter()`
2. App attempts connection → `useConnectionStore.connect()`
3. Connection succeeds → `useRouterStore.setLastConnected()`
4. WebSocket status updates → `useConnectionStore.setWsStatus()`

## DevTools Integration

In development mode, Redux DevTools shows all router actions:

```
Actions:
- addRouter
- updateRouter
- removeRouter
- selectRouter
- clearSelection
- setScanProgress
- setLastConnected
- markConfigurationChecked
- clearConfigurationChecked
- clearAll

Time-travel debugging: Step through router state changes
```

## Performance Tips

1. **Use selectors for specific fields:**

   ```typescript
   // ✅ Good
   const routers = useRouterStore((s) => s.getAllRouters());

   // ❌ Bad
   const { routers, selectedRouterId, scanProgress } = useRouterStore();
   ```

2. **Use out-of-React access for utilities:**

   ```typescript
   // In utility functions
   const routers = useRouterStore.getState().getAllRouters();
   ```

3. **Batch related updates:**

   ```typescript
   // ✅ Good: Single store update
   updateRouter(id, { connectionStatus: 'online', lastConnected: now });

   // ❌ Bad: Multiple separate updates
   updateRouter(id, { connectionStatus: 'online' });
   updateRouter(id, { lastConnected: now });
   ```

## Configuration Check Constants

```typescript
// No re-display threshold
const CONFIG_CHECK_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
```

## See Also

- **[Connection Store](./auth.md)** - WebSocket connection state
- **[Auth Store](./auth.md)** - User authentication and tokens
- **[Hooks & Utilities](./hooks-utilities.md)** - Auto-reconnect and recovery
