---
sidebar_position: 4
title: Hooks & Utility Functions
---

# Hooks & Utility Functions

Comprehensive reference for authentication hooks, route guards, and error recovery utilities.

## Route Guard Hooks

Route guards for TanStack Router and component-level authentication checks.

**Source:** `libs/state/stores/src/hooks/useRouteGuard.ts`

### `requireAuth` — TanStack Router Guard

Protects routes from unauthenticated access. Redirects to login with return URL preservation.

**Type signature:**
```typescript
function requireAuth({ location }: { location: RouteLocation }): void
```

**Usage with TanStack Router:**

```tsx
import { createRoute } from '@tanstack/react-router';
import { requireAuth } from '@nasnet/state/stores';

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,  // Apply guard here
  component: Dashboard,
});
```

**How it works:**
1. Checks if `isAuthenticated` is true
2. Validates token expiry
3. If not authenticated or token expired:
   - Redirects to `/login`
   - Preserves current URL in `redirect` search param
   - User can be redirected back after login

**Behavior:**
- ✅ Authenticated + valid token → Allow access
- ❌ Not authenticated OR token expired → Redirect to `/login?redirect=/dashboard`

### `requirePermission` — Permission Gate

Creates a route guard that checks for specific permissions.

**Type signature:**
```typescript
function requirePermission(permission: string): (context: { location: RouteLocation }) => void
```

**Usage:**

```tsx
export const adminRoute = createRoute({
  beforeLoad: requirePermission('admin'),  // Only admins
  component: AdminPanel,
});

export const reportsRoute = createRoute({
  beforeLoad: requirePermission('reports:read'),
  component: ReportsPage,
});
```

**How it works:**
1. First checks authentication (calls `requireAuth`)
2. Then checks user permissions
3. If permission missing:
   - Redirects to `/unauthorized`
   - Includes required permission in search params

**Behavior:**
- ✅ Authenticated + has permission → Allow access
- ❌ Authenticated but missing permission → Redirect to `/unauthorized?required=admin`
- ❌ Not authenticated → Redirect to `/login`

### `requireGuest` — Guest-Only Guard

Redirects authenticated users away from guest-only pages (login, register, etc).

**Type signature:**
```typescript
function requireGuest({ location }: { location: RouteLocation }): void
```

**Usage:**

```tsx
export const loginRoute = createRoute({
  beforeLoad: requireGuest,
  component: LoginPage,
});
```

**How it works:**
1. Checks if user is authenticated AND token is valid
2. If both true:
   - Gets redirect URL from `search.redirect` param
   - Redirects to that URL or `/dashboard` if not specified

**Behavior:**
- ✅ Not authenticated → Allow access to login page
- ❌ Authenticated + valid token → Redirect to dashboard (or redirect param)

## Component-Level Auth Hooks

React hooks for checking auth status within components.

### `useRequireAuth` — Component-Level Auth Check

Provides current auth status for conditional rendering.

**Type signature:**
```typescript
interface AuthStatus {
  isAuthenticated: boolean;    // User logged in with valid token
  isExpired: boolean;          // Token has expired
  isExpiringSoon: boolean;     // Token expires within 5 minutes
}

function useRequireAuth(): AuthStatus
```

**Usage:**

```tsx
function ProtectedContent() {
  const { isAuthenticated, isExpired, isExpiringSoon } = useRequireAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isExpiringSoon) {
    return <SessionExpiringDialog />;
  }

  return <DashboardContent />;
}
```

**When to use:**
- Conditional rendering based on auth status
- Showing session expiry warnings
- Protecting component-level features

### `useHasPermission` — Permission Check Hook

Check if user has a specific permission.

**Type signature:**
```typescript
function useHasPermission(permission: string): boolean
```

**Usage:**

```tsx
function AdminButton() {
  const hasAdminAccess = useHasPermission('admin');

  if (!hasAdminAccess) return null;  // Don't render button

  return <Button onClick={openAdminPanel}>Admin Panel</Button>;
}
```

**Permissions example:**
- `'admin'` - Full system access
- `'reports:read'` - Can view reports
- `'reports:write'` - Can create/edit reports
- `'system:backup'` - Can create backups

### `useCurrentUser` — Get User Profile

Get current logged-in user information.

**Type signature:**
```typescript
interface User {
  id: string;
  username: string;
  email: string | null;
  permissions: string[];
}

function useCurrentUser(): User | null
```

**Usage:**

```tsx
function UserGreeting() {
  const user = useCurrentUser();

  if (!user) return <LoginPrompt />;

  return <div>Welcome, {user.username}!</div>;
}

function PermissionsList() {
  const user = useCurrentUser();
  return (
    <ul>
      {user?.permissions.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
```

### `useAuthActions` — Auth Action Functions

Get stable references to auth actions.

**Type signature:**
```typescript
interface AuthActions {
  login: (token, user, expiresAt, refreshToken) => void;
  logout: () => void;
  updateActivity: () => void;
}

function useAuthActions(): AuthActions
```

**Usage:**

```tsx
function LogoutButton() {
  const { logout } = useAuthActions();

  return (
    <Button onClick={logout} variant="destructive">
      Logout
    </Button>
  );
}
```

## Token Refresh Hook

**Source:** `libs/state/stores/src/hooks/useTokenRefresh.ts`

### `useTokenRefresh` — Automatic Token Refresh

Proactively refreshes JWT tokens before expiry to maintain sessions.

**Type signature:**
```typescript
export interface UseTokenRefreshOptions {
  refreshTokenFn: () => Promise<TokenRefreshResult>;
  onReauthRequired?: () => void;
  showNotifications?: boolean;
  checkInterval?: number;  // Default: 60000ms (1 minute)
}

function useTokenRefresh(options: UseTokenRefreshOptions): void
```

**Constants:**
```typescript
const REFRESH_CHECK_INTERVAL_MS = 60_000;      // Check every 1 minute
const MAX_REFRESH_ATTEMPTS = 3;                 // Max 3 attempts before re-auth
```

**Usage:**

```tsx
function AuthProvider({ children }) {
  const { refresh } = useAuthQuery();

  useTokenRefresh({
    refreshTokenFn: async () => {
      const result = await refresh();
      return {
        token: result.token,
        expiresAt: new Date(result.expiresAt),
        refreshToken: result.refreshToken,
      };
    },
    onReauthRequired: () => {
      // User needs to log in again
      navigate('/login');
    },
    showNotifications: true,  // Show toast on errors
  });

  return children;
}
```

**How it works:**
1. Checks token expiry every 60 seconds
2. If token expires within 5 minutes AND should retry:
   - Calls `refreshTokenFn()`
   - Updates auth store with new token
   - Resets refresh attempts on success
3. If refresh fails:
   - Increments attempt counter
   - Retries up to 3 times
   - After 3 failures: shows notification + calls `onReauthRequired()`

**Refresh flow:**
```
60s interval check
  ↓
Token expiring within 5 minutes? AND can retry?
  ├─ YES → Call refreshTokenFn()
  │        ├─ SUCCESS → setAuth() + resetAttempts()
  │        └─ FAIL → incrementAttempts() → Check if >= 3
  │                   └─ YES → Show error + call onReauthRequired()
  │
  └─ NO → Continue waiting
```

**When refresh fails:**
- After 3 failed attempts, user sees notification: *"Your session is about to expire. Please log in again."*
- `onReauthRequired()` callback is triggered
- Typically redirects to login page

### Helper: `createMutationRefreshFn` — Apollo Integration

Create a refresh function from Apollo GraphQL mutation.

**Type signature:**
```typescript
function createMutationRefreshFn(
  mutation: () => Promise<{ token: string; expiresAt: string; refreshToken?: string }>
): TokenRefreshFn
```

**Usage:**

```tsx
import { useRefreshTokenMutation } from '@nasnet/api-client/queries';

function AuthProvider({ children }) {
  const [refreshMutation] = useRefreshTokenMutation();

  useTokenRefresh({
    refreshTokenFn: createMutationRefreshFn(async () => {
      const result = await refreshMutation();
      return {
        token: result.data.refreshToken.token,
        expiresAt: result.data.refreshToken.expiresAt,
        refreshToken: result.data.refreshToken.refreshToken,
      };
    }),
  });

  return children;
}
```

## Reconnection Utilities

**Source:** `libs/state/stores/src/utils/reconnect.ts`

WebSocket reconnection with exponential backoff.

### `calculateBackoff` — Exponential Backoff Calculation

Calculate delay for retry attempt with jitter.

**Type signature:**
```typescript
function calculateBackoff(attempt: number): number
```

**Formula:** `min(baseDelay * 2^attempt + jitter, maxDelay)`

**Delay schedule:**
| Attempt | Delay | Total |
|---------|-------|-------|
| 0 | ~1-2s | ~1-2s |
| 1 | ~2-3s | ~3-5s |
| 2 | ~4-5s | ~7-10s |
| 3 | ~8-9s | ~15-19s |
| 4 | ~16-17s | ~31-36s |
| 5+ | ~30s (capped) | 30+ seconds |

**Usage:**

```typescript
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    await connect();
    break; // Success
  } catch (error) {
    const delay = calculateBackoff(attempt);
    console.log(`Retrying in ${delay}ms...`);
    await sleep(delay);
  }
}
```

**Why jitter?** Prevents thundering herd — when many clients reconnect simultaneously, they don't all retry at the same time.

### `sleep` — Promise-Based Delay

Sleep for specified duration.

**Type signature:**
```typescript
function sleep(ms: number): Promise<void>
```

**Usage:**

```typescript
await sleep(1000);  // Wait 1 second
// Or in loops
await sleep(calculateBackoff(attempt));
```

### `createReconnectionManager` — Reconnection State Machine

Manages reconnection with exponential backoff and connection store integration.

**Type signature:**
```typescript
interface ReconnectionManagerConfig {
  maxAttempts?: number;                        // Default: 10
  connect: () => Promise<void>;                // Connection function
  onStatusChange?: (status: WebSocketStatus) => void;
  showNotifications?: boolean;                 // Default: true
}

interface ReconnectionManager {
  start: () => void;                           // Start reconnection
  stop: () => void;                            // Stop reconnection
  reset: () => void;                           // Reset attempt counter
  getAttempts: () => number;                   // Get current attempt count
  isActive: () => boolean;                     // Check if reconnecting
}

function createReconnectionManager(config: ReconnectionManagerConfig): ReconnectionManager
```

**Usage:**

```typescript
const manager = createReconnectionManager({
  maxAttempts: 10,
  connect: async () => {
    await websocket.connect();
  },
  onStatusChange: (status) => {
    console.log('WebSocket status:', status);
  },
  showNotifications: true,
});

// Start reconnecting
manager.start();

// Check status
if (manager.isActive()) {
  console.log(`Reconnection attempt ${manager.getAttempts()} of 10`);
}

// Stop when done
manager.stop();

// Reset for new connection attempt
manager.reset();
```

**Behavior:**
- Automatically updates connection store status
- Shows toast notifications on error/success
- Stops after max attempts (default 10)
- Integrates with notification store

### `createLatencyUpdater` — Debounced Latency Tracking

Create a debounced latency update function.

**Type signature:**
```typescript
function createLatencyUpdater(intervalMs?: number): (routerId: string, latencyMs: number) => void
```

**Default interval:** 100ms

**Usage:**

```typescript
const updateLatency = createLatencyUpdater(100);  // Throttle to max 1 update per 100ms

// In WebSocket ping handler
websocket.on('pong', (latencyMs) => {
  updateLatency(routerId, latencyMs);
  // Updates connection store, but max once per 100ms
});
```

**Why throttle?** Without throttling, frequent pings cause excessive store updates and re-renders. Throttling limits updates to reasonable intervals.

## Error Recovery Utilities

**Source:** `libs/state/stores/src/utils/recovery.ts`

Retry, cache clearing, and error reporting.

### `withRetry` — Execute with Automatic Retry

Execute operation with exponential backoff retry.

**Type signature:**
```typescript
interface RetryConfig {
  maxRetries?: number;                         // Default: 3
  initialDelayMs?: number;                     // Default: 1000
  maxDelayMs?: number;                         // Default: 30000
  showNotifications?: boolean;                 // Default: true
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesExceeded?: (error: Error) => void;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): Promise<RetryResult<T>>
```

**Usage:**

```typescript
const result = await withRetry(
  () => fetchRouterData(routerId),
  {
    maxRetries: 3,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}: ${error.message}`);
    },
    shouldRetry: (error) => {
      // Don't retry authentication errors
      return error.code !== 'AUTH_FAILED';
    },
  }
);

if (result.success) {
  console.log('Data:', result.data);
  console.log(`Succeeded on attempt ${result.attempts}`);
} else {
  console.error('Failed after', result.attempts, 'attempts');
  console.error('Error:', result.error?.message);
}
```

### `createRetryHandler` — Reusable Retry Function

Create a function that can be called to retry an operation.

**Type signature:**
```typescript
function createRetryHandler<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): () => Promise<RetryResult<T>>
```

**Usage:**

```tsx
function DataComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const retry = createRetryHandler(
    async () => {
      const result = await fetchData();
      setData(result);
      setError(null);
    },
    {
      onMaxRetriesExceeded: (err) => setError(err),
    }
  );

  return error ? (
    <ErrorCard onRetry={retry} />
  ) : (
    <DataDisplay data={data} />
  );
}
```

### `clearAllCache` — Clear All Cache Data

Clear Apollo cache and localStorage cache keys.

**Type signature:**
```typescript
async function clearAllCache(): Promise<void>
```

**What it clears:**
- All localStorage keys starting with `apollo-` or containing `-cache`
- All sessionStorage cache keys
- Shows success notification

**Usage:**

```typescript
// In error recovery flow
await clearAllCache();
// Wait for notification to show
await sleep(500);
// Reload page
window.location.reload();
```

### `clearCacheAndReload` — Clear Cache and Reload

Clear cache and reload page in one call.

**Type signature:**
```typescript
async function clearCacheAndReload(): Promise<void>
```

**Usage:**

```typescript
// When user clicks "Clear cache and reload"
await clearCacheAndReload();
// Function handles everything automatically
```

### `generateIssueReport` — Generate Error Report

Create structured error report for bug reporting.

**Type signature:**
```typescript
interface IssueReport {
  message: string;           // Error message
  code?: string;             // Error code
  stack?: string;            // Stack trace
  component?: string;        // Component name
  url: string;               // Current URL
  timestamp: string;         // ISO timestamp
  userAgent: string;         // Browser info
  context?: Record<string, unknown>;  // Additional context
}

function generateIssueReport(
  error: Error,
  context?: Record<string, unknown>
): IssueReport
```

**Usage:**

```typescript
const report = generateIssueReport(error, {
  routerId: 'router-123',
  action: 'backup-restore',
});

console.log(JSON.stringify(report, null, 2));
```

### `copyIssueReport` — Copy Report to Clipboard

Generate error report and copy to clipboard.

**Type signature:**
```typescript
async function copyIssueReport(
  error: Error,
  context?: Record<string, unknown>
): Promise<void>
```

**Usage:**

```tsx
<Button
  onClick={() =>
    copyIssueReport(error, { routerId: selectedRouterId })
  }
>
  Copy Error Details
</Button>
```

**Behavior:**
- Copies JSON report to clipboard
- Shows success notification
- Falls back to console log if clipboard unavailable

### `openIssueReporter` — Open GitHub Issue Template

Open GitHub issues page with pre-filled error report.

**Type signature:**
```typescript
function openIssueReporter(
  error: Error,
  context?: Record<string, unknown>
): void
```

**Usage:**

```tsx
<Button
  onClick={() =>
    openIssueReporter(error, {
      feature: 'router-backup',
    })
  }
>
  Report on GitHub
</Button>
```

**What it does:**
- Generates structured issue body
- Opens GitHub issues page
- Pre-fills title and description
- Includes error details, context, and JSON report

### `createRecoveryActions` — Grouped Recovery Actions

Create set of recovery actions for an error.

**Type signature:**
```typescript
interface RecoveryActions {
  retry: () => Promise<void>;
  clearCacheAndRetry: () => Promise<void>;
  copyReport: () => Promise<void>;
  reportIssue: () => void;
  reload: () => void;
  goHome: () => void;
  goBack: () => void;
}

function createRecoveryActions(
  error: Error,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions
```

**Usage:**

```tsx
function ErrorBoundary({ error, onRetry }) {
  const actions = createRecoveryActions(error, onRetry, {
    feature: 'dashboard',
  });

  return (
    <ErrorDisplay
      error={error}
      onRetry={actions.retry}
      onClearCache={actions.clearCacheAndRetry}
      onReport={actions.reportIssue}
    />
  );
}
```

### `useRecoveryActions` — Hook for Recovery Actions

React hook for creating recovery actions.

**Type signature:**
```typescript
function useRecoveryActions(
  error: Error | null,
  retryFn?: () => Promise<void>,
  context?: Record<string, unknown>
): RecoveryActions | null
```

**Usage:**

```tsx
function DataComponent() {
  const { data, error, refetch } = useQuery(GET_DATA);
  const recovery = useRecoveryActions(error, refetch);

  if (error && recovery) {
    return (
      <ErrorCard
        error={error}
        onRetry={recovery.retry}
        onReport={recovery.reportIssue}
      />
    );
  }

  return <DataDisplay data={data} />;
}
```

## Decision Matrix

When to use each utility:

| Scenario | Use | Example |
|----------|-----|---------|
| Protect route from unauth | `requireAuth` | Dashboard route |
| Require specific permission | `requirePermission` | Admin panel route |
| Redirect authenticated users | `requireGuest` | Login page route |
| Check auth in component | `useRequireAuth` | Conditional rendering |
| Check single permission | `useHasPermission` | Show/hide button |
| Maintain token freshness | `useTokenRefresh` | AuthProvider setup |
| Auto-reconnect WebSocket | `createReconnectionManager` | Connection loss handling |
| Retry failed operations | `withRetry` | Fetch errors |
| Report errors to users | `createRecoveryActions` | Error boundary |
| Clear corrupted data | `clearAllCache` | Severe errors |

## See Also

- **[Auth Store](./auth.md)** — Token, user, and session state
- **[Router Store](./router.md)** — Router discovery and selection
- **[Connection Store](./connection.md)** — WebSocket connection state
