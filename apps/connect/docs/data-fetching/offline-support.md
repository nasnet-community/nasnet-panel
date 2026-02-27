# Offline Support

NasNetConnect runs on a router — network connectivity to the device can disappear at any time. The
offline support layer detects disconnection, queues mutations, and replays them automatically when
the device is reachable again.

## Architecture

Three files implement the offline layer:

| File                             | Responsibility                        |
| -------------------------------- | ------------------------------------- |
| `apollo/offline-detector.ts`     | Detects connectivity state changes    |
| `apollo/offline-queue.ts`        | Queues mutations during disconnection |
| `apollo/apollo-cache-persist.ts` | Persists Apollo cache to IndexedDB    |

## Offline Detection

File: `libs/api-client/core/src/apollo/offline-detector.ts`

The detector monitors four signals simultaneously:

1. **Browser `online`/`offline` events** — immediate feedback when the device loses internet
2. **`network:error` custom events** — dispatched by the Apollo error link when GraphQL requests
   fail at the network level
3. **WebSocket `ws:connected`/`ws:closed`/`ws:error` events** — dispatched by the WS client to track
   subscription health
4. **Periodic health checks** — GET `/api/health` every 30 seconds with a 5-second timeout

State is written to the `useNetworkStore` Zustand store, which exposes:

- `isOnline` — browser reports network connectivity
- `isRouterReachable` — backend is responding to health checks
- `isRouterConnected` — WebSocket subscription channel is up
- `reconnectAttempts` — increments on each failure, resets on success

### Setup

```typescript
// In App.tsx
import { useOfflineDetector } from '@nasnet/api-client/core';

function App() {
  useOfflineDetector({
    healthEndpoint: '/api/health',    // default
    healthCheckInterval: 30000,        // 30s, default
    healthCheckTimeout: 5000,          // 5s, default
  });

  return <Router />;
}
```

### Degraded Mode

The `isDegraded()` function returns `true` when the browser is online but the router or WebSocket is
unreachable. This powers the "degraded mode" UI indicator in the app header.

```typescript
import { isOffline, isDegraded } from '@nasnet/api-client/core';

const offline = isOffline(); // browser offline OR router unreachable
const degraded = isDegraded(); // browser online but router/WS down
```

## Offline Mutation Queue

File: `libs/api-client/core/src/apollo/offline-queue.ts`

When mutations fail because the router is unreachable, they can be enqueued for replay. The queue is
backed by IndexedDB via `localforage` so it survives page reloads.

### Queue Behaviour

- **Max size**: 50 mutations (configurable)
- **Max retries**: 3 per mutation
- **Retry delay**: 1 second between retries
- **Conflict resolution**: last-write-wins — if the same operation with the same variables is
  enqueued twice, the older entry is replaced
- **Replay order**: FIFO (oldest mutations replayed first)

### API

```typescript
import { offlineQueue, setupAutoReplay } from '@nasnet/api-client/core';

// Enqueue a mutation when offline
if (isOffline()) {
  await offlineQueue.enqueue(
    UPDATE_ROUTER_MUTATION,
    { id: routerId, name: 'New Name' },
    optimisticResponse // optional
  );
}

// Replay all queued mutations when connectivity returns
const successCount = await offlineQueue.replayAll(apolloClient);

// Set up automatic replay tied to useNetworkStore
const cleanup = setupAutoReplay(apolloClient);
// Call cleanup() on component unmount
```

### Auto-Replay

`setupAutoReplay` subscribes to the `useNetworkStore` and triggers `replayAll` whenever
`isRouterReachable` transitions from `false` to `true`. It returns an unsubscribe function for
cleanup.

## Apollo Cache Persistence

File: `libs/api-client/core/src/apollo/apollo-cache-persist.ts`

The Apollo `InMemoryCache` is persisted to IndexedDB so the last known state of routers, resources,
and services is available immediately on next page load — even before any network requests complete.

### Configuration

| Setting    | Default               | Description                        |
| ---------- | --------------------- | ---------------------------------- |
| `maxSize`  | 5 MB                  | Maximum cache size before eviction |
| `debounce` | 1000 ms               | Delay before writing to storage    |
| `key`      | `nasnet-apollo-cache` | IndexedDB storage key prefix       |
| `debug`    | `true` in dev         | Log cache operations               |

### Initialisation

Call `initializeCachePersistence` once before the React tree mounts:

```typescript
import { apolloCache } from '@nasnet/api-client/core';
import { initializeCachePersistence } from '@nasnet/api-client/core';

async function initApp() {
  // Restore Apollo cache from IndexedDB before first render
  await initializeCachePersistence(apolloCache);

  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}

initApp();
```

### Cache Lifecycle

- **On mount**: `persistCache` restores the previous cache snapshot synchronously before the first
  render
- **On write**: Cache updates are debounced by 1 second before writing to IndexedDB
- **On logout**: Call `clearPersistedCache()` then `apolloClient.clearStore()` to remove stale data

```typescript
import { clearPersistedCache } from '@nasnet/api-client/core';

async function handleLogout() {
  await clearPersistedCache();
  await apolloClient.clearStore();
}
```

### Storage Driver Priority

Both the cache persistence and the mutation queue use `localforage` configured to try drivers in
this order:

1. IndexedDB (preferred — larger capacity, async)
2. LocalStorage (fallback — synchronous, 5 MB limit)

## Network State Store

The `useNetworkStore` Zustand store is the single source of truth for connectivity state. Components
can read it directly:

```typescript
import { useNetworkStore } from '@nasnet/state/stores';

function ConnectionBadge() {
  const { isOnline, isRouterReachable, isRouterConnected, reconnectAttempts } =
    useNetworkStore();

  if (!isOnline) return <Badge variant="error">Offline</Badge>;
  if (!isRouterReachable) return <Badge variant="warning">Router unreachable</Badge>;
  if (!isRouterConnected) return <Badge variant="warning">Subscriptions down</Badge>;
  return <Badge variant="success">Connected</Badge>;
}
```
