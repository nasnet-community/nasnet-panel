---
sidebar_position: 6
title: Offline-First Architecture
---

# Offline-First Architecture

NasNetConnect operates in environments where network connectivity to the MikroTik router is
inherently unstable — server rooms, mobile devices, and embedded containers. The offline-first
system ensures the UI remains functional and consistent across degraded and fully disconnected
states. It is composed of three cooperating modules: **cache persistence** (Apollo InMemoryCache →
IndexedDB via localforage), **offline detection** (four signal sources converging to a Zustand
network store), and an **offline mutation queue** (FIFO, deduplicated, auto-replaying queue backed
by IndexedDB). Together they allow the app to serve cached data immediately on load, detect
connectivity changes within seconds, and defer mutations until the connection is restored.

---

## Architecture Sequence Diagram

```
App Boot
   │
   ├─► initializeCachePersistence(apolloCache)
   │         │  IndexedDB → InMemoryCache restore
   │         ▼
   │   Apollo serves cached data immediately
   │
   ├─► useOfflineDetector() / setupOfflineDetector()
   │         │
   │   ┌─────┴──────────────────────────────────────────┐
   │   │ Signal 1: navigator.online/offline events       │
   │   │ Signal 2: 'network:error' (from errorLink)      │
   │   │ Signal 3: 'ws:connected/closed/error' (from ws) │
   │   │ Signal 4: /api/health polling (every 30s)       │
   │   └──────────────────┬─────────────────────────────┘
   │                      ▼
   │           useNetworkStore.setOnline()
   │           useNetworkStore.setRouterReachable()
   │           useNetworkStore.setRouterConnected()
   │
   └─► setupAutoReplay(apolloClient)
             │
       subscribe to isRouterReachable changes
             │
       false → true? ──► offlineQueue.replayAll(apolloClient)
                                    │
                              sorted by timestamp (FIFO)
                                    │
                         for each QueuedMutation:
                              apolloClient.mutate()
                                    │
                              success → remove from queue
                              failure → retryCount++
                                     → discard at maxRetries


User makes mutation while offline:
   └─► offlineQueue.enqueue(mutation, variables)
             │  dedup by operationName+variables (last-write-wins)
             │  persist to IndexedDB
             └─► UI shows optimistic response
```

---

## Cache Persistence

**Source:** `core/src/apollo/apollo-cache-persist.ts`

### Purpose

Apollo's `InMemoryCache` is volatile — it is cleared on every page reload. Cache persistence writes
the serialized cache to IndexedDB on every mutation, making it available to the next page load. On
cold start, the app hydrates the cache from IndexedDB before the first React render, so queries
return cached data immediately without a loading spinner.

### Storage Backend

```ts
// core/src/apollo/apollo-cache-persist.ts:44
function configureStorage(): typeof localforage {
  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
    name: 'nasnet-apollo-cache',
    storeName: 'apollo_cache',
    description: 'Apollo Client cache persistence for offline support',
  });
  return localforage;
}
```

`localforage` is used as the IndexedDB abstraction layer. The driver priority list
`[INDEXEDDB, LOCALSTORAGE]` means IndexedDB is used when available, with `localStorage` as the
fallback for environments that restrict IndexedDB (some private browsing modes). All storage keys
are prefixed with the configured `key` option (default: `nasnet-apollo-cache`) to avoid collisions
with other IndexedDB databases.

### `CachePersistConfig`

```ts
export interface CachePersistConfig {
  maxSize?: number; // Default: 5MB (5 * 1024 * 1024 bytes)
  debounce?: number; // Default: 1000ms — write debounce to reduce I/O
  key?: string; // Default: 'nasnet-apollo-cache' — storage key prefix
  debug?: boolean; // Default: import.meta.env.DEV
}
```

The 1-second debounce is critical for performance: without it, every real-time subscription update
(e.g. bandwidth telemetry at 5-second intervals) would trigger an IndexedDB write. With the
debounce, bursts of updates coalesce into a single write.

### `initializeCachePersistence(cache, config?)`

```ts
export async function initializeCachePersistence(
  cache: InMemoryCache,
  config?: CachePersistConfig
): Promise<void>;
```

Restores the persisted cache into the provided `InMemoryCache` instance using
`apollo3-cache-persist`. Must be awaited before `ReactDOM.render()` to guarantee data is available
on the first render cycle.

```tsx
// Usage pattern (apps/connect/src/main.tsx or equivalent)
import { apolloCache } from '@nasnet/api-client/core';
import { initializeCachePersistence } from '@nasnet/api-client/core';

async function boot() {
  await initializeCachePersistence(apolloCache);
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}
boot();
```

If persistence fails (e.g., corrupted data), the function catches the error, calls
`clearPersistedCache()` to remove the corrupt entry, and continues without throwing — the app starts
with an empty cache rather than crashing.

SSR is detected via `typeof window === 'undefined'` and the function returns early, making it safe
to import in universal rendering setups.

### `clearPersistedCache(key?)`

```ts
export async function clearPersistedCache(key?: string): Promise<void>;
```

Enumerates all localforage keys matching the prefix pattern `<key>-*` and removes them. Should be
called on logout alongside `apolloClient.clearStore()`:

```ts
await clearPersistedCache();
apolloClient.clearStore();
```

### `getPersistedCacheSize(key?)`

```ts
export async function getPersistedCacheSize(key?: string): Promise<number>;
```

Returns the total size in bytes of all cache entries. Useful for diagnostics; note that UTF-16
encoding means each stored character counts as 2 bytes.

---

## Offline Detection

**Source:** `core/src/apollo/offline-detector.ts`

### Four Signal Sources

The offline detector aggregates signals from four independent sources. This redundancy is necessary
because no single source is reliable across all failure modes:

| Signal                      | Source                                       | Limitations                                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `navigator.online/offline`  | Browser events                               | Unreliable — can be `online` while the actual router is unreachable |
| `network:error`             | Custom DOM event from `apollo-error-link.ts` | Only fires when a GraphQL request fails                             |
| `ws:connected/closed/error` | Custom DOM events from `apollo-ws-client.ts` | Only reflects WebSocket state, not HTTP                             |
| `/api/health` polling       | `fetch()` every 30 seconds                   | Active check; catches all cases but has latency                     |

Together they distinguish three connectivity states reflected in `useNetworkStore`:

| State                                         | `isOnline` | `isRouterReachable` | `isRouterConnected` |
| --------------------------------------------- | ---------- | ------------------- | ------------------- |
| Fully connected                               | true       | true                | true                |
| Degraded (browser online, server unreachable) | true       | false               | false/true          |
| Offline                                       | false      | false               | false               |

### `setupOfflineDetector(config?)`

```ts
export function setupOfflineDetector(config?: OfflineDetectorConfig): CleanupFunction;
```

Registers all four signal listeners and starts the health check interval. Returns a cleanup function
that removes all listeners and clears the interval.

```ts
export interface OfflineDetectorConfig {
  healthEndpoint?: string; // Default: '/api/health'
  healthCheckInterval?: number; // Default: 30000ms (30 seconds)
  healthCheckTimeout?: number; // Default: 5000ms (5 seconds)
}
```

The health check uses `AbortController` to enforce the timeout:

```ts
// core/src/apollo/offline-detector.ts:130
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), healthCheckTimeout);
const response = await fetch(healthEndpoint, {
  method: 'GET',
  signal: controller.signal,
  redirect: 'error',
});
```

`redirect: 'error'` prevents a router redirect to a captive portal from being counted as a
successful health check.

### Signal-to-Store Mapping

```ts
// Browser events → isOnline
window.addEventListener('online', () => store.setOnline(true) + performHealthCheck());
window.addEventListener('offline', () => store.setOnline(false) + store.setRouterReachable(false));

// Apollo error link event → isRouterReachable
window.addEventListener('network:error', () => {
  store.setRouterReachable(false);
  store.incrementReconnectAttempts();
});

// WebSocket events → isRouterConnected
window.addEventListener('ws:connected', () => {
  store.setRouterConnected(true);
  store.setRouterReachable(true);
  store.resetReconnectAttempts();
});
window.addEventListener('ws:closed', () => store.setRouterConnected(false) + incrementAttempts);
window.addEventListener('ws:error', () => store.setRouterConnected(false) + incrementAttempts);
```

When the browser comes back online, an immediate health check fires (before the next scheduled
interval) to confirm actual backend reachability.

### `useOfflineDetector(config?)`

```ts
export function useOfflineDetector(config?: OfflineDetectorConfig): void;
```

React hook that wraps `setupOfflineDetector` in a `useEffect` with proper cleanup on unmount. The
`config` dependency is serialized via `JSON.stringify` to produce a stable reference.

```tsx
// Mount once at the app root
function App() {
  useOfflineDetector(); // starts all listeners + health polling
  return <Router />;
}
```

### `isOffline()` and `isDegraded()`

```ts
export function isOffline(): boolean;
// true if: !state.isOnline || !state.isRouterReachable

export function isDegraded(): boolean;
// true if: state.isOnline && (!state.isRouterReachable || !state.isRouterConnected)
```

These functions read directly from `useNetworkStore.getState()` and can be used outside React
components (e.g., in the offline queue's `setupAutoReplay`).

---

## Offline Mutation Queue

**Source:** `core/src/apollo/offline-queue.ts`

### Purpose

When a user performs a mutation while offline (or while the router is temporarily unreachable),
discarding it would be hostile UX. The queue captures the mutation with its variables and persists
it to IndexedDB. When connectivity is restored, the queue replays all pending mutations in the order
they were submitted.

### `QueuedMutation`

```ts
export interface QueuedMutation {
  id: string; // generateId() — timestamp + random
  mutation: DocumentNode;
  variables: Record<string, unknown>;
  timestamp: Date; // Enqueue time — used for FIFO sort
  retryCount: number;
  operationName: string;
  optimisticResponse?: unknown; // Passed to apolloClient.mutate()
}
```

### `OfflineQueueConfig`

```ts
export interface OfflineQueueConfig {
  maxQueueSize?: number; // Default: 50 — throws when full
  maxRetries?: number; // Default: 3 — discard after 3 failures
  retryDelay?: number; // Default: 1000ms — wait between retries
  storageKey?: string; // Default: 'nasnet-offline-queue'
}
```

### `OfflineMutationQueue` Class

#### `enqueue(mutation, variables, optimisticResponse?)`

```ts
async enqueue(
  mutation: DocumentNode,
  variables: Record<string, unknown>,
  optimisticResponse?: unknown
): Promise<string>  // returns the assigned id
```

Checks for a duplicate entry (same `operationName` + same `JSON.stringify(variables)`) and removes
it before adding the new entry. This implements **last-write-wins** conflict resolution: if the user
edits the same resource twice while offline, only the latest intent is queued.

Throws if the queue is at `maxQueueSize`. Persists to IndexedDB after every enqueue.

```ts
// Example: enqueue when offline
if (isOffline()) {
  await offlineQueue.enqueue(UPDATE_ROUTER_NAME, { id: routerId, name: newName });
}
```

#### `replayAll(client)`

```ts
async replayAll(
  client: ApolloClient<NormalizedCacheObject>
): Promise<number>  // returns count of successfully replayed mutations
```

Replays mutations in chronological order (sorted by `timestamp`, oldest first):

1. Calls `apolloClient.mutate()` with the stored `mutation`, `variables`, and optional
   `optimisticResponse`.
2. On success: removes the entry from queue and IndexedDB.
3. On failure: increments `retryCount`. If `retryCount >= maxRetries`, discards the entry. Otherwise
   keeps it for the next replay attempt.
4. Waits `retryDelay` ms between attempts.
5. Guards against concurrent replays with `isReplaying` flag.

#### Queue Management Methods

```ts
async remove(id: string): Promise<void>
async clear(): Promise<void>
size(): number
isEmpty(): boolean
getQueue(): ReadonlyArray<QueuedMutation>
```

### Singleton and Auto-Replay

```ts
// core/src/apollo/offline-queue.ts:375
export const offlineQueue = new OfflineMutationQueue();
```

The singleton is the standard entry point. Multiple `OfflineMutationQueue` instances would write to
different IndexedDB stores (different `storageKey`) and operate independently.

```ts
export function setupAutoReplay(client: ApolloClient<NormalizedCacheObject>): () => void; // returns unsubscribe function
```

`setupAutoReplay` subscribes to the Zustand `useNetworkStore` via `subscribe()`. When
`isRouterReachable` transitions from `false` to `true`, it calls `offlineQueue.replayAll(client)`
automatically:

```ts
// core/src/apollo/offline-queue.ts:398
const unsubscribe = useNetworkStore.subscribe((state, prevState) => {
  if (!prevState.isRouterReachable && state.isRouterReachable) {
    handleOnline();
  }
});
```

This creates a clean integration: the offline detector manages `isRouterReachable`, and the
auto-replay mechanism reacts to its changes without polling.

### IndexedDB Storage Limitation

`DocumentNode` (the parsed GraphQL AST) cannot be JSON-serialized to IndexedDB. The queue stores the
serialized form as a placeholder:

```ts
// core/src/apollo/offline-queue.ts:192
const serialized: SerializedMutation[] = this.queue.map((item) => ({
  mutationString: '', // DocumentNode cannot be serialized
  variables: item.variables,
  // ...
}));
```

This means the in-memory `mutation` reference (the `DocumentNode`) is the live reference that
`replayAll` uses — it is not reconstructed from IndexedDB. On page reload, `loadFromStorage`
restores the metadata (variables, timestamps, retry counts) but sets `mutation` to `null`. The
mutation AST must be re-registered by the caller after reload. In practice, the queue is typically
used within a single session — reload events are rare in embedded container deployments.

---

## Full Integration Example

```tsx
// apps/connect/src/main.tsx
import { apolloCache, initializeCachePersistence } from '@nasnet/api-client/core';
import { apolloClient } from '@nasnet/api-client/core';
import { setupAutoReplay, offlineQueue } from '@nasnet/api-client/core';
import { isOffline } from '@nasnet/api-client/core';

async function boot() {
  // 1. Restore cache before first render
  await initializeCachePersistence(apolloCache);

  // 2. Start auto-replay when router becomes reachable
  const stopAutoReplay = setupAutoReplay(apolloClient);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  );

  // 3. Flush error buffer on unload
  window.addEventListener('beforeunload', flushErrorBuffer);

  return () => stopAutoReplay();
}

// apps/connect/src/App.tsx
function App() {
  // 4. Start offline detection
  useOfflineDetector();

  return <RouterOutlet />;
}

// Feature component: enqueue mutation when offline
function RenameRouter({ routerId }: { routerId: string }) {
  const { mutate, isLoading } = useMutationWithLoading(UPDATE_ROUTER_NAME);

  const handleSave = async (name: string) => {
    if (isOffline()) {
      // Queue for later, show optimistic UI
      await offlineQueue.enqueue(UPDATE_ROUTER_NAME, { id: routerId, name });
    } else {
      await mutate({ id: routerId, name });
    }
  };

  return (
    <Button
      onClick={() => handleSave('NewName')}
      isLoading={isLoading}
    >
      Save
    </Button>
  );
}
```

---

## Custom Events

The offline-first system coordinates via custom DOM events. Four event types flow through the
system:

### `network:error` Event

**Dispatched by:** `core/src/apollo/apollo-error-link.ts` when a network error occurs.

**Listener:** `setupOfflineDetector()` in `offline-detector.ts`

```ts
// Fired whenever Apollo reports a network error
window.addEventListener('network:error', () => {
  store().setRouterReachable(false);
  store().incrementReconnectAttempts();
});

// Manually dispatch (rarely needed outside the error link):
window.dispatchEvent(
  new CustomEvent('network:error', {
    detail: { error: new Error('Connection failed') },
  })
);
```

**Payload:** `{ detail: { error: Error } }`

### `ws:connected` Event

**Dispatched by:** `core/src/apollo/apollo-ws-client.ts` when WebSocket connects successfully.

**Effect:** Sets router as both connected and reachable, resets reconnect attempts.

```ts
window.addEventListener('ws:connected', () => {
  store().setRouterConnected(true);
  store().setRouterReachable(true);
  store().resetReconnectAttempts();
});
```

### `ws:closed` Event

**Dispatched by:** `core/src/apollo/apollo-ws-client.ts` when WebSocket closes unexpectedly.

**Effect:** Marks router as disconnected, increments reconnection attempts.

```ts
window.addEventListener('ws:closed', () => {
  store().setRouterConnected(false);
  store().incrementReconnectAttempts();
});
```

### `ws:error` Event

**Dispatched by:** `core/src/apollo/apollo-ws-client.ts` when WebSocket encounters an error.

**Effect:** Marks router as disconnected, increments reconnection attempts.

```ts
window.addEventListener('ws:error', () => {
  store().setRouterConnected(false);
  store().incrementReconnectAttempts();
});
```

**Payload:** `{ detail: { code?: string, message?: string } }`

---

## Imperative Connectivity API

While hooks are the preferred way to use offline detection in React components, the imperative API
allows checking connectivity outside the component tree (e.g., in data layer code, event handlers,
or utility functions).

### `isOffline()`

```ts
export function isOffline(): boolean;
// true if: !state.isOnline || !state.isRouterReachable
```

Returns `true` when the browser is offline (navigator.onLine = false) **or** the router is
unreachable. Used to decide whether to queue mutations or reject operations.

**Usage outside React:**

```ts
import { isOffline, offlineQueue } from '@nasnet/api-client/core';

async function submitForm(data) {
  if (isOffline()) {
    // Queue for later
    await offlineQueue.enqueue(UPDATE_ROUTER, { ...data });
    showToast('Changes will be saved when you're back online');
  } else {
    // Execute immediately
    await apolloClient.mutate({ mutation: UPDATE_ROUTER, variables: data });
  }
}
```

### `isDegraded()`

```ts
export function isDegraded(): boolean;
// true if: state.isOnline && (!state.isRouterReachable || !state.isRouterConnected)
```

Returns `true` when the browser is online but either:

- The backend router is unreachable, **or**
- The WebSocket connection is down (but HTTP may still work)

Used to show a "reconnecting" or "degraded" indicator in the UI while allowing some operations to
continue.

**Usage example:**

```ts
function StatusBar() {
  const state = useNetworkStore();

  if (!state.isOnline) {
    return <OfflineIndicator />;  // Fully offline
  }

  if (isDegraded()) {
    return <DegradedIndicator />;  // Browser online, server/WS unreachable
  }

  return <OnlineIndicator />;      // Fully connected
}
```

---

## Hook vs. Imperative Setup

### `useOfflineDetector(config?)` — React Hook (Preferred)

**When to use:** Component tree initialization, automatic cleanup on unmount.

**Characteristics:**

- Auto-cleanup on component unmount
- Config dependency tracking via `JSON.stringify`
- Integrates with React lifecycle

```tsx
// Mount once at app root
function App() {
  useOfflineDetector({
    healthCheckInterval: 15000, // Custom interval
  });

  return <Router />;
}
// Cleanup automatic on unmount (unlikely in SPA, but correct practice)
```

### `setupOfflineDetector(config?)` — Imperative Setup

**When to use:** Bootstrap code, non-React applications, custom cleanup.

**Characteristics:**

- Manual cleanup via returned function
- Can be called outside React
- Useful in initialization scripts

```ts
// In app bootstrap (before React)
import { setupOfflineDetector } from '@nasnet/api-client/core';

const cleanup = setupOfflineDetector({
  healthCheckInterval: 30000,
  healthEndpoint: '/api/health',
});

// Later, on app shutdown:
cleanup();
```

**Comparison table:**

| Aspect        | `useOfflineDetector()`    | `setupOfflineDetector()`            |
| ------------- | ------------------------- | ----------------------------------- |
| Where to call | Inside React component    | Bootstrap code, top-level functions |
| Cleanup       | Automatic on unmount      | Manual via returned function        |
| Dependencies  | `config` serialized       | None (imperative)                   |
| Best for      | React apps (99% of cases) | Non-React code, custom lifecycle    |

---

## Health Check Configuration

The offline detector polls the backend health endpoint at regular intervals to actively detect
reachability. This is necessary because browser events (`online`, `offline`) and passive error
tracking are insufficient — a host can appear online but be unreachable.

### Configuration Options

```ts
export interface OfflineDetectorConfig {
  healthEndpoint?: string; // Default: '/api/health'
  healthCheckInterval?: number; // Default: 30000 (30 seconds)
  healthCheckTimeout?: number; // Default: 5000 (5 seconds)
}
```

| Setting               | Default       | Purpose                                       |
| --------------------- | ------------- | --------------------------------------------- |
| `healthEndpoint`      | `/api/health` | Backend endpoint to ping                      |
| `healthCheckInterval` | 30000 ms      | How often to poll (30s = reasonable overhead) |
| `healthCheckTimeout`  | 5000 ms       | Max time to wait for health check response    |

### Health Check Behavior

**Source:** `core/src/apollo/offline-detector.ts:124–155`

```ts
async function performHealthCheck(): Promise<void> {
  // Skip if browser reports offline (no point checking)
  if (!navigator.onLine) {
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), healthCheckTimeout);

  try {
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'error', // Reject redirect (captive portals)
    });

    if (response.ok) {
      store().setRouterReachable(true);
      store().recordSuccessfulRequest();
    } else {
      store().setRouterReachable(false);
      store().incrementReconnectAttempts();
    }
  } catch {
    // Network error or timeout
    store().setRouterReachable(false);
    store().incrementReconnectAttempts();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Key details:**

- `redirect: 'error'` prevents captive portal redirects from being counted as success.
- `AbortController` enforces the timeout; `setTimeout(...).abort()` is more reliable than
  Promise-based timeouts.
- Both response errors (non-ok status) and network errors (throw/timeout) mark the router as
  unreachable.
- Immediate health check fires when the browser comes back online before the next scheduled
  interval.

### Tuning for Your Environment

| Scenario                | Config                                                     | Rationale                                     |
| ----------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| **Stable LAN**          | `{ healthCheckInterval: 45000 }`                           | Less frequent polling, lower overhead         |
| **Mobile / Unreliable** | `{ healthCheckInterval: 10000, healthCheckTimeout: 3000 }` | Fast detection of drops, quick timeout        |
| **Slow backend**        | `{ healthCheckTimeout: 10000 }`                            | Higher timeout for slow health check endpoint |
| **Custom endpoint**     | `{ healthEndpoint: '/custom/health' }`                     | Route to your own health check                |

---

## See Also

- `./intro.md` — Library overview
- `./apollo-client.md` — Apollo cache configuration and type policies
- `./authentication.md` — Auth expiry integration with network error events
- `./error-handling.md` — How `network:error` events feed the offline detector
- `./websocket-subscriptions.md` — WebSocket events that drive connectivity state
- `./universal-state-resource-model.md` — Cache key policies for resource types
