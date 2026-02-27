---
sidebar_position: 4
title: Authentication
---

# Authentication

NasNetConnect uses two parallel authentication systems that operate independently: an **Apollo auth link** for GraphQL operations and an **Axios interceptor** for REST API calls. Both systems share the same JWT-first, Basic-fallback priority but differ in credential storage scope — the Apollo link uses per-router `sessionStorage` keys while the Axios interceptor uses a global `localStorage` key. Authentication for WebSocket subscriptions is handled separately via `connectionParams` on every connect/reconnect cycle.

---

## Overview

```
GraphQL (Apollo)                    REST (Axios)
──────────────────────              ──────────────────────
useQuery / useMutation              apiClient.get/post/...
        │                                   │
        ▼                                   ▼
  apollo-auth-link                   authInterceptor
  (setContext)                       (request interceptor)
        │                                   │
   JWT Bearer?  ──── yes ───► Bearer <token>
        │ no                                │
   Per-router creds                  Global localStorage
   (sessionStorage)                  (nasnet:api:credentials)
        │                                   │
   Basic <b64>                       Basic <b64>
        │                                   │
        ▼                                   ▼
   X-Router-Id header            Authorization header only
```

---

## Apollo Authentication Link

**Source:** `core/src/apollo/apollo-auth-link.ts`

The Apollo auth link runs as a `setContext` link in the link chain, injecting two headers before every HTTP-transported GraphQL operation (queries and mutations; subscriptions use `connectionParams` instead).

### Exported Symbols

#### `authLink`

```ts
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

The singleton `authLink` instance. This is what `apollo-client.ts` wires into the link chain:

```ts
// From core/src/apollo/apollo-client.ts:59
authLink.concat(httpLink)
```

It reads `currentRouterId` from the Zustand `useConnectionStore` on every request, ensuring multi-router scenarios always attach the correct context header.

#### `createAuthLink(getToken)`

```ts
export function createAuthLink(getToken: () => string | null)
```

Factory variant for tests or embedded use cases where JWT retrieval needs custom logic. Accepts a `getToken` callback and builds an equivalent `setContext` link. The `X-Router-Id` header is still sourced from `useConnectionStore`.

### Header Injection Logic

Two headers are injected:

| Header | Value | Purpose |
|---|---|---|
| `X-Router-Id` | `currentRouterId` or `''` | Backend routes the request to the correct MikroTik connection |
| `Authorization` | `Bearer <jwt>` or `Basic <b64>` | Authenticates the request |

### JWT vs Basic Auth Priority

The function `getAuthorizationHeader(routerId)` implements a deterministic two-step priority:

```ts
// core/src/apollo/apollo-auth-link.ts:54
function getAuthorizationHeader(routerId: string | null): string | undefined {
  // 1. JWT from auth store takes priority
  const jwtToken = getAuthToken();
  if (jwtToken) {
    return `Bearer ${jwtToken}`;
  }

  // 2. Fall back to per-router Basic auth
  const credentials = getStoredCredentials(routerId);
  if (credentials) {
    return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  return undefined;
}
```

**Step 1 — JWT Bearer:** `getAuthToken()` is imported from `@nasnet/state/stores` and reads the current JWT from the `useAuthStore`. If a valid (non-null) token is present, it always wins.

**Step 2 — Basic auth fallback:** If no JWT is present, `getStoredCredentials(routerId)` looks up `sessionStorage` for the key `router-credentials-<routerId>`. This allows the app to manage the MikroTik router directly with username/password credentials when the NasNet JWT auth layer is bypassed or not yet active.

### Per-Router sessionStorage Credentials

Credentials are namespaced to the router:

```ts
// core/src/apollo/apollo-auth-link.ts:22
function getStoredCredentials(routerId: string | null) {
  const stored = sessionStorage.getItem(`router-credentials-${routerId}`);
  // parses JSON, validates { username: string, password: string }
}
```

Key format: `router-credentials-<routerId>` (e.g., `router-credentials-01HXYZ123`).

Using `sessionStorage` (not `localStorage`) gives the following security properties:
- Credentials are cleared automatically when the browser tab is closed.
- Credentials from one router never appear in another router's request — each router ID produces a distinct key.
- If the user switches active routers (`currentRouterId` changes), the auth header automatically updates on the next request without any cache invalidation.

---

## Axios Authentication Interceptor

**Source:** `core/src/interceptors/auth.ts`

The Axios interceptor handles REST requests made through the `apiClient` instance. REST calls are primarily used for health checks, binary downloads, and legacy endpoints not yet migrated to GraphQL.

### Exported Symbols

#### `authInterceptor(config)`

```ts
export function authInterceptor(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const credentials = getStoredCredentials();
  if (credentials?.username && credentials?.password) {
    const encoded = btoa(`${credentials.username}:${credentials.password}`);
    config.headers.Authorization = `Basic ${encoded}`;
  }
  return config;
}
```

A pure request interceptor — it never throws, always returns the config. If no credentials exist it returns `config` unmodified (no `Authorization` header).

#### `storeCredentials(credentials)`

```ts
export function storeCredentials(credentials: StoredCredentials): void
```

Persists `{ username, password }` to `localStorage` under the key `nasnet:api:credentials`. Throws `Error('Failed to store credentials')` if `localStorage` is unavailable (e.g., private browsing with storage blocked).

#### `clearCredentials()`

```ts
export function clearCredentials(): void
```

Removes the key `nasnet:api:credentials` from `localStorage`. Safe to call if the key does not exist.

### Storage Comparison: Apollo vs Axios

| | Apollo auth link | Axios auth interceptor |
|---|---|---|
| Storage | `sessionStorage` | `localStorage` |
| Scope | Per-router (`router-credentials-<id>`) | Global (`nasnet:api:credentials`) |
| Auth type | JWT (primary) + Basic (fallback) | Basic only |
| Cleared on tab close | Yes | No |
| JWT awareness | Yes (via `getAuthToken`) | No |

The Axios interceptor is intentionally simpler — it handles infrastructure-level REST calls that use Basic auth throughout, while the Apollo link handles the full JWT lifecycle for GraphQL operations.

---

## WebSocket Authentication (connectionParams)

**Source:** `core/src/apollo/apollo-ws-client.ts`

GraphQL subscriptions travel over WebSocket, which does not support HTTP headers. Instead, the `graphql-ws` protocol sends authentication as part of the `ConnectionInit` message payload via `connectionParams`.

### connectionParams callback

```ts
// core/src/apollo/apollo-ws-client.ts:149
connectionParams: () => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorization(currentRouterId);

  return {
    routerId: currentRouterId,
    authorization,
  };
},
```

The callback is a **function** (not a static object). `graphql-ws` calls it on every new connection attempt, including reconnects after network disruption. This means fresh credentials are always used — if the JWT was refreshed or credentials were updated while a reconnect was in progress, the new values are used automatically.

### WebSocket JWT vs Basic Priority

The WebSocket `getAuthorization(routerId)` function mirrors the Apollo link logic exactly:

```ts
// core/src/apollo/apollo-ws-client.ts:92
function getAuthorization(routerId: string | null): string | undefined {
  const jwtToken = getAuthToken();
  if (jwtToken) return `Bearer ${jwtToken}`;

  const credentials = getStoredCredentials(routerId);
  if (credentials) return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;

  return undefined;
}
```

The same `sessionStorage` key pattern (`router-credentials-<routerId>`) is used.

### Authentication-Aware Retry

The WebSocket client refuses to retry after receiving close codes that indicate authentication failure:

```ts
// core/src/apollo/apollo-ws-client.ts:169
shouldRetry: (errOrCloseEvent) => {
  if (errOrCloseEvent instanceof CloseEvent) {
    // 4401 = Authentication failed
    // 4403 = Forbidden
    if (errOrCloseEvent.code === 4401 || errOrCloseEvent.code === 4403) {
      return false;
    }
  }
  // ...
},
```

Retrying with the same bad credentials would be pointless. Close code `4401` is a custom application-level code used by the NasNet backend to signal JWT expiry or missing credentials.

---

## Session Expiry Flow

When a session expires, the error link (not the auth link) is responsible for clearing state and notifying the user. The flow is triggered from two directions:

```
GraphQL error UNAUTHENTICATED          HTTP 401 on network error
         │                                      │
         ▼                                      ▼
  apollo-error-link.ts                   apollo-error-link.ts
  checkAuthError(code) → true            statusCode === 401
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
              handleAuthError(message)
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
  useAuthStore     addNotification   window.dispatchEvent
  .clearAuth()     type: 'error'     'auth:expired'
                   title: 'Session   (for router redirect)
                   expired'
```

**Source:** `core/src/apollo/apollo-error-link.ts:37`

```ts
function handleAuthError(message?: string) {
  useAuthStore.getState().clearAuth();
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: 'Session expired',
    message: message || 'Your session has expired. Please log in again.',
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
}
```

The `auth:expired` custom event is the decoupling point — the router (TanStack Router) or any other listener can catch this event and redirect to the login page without the API client layer knowing anything about routing.

---

## Link Chain Position

The auth link sits just before the HTTP link in the chain:

```
Request → errorLink → retryLink → splitLink ─┬─► wsLink (subscriptions)
                                              └─► authLink → httpLink (queries/mutations)
```

**Source:** `core/src/apollo/apollo-client.ts:72`

```ts
const link = from([errorLink, retryLink, splitLink]);
// splitLink wires: authLink.concat(httpLink) for HTTP traffic
```

The auth link is placed after `errorLink` and `retryLink` so that errors and retries are handled at the top level, but before the actual HTTP transport so credentials are always fresh on each attempt (including retried attempts).

---

## See Also

- `./intro.md` — Library overview and structure
- `./apollo-client.md` — Full link chain assembly and cache configuration
- `./axios-http-client.md` — Axios client creation and interceptor registration order
- `./error-handling.md` — How auth errors are caught and routed
- `./websocket-subscriptions.md` — WebSocket reconnection and subscription lifecycle
