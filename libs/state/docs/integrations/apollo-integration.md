# Apollo Client & Zustand Integration

Apollo Client manages all server state (router config, logs, VPN lists, etc.) while Zustand stores manage UI state. The two systems are integrated through **Apollo Links** that access Zustand stores using `.getState()` to read current context (router ID, authentication tokens) without React hooks.

**Source:**
- `libs/api-client/core/src/apollo/apollo-auth-link.ts`
- `libs/api-client/core/src/apollo/apollo-error-link.ts`
- `libs/state/stores/src/index.ts`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ React Components                                            │
│ (useQuery, useMutation hooks)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Apollo Client                                               │
│ - InMemoryCache                                            │
│ - HTTP Link                                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Apollo Links (Middleware)                                  │
│                                                             │
│ 1. Auth Link: Reads useAuthStore.getState()               │
│    ↓ Injects X-Router-Id, Authorization headers           │
│                                                             │
│ 2. Error Link: Reads useNotificationStore.getState()      │
│    ↓ Updates useAuthStore on 401                          │
│    ↓ Shows error notifications                            │
│                                                             │
│ 3. WebSocket Link (for subscriptions)                     │
│    ↓ Reads connection state                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Zustand Stores                                              │
│                                                             │
│ useAuthStore    - JWT token, user session                  │
│ useConnectionStore - Current router ID, WebSocket state    │
│ useNotificationStore - Error/success toasts               │
└─────────────────────────────────────────────────────────────┘
```

## Pattern: Reading State Outside React

Apollo Links are middleware that runs **outside React hooks**. To access Zustand state, use `.getState()`:

```typescript
// ✅ CORRECT - getState() reads current state outside React
const { currentRouterId } = useConnectionStore.getState();
const token = getAuthToken(); // calls useAuthStore.getState()

// ❌ WRONG - Can't use hooks outside React components
const { currentRouterId } = useConnectionStore(); // Error!
```

### getState() Pattern

```typescript
import { useAuthStore, useConnectionStore } from '@nasnet/state/stores';

// In Apollo Link (not a React component)
export const authLink = setContext((_, { headers }) => {
  // Read current state without React hooks
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

## Apollo Auth Link

The **auth link** injects authentication context into every GraphQL request.

**Source:** `libs/api-client/core/src/apollo/apollo-auth-link.ts`

### How It Works

1. **Reads current router ID** from `useConnectionStore.getState()`
2. **Gets authorization header** (JWT or Basic auth) from `useAuthStore`
3. **Injects headers** into every GraphQL request

### Authentication Priority

The auth link tries authentication in this order:

```typescript
function getAuthorizationHeader(routerId: string | null): string | undefined {
  // 1. Try JWT Bearer token (primary)
  const jwtToken = getAuthToken(); // from useAuthStore
  if (jwtToken) {
    return `Bearer ${jwtToken}`;
  }

  // 2. Fall back to Basic auth (router-specific credentials)
  const credentials = getStoredCredentials(routerId); // from sessionStorage
  if (credentials) {
    return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  return undefined;
}
```

### Headers Injected

```typescript
// Example request headers after auth link
{
  'X-Router-Id': 'router-123',           // Current router ID
  'Authorization': 'Bearer eyJhb...',    // JWT token OR
  'Authorization': 'Basic dXNlcjpwYXNz', // Basic auth
}
```

### Usage in Apollo Setup

```typescript
import { ApolloClient, from } from '@apollo/client';
import { authLink } from '@nasnet/api-client/core';

const client = new ApolloClient({
  link: from([
    authLink,      // Inject auth headers first
    errorLink,     // Handle errors
    httpLink,      // Execute HTTP request
  ]),
  cache: new InMemoryCache(),
});
```

### Custom Token Getter

If you need custom authentication logic:

```typescript
import { createAuthLink } from '@nasnet/api-client/core';

function getCustomToken(): string | null {
  // Your custom logic here
  return localStorage.getItem('custom-token');
}

const customAuthLink = createAuthLink(getCustomToken);
```

## Apollo Error Link

The **error link** handles GraphQL and network errors, updating stores and notifying users.

**Source:** `libs/api-client/core/src/apollo/apollo-error-link.ts`

### Error Handling Flow

```
GraphQL Request
    │
    ├─ GraphQL Error (error code)
    │   │
    │   ├─ UNAUTHENTICATED / 401
    │   │  └─ clearAuth() + show "Session expired" toast
    │   │
    │   ├─ FORBIDDEN / 403
    │   │  └─ show "Access denied" toast
    │   │
    │   ├─ VALIDATION_FAILED
    │   │  └─ skip (handled by form validation)
    │   │
    │   └─ Other error
    │      └─ show user-friendly error message
    │
    └─ Network Error (HTTP status)
        │
        ├─ 401 Unauthorized
        │  └─ clearAuth() + redirect to login
        │
        ├─ 403 Forbidden
        │  └─ show "Access denied" toast
        │
        └─ Connection error
           └─ show "Network error" notification
```

### Error Categories

#### Authentication Errors (UNAUTHENTICATED, 401)

```typescript
function handleAuthError(message?: string) {
  // Clear auth state
  useAuthStore.getState().clearAuth();

  // Show notification
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: 'Session expired',
    message: message || 'Your session has expired. Please log in again.',
  });

  // Dispatch event for listeners (e.g., router redirect)
  window.dispatchEvent(new CustomEvent('auth:expired'));
}
```

#### Network Errors

```typescript
function handleNetworkError(error: Error) {
  // Show notification
  useNotificationStore.getState().addNotification({
    type: 'error',
    title: 'Network error',
    message: 'Unable to reach the server. Please check your connection.',
  });

  // Dispatch event for network tracking
  window.dispatchEvent(
    new CustomEvent('network:error', { detail: { error } })
  );
}
```

#### Validation Errors

```typescript
// Validation errors are skipped in the error link
// They're handled at the form level with React Hook Form
if (checkValidationError(errorCode)) {
  if (import.meta.env.DEV) {
    console.warn('[Validation Error - handled by form]:', message);
  }
  continue; // Skip showing error toast
}
```

### Error Codes

| Code | Handling |
|------|----------|
| `UNAUTHENTICATED` | Clear auth, show "Session expired", dispatch `auth:expired` event |
| `FORBIDDEN` | Show "Access denied" notification |
| `NOT_FOUND` | Show "Resource not found" notification |
| `VALIDATION_FAILED` | Skip (form handles) |
| HTTP `401` | Same as UNAUTHENTICATED |
| HTTP `403` | Same as FORBIDDEN |
| Network timeout/offline | Show "Network error" notification |

### Usage in Apollo Setup

```typescript
import { ApolloClient, from } from '@apollo/client';
import { errorLink } from '@nasnet/api-client/core';

const client = new ApolloClient({
  link: from([
    errorLink,     // Handle errors first
    authLink,      // Add auth headers
    httpLink,      // Execute HTTP request
  ]),
  cache: new InMemoryCache(),
});
```

### Custom Error Handlers

For custom error handling:

```typescript
import { createErrorLink } from '@nasnet/api-client/core';

const customErrorLink = createErrorLink({
  onAuthError: (message) => {
    console.log('Auth failed:', message);
    // Custom redirect logic
    window.location.href = '/login';
  },
  onNetworkError: (error) => {
    console.error('Network failed:', error);
    // Custom recovery logic
  },
});
```

## Bidirectional Flow: Subscriptions to Zustand

GraphQL **subscriptions** deliver real-time data that needs to update Zustand stores.

### Pattern: Update Store on Subscription Data

```typescript
// Example: Interface statistics subscription updates interface-stats store
import { useSubscribeInterfaceStats } from '@nasnet/api-client/queries';
import { useInterfaceStatsStore } from '@nasnet/state/stores';

function InterfaceStatsMonitor() {
  const { pollingInterval } = useInterfaceStatsStore();

  // Subscribe with current polling interval
  const { data } = useSubscribeInterfaceStats({
    routerId: 'router-123',
    interval: pollingInterval,
  });

  // Update store when polling interval changes
  useEffect(() => {
    // Apollo will re-subscribe with new interval
  }, [pollingInterval]);

  return <div>{/* Display stats */}</div>;
}
```

### Real Example: Alert Notifications

```typescript
// Subscribe to alerts
const { data: alertData } = useSubscribeAlerts({ routerId });

// Store notifications in useAlertNotificationStore
useEffect(() => {
  if (alertData?.alert) {
    useAlertNotificationStore.getState().addNotification({
      alertId: alertData.alert.id,
      title: alertData.alert.title,
      message: alertData.alert.message,
      severity: alertData.alert.severity,
      deviceId: alertData.alert.deviceId,
      ruleId: alertData.alert.ruleId,
    });
  }
}, [alertData]);
```

## WebSocket Client State

The Apollo WebSocket client maintains connection state in `useConnectionStore`.

### Connection State Shape

```typescript
interface ConnectionState {
  // Current router ID
  currentRouterId: string | null;

  // WebSocket connection state
  websocketConnected: boolean;
  websocketError: Error | null;

  // Connection metrics
  lastMessageAt?: string;
  messageCount: number;

  // Actions
  setCurrentRouterId: (id: string | null) => void;
  setWebsocketConnected: (connected: boolean) => void;
  setWebsocketError: (error: Error | null) => void;
}
```

### WebSocket Lifecycle

```typescript
// Apollo WebSocket client
const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_WS_URL,

    // Track connection state
    on: {
      connected() {
        useConnectionStore.getState().setWebsocketConnected(true);
      },
      error(error) {
        useConnectionStore.getState().setWebsocketError(error);
      },
      closed() {
        useConnectionStore.getState().setWebsocketConnected(false);
      },
    },
  })
);
```

## Complete Apollo Setup Example

```typescript
// libs/api-client/core/src/apollo/client.ts

import { ApolloClient, from, InMemoryCache, ApolloLink } from '@apollo/client';
import { createHttpLink } from '@apollo/client/link/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';

import { authLink } from './apollo-auth-link';
import { errorLink } from './apollo-error-link';

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL + '/graphql',
  credentials: 'include', // Send cookies
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_WS_URL,
  })
);

// Split: subscriptions use ws, others use http
const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

// Chain all links in order
export const apolloClient = new ApolloClient({
  link: from([
    errorLink,      // Error handling (catches errors)
    authLink,       // Auth context (adds headers)
    splitLink,      // HTTP or WebSocket (executes request)
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
    mutate: { errorPolicy: 'all' },
  },
});
```

## Token Refresh Integration

The **token refresh** system proactively renews JWT tokens before expiration to maintain user sessions seamlessly.

**Source:**
- `libs/state/stores/src/hooks/useTokenRefresh.ts`
- `libs/api-client/core/src/apollo/apollo-auth-link.ts`

### How Token Refresh Works

```
┌──────────────────────────────────────┐
│ useTokenRefresh Hook                 │
│ - Checks every 60 seconds            │
│ - Monitors token expiry              │
└──────────────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Is token expiring    │
        │ in next 5 minutes?   │
        └──────────┬───────────┘
                   │
         ┌─────────┴──────────┐
         │ YES               NO
         ▼                    │
┌────────────────────┐        │
│ Attempt Refresh    │        │
│ (max 3 attempts)   │        │
└────────┬───────────┘        │
         │                    │
    ┌────┴──────┐             │
    │            │             │
    ▼            ▼             │
 Success     Failure           │
    │         (retry)          │
    │            │             │
    │      Max attempts       │
    │         exceeded?        │
    │            │             │
    │      ┌─────┴─────┐       │
    │      │ YES   NO  │       │
    │      ▼       ▼   │       │
    │   Re-auth  Retry │       │
    │   Required       │       │
    │                  ▼       │
    └─────────────────────────┘
        Update Apollo Link
        with new token
```

### Constants

```typescript
// Check interval for token expiry (1 minute)
const REFRESH_CHECK_INTERVAL_MS = 60_000;

// Maximum refresh attempts before requiring re-authentication
const MAX_REFRESH_ATTEMPTS = 3;

// Proactive refresh threshold (5 minutes before expiry)
const REFRESH_THRESHOLD_MS = 5 * 60_000;
```

### useTokenRefresh Hook

Monitors token expiry and automatically refreshes tokens before they expire.

**Options:**
```typescript
interface UseTokenRefreshOptions {
  /**
   * Callback to perform the actual token refresh
   * Should call your refresh token endpoint
   */
  refreshTokenFn: () => Promise<TokenRefreshResult>;

  /**
   * Callback when re-authentication is required
   * Called after max refresh attempts exceeded
   */
  onReauthRequired?: () => void;

  /**
   * Whether to show notifications (default: true)
   */
  showNotifications?: boolean;

  /**
   * Check interval in milliseconds (default: 60000)
   */
  checkInterval?: number;
}

interface TokenRefreshResult {
  token: string;           // New access token
  expiresAt: Date;         // Expiration time
  refreshToken?: string;   // Optional new refresh token
}
```

**Integration with Apollo:**

```typescript
import { useTokenRefresh } from '@nasnet/state/stores';
import { useAuthMutation } from '@nasnet/api-client/queries';

function AuthProvider({ children }) {
  // Set up token refresh hook
  useTokenRefresh({
    refreshTokenFn: async () => {
      // Call Apollo mutation to refresh token
      const { data } = await refreshTokenMutation();
      return {
        token: data.refreshToken.token,
        expiresAt: new Date(data.refreshToken.expiresAt),
        refreshToken: data.refreshToken.refreshToken,
      };
    },

    onReauthRequired: () => {
      // Redirect to login
      window.location.href = '/login';
    },

    showNotifications: true,  // Show "Session expiring" toast if max retries exceeded
  });

  return children;
}
```

**Flow diagram:**

```
1. Token check interval fires (every 60s)
2. Is token expiring in next 5 minutes?
   ├─ NO → Wait for next interval
   └─ YES → Attempt refresh
3. Call refreshTokenFn()
4. Success?
   ├─ YES → Update auth store with new token
   │        Update Apollo auth link headers
   │        Pending requests auto-retry ✓
   └─ NO → Increment retry attempts
5. Retry count < 3?
   ├─ YES → Retry (with backoff delay)
   └─ NO → Call onReauthRequired() callback
           Show "Session expiring" toast
           User must log in again
```

**Key benefits:**
- Users never see "Session expired" errors during normal operation
- Background refresh keeps session alive across long workflows
- Seamless retry of failed requests after token update
- Configurable retry attempts and intervals

---

## Error Recovery Integration

The **error recovery** system provides utilities for automatically retrying failed operations and recovering from various error states.

**Source:**
- `libs/state/stores/src/utils/recovery.ts`
- `libs/api-client/core/src/apollo/apollo-error-link.ts`

### Recovery Architecture

```
┌─────────────────────────────────┐
│ GraphQL Operation Fails          │
│ (Network or GraphQL error)       │
└──────────────────┬──────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Error Link Catches   │
        │ (middleware layer)   │
        └──────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    GraphQL Error      Network Error
    (400-level)        (connectivity)
         │                   │
         ▼                   ▼
   ┌──────────┐      ┌──────────────┐
   │ Check    │      │ Retry with   │
   │ error    │      │ exponential  │
   │ code     │      │ backoff      │
   └──┬───────┘      └──┬───────────┘
      │                 │
      ├─ 401 → Clear auth, show "Session expired"
      ├─ 403 → Show "Access denied"
      ├─ 404 → Show "Resource not found"
      └─ Other → Show generic error + offer recovery
```

### withRetry Function

Executes an operation with automatic retry and exponential backoff.

**Signature:**
```typescript
function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>>
```

**Configuration:**
```typescript
interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Whether to show notifications (default: true) */
  showNotifications?: boolean;

  /** Callback before each retry */
  onRetry?: (attempt: number, error: Error) => void;

  /** Callback when max retries exceeded */
  onMaxRetriesExceeded?: (error: Error) => void;

  /** Predicate to determine if error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
```

**Example: Retry failed GraphQL query**

```typescript
import { withRetry } from '@nasnet/state/stores';

// Retry fetching router data
const result = await withRetry(
  () => fetchRouterConfig(routerId),
  {
    maxRetries: 3,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}: ${error.message}`);
    },
    shouldRetry: (error) => {
      // Don't retry auth errors
      return error.message !== 'Unauthorized';
    },
  }
);

if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Failed after', result.attempts, 'attempts:', result.error);
}
```

**Backoff timing:**
```
Attempt 0: ~1s delay
Attempt 1: ~2s delay
Attempt 2: ~4s delay
Attempt 3: ~8s delay (max)
```

### createRecoveryActions Function

Creates a set of recovery actions for an error, giving users options to recover.

**Returns:**
```typescript
interface RecoveryActions {
  retry: () => Promise<void>;           // Retry the operation
  clearCacheAndRetry: () => Promise<void>; // Clear Apollo cache, then retry
  copyReport: () => Promise<void>;      // Copy error details to clipboard
  reportIssue: () => void;              // Open GitHub issue reporter
  reload: () => void;                   // Reload the page
  goHome: () => void;                   // Navigate to home
  goBack: () => void;                   // Navigate back in history
}
```

**Example: Error recovery UI**

```typescript
import { createRecoveryActions } from '@nasnet/state/stores';

function ErrorCard({ error, onRetry }) {
  const actions = createRecoveryActions(error, onRetry, {
    component: 'RouterDetailPanel',
  });

  return (
    <div className="error-card">
      <h3>Error loading router</h3>
      <p>{error.message}</p>

      <div className="actions">
        <Button onClick={actions.retry}>
          Retry
        </Button>
        <Button onClick={actions.clearCacheAndRetry}>
          Clear Cache & Retry
        </Button>
        <Button onClick={actions.copyReport}>
          Copy Error Details
        </Button>
        <Button onClick={actions.reportIssue}>
          Report Issue
        </Button>
        <Button onClick={actions.goHome}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
```

### Cache Clearing for Data Corruption

Clear Apollo cache and Zustand stores when data corruption is suspected:

```typescript
import { clearAllCache, clearCacheAndReload } from '@nasnet/state/stores';

// Option 1: Clear cache and stay on page
await clearAllCache();
// User can retry operations now

// Option 2: Clear cache and reload
// (for severe corruption)
await clearCacheAndReload();  // Reloads after 500ms
```

**What gets cleared:**
- Apollo InMemoryCache
- localStorage cache entries (apollo-*, *-cache)
- sessionStorage cache entries (apollo-*, *-cache)
- Zustand stores are NOT automatically cleared (only cache)

---

## Reconnection Integration

The **reconnection** system handles WebSocket reconnection with exponential backoff and integrates with Apollo subscriptions.

**Source:**
- `libs/state/stores/src/utils/reconnect.ts`
- `libs/api-client/core/src/apollo/` (WebSocket link)

### Reconnection Architecture

```
┌──────────────────────────┐
│ WebSocket Disconnects    │
│ (network loss)           │
└──────────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Attempt Reconnect    │
    │ (exponential backoff) │
    └──────────┬───────────┘
               │
        ┌──────┴──────┐
        │             │
     Success        Failure
        │             │
        ▼             ▼
    ┌────┐      Attempt < 10?
    │ OK │      ├─ YES → Wait & retry
    └────┘      └─ NO → Give up, show error
                       "Maximum reconnection attempts exceeded"
```

### calculateBackoff Function

Calculates exponential backoff with jitter to prevent thundering herd.

**Formula:**
```
delay = min(baseDelay * 2^attempt + jitter, maxDelay)
       = min(1000 * 2^n + random(0-1000), 30000)
```

**Timing:**
```typescript
calculateBackoff(0) → ~1-2s
calculateBackoff(1) → ~2-3s
calculateBackoff(2) → ~4-5s
calculateBackoff(3) → ~8-9s
calculateBackoff(4) → ~16-17s
calculateBackoff(5+) → ~30s (capped)
```

**Example:**
```typescript
import { calculateBackoff } from '@nasnet/state/stores';

// Get delay for attempt 2
const delay = calculateBackoff(2);  // ~4000-5000ms
await sleep(delay);
await reconnect();
```

### createReconnectionManager Function

Creates a manager for handling WebSocket reconnection with status tracking.

**Configuration:**
```typescript
interface ReconnectionManagerConfig {
  maxAttempts?: number;        // Default: 10
  connect: () => Promise<void>; // Actual connection function
  onStatusChange?: (status: WebSocketStatus) => void;
  showNotifications?: boolean;  // Default: true
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

**Example: Apollo WebSocket reconnection**

```typescript
import { createReconnectionManager } from '@nasnet/state/stores';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// Create reconnection manager
const reconnectionManager = createReconnectionManager({
  maxAttempts: 10,
  connect: async () => {
    // Create WebSocket connection
    const wsLink = new GraphQLWsLink(
      createClient({
        url: import.meta.env.VITE_WS_URL,
      })
    );
    // Connection is ready after this call
  },
  onStatusChange: (status) => {
    console.log('WebSocket status:', status);
    useConnectionStore.getState().setWsStatus(status);
  },
  showNotifications: true,  // Show toast on connection/reconnection
});

// Handle connection loss
window.addEventListener('offline', () => {
  reconnectionManager.start();
});

// Successful connection
window.addEventListener('online', () => {
  reconnectionManager.reset();
  reconnectionManager.start();
});
```

**Manager API:**
```typescript
manager.start();              // Start reconnection attempts
manager.stop();               // Stop trying to reconnect
manager.reset();              // Reset attempt counter
manager.getAttempts();        // Get current attempt number
manager.isActive();           // Check if reconnecting
```

### createLatencyUpdater Function

Debounced latency updater to track WebSocket ping latency without excessive store updates.

**Usage:**
```typescript
import { createLatencyUpdater } from '@nasnet/state/stores';

const updateLatency = createLatencyUpdater(100);  // Update at most every 100ms

// In WebSocket ping handler
wsClient.on('pong', (time) => {
  const latencyMs = Date.now() - time;
  updateLatency(currentRouterId, latencyMs);  // Debounced update
});
```

**Benefits:**
- Prevents excessive Zustand updates during high-frequency pings
- Limits store updates to max 10/second (100ms interval)
- Keeps connection latency visible without performance impact

### Integration with Connection Store

The reconnection utilities update `useConnectionStore`:

```typescript
import {
  useConnectionStore,
  type WebSocketStatus,
} from '@nasnet/state/stores';

// Reconnection manager updates these
useConnectionStore.getState().setWsStatus('connecting');
useConnectionStore.getState().setWsStatus('connected');
useConnectionStore.getState().setWsStatus('error', 'Max attempts exceeded');
useConnectionStore.getState().incrementReconnectAttempts();
useConnectionStore.getState().resetReconnection();
useConnectionStore.getState().updateLatency(routerId, latencyMs);
```

**Reading connection state:**
```typescript
// Check if WebSocket is connected
const connected = useConnectionStore(state => state.websocketConnected);

// Get current latency
const latency = useConnectionStore(state => state.latencies[currentRouterId]);

// Get reconnection attempts
const attempts = useConnectionStore(state => state.reconnectAttempts);
```

---

## Testing Apollo-Zustand Integration

### Mock Auth Store in Tests

```typescript
import { useAuthStore } from '@nasnet/state/stores';
import { renderHook } from '@testing-library/react';

test('auth link injects token', () => {
  // Mock the auth store
  useAuthStore.setState({ token: 'test-token-123' });

  // Your link should now use 'test-token-123'
  const headers = authLink.getContext();
  expect(headers.Authorization).toBe('Bearer test-token-123');

  // Clean up
  useAuthStore.getState().clearAuth();
});
```

### Mock Error Handler

```typescript
test('error link handles 401 errors', async () => {
  // Mock notification store to track calls
  const addNotificationSpy = jest.spyOn(
    useNotificationStore.getState(),
    'addNotification'
  );

  // Trigger 401 error
  const error = new Error('Unauthorized');
  (error as any).statusCode = 401;

  errorLink.onError(error);

  // Verify notification was shown
  expect(addNotificationSpy).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'error' })
  );
});
```

---

## Section Guide

- **Token Refresh Integration** - Proactive JWT token refresh to maintain sessions (see `useTokenRefresh` hook)
- **Error Recovery Integration** - Retry logic, cache clearing, and error reporting (see `withRetry`, `createRecoveryActions`)
- **Reconnection Integration** - WebSocket reconnection with exponential backoff (see `createReconnectionManager`, `createLatencyUpdater`)

---

## Summary

Apollo Client and Zustand integration enables:

1. **Auth Context**: Auth link reads `useAuthStore.getState()` to inject JWT tokens
2. **Error Handling**: Error link updates `useAuthStore` on 401, shows notifications via `useNotificationStore`
3. **Real-time Updates**: Subscriptions push data into Zustand stores (e.g., alerts, statistics)
4. **Connection State**: WebSocket state lives in `useConnectionStore` for reactive UI
5. **Separation of Concerns**: Apollo manages server state, Zustand manages UI state

This architecture keeps server and UI state cleanly separated while allowing them to communicate when needed.
