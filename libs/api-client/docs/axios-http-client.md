---
sidebar_position: 3
title: Axios HTTP Client
---

# Axios HTTP Client

This document covers the Axios-based HTTP client infrastructure in `libs/api-client/core/src/`. The
Axios layer serves two purposes: a general-purpose REST API client for the NasNet backend
(`/api/v1`), and a router proxy client that tunnels RouterOS REST API calls through the Go backend
to avoid browser CORS restrictions.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Client Factory](#api-client-factory)
   - [createApiClient](#createapiclient)
   - [apiClient Singleton](#apiclient-singleton)
   - [ApiClientConfig](#apiclientconfig)
3. [Interceptors](#interceptors)
   - [Auth Interceptor](#auth-interceptor)
   - [Retry Interceptor](#retry-interceptor)
   - [Error Interceptor](#error-interceptor)
   - [Interceptor Execution Order](#interceptor-execution-order)
4. [Router Proxy Client](#router-proxy-client)
   - [makeRouterOSRequest](#makerouterosrequest)
   - [createProxyQueryFn](#createproxyqueryfn)
   - [createProxyMutationFn](#createproxymutationfn)
   - [Proxy Request Pipeline](#proxy-request-pipeline)
5. [Shared Types](#shared-types)
6. [Error Model](#error-model)
7. [Exports Reference](#exports-reference)
8. [Decision: When to Use Axios vs. Apollo](#decision-when-to-use-axios-vs-apollo)
9. [Cross-References](#cross-references)

---

## Architecture Overview

```
React Component / Feature Hook
          |
          |  REST calls (e.g., auth, health, scanner)
          v
  createApiClient() → AxiosInstance
          |
    +-----------+
    | Interceptors (request → response pipeline)
    |  1. authInterceptor     (request)   — adds Basic Auth header
    |  2. retryInterceptor    (response)  — exponential backoff retry
    |  3. errorInterceptor    (response)  — maps to ApiError
    +-----------+
          |
          v
    GET/POST /api/v1/*
    (NasNet Go backend)


  makeRouterOSRequest(routerIp, endpoint, options)
          |
          v
    POST /api/router/proxy        (NasNet Go backend)
          |
          v
    RouterOS REST API             (MikroTik router)
    /rest/<endpoint>
```

The Axios client communicates exclusively with the NasNet Go backend. The router proxy pattern means
the browser never talks directly to the MikroTik router — the backend handles the actual RouterOS
HTTP calls, credential management, and CORS.

---

## API Client Factory

**Source:** `core/src/client.ts`

### createApiClient

```ts
export function createApiClient(config?: ApiClientConfig): AxiosInstance;
```

Creates and returns a fully configured `AxiosInstance` with all three interceptors registered. The
base URL is resolved in priority order:

1. `config.baseURL` (explicit override)
2. `import.meta.env.VITE_API_URL` (from `.env.development`)
3. `/api/v1` (same-origin default for production)

**Full implementation:**

```ts
export function createApiClient(config?: ApiClientConfig): AxiosInstance {
  const baseURL =
    config?.baseURL || (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';

  const client = axios.create({
    baseURL,
    timeout: config?.timeout ?? 30000, // 30s default
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
  });

  // Registration order matters for LIFO response interceptor execution
  client.interceptors.request.use(authInterceptor);
  client.interceptors.response.use((r) => r, retryInterceptor); // executes second
  client.interceptors.response.use((r) => r, errorInterceptor); // executes first
  return client;
}
```

### apiClient Singleton

```ts
export const apiClient: AxiosInstance = createApiClient();
```

The default instance uses environment-driven base URL with 30s timeout. Import it wherever you need
to make REST calls to the backend:

```ts
import { apiClient } from '@nasnet/api-client/core';

const response = await apiClient.get('/health');
const data = await apiClient.post('/auth/login', { username, password });
```

### ApiClientConfig

**Source:** `core/src/types.ts`

```ts
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
```

All fields are optional. Unspecified fields fall back to the defaults described above.

---

## Interceptors

**Source:** `core/src/interceptors/`

### Auth Interceptor

**Source:** `core/src/interceptors/auth.ts`

```ts
export function authInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig;

export function storeCredentials(credentials: StoredCredentials): void;
export function clearCredentials(): void;
```

A **request** interceptor that reads credentials from `localStorage` at key `nasnet:api:credentials`
and adds an HTTP Basic Authorization header:

```
Authorization: Basic base64(username:password)
```

If no credentials are stored the request proceeds without an `Authorization` header — this is by
design for public endpoints such as health checks.

**Credential storage:**

```ts
// Store credentials after successful login
import { storeCredentials } from '@nasnet/api-client/core';
storeCredentials({ username: 'admin', password: 'secret' });

// Clear on logout
import { clearCredentials } from '@nasnet/api-client/core';
clearCredentials();
```

Note: The Axios auth interceptor uses `localStorage` (persistent across page reloads). The Apollo
auth link uses `sessionStorage` for per-router credentials (cleared when the tab closes). This
distinction is intentional — the Axios client is used for global backend authentication while Apollo
handles per-router isolation.

---

### Retry Interceptor

**Source:** `core/src/interceptors/retry.ts`

```ts
export async function retryInterceptor(error: AxiosError): Promise<never | unknown>;
```

A **response error** interceptor that implements exponential backoff retry for transient failures.

**Constants:**

```ts
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second base
```

**Backoff formula:** `2^retryCount × 1000ms`

| Attempt | Delay |
| ------- | ----- |
| 1       | 2s    |
| 2       | 4s    |
| 3       | 8s    |

**What gets retried:**

| Condition                   | Retried?           |
| --------------------------- | ------------------ |
| Network error (no response) | Yes                |
| HTTP 5xx (server error)     | Yes                |
| HTTP 4xx (client error)     | No                 |
| HTTP 2xx–3xx                | N/A (success path) |

**Connection store integration:**

- On the first retry: calls `useConnectionStore.getState().setReconnecting()` to update global
  connection status.
- After all retries exhausted: calls `useConnectionStore.getState().setDisconnected()`.
- On successful retry: calls `useConnectionStore.getState().setConnected()`.

This allows the application UI to show "Reconnecting..." status banners automatically when the
backend is temporarily unreachable.

**Internal retry tracking** uses an extended config type:

```ts
interface RetryableConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}
```

The retry count is stored on the request config object itself so each unique request has its own
counter.

---

### Error Interceptor

**Source:** `core/src/interceptors/error.ts`

```ts
export function errorInterceptor(error: AxiosError): Promise<never>;
```

A **response error** interceptor that transforms `AxiosError` into `ApiError` with user-friendly
messages. It runs **after** the retry interceptor has given up.

**Status code → message mapping:**

| Status  | Message                                                   |
| ------- | --------------------------------------------------------- |
| 400     | `'Bad request. Please check your input.'`                 |
| 401     | `'Authentication failed. Check your credentials.'`        |
| 403     | `'Permission denied. You do not have access.'`            |
| 404     | `'Resource not found.'`                                   |
| 409     | `'Conflict. The resource may have changed.'`              |
| 429     | `'Too many requests. Please try again later.'`            |
| 500     | `'Server error. Please try again.'`                       |
| 502     | `'Gateway error. The server is temporarily unavailable.'` |
| 503     | `'Service unavailable. Please try again later.'`          |
| 504     | `'Gateway timeout. The server is not responding.'`        |
| Network | `'Network error. Check your connection.'`                 |
| Timeout | `'Request timeout. The server took too long to respond.'` |

Every error is also logged to console with structured context:

```ts
console.error('[API Error]', {
  url: error.config?.url,
  method: error.config?.method,
  status: statusCode,
  message: error.message,
  timestamp: new Date().toISOString(),
});
```

The interceptor always rejects with an `ApiError`:

```ts
return Promise.reject(new ApiError(message, error, statusCode, `HTTP_${statusCode}`));
```

### Interceptor Execution Order

Axios response interceptors execute in **LIFO order** (last registered, first executed for errors).
The registration order in `createApiClient` is intentional:

```
Registration order:        Execution order (errors):
1. retryInterceptor       2. retryInterceptor  ← tries to recover
2. errorInterceptor       1. errorInterceptor  ← transforms final error

Flow for a 503 error:
  AxiosError → errorInterceptor (skips — re-throws) → retryInterceptor
      [wait 2s] → retry request
      [wait 4s] → retry request
      [wait 8s] → retry request exhausted
  AxiosError → errorInterceptor → ApiError (user-friendly message)
```

The `retryInterceptor` re-throws the original `AxiosError` if it has been retried to exhaustion or
is not retryable, at which point `errorInterceptor` converts it to an `ApiError`.

---

## Router Proxy Client

**Source:** `core/src/router-proxy.ts`

The router proxy bypasses CORS restrictions by routing all RouterOS REST API calls through the
NasNet Go backend. The browser never connects directly to the MikroTik router.

### makeRouterOSRequest

```ts
export async function makeRouterOSRequest<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions,
  config?: Partial<ProxyConfig>
): Promise<RouterOSResponse<T>>;
```

**Parameters:**

| Parameter  | Type                     | Description                                                   |
| ---------- | ------------------------ | ------------------------------------------------------------- |
| `routerIp` | `string`                 | Target router IP address (e.g., `'192.168.88.1'`)             |
| `endpoint` | `string`                 | RouterOS REST path (e.g., `'interface'`, `'system/resource'`) |
| `options`  | `RouterOSRequestOptions` | Optional method, body, headers, params                        |
| `config`   | `Partial<ProxyConfig>`   | Optional timeout/retry overrides                              |

**`RouterOSRequestOptions`:**

```ts
export interface RouterOSRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // default: 'GET'
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}
```

**`RouterOSResponse<T>`:**

```ts
export interface RouterOSResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
```

**Default proxy configuration:**

```ts
const defaultConfig: ProxyConfig = {
  timeout: 30000, // 30s
  retries: 3,
  retryDelay: 1000, // 1s between retries
  baseUrl: '', // relative to current origin
};
```

**Endpoint normalization** — `buildRouterOSEndpoint`:

```
Input: 'interface'         →  Output: '/rest/interface'
Input: '/interface'        →  Output: '/rest/interface'
Input: 'rest/interface'    →  Output: '/rest/interface'
Input: '/rest/interface'   →  Output: '/rest/interface'
```

**Response transformation** — `convertRouterOSResponse`:

RouterOS uses kebab-case field names (e.g., `max-l2mtu`, `running-user`). The proxy client
automatically converts all response keys to camelCase:

```
RouterOS:  { "max-l2mtu": "1500", "is-running": "true" }
Converted: { maxL2Mtu: "1500",    isRunning: "true" }
```

**RouterOS error handling:**

| RouterOS Status | Returned `RouterOSResponse`                             |
| --------------- | ------------------------------------------------------- |
| 401             | `{ success: false, error: 'Authentication failed...' }` |
| 403             | `{ success: false, error: 'Access denied...' }`         |
| 404             | `{ success: false, error: 'Resource not found...' }`    |
| Other non-2xx   | Throw → retry → `{ success: false, error: '...' }`      |

**Pre-condition:** credentials must be stored in `localStorage` at key `nasnet:api:credentials`. If
no credentials are found, the function returns immediately:

```ts
{ success: false, error: 'No valid authentication credentials found', timestamp }
```

**Usage example:**

```ts
import { makeRouterOSRequest } from '@nasnet/api-client/core';

// Read router interfaces
const result = await makeRouterOSRequest<Interface[]>('192.168.88.1', 'interface');
if (result.success) {
  console.log(result.data); // Interface[] with camelCase keys
} else {
  console.error(result.error);
}

// Write — enable an interface
const result = await makeRouterOSRequest('192.168.88.1', 'interface/set', {
  method: 'POST',
  body: { '.id': '*1', disabled: 'false' },
});
```

---

### createProxyQueryFn

```ts
export function createProxyQueryFn<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions
): () => Promise<T>;
```

Creates a TanStack Query `queryFn` that wraps `makeRouterOSRequest`. On failure it throws an `Error`
(instead of returning a `RouterOSResponse` with `success: false`), which is the contract TanStack
Query expects.

```ts
import { useQuery } from '@tanstack/react-query';
import { createProxyQueryFn } from '@nasnet/api-client/core';

const { data } = useQuery({
  queryKey: ['interfaces', routerIp],
  queryFn: createProxyQueryFn<Interface[]>(routerIp, 'interface'),
});
```

---

### createProxyMutationFn

```ts
export function createProxyMutationFn<TData, TVariables>(
  routerIp: string,
  endpoint: string,
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): (variables: TVariables) => Promise<TData>;
```

Creates a TanStack Query `mutationFn` that passes the mutation variables as the request body.
Default method is `POST`.

```ts
import { useMutation } from '@tanstack/react-query';
import { createProxyMutationFn } from '@nasnet/api-client/core';

const { mutate } = useMutation({
  mutationFn: createProxyMutationFn<void, DisablePayload>(routerIp, 'interface/set', 'POST'),
});

mutate({ '.id': '*2', disabled: 'true' });
```

---

### Proxy Request Pipeline

The full lifecycle of a `makeRouterOSRequest` call:

```
makeRouterOSRequest('192.168.88.1', 'interface', { method: 'GET' })
      |
      v
1. Check credentials in localStorage
      |  (no credentials) → return { success: false, error: 'No credentials' }
      |  (credentials found) → build Basic auth header
      v
2. Build proxy request body:
   {
     router_ip: '192.168.88.1',
     endpoint: '/rest/interface',
     method: 'GET',
     headers: { Authorization: 'Basic ...', Content-Type: 'application/json' }
   }
      |
      v
3. POST /api/router/proxy  (to NasNet Go backend)
      |
      |  (timeout: 30s, AbortController)
      |  (retry: up to 3 attempts, 1s delay)
      v
4. NasNet backend → MikroTik RouterOS REST API
   GET /rest/interface
      |
      v
5. RouterProxyResponse { status, status_text, headers, body }
      |
      v
6. Check RouterOS status code (401, 403, 404, non-2xx)
      |
      v
7. convertRouterOSResponse(body) → camelCase keys
      |
      v
8. Return { success: true, data: <converted>, timestamp }
```

---

## Shared Types

**Source:** `core/src/types.ts`

```ts
// Success response wrapper (used by REST endpoints)
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

// Error response wrapper
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Type-safe error class
export class ApiError extends Error {
  public originalError?: unknown;
  public statusCode?: number;
  public code?: string;

  constructor(message: string, originalError?: unknown, statusCode?: number, code?: string);
}

// Credential storage shape (used by both auth interceptor and router proxy)
export interface StoredCredentials {
  username: string;
  password: string;
}

// Client configuration
export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Internal retry tracking (extends Axios config)
export interface RetryConfig {
  retryCount?: number;
  [key: string]: unknown;
}
```

---

## Error Model

The Axios layer uses `ApiError` for type-safe error handling. `ApiError` extends native `Error` and
adds:

- `statusCode` — the HTTP status code (or `undefined` for network errors).
- `code` — a string code in the format `HTTP_<status>` (e.g., `HTTP_401`, `HTTP_503`).
- `originalError` — the original `AxiosError` for debugging.

**Catching errors in feature code:**

```ts
import { apiClient, ApiError } from '@nasnet/api-client/core';

try {
  const response = await apiClient.get('/routers');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      // Handle unauthorized
    } else if (error.statusCode === 503) {
      // Handle service unavailable
    }
    // Show user-facing message from error.message
    toast.error(error.message);
  }
}
```

See `./error-handling.md` for the complete error handling architecture, including the GraphQL error
code taxonomy (`P1xx`, `R2xx`, `N3xx`, `V4xx`, `A5xx`, `S6xx`).

---

## Exports Reference

All symbols are re-exported from `@nasnet/api-client/core`.

**From `core/src/client.ts`:**

| Export            | Type            | Description                               |
| ----------------- | --------------- | ----------------------------------------- |
| `createApiClient` | function        | Factory that creates a new Axios instance |
| `apiClient`       | `AxiosInstance` | Default pre-configured Axios instance     |

**From `core/src/router-proxy.ts`:**

| Export                                     | Type           | Description                                 |
| ------------------------------------------ | -------------- | ------------------------------------------- |
| `makeRouterOSRequest<T>`                   | async function | Direct RouterOS REST call via backend proxy |
| `createProxyQueryFn<T>`                    | function       | Creates TanStack Query `queryFn`            |
| `createProxyMutationFn<TData, TVariables>` | function       | Creates TanStack Query `mutationFn`         |

**From `core/src/interceptors/`:**

| Export             | Type                | Description                           |
| ------------------ | ------------------- | ------------------------------------- |
| `authInterceptor`  | request interceptor | Adds Basic Auth header                |
| `storeCredentials` | function            | Persists credentials to localStorage  |
| `clearCredentials` | function            | Removes credentials from localStorage |
| `retryInterceptor` | error interceptor   | Exponential backoff retry             |
| `errorInterceptor` | error interceptor   | Maps to `ApiError`                    |

**From `core/src/types.ts`:**

| Export              | Kind      | Description                                  |
| ------------------- | --------- | -------------------------------------------- |
| `ApiResponse<T>`    | interface | Success response shape                       |
| `ApiErrorResponse`  | interface | Error response shape                         |
| `ApiError`          | class     | Type-safe error with `statusCode` and `code` |
| `StoredCredentials` | interface | `{ username, password }` shape               |
| `ApiClientConfig`   | interface | `createApiClient` options                    |
| `RetryConfig`       | interface | Internal retry tracking shape                |

**From `core/src/router-proxy.ts` (types):**

| Export                   | Kind      | Description                             |
| ------------------------ | --------- | --------------------------------------- |
| `RouterOSRequestOptions` | interface | `method`, `body`, `headers`, `params`   |
| `RouterOSResponse<T>`    | interface | `{ success, data?, error?, timestamp }` |

---

## Fetch-Based Router Proxy

The router proxy is a separate `fetch`-based client (not Axios) that directly handles RouterOS REST
API tunneling through the NasNet backend. While Axios handles general REST endpoints (`/api/v1/*`),
the router proxy is optimized for the specific pattern of proxying RouterOS requests with credential
management and response transformation.

### Helper Functions

**Source:** `core/src/router-proxy.ts:87–121`

#### `buildRouterOSEndpoint(endpoint)`

Normalizes RouterOS REST API endpoint paths to ensure they start with `/rest/`:

```ts
function buildRouterOSEndpoint(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  if (cleanEndpoint.startsWith('rest/')) {
    return `/${cleanEndpoint}`;
  }
  return `/rest/${cleanEndpoint}`;
}
```

| Input               | Output            | Notes                 |
| ------------------- | ----------------- | --------------------- |
| `'interface'`       | `/rest/interface` | Common case           |
| `'/interface'`      | `/rest/interface` | Leading slash removed |
| `'rest/interface'`  | `/rest/interface` | Already prefixed      |
| `'/rest/interface'` | `/rest/interface` | Already complete      |

#### `convertRouterOSResponse<T>(data)`

Recursively converts all object keys from kebab-case to camelCase. RouterOS uses field names like
`max-l2mtu`, `running-user`, etc.; the browser expects camelCase for consistency with JavaScript
conventions.

```ts
function convertRouterOSResponse<T>(data: unknown): T {
  if (Array.isArray(data)) {
    return data.map((item) => convertRouterOSResponse(item)) as T;
  }

  if (data && typeof data === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = convertRouterOSResponse(value);
    }
    return converted as T;
  }

  return data as T;
}
```

**Example:**

```
Input:  { "max-l2mtu": "1500", "is-running": "true" }
Output: { maxL2Mtu: "1500",    isRunning:   "true" }
```

### TanStack Query Factories

These factory functions wrap `makeRouterOSRequest` for use with TanStack Query's `useQuery` and
`useMutation` hooks. They bridge the gap between the raw Promise-based router proxy API and TanStack
Query's error-handling contract (throwing on failure instead of returning error objects).

#### `createProxyQueryFn<T>(routerIp, endpoint, options?)`

**Source:** `core/src/router-proxy.ts` (lines from reading session)

```ts
export function createProxyQueryFn<T>(
  routerIp: string,
  endpoint: string,
  options?: RouterOSRequestOptions
): () => Promise<T>;
```

Creates a TanStack Query `queryFn` that **throws** on failure (the contract TanStack Query expects)
instead of returning a `RouterOSResponse` with `success: false`.

**Usage with `useQuery`:**

```ts
import { useQuery } from '@tanstack/react-query';
import { createProxyQueryFn } from '@nasnet/api-client/core';

interface Interface {
  name: string;
  running: boolean;
  disabled: boolean;
}

function InterfaceList({ routerIp }: { routerIp: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['interfaces', routerIp],
    queryFn: createProxyQueryFn<Interface[]>(routerIp, 'interface'),
  });

  return data ? <Table data={data} /> : <Spinner />;
}
```

#### `createProxyMutationFn<TData, TVariables>(routerIp, endpoint, method?)`

**Source:** `core/src/router-proxy.ts` (lines from reading session)

```ts
export function createProxyMutationFn<TData, TVariables>(
  routerIp: string,
  endpoint: string,
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): (variables: TVariables) => Promise<TData>;
```

Creates a TanStack Query `mutationFn`. The `variables` parameter is passed as the request body.
Default method is `POST`.

**Usage with `useMutation`:**

```ts
import { useMutation } from '@tanstack/react-query';
import { createProxyMutationFn } from '@nasnet/api-client/core';

interface DisableInterfacePayload {
  '.id': string;
  disabled: 'true' | 'false';
}

function InterfaceToggle({ routerIp, interfaceId }: Props) {
  const { mutate, isPending } = useMutation({
    mutationFn: createProxyMutationFn<void, DisableInterfacePayload>(
      routerIp,
      'interface/set',
      'POST'
    ),
  });

  const handleDisable = () => {
    mutate({
      '.id': interfaceId,
      disabled: 'true',
    });
  };

  return <Button onClick={handleDisable} disabled={isPending}>Disable</Button>;
}
```

### ProxyConfig Interface

**Source:** `core/src/router-proxy.ts:11–17`

```ts
interface ProxyConfig {
  readonly timeout: number; // Default: 30000 (30 seconds)
  readonly retries: number; // Default: 3
  readonly retryDelay: number; // Default: 1000 (1 second)
  readonly baseUrl: string; // Default: '' (relative to current origin)
}
```

These defaults apply to all router proxy requests. Override on a per-request basis:

```ts
const result = await makeRouterOSRequest(routerIp, endpoint, options, {
  timeout: 60000, // 60s timeout for slow queries
  retries: 5, // More retries for unreliable links
});
```

---

## Decision: When to Use Axios vs. Apollo

The library provides three HTTP mechanisms. Choose based on the data source and operation type:

| Scenario                                             | Use                                                          | Notes                                        |
| ---------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Reading/writing GraphQL data from the NasNet backend | Apollo Client (`useQuery`, `useMutation`, `useSubscription`) | Normalized cache, subscriptions, real-time   |
| Direct RouterOS REST API calls (non-GraphQL)         | `makeRouterOSRequest` or `createProxyQueryFn`                | Fetch-based; bypasses CORS via backend proxy |
| Backend REST endpoints (`/api/v1/*`)                 | `apiClient` (Axios)                                          | General REST client; auth, health, etc.      |
| Form submissions that don't map to GraphQL           | `apiClient` (Axios)                                          | Pre-validation bootstrap calls               |
| Real-time data streams                               | Apollo subscriptions via WebSocket                           | Subscriptions, live updates                  |
| File uploads                                         | `apiClient` (Axios) with `multipart/form-data`               | Axios handles multipart encoding             |
| Authentication (login, token refresh)                | `apiClient` (Axios)                                          | Runs before Apollo is configured             |

**Rule of thumb:**

- **If the data has a GraphQL type in `schema/`** → Use Apollo.
- **If you need raw RouterOS REST access** → Use `makeRouterOSRequest` / `createProxyQueryFn`.
- **If you're calling `/api/v1/*` backend endpoints** → Use `apiClient` (Axios).

See `./intro.md` for the full decision matrix.

---

## Cross-References

| Topic                                | Document                   |
| ------------------------------------ | -------------------------- |
| Library overview and decision matrix | `./intro.md`               |
| Apollo Client setup and link chain   | `./apollo-client.md`       |
| Authentication architecture          | `./authentication.md`      |
| Error handling and ApiError taxonomy | `./error-handling.md`      |
| Domain query hooks built on Apollo   | `./domain-query-hooks.md`  |
| Testing strategies and mock clients  | `./testing-and-codegen.md` |
