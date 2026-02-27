# Router Connection

The router connection system handles discovering routers on the network, validating credentials, establishing connections, and maintaining them over time with heartbeat monitoring and automatic reconnection.

**Key files:**
- `libs/features/router-discovery/src/` — discovery UI components and services
- `libs/state/stores/src/connection/connection.store.ts` — connection state (Zustand)
- `libs/state/stores/src/router/router.store.ts` — router list and metadata
- `apps/connect/src/app/hooks/useConnectionHeartbeat.ts` — heartbeat monitoring
- `apps/connect/src/app/hooks/useConnectionToast.tsx` — connection status toasts
- `libs/api-client/queries/src/discovery/useTestConnection.ts` — credential validation
- `libs/api-client/core/` — Apollo client with auth links

**Cross-references:**
- See `../state-management/zustand-stores.md` for store patterns
- See `../data-fetching/graphql-hooks.md` for Apollo client setup

---

## Router Discovery

Before connecting to a router, users must find it. There are two methods:

### Automatic: Network Scanning

`libs/features/router-discovery/src/components/NetworkScanner.tsx`

Scans a subnet to find MikroTik routers:

```typescript
interface NetworkScannerProps {
  onScanComplete?: (results: ScanResult[]) => void;
  onRouterSelect?: (result: ScanResult) => void;
  defaultSubnet?: string;
}
```

The scanner:
1. Validates the subnet string via `validateSubnet()`
2. Gets the default subnet via `getDefaultSubnet()` (from browser network info or fallback to `192.168.88.0/24`)
3. Calls `startNetworkScan(subnet)` from `scanService`
4. The backend scans the subnet by sending ARP/ICMP probes and checking for RouterOS API on port 8728
5. Returns `ScanResult[]` with IP address, MAC, hostname, and RouterOS version when detected

Progress is shown with animated feedback (`framer-motion`) during the scan, with a cancel button.

```typescript
interface ScanResult {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  routerOsVersion?: string;
  isReachable: boolean;
}
```

### Manual: Direct Entry

`libs/features/router-discovery/src/components/ManualRouterEntry.tsx`

For routers on a different subnet or when scanning isn't possible:

```typescript
interface ManualRouterEntryProps {
  onRouterAdd?: (ipAddress: string) => void;
}
```

Validates the IP address format before submitting.

### Router List

`libs/features/router-discovery/src/components/RouterList.tsx`

Displays discovered/saved routers with connection status indicator. Used on the router selection page.

`libs/features/router-discovery/src/components/RouterCard.tsx`

Per-router card showing:
- Router IP and hostname
- RouterOS version (if discovered)
- Connection status badge (connected/disconnected)
- Last connected timestamp
- Connect button

---

## Credential Flow

After selecting a router (discovered or manually entered), the user enters credentials.

`libs/features/router-discovery/src/components/CredentialDialog.tsx`

```typescript
interface CredentialDialogProps {
  isOpen: boolean;
  routerIp: string;
  routerName?: string;
  isValidating?: boolean;
  validationError?: string;
  onSubmit?: (credentials: RouterCredentials, saveCredentials: boolean) => void;
  onCancel?: () => void;
  initialCredentials?: RouterCredentials;
}
```

Default credentials auto-fill from `DEFAULT_CREDENTIALS` (username: `admin`, password: empty string) — the MikroTik factory default.

The `saveCredentials` flag controls whether credentials are stored in the router store for future connections.

### Credential Validation

`libs/api-client/queries/src/discovery/useTestConnection.ts`

Uses React Query (not Apollo) for the credential validation mutation:

```typescript
const testConnection = useTestConnection();

testConnection.mutate(
  { ipAddress: '192.168.88.1', credentials: { username: 'admin', password: '' } },
  {
    onSuccess: (result) => {
      if (result.isValid) {
        // result.routerInfo.identity — router name
        // result.routerInfo.version  — RouterOS version
        proceed();
      } else {
        setError(result.error); // 'Invalid credentials', 'Connection refused', etc.
      }
    },
  }
);
```

The validation calls the backend which attempts to connect to the RouterOS API (`/rest/system/identity`) and returns the router identity on success.

---

## Connection State Store

`libs/state/stores/src/connection/connection.store.ts`

Manages WebSocket status, per-router connections, and reconnection state.

### State Shape

```typescript
interface ConnectionState {
  // Global WebSocket status
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  wsError: string | null;

  // Per-router connection info
  routers: Record<string, RouterConnection>;
  activeRouterId: string | null;

  // Reconnection tracking
  reconnectAttempts: number;
  maxReconnectAttempts: number;  // Default: 10
  isReconnecting: boolean;

  // Legacy compatibility fields (deprecated but present)
  state: 'connected' | 'disconnected' | 'reconnecting';
  currentRouterId: string | null;
  currentRouterIp: string | null;
}

interface RouterConnection {
  routerId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  protocol: 'rest' | 'api' | 'ssh';
  latencyMs: number | null;
  lastConnected: Date | null;
  lastError: string | null;
}
```

### Persistence

Only `activeRouterId` persists to localStorage. All connection status resets on page reload (forces a fresh connection check).

### Key Actions

```typescript
const store = useConnectionStore();

// Update WebSocket status
store.setWsStatus('connected');
store.setWsStatus('error', 'Connection refused');

// Register/update a router connection
store.setRouterConnection('router-123', {
  status: 'connected',
  protocol: 'rest',
  latencyMs: 12,
  lastConnected: new Date(),
});

// Set active router
store.setActiveRouter('router-123');

// Update latency (debounced internally)
store.updateLatency('router-123', 15);

// Reconnection tracking
store.incrementReconnectAttempts();
store.resetReconnection();
const exceeded = store.hasExceededMaxAttempts(); // boolean
```

### Selector Usage (Performance Critical)

```typescript
// ✅ GOOD: Only re-renders when wsStatus changes
const wsStatus = useConnectionStore(state => state.wsStatus);

// ✅ GOOD: Multiple fields with shallow comparison
import { shallow } from 'zustand/shallow';
const { wsStatus, isReconnecting } = useConnectionStore(
  state => ({ wsStatus: state.wsStatus, isReconnecting: state.isReconnecting }),
  shallow
);

// ❌ BAD: Re-renders on ANY store change
const store = useConnectionStore();
```

---

## WebSocket Lifecycle

NasNet uses Apollo Client's WebSocket link for GraphQL subscriptions (real-time router data). The connection lifecycle:

```
Page load → Apollo initializes WS link
                │
                ▼
        [wsStatus: 'connecting']
                │
                ├─ success ──► [wsStatus: 'connected']
                │               │
                │               └─ heartbeat active
                │
                └─ failure ──► [wsStatus: 'error']
                                │
                                ▼
                        exponential backoff reconnect
                        (attempts: 1, 2, ... max 10)
                                │
                        [wsStatus: 'connecting']
```

The Apollo WebSocket link is configured in `libs/api-client/core/` with subscription support. When the WS connects, it's used for all GraphQL subscriptions. REST queries fall back to HTTP.

---

## Heartbeat Monitoring

`apps/connect/src/app/hooks/useConnectionHeartbeat.ts`

Periodically validates the connection by pinging the router:

```typescript
// Mount once at app level
function App() {
  useConnectionHeartbeat();
  return <Router />;
}
```

Behavior:
- Runs every **30 seconds** (when `currentRouterIp` is set)
- Sends `GET /system/identity` to RouterOS REST API with a 5-second timeout
- On success: calls `store.setConnected()` if not already connected
- On failure: calls `store.setDisconnected()` if not already disconnected
- Cleans up interval on unmount or when router IP changes

```typescript
const HEARTBEAT_CONFIG = {
  interval: 30_000,  // 30 seconds
  timeout: 5000,     // 5 second request timeout
};
```

For manual one-off checks:

```typescript
import { testConnection } from '@/app/hooks/useConnectionHeartbeat';

const isConnected = await testConnection('192.168.88.1');
```

---

## Connection Status Toast

`apps/connect/src/app/hooks/useConnectionToast.tsx`

Watches `wsStatus` and shows toast notifications on status changes:

- `'connected'` → shows success toast (if previously disconnected)
- `'disconnected'` → shows warning toast "Connection lost to router"
- `'error'` → shows error toast with reason
- Suppresses duplicate toasts (debounced)

Mount once in the app layout:

```typescript
function AppLayout() {
  useConnectionToast();
  return <Outlet />;
}
```

---

## Reconnection Strategy

The connection store tracks reconnection attempts with exponential backoff:

1. Disconnect detected → `reconnectAttempts` increments
2. Apollo WS link attempts reconnect (uses its own backoff internally)
3. Store tracks attempt count for UI feedback
4. After 10 failed attempts (`maxReconnectAttempts`): `hasExceededMaxAttempts()` returns true
5. UI shows "Manual retry" button instead of auto-reconnecting

On successful reconnect: `resetReconnection()` clears attempt counter.

---

## Protocol Selection

When a router is connected, the backend selects the communication protocol based on what's available:

| Protocol | Port | Usage |
|----------|------|-------|
| REST | 443/80 | Primary (RouterOS 7+) |
| RouterOS API | 8728/8729 | Fallback (RouterOS 6) |
| SSH | 22 | Command-level operations |

The active protocol is stored in `RouterConnection.protocol`. The `ProtocolSelector` component (in `libs/features/configuration-import/src/components/ProtocolSelector.tsx`) is used in the configuration import wizard to let users choose which protocol to use for bulk command execution.

Available protocols are fetched via:

```typescript
const { api, ssh, telnet, isLoading } = useEnabledProtocols(routerIp);
```

---

## Connection Status Indicators

The UI exposes connection status through:

1. **AppHeader** — global WS status indicator (green dot / red dot)
2. **RouterCard** — per-router status in the router list
3. **RouterHeader** (in `apps/connect/src/app/routes/router-panel/components/RouterHeader.tsx`) — active router status in the panel header

Status display mapping:

| wsStatus | Indicator | Label |
|----------|-----------|-------|
| connected | Green dot | "Connected" |
| connecting | Amber pulse | "Connecting..." |
| disconnected | Gray dot | "Disconnected" |
| error | Red dot | Error message |
