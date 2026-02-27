---
sidebar_position: 5
title: Error Handling
---

# Error Handling

NasNetConnect's error handling is a multi-layer pipeline that transforms raw protocol errors into
structured, user-friendly feedback. The system covers GraphQL errors from Apollo, network-level
failures from both Apollo and Axios, component-level error display, and structured error logging
with deduplication and batching. The entire pipeline is coordinated by three cooperating modules:
the Apollo error link, the error message taxonomy, and the error logging utility — complemented by
React hooks that bring structured errors into the component layer.

---

## Error Pipeline Overview

```
                  GraphQL Response                Network Failure
                        │                               │
              ┌─────────▼─────────┐         ┌──────────▼──────────┐
              │  graphQLErrors[]  │         │    networkError      │
              │  (from server)    │         │  (timeout/HTTP err)  │
              └─────────┬─────────┘         └──────────┬──────────┘
                        │                               │
                        └───────────────┬───────────────┘
                                        ▼
                              apollo-error-link.ts
                              (onError handler)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
             logGraphQLError    classify error code    handleAuthError /
             logNetworkError    via error-messages.ts  handleNetworkError
                    │                   │                   │
                    ▼                   ▼                   ▼
             error-logging.ts     switch on code      useAuthStore.clearAuth()
             (buffer/console)     FORBIDDEN            addNotification()
                                  NOT_FOUND            'auth:expired' event
                                  VALIDATION_FAILED
                                  default → getErrorInfo()

                    ▼ (component layer)
              useGraphQLError()     useQueryWithLoading()     useMutationWithLoading()
              ProcessedError        NetworkStatus states       isLoading/isSuccess/isError
```

---

## Error Taxonomy

**Source:** `core/src/utils/error-messages.ts`

All error codes follow a six-category scheme. The category is encoded in the first two characters of
the code string.

### Error Code Categories

| Prefix | Category   | Examples                       | Notes                                |
| ------ | ---------- | ------------------------------ | ------------------------------------ |
| `P1xx` | Platform   | `P100`, `P101`, `P102`, `P103` | Router capability/version mismatches |
| `R2xx` | Protocol   | `R200`, `R201`, `R202`, `R203` | RouterOS connection failures         |
| `N3xx` | Network    | `N300`, `N301`, `N302`         | Reachability, DNS, timeout           |
| `V4xx` | Validation | `V400`, `V401`, `V402`, `V403` | Schema, reference, conflict          |
| `A5xx` | Auth       | `A500`, `A501`, `A502`         | Credentials, permissions, expiry     |
| `S6xx` | Resource   | `S600`, `S601`, `S602`, `S603` | Not found, locked, invalid state     |

Additionally, GraphQL-standard codes (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
`VALIDATION_FAILED`) are handled by the error link by name.

### `ErrorInfo` Type

Every resolved error code maps to this structure:

```ts
// core/src/utils/error-messages.ts:33
export interface ErrorInfo {
  message: string; // User-facing message (no jargon)
  severity: ErrorSeverity; // 'info' | 'warning' | 'error' | 'critical'
  recoverable: boolean; // Whether user action can fix it
  action?: string; // Suggested recovery step
  i18nKey?: string; // Translation key (e.g., 'errors.auth.expired')
}
```

### Complete Code Reference

**Platform errors (P1xx)**

| Code   | Message                              | Severity | Recoverable | Action                     |
| ------ | ------------------------------------ | -------- | ----------- | -------------------------- |
| `P100` | Feature not supported on your router | warning  | false       | Check router compatibility |
| `P101` | Capability not available             | warning  | false       | Install required package   |
| `P102` | RouterOS version too old             | warning  | false       | Update RouterOS            |
| `P103` | Required package not installed       | warning  | true        | Install missing package    |

**Protocol errors (R2xx)**

| Code   | Message                       | Severity | Recoverable | Action                          |
| ------ | ----------------------------- | -------- | ----------- | ------------------------------- |
| `R200` | Failed to connect to router   | error    | true        | Check router IP and credentials |
| `R201` | Connection timed out          | error    | true        | Try again or check network      |
| `R202` | Protocol error occurred       | error    | true        | Try reconnecting                |
| `R203` | All connection methods failed | error    | true        | Verify router is accessible     |

**Network errors (N3xx)**

| Code   | Message                       | Severity | Recoverable | Action                        |
| ------ | ----------------------------- | -------- | ----------- | ----------------------------- |
| `N300` | Cannot reach the router       | error    | true        | Check your network connection |
| `N301` | Cannot resolve router address | error    | true        | Check DNS settings            |
| `N302` | Network request timed out     | error    | true        | Try again                     |

**Validation errors (V4xx)**

| Code   | Message                            | Severity | Recoverable | Action                   |
| ------ | ---------------------------------- | -------- | ----------- | ------------------------ |
| `V400` | Invalid input provided             | warning  | true        | Check your input         |
| `V401` | Referenced item not found          | warning  | true        | Select a valid reference |
| `V402` | Circular dependency detected       | error    | true        | Review configuration     |
| `V403` | Conflicting configuration detected | error    | true        | Resolve conflicts        |

**Auth errors (A5xx)**

| Code   | Message                           | Severity | Recoverable | Action                 |
| ------ | --------------------------------- | -------- | ----------- | ---------------------- |
| `A500` | Authentication failed             | error    | true        | Check your credentials |
| `A501` | Permission denied for this action | warning  | false       | Contact administrator  |
| `A502` | Session has expired               | warning  | true        | Please log in again    |

**Resource errors (S6xx)**

| Code   | Message                      | Severity | Recoverable | Action                     |
| ------ | ---------------------------- | -------- | ----------- | -------------------------- |
| `S600` | Requested item was not found | warning  | false       | Item may have been deleted |
| `S601` | Resource is locked           | warning  | true        | Wait and try again         |
| `S602` | Invalid state transition     | error    | false       | Refresh and try again      |
| `S603` | Dependent resource not ready | warning  | true        | Wait for dependencies      |

---

## Exported Functions from `error-messages.ts`

#### `getErrorMessage(code, fallbackMessage?)`

```ts
export function getErrorMessage(code: string | undefined, fallbackMessage?: string): string;
```

Returns the user-friendly message string for a code. Resolution order: exact code match → category
prefix fallback → provided fallback → generic message. Safe with `undefined` input.

```ts
getErrorMessage('N300'); // "Cannot reach the router"
getErrorMessage('N399'); // "Network error occurred" (category fallback)
getErrorMessage('UNKNOWN', 'Oops'); // "Oops" (explicit fallback)
getErrorMessage(undefined); // "An error occurred. Please try again."
```

#### `getErrorInfo(code, fallbackMessage?)`

```ts
export function getErrorInfo(code: string | undefined, fallbackMessage?: string): ErrorInfo;
```

Returns the full `ErrorInfo` object with message, severity, recoverability, action, and i18n key.

```ts
const info = getErrorInfo('A502');
// { message: "Your session has expired", severity: "warning",
//   recoverable: true, action: "Please log in again",
//   i18nKey: "errors.auth.expired" }
```

#### `getErrorCategory(code)`

```ts
export function getErrorCategory(code: string): ErrorCategory | undefined;
```

Extracts the two-character category prefix from a code string. Returns `undefined` if the prefix
does not match any known category.

#### `getErrorSeverity(code)`

```ts
export function getErrorSeverity(code: string | undefined): ErrorSeverity;
```

Shorthand to get just the severity level. Returns `'error'` for unknown codes.

#### `isRecoverableError(code)`

```ts
export function isRecoverableError(code: string | undefined): boolean;
```

Returns `true` for unknown codes (safe default).

#### `getErrorAction(code)`

```ts
export function getErrorAction(code: string | undefined): string | undefined;
```

Returns the suggested action string or `undefined` if none is defined.

#### Category Predicates

```ts
export function isAuthError(code: string | undefined): boolean; // code.startsWith('A5')
export function isNetworkError(code: string | undefined): boolean; // code.startsWith('N3') || 'R2'
export function isValidationError(code: string | undefined): boolean; // code.startsWith('V4')
```

Used by the error link to route errors to the correct handler without repeated string comparisons.

---

## Apollo Error Link

**Source:** `core/src/apollo/apollo-error-link.ts`

The error link is the first link in the chain and receives every error from every downstream link
and the server.

```ts
// core/src/apollo/apollo-client.ts:72
const link = from([errorLink, retryLink, splitLink]);
```

### GraphQL Error Routing

```ts
// core/src/apollo/apollo-error-link.ts:118
export const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      const errorCode = extensions?.code as string | undefined;

      logGraphQLError(operation.operationName, error, { ... });

      // 1. Skip validation errors — handled by React Hook Form
      if (checkValidationError(errorCode)) { continue; }

      // 2. Auth errors (A5xx codes or UNAUTHENTICATED)
      if (checkAuthError(errorCode) || errorCode === 'UNAUTHENTICATED') {
        handleAuthError(message); continue;
      }

      // 3. Named codes
      switch (errorCode) {
        case 'FORBIDDEN':  → addNotification 'Access denied'
        case 'NOT_FOUND':  → addNotification 'Not found' (warning)
        default:           → getErrorInfo(code) → addNotification
      }
    }
  }
```

The `VALIDATION_FAILED` / `V4xx` skip-and-continue is deliberate: form validation errors propagate
back to the `useMutation` return value where React Hook Form can display field-level errors. Global
notifications for form errors would be confusing.

### Network Error Routing

```ts
if (networkError) {
  const statusCode = getStatusCode(networkError);
  logNetworkError(operation.operationName, networkError, { statusCode });

  if (statusCode === 401) { handleAuthError(...); return; }
  if (statusCode === 403) { addNotification 'Access denied'; return; }

  handleNetworkError(networkError);  // generic toast + 'network:error' event
}
```

The `network:error` custom event dispatched by `handleNetworkError` is consumed by
`offline-detector.ts` to track connectivity state.

### `createErrorLink(options)`

```ts
export function createErrorLink(options: {
  onAuthError?: (message: string) => void;
  onNetworkError?: (error: Error) => void;
});
```

Factory for test environments or embedded deployments where the default side effects (notification
store, custom events) are unavailable. When `onAuthError` is provided it replaces `handleAuthError`
entirely; when absent the default implementation is used.

---

## Structured Error Logging

**Source:** `core/src/utils/error-logging.ts`

The logging utility provides structured, deduplicated, buffered error logging. It is intentionally
separated from the error display logic to enable future observability integration (tracked as
`NAS-13.8`).

### Configuration Constants

```ts
const MAX_BUFFER_SIZE = 10; // Buffer flushes at 10 entries
const FLUSH_INTERVAL_MS = 60000; // Flush every 60 seconds
const THROTTLE_WINDOW_MS = 5000; // Deduplicate within 5 seconds
```

### `ErrorLogEntry` Type

```ts
export interface ErrorLogEntry {
  code?: string; // Error code (e.g. "N300")
  message: string;
  operation?: string; // GraphQL operation name
  context?: Record<string, unknown>;
  timestamp: number; // Auto-generated (ms since epoch)
  stack?: string; // Error stack trace
  url?: string; // Auto-captured window.location.href
  component?: string; // Source component name (for boundary errors)
}
```

`ErrorLogInput` is `Omit<ErrorLogEntry, 'timestamp' | 'url'>` — callers do not provide
auto-generated fields.

### Public API

#### `logError(entry)`

```ts
export function logError(entry: ErrorLogInput): void;
```

Core logging function. Deduplication is based on a hash of `code + message + operation`. If the same
error fires within 5 seconds it is silently dropped. In development mode it logs to the console
immediately with colored grouping. In production it buffers entries and flushes when the buffer
reaches `MAX_BUFFER_SIZE` or `FLUSH_INTERVAL_MS` elapses.

```ts
logError({
  code: 'N300',
  message: 'Connection failed',
  operation: 'GetRouter',
  context: { routerId: 'abc' },
});
```

#### `logGraphQLError(operation, error, context?)`

```ts
export function logGraphQLError(
  operation: string,
  error: { message: string; extensions?: { code?: string } },
  context?: Record<string, unknown>
): void;
```

Convenience wrapper used by the error link. Extracts `extensions.code` and calls `logError`.

#### `logNetworkError(operation, error, context?)`

```ts
export function logNetworkError(
  operation: string,
  error: Error,
  context?: Record<string, unknown>
): void;
```

Defaults the code to `N302` (network timeout) since most Apollo network errors do not carry
structured codes.

#### `logComponentError(component, error, errorInfo?)`

```ts
export function logComponentError(
  component: string,
  error: Error,
  errorInfo?: { componentStack?: string }
): void;
```

Intended for use inside React error boundaries. Sets `component` on the log entry and includes the
React component stack in `context`.

#### `flushErrorBuffer()`

```ts
export function flushErrorBuffer(): void;
```

Force-flushes the production buffer. Should be called on `window.beforeunload` to avoid losing
buffered errors on page close.

#### `getErrorBufferSize()`

```ts
export function getErrorBufferSize(): number;
```

Returns the current number of entries waiting to be flushed. Useful in monitoring dashboards.

---

## Axios Error Interceptor

**Source:** `core/src/interceptors/error.ts`

The Axios error interceptor handles the REST client path. It runs after the retry interceptor
exhausts its attempts (LIFO stack order — see `core/src/client.ts` for registration order).

### HTTP Status Code Mapping

| Status                      | User Message                                          |
| --------------------------- | ----------------------------------------------------- |
| 400                         | Bad request. Please check your input.                 |
| 401                         | Authentication failed. Check your credentials.        |
| 403                         | Permission denied. You do not have access.            |
| 404                         | Resource not found.                                   |
| 409                         | Conflict. The resource may have changed.              |
| 429                         | Too many requests. Please try again later.            |
| 500                         | Server error. Please try again.                       |
| 502                         | Gateway error. The server is temporarily unavailable. |
| 503                         | Service unavailable. Please try again later.          |
| 504                         | Gateway timeout. The server is not responding.        |
| Network error (no response) | Network error. Check your connection.                 |
| `ECONNABORTED`              | Request timeout. The server took too long to respond. |
| ≥500 (unknown)              | Server error. Please try again.                       |
| ≥400 (unknown)              | Request failed. Please try again.                     |

### `errorInterceptor(error)`

```ts
export function errorInterceptor(error: AxiosError): Promise<never>;
```

Logs the raw error to `console.error` with `url`, `method`, `status`, `message`, and `timestamp`,
then rejects with an `ApiError` instance that wraps the Axios error:

```ts
return Promise.reject(new ApiError(message, error, statusCode, `HTTP_${statusCode}`));
```

The `ApiError` class (from `core/src/types.ts`) is type-safe and provides `statusCode` and `code`
fields for downstream handlers.

---

## React Hooks

### `useGraphQLError`

**Source:** `core/src/hooks/useGraphQLError.ts`

```ts
export function useGraphQLError(
  apolloError: ApolloError | Error | undefined,
  options?: UseGraphQLErrorOptions
): UseGraphQLErrorReturn;
```

Transforms an `ApolloError` or generic `Error` into a `ProcessedError` ready for UI rendering.

#### `UseGraphQLErrorOptions`

```ts
export interface UseGraphQLErrorOptions {
  showToast?: boolean; // Auto-show notification on error (default: false)
  logErrors?: boolean; // Log via error-logging.ts (default: true)
  operationName?: string; // For structured log entries
  skipValidationErrors?: boolean; // Suppress V4xx errors (default: false)
}
```

#### `ProcessedError`

```ts
export interface ProcessedError {
  message: string; // User-facing message from getErrorInfo()
  severity: ErrorSeverity;
  code?: string;
  technicalMessage?: string; // Raw apolloError.message for debug views
  recoverable: boolean;
  action?: string;
  isAuthError: boolean; // True for A5xx or ApolloError with networkError
  isNetworkError: boolean;
  isValidationError: boolean;
  originalError?: ApolloError | Error;
}
```

#### `UseGraphQLErrorReturn`

```ts
export interface UseGraphQLErrorReturn {
  error: ProcessedError | null;
  hasError: boolean;
  clearError: () => void;
  showErrorToast: () => void; // Manually trigger notification
  createRetryHandler: <T>(fn: () => Promise<T>) => () => Promise<T | undefined>;
}
```

#### Usage Examples

**Basic query error display:**

```tsx
function RouterCard({ routerId }: { routerId: string }) {
  const { data, error: apolloError, refetch } = useQuery(GET_ROUTER);
  const { error, hasError } = useGraphQLError(apolloError);

  if (hasError) {
    return (
      <ErrorCard
        title={error!.message}
        type={error!.isNetworkError ? 'network' : 'error'}
        onRetry={refetch}
      />
    );
  }
  return <RouterDetails data={data} />;
}
```

**Mutation with retry handler:**

```tsx
function UpdateForm() {
  const [updateRouter, { error: apolloError }] = useMutation(UPDATE_ROUTER);
  const { error, createRetryHandler } = useGraphQLError(apolloError, {
    showToast: true,
    operationName: 'UpdateRouter',
  });

  const handleSubmit = createRetryHandler(async () => {
    await updateRouter({ variables: { id, data } });
  });

  return <form onSubmit={handleSubmit}>{error && <ErrorCard title={error.message} />}</form>;
}
```

**Skipping form validation errors:**

```tsx
const { error } = useGraphQLError(apolloError, {
  skipValidationErrors: true,
  // V4xx errors suppressed; React Hook Form handles field display
});
```

#### Utility Exports

```ts
export function isApolloError(error: unknown): error is ApolloError;
export function getApolloErrorCode(error: ApolloError): string | undefined;
```

`getApolloErrorCode` extracts `graphQLErrors[0]?.extensions?.code` — the primary code when multiple
errors are returned.

---

### `useQueryWithLoading`

**Source:** `core/src/hooks/useQueryWithLoading.ts`

```ts
export function useQueryWithLoading<TData, TVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): UseQueryWithLoadingResult<TData, TVariables>;
```

Wraps `useQuery` with `notifyOnNetworkStatusChange: true` and derives four additional loading states
from `NetworkStatus`:

```ts
export interface QueryWithLoadingState<TData> {
  isInitialLoading: boolean; // loading && !data   — show skeleton
  isRevalidating: boolean; // loading && !!data  — show refresh indicator
  isStale: boolean; // networkStatus === NetworkStatus.refetch
  isLoading: boolean; // raw loading flag
  lastUpdated: Date | null; // approximate; null while loading
}
```

**Why this matters:** The standard `loading` boolean cannot distinguish between "first fetch" and
"background refresh". Showing a full skeleton during a background refresh destroys the user's
context. `isInitialLoading` drives skeleton rendering; `isRevalidating` drives a subtle indicator.

```tsx
const { data, isInitialLoading, isRevalidating } = useQueryWithLoading(GET_RESOURCES);

if (isInitialLoading) return <ResourceListSkeleton />;
return (
  <div>
    {isRevalidating && <RefreshIndicator />}
    <ResourceTable data={data.resources} />
  </div>
);
```

---

### `useMutationWithLoading`

**Source:** `core/src/hooks/useMutationWithLoading.ts`

```ts
export function useMutationWithLoading<TData, TVariables>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables>
): UseMutationWithLoadingResult<TData, TVariables>;
```

Wraps `useMutation` with explicit `isSuccess` and `isError` boolean state (the standard hook only
exposes `error` being non-null for failure):

```ts
export interface MutationWithLoadingState {
  isLoading: boolean; // Apollo loading flag
  isSuccess: boolean; // Set on onCompleted
  isError: boolean; // Set on onError
  error: ApolloError | null;
  reset: () => void; // Clear isSuccess / isError
}

export interface UseMutationWithLoadingResult<TData, TVariables> extends MutationWithLoadingState {
  mutate: (variables?: TVariables) => Promise<FetchResult<TData>>;
  mutationTuple: MutationTuple<TData, TVariables>; // Raw tuple for advanced usage
  data: TData | null | undefined;
}
```

The `mutate` shorthand clears `isSuccess`/`isError` before each execution so stale state never
persists.

#### `createOptimisticOptions`

```ts
export function createOptimisticOptions<TData, TVariables>(config: {
  optimisticResponse: OptimisticResponse<TData>;
  cacheUpdate?: (cache, data: TData) => void;
}): Partial<MutationHookOptions<TData, TVariables>>;
```

Helper for building optimistic mutation options from a typed response and optional cache updater,
avoiding the `as any` casts that raw optimistic usage requires.

---

## Error Message Utility API

**Source:** `core/src/utils/error-messages.ts:33–200+`

These utility functions map error codes to structured error information, driving user-facing
messages and recovery suggestions.

### `getErrorMessage(code?, fallbackMessage?)`

```ts
export function getErrorMessage(code: string | undefined, fallbackMessage?: string): string;
```

Returns the user-friendly message string for a code. Resolution order: exact code match → category
prefix fallback → provided fallback → generic default.

```ts
getErrorMessage('N300'); // "Cannot reach the router"
getErrorMessage('N399'); // "Network error occurred" (N3xx category fallback)
getErrorMessage('UNKNOWN', 'Oops'); // "Oops" (explicit fallback)
getErrorMessage(undefined); // "An error occurred. Please try again." (default)
```

### `getErrorInfo(code?, fallbackMessage?)`

```ts
export function getErrorInfo(code: string | undefined, fallbackMessage?: string): ErrorInfo;
```

Returns the full `ErrorInfo` object with all metadata:

```ts
interface ErrorInfo {
  message: string; // User-facing message
  severity: ErrorSeverity; // 'info' | 'warning' | 'error' | 'critical'
  recoverable: boolean; // Whether user action can fix it
  action?: string; // Suggested recovery step
  i18nKey?: string; // Translation key for i18n integration
}
```

**Example:**

```ts
const info = getErrorInfo('A502');
// {
//   message: "Your session has expired",
//   severity: "warning",
//   recoverable: true,
//   action: "Please log in again",
//   i18nKey: "errors.auth.expired"
// }
```

### `getErrorCategory(code)`

```ts
export function getErrorCategory(code: string): ErrorCategory | undefined;
```

Extracts the two-character category prefix. Returns `undefined` if not recognized.

```ts
getErrorCategory('N300'); // 'N3'
getErrorCategory('A501'); // 'A5'
getErrorCategory('UNKNOWN'); // undefined
```

### `getErrorSeverity(code?)`

```ts
export function getErrorSeverity(code: string | undefined): ErrorSeverity;
```

Shorthand to extract just the severity level. Returns `'error'` for unknown codes (safe default).

```ts
getErrorSeverity('P100'); // 'warning'
getErrorSeverity('A500'); // 'error'
getErrorSeverity(undefined); // 'error'
```

### `getErrorAction(code?)`

```ts
export function getErrorAction(code: string | undefined): string | undefined;
```

Returns the suggested action string or `undefined` if none is defined for this code.

```ts
getErrorAction('N300'); // "Check your network connection"
getErrorAction('P103'); // "Install missing package"
getErrorAction('S600'); // undefined (no action for "not found")
```

### Category Predicates

```ts
export function isAuthError(code: string | undefined): boolean;
// true if code.startsWith('A5')

export function isNetworkError(code: string | undefined): boolean;
// true if code.startsWith('N3') || code.startsWith('R2')

export function isValidationError(code: string | undefined): boolean;
// true if code.startsWith('V4')
```

Used by the error link to route errors without repeated string comparisons:

```ts
if (isAuthError(errorCode)) {
  handleAuthError(message);
} else if (isNetworkError(errorCode)) {
  handleNetworkError(networkError);
}
```

---

## Structured Error Logging

**Source:** `core/src/utils/error-logging.ts:1–288`

The logging system provides structured, deduplicated, buffered error logging suitable for both
development debugging and future observability integration. It separates error logging from error
display, enabling independent evolution of diagnostics.

### Configuration Constants

```ts
const MAX_BUFFER_SIZE = 10; // Flush at 10 entries
const FLUSH_INTERVAL_MS = 60000; // Flush every 60 seconds (1 minute)
const THROTTLE_WINDOW_MS = 5000; // Deduplicate within 5 seconds
```

### `ErrorLogEntry` Type

```ts
export interface ErrorLogEntry {
  code?: string; // Error code (e.g., 'N300')
  message: string;
  operation?: string; // GraphQL operation name (if applicable)
  context?: Record<string, unknown>; // Extra diagnostic data
  timestamp: number; // Auto-generated: ms since epoch
  stack?: string; // Error stack trace (if available)
  url?: string; // Auto-captured: window.location.href
  component?: string; // Source component (for boundary errors)
}
```

`ErrorLogInput` is `Omit<ErrorLogEntry, 'timestamp' | 'url'>` — callers do not provide
auto-generated fields.

### `logError(entry)`

```ts
export function logError(entry: ErrorLogInput): void;
```

Core logging function. Deduplication is based on `code + message + operation`. If the same error
fires within 5 seconds it is silently dropped.

**Behavior by environment:**

| Environment     | Behavior                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Development** | Logs to console immediately with colored grouping                                             |
| **Production**  | Buffers entries; flushes when buffer reaches `MAX_BUFFER_SIZE` or `FLUSH_INTERVAL_MS` elapses |

**Example:**

```ts
logError({
  code: 'N300',
  message: 'Connection failed',
  operation: 'GetRouter',
  context: { routerId: 'abc123', attempt: 2 },
});
```

### `logGraphQLError(operation, error, context?)`

```ts
export function logGraphQLError(
  operation: string,
  error: { message: string; extensions?: { code?: string } },
  context?: Record<string, unknown>
): void;
```

Convenience wrapper for Apollo errors. Extracts `extensions.code` and calls `logError`.

**Called by:** `core/src/apollo/apollo-error-link.ts` on every GraphQL error.

### `logNetworkError(operation, error, context?)`

```ts
export function logNetworkError(
  operation: string,
  error: Error,
  context?: Record<string, unknown>
): void;
```

Logs network errors with default code `N302` (network timeout), since most Apollo network errors
don't carry structured codes.

**Called by:** `core/src/apollo/apollo-error-link.ts` on network failures.

### `logComponentError(component, error, errorInfo?)`

```ts
export function logComponentError(
  component: string,
  error: Error,
  errorInfo?: { componentStack?: string }
): void;
```

Intended for React error boundaries. Sets `component` on the log entry and includes the component
stack in context.

**Usage in error boundary:**

```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logComponentError('RouterCard', error, {
      componentStack: errorInfo.componentStack,
    });
  }
}
```

### `flushErrorBuffer()`

```ts
export function flushErrorBuffer(): void;
```

Force-flushes the production buffer immediately. Should be called on `window.beforeunload` to avoid
losing buffered errors on page close.

**Usage:**

```ts
window.addEventListener('beforeunload', flushErrorBuffer);
```

### `getErrorBufferSize()`

```ts
export function getErrorBufferSize(): number;
```

Returns the current number of entries waiting to be flushed. Useful for monitoring dashboards or
diagnostic panels.

---

## Enhanced React Hooks API

### `useQueryWithLoading<TData, TVariables>(query, options?)`

**Source:** `core/src/hooks/useQueryWithLoading.ts`

```ts
export interface QueryWithLoadingState<TData> {
  isInitialLoading: boolean; // loading && !data — show skeleton
  isRevalidating: boolean; // loading && !!data — show refresh indicator
  isStale: boolean; // explicit refetch in progress
  isLoading: boolean; // any loading state
  lastUpdated: Date | null; // approximate; null while loading
}

export function useQueryWithLoading<TData, TVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): UseQueryWithLoadingResult<TData, TVariables>;
```

Extends `useQuery` with differentiated loading states. The standard `loading` boolean cannot
distinguish between "first fetch" and "background refresh" — this hook provides that distinction.

**Usage:**

```tsx
function ResourceList() {
  const { data, isInitialLoading, isRevalidating } = useQueryWithLoading(GET_RESOURCES);

  if (isInitialLoading) {
    return <ResourceListSkeleton />; // Show skeleton on first load
  }

  return (
    <div>
      {isRevalidating && <RefreshSpinner />} // Show subtle indicator during background refresh
      <ResourceTable data={data.resources} />
    </div>
  );
}
```

### `useMutationWithLoading<TData, TVariables>(mutation, options?)`

**Source:** `core/src/hooks/useMutationWithLoading.ts`

```ts
export interface MutationWithLoadingState {
  isLoading: boolean; // Apollo loading flag
  isSuccess: boolean; // Set on onCompleted
  isError: boolean; // Set on onError
  error: ApolloError | null;
  reset: () => void; // Clear isSuccess / isError
}

export function useMutationWithLoading<TData, TVariables>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables>
): UseMutationWithLoadingResult<TData, TVariables>;
```

Wraps `useMutation` with explicit `isSuccess` and `isError` states. The shorthand `mutate` function
auto-clears these states before each execution.

**Usage:**

```tsx
function SaveButton() {
  const { mutate, isLoading, isSuccess, error } = useMutationWithLoading(SAVE_CONFIG);

  return (
    <>
      <Button
        onClick={() => mutate({ config })}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
      {isSuccess && <SuccessCheckmark />}
      {error && <ErrorAlert message={error.message} />}
    </>
  );
}
```

### `createOptimisticOptions<TData, TVariables>(config)`

```ts
export function createOptimisticOptions<TData, TVariables>(config: {
  optimisticResponse: OptimisticResponse<TData>;
  cacheUpdate?: (cache, data: TData) => void;
}): Partial<MutationHookOptions<TData, TVariables>>;
```

Helper for building optimistic mutation options from a typed response and optional cache updater.
Avoids `as any` casts.

**Usage:**

```ts
const { mutate } = useMutation(ENABLE_INTERFACE, {
  ...createOptimisticOptions({
    optimisticResponse: {
      enableInterface: { id: interfaceId, disabled: false },
    },
    cacheUpdate: (cache, data) => {
      cache.modify({
        fields: {
          interface(existing) {
            return { ...existing, ...data.enableInterface };
          },
        },
      });
    },
  }),
});
```

### `useGraphQLError(apolloError?, options?)`

**Source:** `core/src/hooks/useGraphQLError.ts`

```ts
export interface UseGraphQLErrorOptions {
  showToast?: boolean; // Auto-show notification (default: false)
  logErrors?: boolean; // Log via error-logging.ts (default: true)
  operationName?: string; // For structured log entries
  skipValidationErrors?: boolean; // Suppress V4xx (default: false)
}

export interface ProcessedError {
  message: string; // User-facing from getErrorInfo()
  severity: ErrorSeverity;
  code?: string;
  technicalMessage?: string; // Raw apolloError.message for debug
  recoverable: boolean;
  action?: string;
  isAuthError: boolean;
  isNetworkError: boolean;
  isValidationError: boolean;
  originalError?: ApolloError | Error;
}

export interface UseGraphQLErrorReturn {
  error: ProcessedError | null;
  hasError: boolean;
  clearError: () => void;
  showErrorToast: () => void;
  createRetryHandler: <T>(fn: () => Promise<T>) => () => Promise<T | undefined>;
}

export function useGraphQLError(
  apolloError: ApolloError | Error | undefined,
  options?: UseGraphQLErrorOptions
): UseGraphQLErrorReturn;
```

Transforms Apollo errors into `ProcessedError` objects with severity, recoverability, and action
classification.

**Usage with automatic toast:**

```tsx
function UpdateForm() {
  const [updateRouter] = useMutation(UPDATE_ROUTER);
  const { error } = useGraphQLError(apolloError, { showToast: true });

  return error && <ErrorCard title={error.message} />;
}
```

**Usage with retry handler:**

```tsx
const { error, createRetryHandler } = useGraphQLError(apolloError);

const handleSubmit = createRetryHandler(async () => {
  await updateRouter({ variables: { id, data } });
});
```

**Skipping validation errors (form handling):**

```tsx
const { error } = useGraphQLError(apolloError, {
  skipValidationErrors: true,
  // V4xx errors suppressed; React Hook Form displays field errors
});
```

#### Utility Exports

```ts
export function isApolloError(error: unknown): error is ApolloError;
export function getApolloErrorCode(error: ApolloError): string | undefined;
```

`getApolloErrorCode` extracts `graphQLErrors[0]?.extensions?.code` — the primary error code when
multiple errors are returned.

---

## See Also

- `./intro.md` — Library overview
- `./apollo-client.md` — Link chain assembly (error link position)
- `./axios-http-client.md` — Axios interceptor registration order
- `./authentication.md` — Session expiry handling (auth errors)
- `./offline-first.md` — How network errors feed the offline detector
- `./domain-query-hooks.md` — Domain hooks using `useQueryWithLoading` and `useMutationWithLoading`
