---
sidebar_position: 2
title: Apollo Client
---

# Apollo Client

This document covers the complete Apollo Client infrastructure in
`libs/api-client/core/src/apollo/`. The Apollo layer handles all GraphQL communication: queries,
mutations, and real-time subscriptions via WebSocket. It provides an intelligent link chain, a
carefully tuned normalized cache, offline-first cache persistence, and React provider integration
for both production and test environments.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Link Chain](#link-chain)
   - [Error Link](#error-link)
   - [Retry Link](#retry-link)
   - [Auth Link](#auth-link)
   - [HTTP Link](#http-link)
   - [WebSocket Link and Client](#websocket-link-and-client)
   - [Split Link (Routing)](#split-link-routing)
3. [Normalized Cache](#normalized-cache)
   - [possibleTypes and Union Resolution](#possibletypes-and-union-resolution)
   - [Type Policies](#type-policies)
   - [Universal State v2 Resource Policies](#universal-state-v2-resource-policies)
4. [Default Options](#default-options)
5. [Cache Persistence](#cache-persistence)
6. [Offline Detection](#offline-detection)
7. [Offline Mutation Queue](#offline-mutation-queue)
8. [React Providers](#react-providers)
9. [Enhanced Hooks](#enhanced-hooks)
10. [Exports Reference](#exports-reference)
11. [Cross-References](#cross-references)

---

## Architecture Overview

The Apollo Client instance is assembled in `core/src/apollo/apollo-client.ts`. The full request
pipeline is:

```
React Component
      |
      v
 useQuery / useMutation / useSubscription
      |
      v
 ApolloClient instance  (apollo-client.ts)
      |
      v
+---------------------+
|     Link Chain      |
|                     |
|  errorLink          |  (apollo-error-link.ts)    - catches ALL errors
|      |              |
|  retryLink          |  (apollo-retry-link.ts)    - retries network errors
|      |              |
|  splitLink          |                            - routes by operation type
|   /        \        |
| wsLink    authLink  |  (apollo-ws-client.ts)
|           + httpLink|  (apollo-auth-link.ts)
+---------------------+
      |                        |
      v                        v
  WebSocket                 HTTP POST
  /graphql (ws/wss)         /graphql
      |                        |
      +---------- Backend -----+
```

**Key design decisions:**

- `errorLink` is the outermost link so it intercepts errors from every downstream link.
- `retryLink` sits before `splitLink` to apply backoff retry to HTTP-only operations (subscriptions
  have their own reconnect logic in the WebSocket client).
- The HTTP path composes `authLink.concat(httpLink)` to inject headers before every HTTP request.
- Subscriptions bypass the auth and retry links; auth is supplied as WebSocket `connectionParams`
  instead.

---

## Link Chain

### Error Link

**Source:** `core/src/apollo/apollo-error-link.ts`

The error link is created with Apollo's `onError` helper and positioned first in the chain
(`from([errorLink, retryLink, splitLink])`), so it receives errors from all downstream links.

**Exports:**

```ts
export const errorLink: ApolloLink;
export function createErrorLink(options: {
  onAuthError?: (message: string) => void;
  onNetworkError?: (error: Error) => void;
}): ApolloLink;
```

**GraphQL error handling by code:**

| Code                         | Action                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `UNAUTHENTICATED`            | Clears `useAuthStore`, dispatches `auth:expired` window event, shows toast |
| `FORBIDDEN`                  | Shows "Access denied" error toast                                          |
| `NOT_FOUND`                  | Shows "Not found" warning toast                                            |
| `A5xx` (auth category)       | Same as UNAUTHENTICATED                                                    |
| `V4xx` (validation category) | Skipped — handled by React Hook Form                                       |
| Others                       | Mapped via `getErrorInfo()` from `utils/error-messages.ts`                 |

**Network error handling by HTTP status:**

| Status | Action                                                                              |
| ------ | ----------------------------------------------------------------------------------- |
| 401    | Calls `handleAuthError()` — clears auth, fires `auth:expired` event                 |
| 403    | Shows "Access denied" error toast                                                   |
| Other  | Shows generic "Unable to reach the server" error toast, fires `network:error` event |

**`createErrorLink`** is available when you need custom auth or network error handlers — useful for
isolated module testing or embedded contexts.

```ts
// Custom error handler example
const customErrorLink = createErrorLink({
  onAuthError: (message) => {
    redirectToLogin();
  },
  onNetworkError: (error) => {
    trackNetworkError(error);
  },
});
```

See `./error-handling.md` for the full error handling architecture including error boundaries and
component-level hooks.

---

### Retry Link

**Source:** `core/src/apollo/apollo-retry-link.ts`

```ts
export const retryLink: RetryLink;
```

Configured with Apollo's `RetryLink`:

```ts
const retryLink = new RetryLink({
  delay: {
    initial: 300, // 300ms initial delay
    max: 3000, // 3s maximum delay
    jitter: true, // randomized delay to avoid thundering herd
  },
  attempts: {
    max: 3,
    retryIf: (error) => {
      const isNetworkError = !!error && !error.result;
      const isClientError =
        typeof error?.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500;
      return isNetworkError && !isClientError;
    },
  },
});
```

**Retry policy:**

- Only retries true network errors (no response received).
- Never retries 4xx client errors — those are permanent failures.
- Up to 3 attempts with exponential jitter (300ms, up to 3s).

---

### Auth Link

**Source:** `core/src/apollo/apollo-auth-link.ts`

```ts
export const authLink: ApolloLink;
export function createAuthLink(getToken: () => string | null): ApolloLink;
```

Built with Apollo's `setContext` link. On every HTTP request it reads the current application state
and injects two headers:

| Header          | Source                                          | Value                              |
| --------------- | ----------------------------------------------- | ---------------------------------- |
| `X-Router-Id`   | `useConnectionStore.getState().currentRouterId` | Current router ULID                |
| `Authorization` | `getAuthToken()` (JWT first) or sessionStorage  | `Bearer <jwt>` or `Basic <base64>` |

**Auth header priority:**

1. JWT token from `useAuthStore` via `getAuthToken()`.
2. Basic auth from per-router credentials stored in `sessionStorage` at key
   `router-credentials-<routerId>`.

```ts
// Example: how the auth link reads state at request time
export const authLink = setContext((_, { headers }) => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorizationHeader(currentRouterId);

  return {
    headers: {
      ...headers,
      'X-Router-Id': currentRouterId || '',
      ...(authorization && { Authorization: authorization }),
    },
  };
});
```

The `createAuthLink` factory lets you provide a custom token getter, useful in isolated testing or
multi-tenant scenarios.

See `./authentication.md` for the complete authentication architecture.

---

### HTTP Link

**Source:** `core/src/apollo/apollo-client.ts` (inline)

```ts
const httpLink = new HttpLink({
  uri: '/graphql',
  credentials: 'include', // sends session cookies
});
```

Points to `/graphql` on the same origin. `credentials: 'include'` ensures cookies (used for session
fallback) are sent with every request.

---

### WebSocket Link and Client

**Source:** `core/src/apollo/apollo-ws-client.ts`

```ts
export interface WsClientOptions {
  url?: string; // auto-detected from window.location
  maxRetries?: number; // default: 10
  showNotifications?: boolean; // default: true
}

export function createWsClient(options?: WsClientOptions): Client;
export const wsClient: Client; // singleton using default options
```

The WebSocket client is built on the `graphql-ws` library. The URL is derived from
`window.location`:

```ts
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/graphql`;
}
```

**Authentication for subscriptions** is supplied as `connectionParams` (re-evaluated on every
reconnect):

```ts
connectionParams: () => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorization(currentRouterId); // JWT or Basic
  return { routerId: currentRouterId, authorization };
};
```

**Reconnect strategy:**

| Attempt | Approx. delay      |
| ------- | ------------------ |
| 1       | ~1s                |
| 2       | ~2s                |
| 3       | ~4s                |
| 4       | ~8s                |
| 5+      | up to 30s (capped) |

Delays use `calculateBackoff` from `@nasnet/state/stores`. Reconnection stops when:

- Close code `4401` (custom auth failure) is received.
- Close code `4403` (forbidden) is received.
- `useConnectionStore.getState().hasExceededMaxAttempts()` returns `true`.

**Connection lifecycle events** update `useConnectionStore` and dispatch window events:

| Event              | Store action                                           | Window event    |
| ------------------ | ------------------------------------------------------ | --------------- |
| `connecting`       | `setWsStatus('connecting')`                            | `ws:connecting` |
| `connected`        | `setWsStatus('connected')`, `resetReconnection()`      | `ws:connected`  |
| `closed` (unclean) | `setWsStatus('error')`, `incrementReconnectAttempts()` | `ws:closed`     |
| `error`            | `setWsStatus('error', message)`                        | `ws:error`      |

See `./websocket-subscriptions.md` for subscription usage patterns.

---

### Split Link (Routing)

**Source:** `core/src/apollo/apollo-client.ts`

```ts
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink, // subscriptions → WebSocket
  authLink.concat(httpLink) // queries + mutations → HTTP with auth headers
);
```

Subscription operations are routed to `wsLink`. Queries and mutations are routed through
`authLink.concat(httpLink)`, which injects `X-Router-Id` and `Authorization` headers before the HTTP
request.

---

## Normalized Cache

**Source:** `core/src/apollo/apollo-client.ts`

The `InMemoryCache` is the central data store. Every entity is normalized by a key field so that
updates from mutations and subscriptions automatically refresh all query results that include that
entity.

### possibleTypes and Union Resolution

```ts
const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes,
  // ...
});
```

`possibleTypesResult` is imported from `@nasnet/api-client/generated` (output of GraphQL codegen).
It tells Apollo about abstract types (interfaces and unions), enabling correct cache normalization
for polymorphic fields like `Node`, `Connection`, and `Edge`. Whenever the schema changes and
codegen is re-run, this is updated automatically.

### Type Policies

**`Query` field policies:**

| Field       | `keyArgs`                                   | Merge strategy          |
| ----------- | ------------------------------------------- | ----------------------- |
| `routers`   | `['filter']`                                | Replace (incoming wins) |
| `resources` | `['routerId', 'category', 'type', 'state']` | Replace (incoming wins) |

These `keyArgs` ensure that different filter combinations produce separate cache entries rather than
overwriting each other.

**`Router` policy:**

- `keyFields: ['id']` — normalized by router ID.
- `status` field uses `merge: true` — partial runtime updates merge into the existing object rather
  than replacing it entirely.

### Universal State v2 Resource Policies

**Source:** `core/src/apollo/apollo-client.ts:118`

All resource types from the Universal State v2 model (see `./universal-state-resource-model.md`) are
normalized by `uuid` (ULID). The cache uses distinct merge strategies per layer:

```
Resource layers and merge behavior:
  Layer 2: validation    → merge: false  (full replace on each validation run)
  Layer 3: deployment    → merge: false  (full replace on apply)
  Layer 4: runtime       → merge: true   (partial updates preserve live metrics)
  Layer 5: telemetry     → custom merge  (append bandwidth history, keep last 24h)
```

**Telemetry merge function** (at `apollo-client.ts:142`):

```ts
telemetry: {
  merge(existing, incoming) {
    return {
      ...existing,
      ...incoming,
      bandwidthHistory: [
        ...(existing.bandwidthHistory ?? []),
        ...(incoming.bandwidthHistory ?? []),
      ].slice(-288), // 288 × 5min = 24 hours
      hourlyStats: incoming.hourlyStats ?? existing.hourlyStats,
      dailyStats: incoming.dailyStats ?? existing.dailyStats,
    };
  },
},
```

**Concrete resource types with `runtime` merge:**

| Type                   | `keyFields` | Has runtime merge |
| ---------------------- | ----------- | ----------------- |
| `Resource` (base)      | `uuid`      | Yes               |
| `WireGuardClient`      | `uuid`      | Yes               |
| `LANNetwork`           | `uuid`      | Yes               |
| `WANLink`              | `uuid`      | Yes               |
| `FeatureResource`      | `uuid`      | Yes               |
| `FirewallRuleResource` | `uuid`      | No (stateless)    |
| `DHCPServerResource`   | `uuid`      | No                |
| `BridgeResource`       | `uuid`      | No                |
| `RouteResource`        | `uuid`      | No                |

**Other type policies:**

| Type               | Behavior                                |
| ------------------ | --------------------------------------- |
| `ValidationResult` | `merge: false` — always replace         |
| `DeploymentState`  | `merge: false` — always replace         |
| `RuntimeState`     | `merge: true` — accumulate live data    |
| `ResourceMetadata` | `merge: true` — preserve local UI state |

---

## Default Options

**Source:** `core/src/apollo/apollo-client.ts:263`

```ts
defaultOptions: {
  watchQuery: {
    fetchPolicy: 'cache-and-network',  // immediate cache + background refresh
    nextFetchPolicy: 'cache-first',    // subsequent renders use cache
    errorPolicy: 'all',                // return partial data on error
  },
  query: {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  },
  mutate: {
    errorPolicy: 'all',                // partial data on mutation error
  },
},
connectToDevTools: import.meta.env.DEV,
```

The `cache-and-network` + `cache-first` combination means:

- The first render gets data immediately from cache (no loading flash for previously visited views).
- The network request refreshes data in the background.
- Subsequent renders on the same query use cache without another network round-trip.

**Exported symbols from apollo-client.ts:**

```ts
export const apolloClient: ApolloClient<NormalizedCacheObject>;
export { cache as apolloCache };
```

`apolloCache` is exported so it can be used directly for cache persistence initialization and
imperative cache writes.

---

## Cache Persistence

**Source:** `core/src/apollo/apollo-cache-persist.ts`

```ts
export interface CachePersistConfig {
  maxSize?: number; // bytes, default: 5MB
  debounce?: number; // ms before writing to storage, default: 1000ms
  key?: string; // storage key prefix, default: 'nasnet-apollo-cache'
  debug?: boolean; // default: import.meta.env.DEV
}

export async function initializeCachePersistence(
  cache: InMemoryCache,
  config?: CachePersistConfig
): Promise<void>;

export async function clearPersistedCache(key?: string): Promise<void>;

export async function getPersistedCacheSize(key?: string): Promise<number>;
```

Cache persistence uses `apollo3-cache-persist` with `localforage` as the storage backend.
`localforage` prefers IndexedDB and falls back to localStorage automatically.

**Storage configuration:**

- Driver preference: `[INDEXEDDB, LOCALSTORAGE]`
- Database name: `nasnet-apollo-cache`
- Store name: `apollo_cache`

The `LocalForageWrapper` class (internal) adapts the localforage API to the interface expected by
`apollo3-cache-persist`.

**Initialization flow in `ApolloProvider`:**

```
ApolloProvider mounts
      |
      v
initializeCachePersistence(apolloCache, { maxSize: 5MB, debounce: 1000ms })
      |
      v (async)
Cache restored from IndexedDB
      |
      v
setIsCacheRestored(true)  →  render children
```

Children are not rendered until the cache is hydrated. This ensures that any query executed
immediately on mount sees offline data before the first network response arrives.

**Clearing the cache on logout:**

```ts
import { clearPersistedCache, apolloClient } from '@nasnet/api-client/core';

async function logout() {
  await clearPersistedCache(); // wipes IndexedDB entries
  apolloClient.clearStore(); // wipes in-memory cache
}
```

See `./offline-first.md` for the complete offline-first architecture.

---

## Offline Detection

**Source:** `core/src/apollo/offline-detector.ts`

```ts
export interface OfflineDetectorConfig {
  healthEndpoint?: string; // default: '/api/health'
  healthCheckInterval?: number; // ms, default: 30000 (30s)
  healthCheckTimeout?: number; // ms, default: 5000 (5s)
}

export function setupOfflineDetector(config?: OfflineDetectorConfig): () => void;
export function useOfflineDetector(config?: OfflineDetectorConfig): void;
export function isOffline(): boolean;
export function isDegraded(): boolean;
```

The detector aggregates signals from four sources into `useNetworkStore`:

| Signal source                                 | Store updates                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `window` `online` event                       | `setOnline(true)`, triggers health check                                           |
| `window` `offline` event                      | `setOnline(false)`, `setRouterReachable(false)`                                    |
| `network:error` custom event (from errorLink) | `setRouterReachable(false)`, `incrementReconnectAttempts()`                        |
| `ws:connected` custom event (from wsClient)   | `setRouterConnected(true)`, `setRouterReachable(true)`, `resetReconnectAttempts()` |
| `ws:closed` / `ws:error` custom events        | `setRouterConnected(false)`, `incrementReconnectAttempts()`                        |
| Periodic `GET /api/health`                    | `setRouterReachable(true/false)` based on response                                 |

**State semantics:**

- `isOffline()` returns `true` when `!isOnline || !isRouterReachable`.
- `isDegraded()` returns `true` when the browser is online but either the router is unreachable or
  the WebSocket connection is down. Degraded mode shows stale data with a "reconnecting" indicator.

**Usage in components:**

```tsx
// React hook (preferred — auto-cleanup on unmount)
function App() {
  useOfflineDetector({ healthCheckInterval: 15000 });
  return <Router />;
}

// Imperative setup (outside React)
const cleanup = setupOfflineDetector();
// later:
cleanup();
```

---

## Offline Mutation Queue

**Source:** `core/src/apollo/offline-queue.ts`

```ts
export interface QueuedMutation {
  id: string;
  mutation: DocumentNode;
  variables: Record<string, unknown>;
  timestamp: Date;
  retryCount: number;
  operationName: string;
  optimisticResponse?: unknown;
}

export interface OfflineQueueConfig {
  maxQueueSize?: number; // default: 50
  maxRetries?: number; // default: 3
  retryDelay?: number; // ms, default: 1000
  storageKey?: string; // default: 'nasnet-offline-queue'
}

export class OfflineMutationQueue {
  constructor(config?: OfflineQueueConfig);
  async enqueue(mutation, variables, optimisticResponse?): Promise<string>;
  async remove(id: string): Promise<void>;
  async replayAll(client: ApolloClient<NormalizedCacheObject>): Promise<number>;
  async clear(): Promise<void>;
  size(): number;
  isEmpty(): boolean;
  getQueue(): ReadonlyArray<QueuedMutation>;
}

export const offlineQueue: OfflineMutationQueue; // singleton instance

export function setupAutoReplay(client: ApolloClient<NormalizedCacheObject>): () => void;
```

**How it works:**

1. When the app detects it is offline and a mutation needs to be executed, the mutation is enqueued
   instead of fired.
2. The queue is persisted to IndexedDB (via localforage) so it survives page reloads.
3. On reconnection, `setupAutoReplay` listens for `isRouterReachable` becoming `true` in
   `useNetworkStore` and calls `offlineQueue.replayAll(apolloClient)`.
4. Mutations are replayed in FIFO order (oldest first).
5. **Last-write-wins deduplication:** if the same `operationName` + `variables` is enqueued twice,
   the first entry is removed and the new one appended.

**Usage pattern:**

```ts
import { isOffline, offlineQueue, apolloClient, setupAutoReplay } from '@nasnet/api-client/core';

// Enqueue when offline
if (isOffline()) {
  await offlineQueue.enqueue(UPDATE_ROUTER_NAME, { id, name });
} else {
  await apolloClient.mutate({ mutation: UPDATE_ROUTER_NAME, variables: { id, name } });
}

// Setup auto-replay (call once at app initialization)
const cleanup = setupAutoReplay(apolloClient);
```

See `./offline-first.md` for integration with the full offline-first strategy.

---

## React Providers

### ApolloProvider (Production)

**Source:** `core/src/apollo/apollo-provider.tsx`

```ts
interface ApolloProviderProps {
  children: ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps): JSX.Element | null;
```

The production provider wraps children in the Apollo context and handles:

1. **Cache hydration** — calls
   `initializeCachePersistence(apolloCache, { maxSize: 5MB, debounce: 1000ms })` on mount and defers
   render until cache is restored.
2. **Apollo context** — wraps children in `<BaseApolloProvider client={apolloClient}>`.
3. **DevTools** — lazily loads `@apollo/client/dev`'s `ApolloDevTools` in development only (zero
   production bundle impact).

**Provider tree position** (from project architecture):

```
ErrorBoundary
  └── ApolloProvider          ← this component
        └── QueryClientProvider
              └── I18nextProvider
                    └── ThemeProvider
                          └── ToastProvider
                                └── App
```

**Import:**

```tsx
import { ApolloProvider } from '@nasnet/api-client/core';
```

### MockApolloProvider (Test / Storybook)

**Source:** `core/src/apollo/apollo-mock-provider.tsx`

```ts
interface MockApolloProviderProps {
  children: ReactNode;
}

export function MockApolloProvider({ children }: MockApolloProviderProps): JSX.Element;
```

A lightweight Apollo context for Storybook stories and unit tests. Uses a `noOpLink` that never
resolves, keeping all queries in `loading` state. No cache persistence, no WebSocket, no HTTP.

```tsx
// In Storybook decorators or test render helpers
import { MockApolloProvider } from '@nasnet/api-client/core';

export const decorators = [
  (Story) => (
    <MockApolloProvider>
      <Story />
    </MockApolloProvider>
  ),
];
```

When you need specific mock data (rather than loading states), use `MockedProvider` from
`@apollo/client/testing` directly.

See `./testing-and-codegen.md` for full testing strategies.

---

## Enhanced Hooks

These hooks are in `core/src/hooks/` and re-exported from `@nasnet/api-client/core`.

### useQueryWithLoading

**Source:** `core/src/hooks/useQueryWithLoading.ts`

Wraps `useQuery` with differentiated loading state:

```ts
export interface QueryWithLoadingState<TData> {
  isInitialLoading: boolean; // loading AND no data exists
  isRevalidating: boolean; // loading AND data already exists
  isStale: boolean; // explicit refetch in progress
  isLoading: boolean; // any loading
  lastUpdated: Date | null;
}

export function useQueryWithLoading<TData, TVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): UseQueryWithLoadingResult<TData, TVariables>;
```

**Usage:**

```tsx
function ResourceList() {
  const { data, isInitialLoading, isRevalidating } = useQueryWithLoading(GET_RESOURCES);

  if (isInitialLoading) {
    return <ResourceListSkeleton />; // first load: show skeleton
  }

  return (
    <>
      {isRevalidating && <RefreshSpinner />} // background refresh indicator
      <ResourceTable data={data?.resources} />
    </>
  );
}
```

### useMutationWithLoading

**Source:** `core/src/hooks/useMutationWithLoading.ts`

Wraps `useMutation` with `isLoading`, `isSuccess`, `isError` states and a simplified `mutate`
function:

```ts
export function useMutationWithLoading<TData, TVariables>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables>
): UseMutationWithLoadingResult<TData, TVariables>;

// Helper for optimistic mutations
export function createOptimisticOptions<TData, TVariables>(config: {
  optimisticResponse: OptimisticResponse<TData>;
  cacheUpdate?: (cache, data: TData) => void;
}): Partial<MutationHookOptions<TData, TVariables>>;
```

**Usage:**

```tsx
function SaveButton() {
  const { mutate, isLoading, isSuccess, error } = useMutationWithLoading(SAVE_CONFIG, {
    onCompleted: () => toast.success('Saved!'),
  });

  return (
    <Button
      onClick={() => mutate({ config })}
      disabled={isLoading}
    >
      {isLoading ? 'Saving...' : 'Save'}
    </Button>
  );
}
```

### useGraphQLError

**Source:** `core/src/hooks/useGraphQLError.ts`

```ts
export function useGraphQLError(
  apolloError: ApolloError | Error | undefined,
  options?: UseGraphQLErrorOptions
): UseGraphQLErrorReturn;
```

Converts raw Apollo errors into user-friendly `ProcessedError` objects with severity, recoverability
classification, and suggested actions. Optionally auto-shows toast notifications.

See `./error-handling.md` for full details.

---

## Exports Reference

All symbols are re-exported from `@nasnet/api-client/core`.

**From `core/src/apollo/index.ts`:**

| Export                       | Type                                  | Description                                         |
| ---------------------------- | ------------------------------------- | --------------------------------------------------- |
| `apolloClient`               | `ApolloClient<NormalizedCacheObject>` | Singleton Apollo Client instance                    |
| `apolloCache`                | `InMemoryCache`                       | Singleton cache (for persistence and direct writes) |
| `authLink`                   | `ApolloLink`                          | Auth context link (JWT + Basic auth)                |
| `errorLink`                  | `ApolloLink`                          | Centralized error handling link                     |
| `retryLink`                  | `RetryLink`                           | Exponential backoff retry link                      |
| `wsClient`                   | `Client` (graphql-ws)                 | WebSocket client for subscriptions                  |
| `ApolloProvider`             | React component                       | Production provider with cache persistence          |
| `MockApolloProvider`         | React component                       | Stub provider for tests/Storybook                   |
| `initializeCachePersistence` | async function                        | Initialize IndexedDB cache persistence              |
| `clearPersistedCache`        | async function                        | Clear persisted cache (e.g., on logout)             |
| `getPersistedCacheSize`      | async function                        | Get cache size in bytes                             |
| `setupOfflineDetector`       | function                              | Imperative offline detection setup                  |
| `useOfflineDetector`         | React hook                            | React offline detection hook (auto-cleanup)         |
| `isOffline`                  | function                              | Check if currently offline                          |
| `isDegraded`                 | function                              | Check if in degraded connectivity mode              |
| `OfflineMutationQueue`       | class                                 | Queue for mutations when offline                    |
| `offlineQueue`               | `OfflineMutationQueue`                | Singleton offline queue                             |
| `setupAutoReplay`            | function                              | Auto-replay queue on reconnection                   |

**Type exports:** `CachePersistConfig`, `OfflineDetectorConfig`, `QueuedMutation`,
`OfflineQueueConfig`, `WsClientOptions`

---

## Cache Type Policies Reference

**Source:** `core/src/apollo/apollo-client.ts:82–240`

### Query Field Policies

The `Query` root type defines key arguments for connection queries to ensure that different filter
combinations produce separate cache entries:

| Field       | `keyArgs`                                   | Merge Strategy          | Purpose                                           |
| ----------- | ------------------------------------------- | ----------------------- | ------------------------------------------------- |
| `routers`   | `['filter']`                                | Replace (incoming wins) | Cache routers list with optional filter parameter |
| `resources` | `['routerId', 'category', 'type', 'state']` | Replace (incoming wins) | Cache resources with multi-dimensional filtering  |

Without these `keyArgs`, a second query with different filter values would overwrite the first
cached result in the same field, making pagination and filtered views impossible.

### Router Type Policy

```ts
// apollo-client.ts:104–113
Router: {
  keyFields: ['id'],
  fields: {
    status: {
      merge: true,
    },
  },
}
```

| Setting        | Value    | Rationale                                                                                      |
| -------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `keyFields`    | `['id']` | Normalize by router ID — each router is a distinct cache entry                                 |
| `status.merge` | `true`   | Runtime status updates merge into the existing router object rather than replacing it entirely |

### Universal State v2 Resource Type Policies

**Complete table** of all resource type policies (apollo-client.ts:115–239):

| Type                     | `keyFields` | `runtime` merge | `telemetry` merge | `validation` merge | `deployment` merge | Notes                                                |
| ------------------------ | ----------- | --------------- | ----------------- | ------------------ | ------------------ | ---------------------------------------------------- |
| **Resource** (base)      | `uuid`      | Yes             | Yes (cap 288)     | No                 | No                 | Base resource policy inherited by all resource types |
| **WireGuardClient**      | `uuid`      | Yes             | —                 | —                  | —                  | VPN client runtime metrics                           |
| **LANNetwork**           | `uuid`      | Yes             | —                 | —                  | —                  | LAN interface runtime metrics                        |
| **WANLink**              | `uuid`      | Yes             | —                 | —                  | —                  | WAN link runtime metrics                             |
| **FeatureResource**      | `uuid`      | Yes             | —                 | —                  | —                  | Marketplace feature runtime state                    |
| **FirewallRuleResource** | `uuid`      | —               | —                 | —                  | —                  | Stateless firewall config                            |
| **DHCPServerResource**   | `uuid`      | —               | —                 | —                  | —                  | Stateless DHCP config                                |
| **BridgeResource**       | `uuid`      | —               | —                 | —                  | —                  | Stateless bridge config                              |
| **RouteResource**        | `uuid`      | —               | —                 | —                  | —                  | Stateless route config                               |
| **ValidationResult**     | —           | —               | —                 | No (replace)       | —                  | Full replacement on validation cycle                 |
| **DeploymentState**      | —           | —               | —                 | —                  | No (replace)       | Full replacement on deployment                       |
| **RuntimeState**         | —           | Yes             | —                 | —                  | —                  | Merge for real-time accumulation                     |
| **ResourceMetadata**     | —           | Yes             | —                 | —                  | —                  | Merge to preserve local UI state                     |

### Merge Strategy Details

#### Resource.runtime (merge: true)

```ts
// apollo-client.ts:129–134
runtime: {
  merge(existing, incoming) {
    return { ...existing, ...incoming };
  },
}
```

**Purpose:** Preserve live runtime metrics across updates. When a resource's status, CPU usage, or
bandwidth updates, the new fields merge in rather than wiping out the entire runtime layer. This
prevents loss of time-series data during incremental updates.

#### Resource.telemetry (custom merge)

```ts
// apollo-client.ts:136–154
telemetry: {
  merge(existing, incoming) {
    if (!existing) return incoming;
    if (!incoming) return existing;
    return {
      ...existing,
      ...incoming,
      // Append bandwidth history (last 24h)
      bandwidthHistory: [
        ...(existing.bandwidthHistory ?? []),
        ...(incoming.bandwidthHistory ?? []),
      ].slice(-288), // 288 × 5min intervals = 24 hours
      hourlyStats: incoming.hourlyStats ?? existing.hourlyStats,
      dailyStats: incoming.dailyStats ?? existing.dailyStats,
    };
  },
}
```

**Purpose:** Append historical bandwidth samples while capping to 24 hours (288 entries at 5-minute
sampling). Keep the latest hourly/daily aggregate stats from the most recent update.

#### Validation and Deployment (merge: false)

```ts
// apollo-client.ts:155–162
validation: {
  merge: false,  // Full replacement on validation run
},
deployment: {
  merge: false,  // Full replacement on apply
},
```

**Rationale:** Validation and deployment states are snapshots of a specific cycle — a new validation
should completely replace the previous one, not merge incrementally.

### Default Query Options

**Source:** `core/src/apollo/apollo-client.ts:263–285`

```ts
defaultOptions: {
  watchQuery: {
    fetchPolicy: 'cache-and-network',  // Return cached → refetch in background
    nextFetchPolicy: 'cache-first',    // Subsequent renders: cache only
    errorPolicy: 'all',                // Return partial data on error
  },
  query: {
    fetchPolicy: 'cache-first',        // Use cache, avoid network if present
    errorPolicy: 'all',
  },
  mutate: {
    errorPolicy: 'all',                // Partial data on mutation error
  },
},
```

| Setting                      | Value               | When Used                                 | Effect                                                                  |
| ---------------------------- | ------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `watchQuery.fetchPolicy`     | `cache-and-network` | First hook render or manual `refetch()`   | Return cached data immediately, then refresh from network in background |
| `watchQuery.nextFetchPolicy` | `cache-first`       | Subsequent renders of same query          | Skip network request if cache exists                                    |
| `query.fetchPolicy`          | `cache-first`       | `useQuery(..., { fetchPolicy: 'query' })` | Use cache if available, otherwise fetch                                 |
| `mutate.errorPolicy`         | `all`               | All mutations                             | Return any successfully resolved fields even if some errored            |

**Benefit:** The `cache-and-network` + `cache-first` pattern eliminates loading spinners for
previously visited views (data from cache) while keeping data fresh (background network refresh).
Subsequent renders of the same query avoid redundant network round-trips.

---

## Cross-References

| Topic                                         | Document                              |
| --------------------------------------------- | ------------------------------------- |
| Authentication tokens, login flows            | `./authentication.md`                 |
| Error handling architecture, error boundaries | `./error-handling.md`                 |
| Offline-first patterns, cache strategies      | `./offline-first.md`                  |
| WebSocket subscription usage patterns         | `./websocket-subscriptions.md`        |
| Universal State v2 resource model             | `./universal-state-resource-model.md` |
| Change set pattern (Apply-Confirm-Merge)      | `./change-set-pattern.md`             |
| Domain query hooks (per-feature wrappers)     | `./domain-query-hooks.md`             |
| Testing Apollo with mocks and Storybook       | `./testing-and-codegen.md`            |
