# REST Client

The frontend includes two distinct REST mechanisms. This document describes both.

## 1. Router Proxy (Primary REST Path)

File: `libs/api-client/core/src/router-proxy.ts`

The router proxy sends RouterOS REST API calls to the Go backend which forwards them to the device.
It exists because the browser cannot contact the router directly due to CORS and authentication
constraints.

### Architecture

```
Frontend
  → fetch POST /api/router/proxy
  → Go backend
  → RouterOS REST API (http://<router>/rest/<endpoint>)
  → Response converted to camelCase and returned
```

### Core Function

```typescript
import { makeRouterOSRequest } from '@nasnet/api-client/core';

// GET example
const result = await makeRouterOSRequest<SystemResource>('192.168.88.1', 'system/resource');

if (result.success) {
  console.log(result.data); // camelCase-converted data
} else {
  console.error(result.error);
}

// POST with body
const result = await makeRouterOSRequest<void>('192.168.88.1', 'interface/set', {
  method: 'POST',
  body: { '.id': '*1', disabled: 'false' },
});
```

### Retry Behaviour

The proxy retries up to 3 times with a 1-second delay between attempts. AbortController is used for
request timeouts (default: 30 seconds).

### Authentication

Credentials are read from `localStorage` at `nasnet:api:credentials`. They are Base64-encoded into a
`Basic` header and sent in the proxy request body so the backend can authenticate with the router.

### Response Normalisation

RouterOS returns keys in `kebab-case` (e.g., `mac-address`, `default-name`). The proxy automatically
converts these to `camelCase` (`macAddress`, `defaultName`) using a recursive converter.

### TanStack Query Integration

Two factory functions wrap the proxy for use with TanStack Query:

```typescript
import { createProxyQueryFn, createProxyMutationFn } from '@nasnet/api-client/core';

// Query
const { data } = useQuery({
  queryKey: ['interfaces', routerIp],
  queryFn: createProxyQueryFn<Interface[]>(routerIp, 'interface'),
});

// Mutation
const { mutate } = useMutation({
  mutationFn: createProxyMutationFn<void, InterfaceUpdate>(routerIp, 'interface/set', 'POST'),
});
```

## 2. Axios Client (Legacy / Interceptors)

File: `libs/api-client/core/src/interceptors/`

An Axios-based client exists for use cases that predate the GraphQL migration or that need to call
Go backend REST endpoints directly (not RouterOS).

### Interceptors

#### Auth Interceptor (`interceptors/auth.ts`)

Reads credentials from `localStorage` at `nasnet:api:credentials` and injects a `Basic` header:

```
Authorization: Basic <base64(username:password)>
```

Helper functions:

- `storeCredentials(credentials)` — persists to localStorage
- `clearCredentials()` — removes from localStorage

#### Error Interceptor (`interceptors/error.ts`)

Transforms Axios errors into typed `ApiError` objects with user-friendly messages:

| Condition                   | Message                                               |
| --------------------------- | ----------------------------------------------------- |
| No response (ECONNABORTED)  | Request timeout. The server took too long to respond. |
| No response (Network Error) | Network error. Check your connection.                 |
| HTTP 400                    | Bad request. Please check your input.                 |
| HTTP 401                    | Authentication failed. Check your credentials.        |
| HTTP 403                    | Permission denied. You do not have access.            |
| HTTP 404                    | Resource not found.                                   |
| HTTP 409                    | Conflict. The resource may have changed.              |
| HTTP 429                    | Too many requests. Please try again later.            |
| HTTP 5xx                    | Server error. Please try again.                       |

#### Retry Interceptor (`interceptors/retry.ts`)

Provides configurable retry logic for transient Axios failures.

## When to Use Each

| Use case                                        | Tool                                     |
| ----------------------------------------------- | ---------------------------------------- |
| Router configuration data (VPN, firewall, etc.) | Apollo GraphQL hooks                     |
| Real-time updates (service status, alerts)      | Apollo subscriptions                     |
| Low-level RouterOS API calls not in GraphQL     | `makeRouterOSRequest` / router proxy     |
| Calling Go backend REST endpoints directly      | Axios with interceptors                  |
| Wrapping proxy calls with cache/loading state   | `createProxyQueryFn` with TanStack Query |
