# WebSocket Subscriptions

This document covers the real-time subscription layer of `@nasnet/api-client`: how the WebSocket client is created and configured, how split-link routing directs subscription operations to the WebSocket transport while keeping queries and mutations on HTTP, how authentication is provided per-connection, how the retry/reconnect strategy works, and how connection lifecycle events flow into the Zustand stores and the offline detector.

Related docs: [./apollo-client.md](./apollo-client.md) (link chain), [./authentication.md](./authentication.md) (auth tokens), [./offline-first.md](./offline-first.md) (offline integration).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Split Link Routing](#2-split-link-routing)
3. [WsClientOptions — Configuration Reference](#3-wsclientoptions--configuration-reference)
4. [Auto wss / ws Protocol Detection](#4-auto-wss--ws-protocol-detection)
5. [connectionParams — Per-Connection Authentication](#5-connectionparams--per-connection-authentication)
6. [Retry Strategy — Exponential Backoff with Jitter](#6-retry-strategy--exponential-backoff-with-jitter)
7. [Connection Lifecycle Events](#7-connection-lifecycle-events)
8. [Zustand Store Updates](#8-zustand-store-updates)
9. [Integration with the Offline Detector](#9-integration-with-the-offline-detector)
10. [Subscription Usage Pattern in Domain Hooks](#10-subscription-usage-pattern-in-domain-hooks)
11. [Exported API Reference](#11-exported-api-reference)

---

## 1. Architecture Overview

```
Browser
  |
  |-- Query / Mutation ──────────────────────────────────────┐
  |                                                          v
  |-- Subscription ──────────┐                    authLink → httpLink
                             v                         ↓
                       GraphQLWsLink               /graphql (HTTP)
                             ↓
                        wsClient (graphql-ws)
                             ↓
                       /graphql (WebSocket)
                             ↓
                          Go backend

Connection events (ws:connecting, ws:connected, ws:closed, ws:error)
      ↓
  CustomEvents on window
      ↓
  OfflineDetector ──→ useNetworkStore (Zustand)
  WsClient handlers ─→ useConnectionStore (Zustand)
```

The WebSocket client is implemented in `libs/api-client/core/src/apollo/apollo-ws-client.ts` using the `graphql-ws` library. Apollo Client's `split` function in `libs/api-client/core/src/apollo/apollo-client.ts` routes subscriptions to the WebSocket link and everything else to the HTTP link.

---

## 2. Split Link Routing

Source: `libs/api-client/core/src/apollo/apollo-client.ts:50`

```ts
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,              // subscription → WebSocket
  authLink.concat(httpLink)  // query / mutation → HTTP with auth headers
);
```

The complete link chain is:

```
Request → errorLink → retryLink → splitLink → (authLink → httpLink) OR (wsLink)
                                                              ↑
                                              subscriptions bypass errorLink/retryLink
                                              because wsClient has its own retry
```

The `retryLink` at the HTTP level (initial delay 300 ms, max 3 s, max 3 attempts, no retry on 4xx) is separate from the WebSocket reconnect logic. Subscriptions are retried exclusively by `graphql-ws`.

---

## 3. WsClientOptions — Configuration Reference

Source: `libs/api-client/core/src/apollo/apollo-ws-client.ts:26`

```ts
export interface WsClientOptions {
  /**
   * WebSocket URL (default: auto-detected from current location)
   */
  url?: string;

  /**
   * Maximum retry attempts (default: 10)
   */
  maxRetries?: number;

  /**
   * Whether to show notifications for status changes (default: true)
   */
  showNotifications?: boolean;
}
```

The module-level `wsClient` is created with all defaults:

```ts
export const wsClient: Client = createWsClient();
// url:               auto-detected (see section 4)
// maxRetries:        10
// showNotifications: true
```

To create a second client for a different backend or with notifications silenced:

```ts
import { createWsClient } from '@nasnet/api-client/core/apollo';

const customClient = createWsClient({
  url: 'wss://my-other-backend/graphql',
  maxRetries: 3,
  showNotifications: false,
});
```

---

## 4. Auto wss / ws Protocol Detection

Source: `libs/api-client/core/src/apollo/apollo-ws-client.ts:51`

```ts
function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:8080/graphql'; // SSR fallback
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/graphql`;
}
```

The logic is deliberately simple:

| Page protocol | WS protocol | Endpoint example |
|---|---|---|
| `https:` | `wss:` | `wss://router.local/graphql` |
| `http:` | `ws:` | `ws://192.168.88.1/graphql` |
| SSR / no window | `ws:` | `ws://localhost:8080/graphql` |

In production the NasNetConnect frontend is served from the router itself (`http://` for local network access) so `ws:` is typical. When TLS is terminated upstream (e.g., a reverse proxy), `wss:` kicks in automatically because `window.location.protocol` will be `https:`.

---

## 5. connectionParams — Per-Connection Authentication

Source: `libs/api-client/core/src/apollo/apollo-ws-client.ts:149`

`connectionParams` is evaluated as a **function** (not a static object), so it is called fresh on every connection attempt including reconnects. This ensures that a refreshed JWT token is always used after the previous token expires.

```ts
connectionParams: () => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorization(currentRouterId);

  return {
    routerId: currentRouterId,
    authorization,
  };
},
```

`getAuthorization` follows the same two-step priority as the HTTP auth link (see [./authentication.md](./authentication.md)):

```ts
function getAuthorization(routerId: string | null): string | undefined {
  // 1. JWT Bearer token from auth store
  const jwtToken = getAuthToken();
  if (jwtToken) return `Bearer ${jwtToken}`;

  // 2. Basic auth from sessionStorage per-router credentials
  const credentials = getStoredCredentials(routerId);
  if (credentials) {
    return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  return undefined;
}
```

The backend receives `routerId` and `authorization` in the `connection_init` message of the `graphql-ws` protocol. When the socket reconnects after a token refresh, the new token is automatically provided.

---

## 6. Retry Strategy — Exponential Backoff with Jitter

Source: `libs/api-client/core/src/apollo/apollo-ws-client.ts:160`

### retryAttempts

```ts
retryAttempts: maxRetries,  // default: 10
```

### retryWait

```ts
retryWait: async (retries) => {
  const delay = calculateBackoff(retries);
  await new Promise((resolve) => setTimeout(resolve, delay));
},
```

`calculateBackoff` is imported from `@nasnet/state/stores`. It implements exponential backoff with jitter. The approximate delay schedule is:

| Attempt | Base | With jitter (approx) |
|---|---|---|
| 1 | 1 000 ms | 800 – 1 200 ms |
| 2 | 2 000 ms | 1 600 – 2 400 ms |
| 3 | 4 000 ms | 3 200 – 4 800 ms |
| 4 | 8 000 ms | 6 400 – 9 600 ms |
| 5+ | 16 000 ms | capped at ~30 000 ms |

### shouldRetry — Fatal Codes

```ts
shouldRetry: (errOrCloseEvent) => {
  // Do not retry on authentication failures
  if (errOrCloseEvent instanceof CloseEvent) {
    if (errOrCloseEvent.code === 4401 || errOrCloseEvent.code === 4403) {
      return false;  // 4401 = auth failed, 4403 = forbidden
    }
  }

  // Stop retrying once max attempts exceeded
  const { hasExceededMaxAttempts } = useConnectionStore.getState();
  if (hasExceededMaxAttempts()) {
    return false;
  }

  return true;
},
```

Fatal close codes that abort retrying immediately:

| Code | Meaning | Action |
|---|---|---|
| `4401` | Authentication failed | Stop — credentials are wrong |
| `4403` | Forbidden | Stop — access denied |

When `hasExceededMaxAttempts()` returns `true` (after 10 failures), a toast notification is shown with a "Retry" prompt, and no further automatic reconnects are attempted.

---

## 7. Connection Lifecycle Events

Source: `libs/api-client/core/src/apollo/apollo-ws-client.ts:188`

The `graphql-ws` `on` handlers bridge the library's internal lifecycle into the application layer through two mechanisms: Zustand store mutations and `window.CustomEvent` dispatches.

### connecting

```ts
on: {
  connecting: () => {
    store.setWsStatus('connecting');
    window.dispatchEvent(new CustomEvent('ws:connecting'));
  },
```

### connected

```ts
  connected: () => {
    store.setWsStatus('connected');
    store.resetReconnection();

    if (activeRouterId) {
      store.setRouterConnection(activeRouterId, {
        status: 'connected',
        lastConnected: new Date(),
        lastError: null,
      });
    }

    // Show success toast only if we were reconnecting
    if (store.reconnectAttempts > 0) {
      showToast('success', 'Connection restored', 'WebSocket connection re-established.');
    }

    window.dispatchEvent(new CustomEvent('ws:connected'));
  },
```

### closed

```ts
  closed: (event) => {
    if (event.wasClean) {
      store.setWsStatus('disconnected');
    } else {
      store.setWsStatus('error', reason);
      store.incrementReconnectAttempts();

      if (store.hasExceededMaxAttempts()) {
        showToast('error', 'Connection failed', 'Unable to reconnect...');
      }
    }

    window.dispatchEvent(new CustomEvent('ws:closed', {
      detail: { code, reason, wasClean },
    }));
  },
```

### error

```ts
  error: (error) => {
    store.setWsStatus('error', errorMessage);

    window.dispatchEvent(new CustomEvent('ws:error', {
      detail: { error },
    }));
  },
```

### Event Summary

| `CustomEvent` name | Dispatched when | `detail` payload |
|---|---|---|
| `ws:connecting` | Connection attempt starts | none |
| `ws:connected` | Socket opened | none |
| `ws:closed` | Socket closed | `{ code, reason, wasClean }` |
| `ws:error` | Protocol/network error | `{ error }` |

---

## 8. Zustand Store Updates

The `ws:*` lifecycle handlers write directly to `useConnectionStore`:

| Method called | When |
|---|---|
| `setWsStatus('connecting')` | Socket dialing |
| `setWsStatus('connected')` | Handshake complete |
| `resetReconnection()` | After a successful reconnect |
| `setWsStatus('error', msg)` | Error or unexpected close |
| `incrementReconnectAttempts()` | After each failed close |
| `setRouterConnection(id, {...})` | Connected / error with router details |

Components can reactively observe these:

```tsx
import { useConnectionStore } from '@nasnet/state/stores';

function ConnectionBadge() {
  const wsStatus = useConnectionStore((s) => s.wsStatus);
  const attempts = useConnectionStore((s) => s.reconnectAttempts);

  return (
    <span>
      {wsStatus} {attempts > 0 && `(retry ${attempts})`}
    </span>
  );
}
```

---

## 9. Integration with the Offline Detector

Source: `libs/api-client/core/src/apollo/offline-detector.ts`

The offline detector subscribes to the same `ws:*` `CustomEvent`s emitted by the WebSocket client:

```ts
// inside setupOfflineDetector()

const handleWsConnected = () => {
  store().setRouterConnected(true);
  store().setRouterReachable(true);
  store().resetReconnectAttempts();
};

const handleWsClosed = () => {
  store().setRouterConnected(false);
  store().incrementReconnectAttempts();
};

const handleWsError = () => {
  store().setRouterConnected(false);
  store().incrementReconnectAttempts();
};

window.addEventListener('ws:connected', handleWsConnected);
window.addEventListener('ws:closed', handleWsClosed);
window.addEventListener('ws:error', handleWsError);
```

Additionally, `setupOfflineDetector` listens for:

- `online` / `offline` browser events → `setOnline(true/false)` on `useNetworkStore`
- `network:error` (dispatched by the Apollo error link on HTTP failures) → `setRouterReachable(false)`
- Periodic health-check `GET /api/health` every 30 s (configurable)

### OfflineDetectorConfig

```ts
export interface OfflineDetectorConfig {
  healthEndpoint?: string;        // default: '/api/health'
  healthCheckInterval?: number;   // default: 30000 ms
  healthCheckTimeout?: number;    // default: 5000 ms
}
```

### Usage in a React App

```tsx
// Option A: imperative (e.g., in a top-level effect)
useEffect(() => {
  const cleanup = setupOfflineDetector();
  return cleanup;
}, []);

// Option B: declarative hook
function App() {
  useOfflineDetector(); // automatic cleanup on unmount
  return <Router />;
}
```

### Utility Functions

| Function | Returns | Reads from |
|---|---|---|
| `isOffline()` | `boolean` | `useNetworkStore` — `!isOnline \|\| !isRouterReachable` |
| `isDegraded()` | `boolean` | `useNetworkStore` — online but router/ws unreachable |

---

## 10. Subscription Usage Pattern in Domain Hooks

Domain hooks use `useSubscription` from `@apollo/client` directly. The WebSocket connection is established automatically when any subscription is mounted (Apollo Client holds the `wsClient` reference via `GraphQLWsLink`).

### Basic Pattern

```tsx
import { useSubscription, gql } from '@apollo/client';

const SUBSCRIBE_FOO = gql`
  subscription FooChanged($routerId: ID!) {
    fooChanged(routerId: $routerId) {
      id
      status
    }
  }
`;

export function useFooChanged(routerId: string, enabled = true) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_FOO, {
    variables: { routerId },
    skip: !enabled || !routerId,
    onData: ({ data }) => {
      // Side-effects: cache updates are handled automatically
      // by Apollo's normalized cache when __typename + id are present
    },
  });

  return {
    event: data?.fooChanged,
    loading,
    error,
  };
}
```

### Real Examples from the Codebase

**Install progress** (`queries/src/services/useInstanceSubscriptions.ts:55`):

```tsx
export function useInstallProgress(routerId: string, enabled = true) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_INSTALL_PROGRESS, {
    variables: { routerID: routerId },
    skip: !enabled || !routerId,
    onData: ({ data }) => {
      const progress = data.data?.installProgress;
      if (progress?.status === 'completed') {
        console.log(`Installation complete for ${progress.featureID}`);
      }
    },
  });

  return {
    progress: data?.installProgress as InstallProgress | undefined,
    loading,
    error,
  };
}
```

**Resource runtime** (`queries/src/resources/useResourceSubscription.ts:208`):

```tsx
export function useResourceRuntimeSubscription(
  uuid: string | undefined,
  options: UseResourceRuntimeSubscriptionOptions = {}
): SubscriptionResult<RuntimeUpdateEvent> {
  const { skip = false, onUpdate, throttleMs = 0 } = options;

  const { data, loading, error } = useSubscription(RESOURCE_RUNTIME_SUBSCRIPTION, {
    variables: { uuid },
    skip: skip || !uuid,
    onData: ({ data: eventData }) => {
      // throttle and invoke onUpdate callback
    },
  });

  return { data: eventData, loading, error, isConnected: !skip && !!uuid && !error };
}
```

### Combining Multiple Subscriptions

```tsx
// queries/src/services/useInstanceSubscriptions.ts:163
export function useInstanceMonitoring(routerId: string, enabled = true) {
  const { progress, loading: il, error: ie } = useInstallProgress(routerId, enabled);
  const { statusChange, loading: sl, error: se } = useInstanceStatusChanged(routerId, enabled);

  return {
    installProgress: progress,
    statusChange,
    loading: il || sl,
    error: ie || se,
  };
}
```

---

## 11. Exported API Reference

### From `libs/api-client/core/src/apollo/apollo-ws-client.ts`

| Export | Kind | Description |
|---|---|---|
| `WsClientOptions` | interface | Configuration shape for `createWsClient` |
| `createWsClient(options?)` | function | Factory — creates a new `graphql-ws` `Client` |
| `wsClient` | `Client` | Default singleton used by `apolloClient` |

### From `libs/api-client/core/src/apollo/offline-detector.ts`

| Export | Kind | Description |
|---|---|---|
| `OfflineDetectorConfig` | interface | Configuration for the offline detector |
| `setupOfflineDetector(config?)` | function | Imperative setup, returns cleanup function |
| `useOfflineDetector(config?)` | hook | React hook version with auto-cleanup |
| `isOffline()` | function | `true` if browser offline or backend unreachable |
| `isDegraded()` | function | `true` if online but WS/backend partially unreachable |
