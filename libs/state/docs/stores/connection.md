# Connection Stores (useConnectionStore & useNetworkStore)

WebSocket connection management, per-router status tracking, and network quality monitoring.

**Sources:**
- `libs/state/stores/src/connection/connection.store.ts`
- `libs/state/stores/src/connection/network.store.ts`
- `libs/state/stores/src/utils/reconnect.ts`

## Connection Store (useConnectionStore)

Manages WebSocket connection status and per-router connection metadata.

### State Shape

```typescript
interface ConnectionState {
  // Global WebSocket status
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  wsError: string | null;               // Error message if status is 'error'

  // Per-router connections map
  routers: Record<string, RouterConnection>;
  activeRouterId: string | null;        // Currently active router

  // Reconnection state
  reconnectAttempts: number;            // Current attempt count (0-10)
  maxReconnectAttempts: number;         // Max attempts before giving up (10)
  isReconnecting: boolean;              // Currently attempting reconnection

  // Legacy compatibility (deprecated but preserved)
  state: 'connected' | 'disconnected' | 'reconnecting';
  lastConnectedAt: Date | null;
  currentRouterId: string | null;
  currentRouterIp: string | null;
}

interface RouterConnection {
  routerId: string;                     // Router ID
  status: WebSocketStatus;              // Connection status
  protocol: 'rest' | 'api' | 'ssh';    // Communication protocol
  latencyMs: number | null;             // Current latency
  lastConnected: Date | null;           // Last successful connection time
  lastError: string | null;             // Last error message
}
```

### WebSocket Status Actions

**`setWsStatus(status, error?)`** - Set WebSocket connection status
```typescript
const { setWsStatus } = useConnectionStore();

// Connection successful
setWsStatus('connected');

// Connection error
setWsStatus('error', 'Failed to establish WebSocket');

// Attempting reconnect
setWsStatus('connecting');
```

**Status transitions:**
- `disconnected` → `connecting` → `connected` (success)
- `disconnected` → `connecting` → `error` (failure)
- `connected` → `disconnected` (lost connection)

### Router Connection Actions

**`setRouterConnection(routerId, connection)`** - Set/update router connection info
```typescript
const { setRouterConnection } = useConnectionStore();

setRouterConnection('router-1', {
  status: 'connected',
  protocol: 'api',
  latencyMs: 45,
  lastConnected: new Date(),
  lastError: null,
});
```

**`setActiveRouter(routerId)`** - Switch active router
```typescript
const { setActiveRouter } = useConnectionStore();

// Switch to router-1
setActiveRouter('router-1');

// Clear active router
setActiveRouter(null);
```

**`updateLatency(routerId, latencyMs)`** - Record latency measurement (debounced)
```typescript
const { updateLatency } = useConnectionStore();

// Call frequently from ping/heartbeat
updateLatency('router-1', 42);
```

### Reconnection Actions

**`incrementReconnectAttempts()`** - Increment attempt counter
```typescript
const { incrementReconnectAttempts } = useConnectionStore();

// Called by reconnection manager on each failed attempt
incrementReconnectAttempts();
```

**`resetReconnection()`** - Reset attempt counter and isReconnecting flag
```typescript
const { resetReconnection } = useConnectionStore();

// Called on successful connection
resetReconnection();
```

**`hasExceededMaxAttempts(): boolean`** - Check if max attempts reached
```typescript
const { hasExceededMaxAttempts } = useConnectionStore();

if (hasExceededMaxAttempts()) {
  // Show manual retry UI
  showError('Unable to reconnect. Please check your connection.');
}
```

### Selectors

| Selector | Returns | Usage |
|----------|---------|-------|
| `selectWsStatus` | WebSocketStatus | Current WebSocket status |
| `selectIsConnected` | `boolean` | Whether connected (wsStatus === 'connected') |
| `selectIsReconnecting` | `boolean` | Whether attempting reconnection |
| `selectActiveRouterId` | `string \| null` | Currently active router |
| `selectActiveRouterConnection` | RouterConnection \| null | Connection info for active router |
| `selectReconnectAttempts` | `number` | Current attempt count |
| `selectHasExceededMaxAttempts` | `boolean` | Whether max attempts exceeded |

**Example:**

```typescript
// Only re-render when connection status changes
const isConnected = useConnectionStore(s => s.wsStatus === 'connected');

// Get active router connection info
const router = useConnectionStore(s => {
  if (!s.activeRouterId) return null;
  return s.routers[s.activeRouterId];
});
```

## Network Store (useNetworkStore)

Monitors browser online status, backend reachability, and network quality.

### State Shape

```typescript
interface NetworkState {
  // Connectivity status
  isOnline: boolean;                    // navigator.onLine (browser online/offline)
  isRouterReachable: boolean;           // Backend health endpoint reachable
  isRouterConnected: boolean;           // WebSocket subscription active

  // Metrics
  lastSuccessfulRequest: Date | null;   // Timestamp of last successful API call
  reconnectAttempts: number;            // Reconnection attempts since last success

  // NAS-4.15: Enhanced status tracking
  wasOffline: boolean;                  // Was recently offline (for status message)
  quality: 'excellent' | 'good' | 'poor' | 'offline';  // Network quality
  latencyMs: number | null;             // Last measured latency
  lastError: string | null;             // Last network error
  lastErrorTime: Date | null;           // When last error occurred
  listenersInitialized: boolean;        // Event listeners set up
}
```

### Status Actions

**`setOnline(online)`** - Update browser online status
```typescript
const { setOnline } = useNetworkStore();

// Called by online/offline event listeners
setOnline(true);   // Browser went online
setOnline(false);  // Browser went offline
```

**`setRouterReachable(reachable)`** - Update backend reachability
```typescript
const { setRouterReachable } = useNetworkStore();

// Called by health check endpoint
if (healthCheckOK) {
  setRouterReachable(true);
} else {
  setRouterReachable(false);
}
```

**`setRouterConnected(connected)`** - Update WebSocket connection
```typescript
const { setRouterConnected } = useNetworkStore();

// Called when subscription connects/disconnects
setRouterConnected(true);   // WebSocket connected
setRouterConnected(false);  // WebSocket disconnected
```

### Metrics Actions

**`recordSuccessfulRequest()`** - Record successful API request
```typescript
const { recordSuccessfulRequest } = useNetworkStore();

// Called on successful GraphQL query
recordSuccessfulRequest();
// Resets: lastSuccessfulRequest, reconnectAttempts, lastError
```

**`incrementReconnectAttempts()`** - Increment retry counter
```typescript
const { incrementReconnectAttempts } = useNetworkStore();

// Called on API failure
incrementReconnectAttempts();
```

**`resetReconnectAttempts()`** - Reset retry counter
```typescript
const { resetReconnectAttempts } = useNetworkStore();
resetReconnectAttempts();
```

### Quality Tracking (NAS-4.15)

**`setQuality(quality)`** - Set network quality assessment
```typescript
const { setQuality } = useNetworkStore();

setQuality('excellent');  // < 100ms latency
setQuality('good');       // < 300ms latency
setQuality('poor');       // >= 300ms latency
setQuality('offline');    // No internet
```

**`updateLatency(latencyMs)`** - Record latency and update quality
```typescript
const { updateLatency } = useNetworkStore();

updateLatency(42);
// Auto-updates quality: excellent
```

**`recordNetworkError(error)`** - Log network error
```typescript
const { recordNetworkError } = useNetworkStore();

recordNetworkError('CORS error: No Access-Control-Allow-Origin');
```

**`clearWasOffline()`** - Clear "was offline" flag
```typescript
const { clearWasOffline } = useNetworkStore();

// Call after showing "back online" message
clearWasOffline();
```

### Event Listener Management

**`initializeListeners()`** - Set up browser online/offline events
```typescript
const { initializeListeners } = useNetworkStore();

// Call once on app initialization
useEffect(() => {
  useNetworkStore.getState().initializeListeners();
}, []);
```

**`cleanupListeners()`** - Remove event listeners on app unmount
```typescript
const { cleanupListeners } = useNetworkStore();

useEffect(() => {
  const { initializeListeners, cleanupListeners } = useNetworkStore.getState();

  initializeListeners();

  return () => {
    cleanupListeners();
  };
}, []);
```

### Selectors

| Selector | Returns | Usage |
|----------|---------|-------|
| `selectIsFullyConnected` | `boolean` | All layers connected (online + reachable + subscribed) |
| `selectIsDegraded` | `boolean` | Online but backend issues |
| `selectIsOffline` | `boolean` | Browser offline |
| `selectNetworkQuality` | NetworkQuality | Quality assessment |
| `selectLatency` | `number \| null` | Current latency in ms |
| `selectWasOffline` | `boolean` | Was recently offline |
| `selectLastError` | `string \| null` | Last error message |

**Example:**

```typescript
// Show offline banner
const isOffline = useNetworkStore(s => s.isOnline === false);

// Check if fully operational
const isFullyConnected = useNetworkStore(s =>
  s.isOnline && s.isRouterReachable && s.isRouterConnected
);

// Monitor quality
const { quality, latencyMs } = useNetworkStore(
  s => ({ quality: s.quality, latencyMs: s.latencyMs }),
  shallow
);
```

## Reconnection Manager

Exponential backoff reconnection utility for WebSocket reconnection.

**Source:** `libs/state/stores/src/utils/reconnect.ts`

### Configuration

```typescript
interface ReconnectionManagerConfig {
  maxAttempts?: number;                 // Default: 10
  connect: () => Promise<void>;         // Actual connection function
  onStatusChange?: (status: WebSocketStatus) => void;
  showNotifications?: boolean;          // Default: true
}
```

### Creating a Manager

```typescript
import { createReconnectionManager } from '@nasnet/state/stores';

const reconnectManager = createReconnectionManager({
  maxAttempts: 10,

  connect: async () => {
    await websocket.connect();
  },

  onStatusChange: (status) => {
    console.log('Connection status:', status);
  },

  showNotifications: true,
});
```

### Manager API

**`start()`** - Begin reconnection attempts
```typescript
reconnectManager.start();
// Starts exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
```

**`stop()`** - Stop reconnection attempts
```typescript
reconnectManager.stop();
// Cancels pending timeout
```

**`reset()`** - Reset attempt counter
```typescript
reconnectManager.reset();
// Sets attempts back to 0
```

**`getAttempts(): number`** - Get current attempt count
```typescript
const attempts = reconnectManager.getAttempts();
```

**`isActive(): boolean`** - Check if reconnecting
```typescript
if (reconnectManager.isActive()) {
  // Currently attempting to reconnect
}
```

### Backoff Formula

```
delay = min(baseDelay * 2^attempt + jitter, maxDelay)

baseDelay = 1000ms
maxDelay = 30000ms
jitter = 0-1000ms random

Attempt 0: ~1-2s
Attempt 1: ~2-3s
Attempt 2: ~4-5s
Attempt 3: ~8-9s
Attempt 4: ~16-17s
Attempt 5+: ~30s (capped)
```

**Prevents thundering herd** by adding random jitter.

### Helper Functions

**`calculateBackoff(attempt)`** - Calculate delay for attempt
```typescript
const delay = calculateBackoff(0);  // ~1000ms
const delay = calculateBackoff(4);  // ~16000ms
```

**`sleep(ms)`** - Promise-based sleep utility
```typescript
await sleep(1000);  // Wait 1 second
```

## Integration with Connection Store

The reconnection manager automatically updates connection store:

```typescript
const reconnectManager = createReconnectionManager({
  connect: async () => {
    await websocket.connect();
  },
  onStatusChange: (status) => {
    // Automatically updates useConnectionStore
    useConnectionStore.getState().setWsStatus(status);
  },
});

// When reconnection succeeds:
// - resets reconnectAttempts → 0
// - sets wsStatus → 'connected'
// - shows success toast

// When max attempts exceeded:
// - sets wsStatus → 'error'
// - shows error toast with retry option
```

## Latency Debouncing

**`createLatencyUpdater(intervalMs)`** - Debounced latency updates
```typescript
import { createLatencyUpdater } from '@nasnet/state/stores';

const updateLatency = createLatencyUpdater(100); // Update max 10x per second

// In ping handler (called very frequently)
updateLatency('router-1', 42);  // Batched updates
```

**Why debounce?** Prevents excessive store updates from high-frequency pings.

## Connection Flow Diagram

```
Browser Events (online/offline)
         ↓
   setOnline()
         ↓
Network Status Listeners
         ↓
API Requests
         ↓
   recordSuccessfulRequest() ← Success
   incrementReconnectAttempts() ← Failure
         ↓
GraphQL Subscription
         ↓
   setRouterConnected() ← Connected/Disconnected
         ↓
useConnectionStore
         ↓
WebSocket Status
         ↓
Reconnection Manager (if needed)
         ↓
createReconnectionManager() → Exponential backoff
         ↓
Connection restored or max attempts exceeded
```

## Usage Examples

### Connecting to Router

```typescript
async function connectToRouter(routerId: string, ip: string) {
  const { setWsStatus } = useConnectionStore();

  setWsStatus('connecting');

  try {
    const ws = new WebSocket(`ws://${ip}:8080`);

    ws.onopen = () => {
      setWsStatus('connected');
      useConnectionStore.getState().setRouterConnection(routerId, {
        status: 'connected',
        protocol: 'api',
        lastConnected: new Date(),
        lastError: null,
      });
    };

    ws.onerror = () => {
      setWsStatus('error', 'WebSocket connection failed');
    };
  } catch (error) {
    setWsStatus('error', error.message);
  }
}
```

### Monitoring Network Quality

```typescript
function setupNetworkMonitoring() {
  const { updateLatency, recordNetworkError } = useNetworkStore();

  // Health check every 30 seconds
  setInterval(async () => {
    const start = Date.now();

    try {
      const response = await fetch('/api/health');
      const latency = Date.now() - start;

      updateLatency(latency);
      useNetworkStore.getState().recordSuccessfulRequest();
    } catch (error) {
      recordNetworkError(error.message);
    }
  }, 30000);
}
```

### Showing Connection Status

```typescript
function ConnectionStatus() {
  const isOnline = useNetworkStore(s => s.isOnline);
  const quality = useNetworkStore(s => s.quality);
  const latency = useNetworkStore(s => s.latencyMs);

  if (!isOnline) {
    return <OfflineBanner />;
  }

  return (
    <StatusBar>
      Quality: {quality} | Latency: {latency}ms
    </StatusBar>
  );
}
```

## Performance Optimization

1. **Always use selectors:**
   ```typescript
   // ✅ Good
   const isConnected = useConnectionStore(s => s.wsStatus === 'connected');

   // ❌ Bad
   const { wsStatus } = useConnectionStore();
   ```

2. **Batch router updates:**
   ```typescript
   // ✅ Good: Single call
   setRouterConnection('router-1', { status, protocol, latency });

   // ❌ Bad: Multiple calls
   setStatus('router-1', status);
   setProtocol('router-1', protocol);
   setLatency('router-1', latency);
   ```

3. **Debounce latency updates:**
   ```typescript
   const updateLatency = createLatencyUpdater(100);

   // Can call frequently without store churn
   ws.onmessage = (msg) => {
     const latency = calculateLatency(msg.timestamp);
     updateLatency(routerId, latency);
   };
   ```

See `Docs/architecture/frontend-architecture.md` for state architecture overview.
