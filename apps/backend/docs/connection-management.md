# Connection Management

> Per-router connection pool with circuit breaker protection, exponential-backoff reconnection,
> periodic health monitoring, and hardware/software capability detection with 24-hour caching.

**Packages:** `internal/connection/`, `internal/capability/` **Key Files:** `connection/pool.go`,
`connection/circuit.go`, `connection/manager_reconnect.go`, `connection/state.go`,
`connection/manager.go`, `connection/health.go`, `capability/detector.go`, `capability/cache.go`,
`capability/types.go` **Prerequisites:** [See: router-communication.md §Protocol Adapters], [See:
event-system.md
§Event Bus], [See: application-bootstrap.md §Boot Sequence]

---

## Overview

Connection management in NasNetConnect is split into two cooperating packages:

- **`internal/connection`** — Manages the lifecycle of each router connection (connect, disconnect,
  reconnect, health check) using a connection pool, per-router circuit breakers, and
  exponential-backoff retry loops.
- **`internal/capability`** — Detects what the connected router supports (hardware, software
  version, container support) and caches the result for 24 hours with background lazy refresh.

Both packages are initialized during application bootstrap and wired together through the `Manager`
type, which exposes a single, consistent API for the rest of the codebase to use.

---

## Architecture

```
                    ┌────────────────────────────────────┐
                    │           Manager                   │
                    │  ┌──────────┐  ┌────────────────┐  │
 GraphQL Resolvers  │  │   Pool   │  │ CircuitBreaker │  │
 ──────────────────►│  │ [routerId│  │ Factory        │  │
 Bootstrap / Events │  │ →Conn]   │  └────────────────┘  │
                    │  └──────────┘         │             │
                    │        │              │per router   │
                    │        ▼              ▼             │
                    │  ┌──────────────────────────────┐  │
                    │  │ Connection                    │  │
                    │  │  Status (State machine)       │  │
                    │  │  Client (RouterClient iface)  │  │
                    │  │  CircuitBreaker               │  │
                    │  │  reconnectCancel              │  │
                    │  │  healthCancel                 │  │
                    │  └──────────────────────────────┘  │
                    └────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      startReconnection  startHealthMonitoring  EventBus
       (goroutine)         (goroutine)        (StatusChanged)

                    ┌────────────────────────────────────┐
                    │   capability.Service               │
                    │  ┌──────────┐  ┌──────────────┐   │
                    │  │ Detector │  │ MemoryCache  │   │
                    │  │ (5 steps)│  │ (24h TTL)    │   │
                    │  └──────────┘  └──────────────┘   │
                    └────────────────────────────────────┘
```

---

## Package Reference: `internal/connection`

### Protocols

```go
type Protocol string

const (
    ProtocolREST    Protocol = "REST"     // RouterOS REST API (7.1+), port 80/443
    ProtocolAPI     Protocol = "API"      // Binary API, port 8728
    ProtocolAPISSL  Protocol = "API_SSL"  // TLS binary API, port 8729
    ProtocolSSH     Protocol = "SSH"      // SSH, port 22
    ProtocolTelnet  Protocol = "TELNET"   // Telnet, port 23
)
```

The `RouterClient` interface abstracts protocol adapters:

```go
type RouterClient interface {
    Connect(ctx context.Context) error
    Disconnect() error
    IsConnected() bool
    Ping(ctx context.Context) error
    Protocol() Protocol
    Version() string
}
```

A `ClientFactory` is provided at `Manager` construction time; it selects the appropriate adapter
based on the connection configuration and available protocol.

---

### Connection State Machine (`state.go`)

Each connection progresses through a finite set of states with validated transitions:

```
DISCONNECTED ──► CONNECTING ──► CONNECTED ──► RECONNECTING ──► CONNECTED
                     │                               │
                     └──────────► ERROR ◄────────────┘
                                   │
                                   └──► DISCONNECTED (manual reset)
```

| State               | Meaning                                           |
| ------------------- | ------------------------------------------------- |
| `StateDisconnected` | No active connection                              |
| `StateConnecting`   | Connection attempt in progress                    |
| `StateConnected`    | Active and responsive                             |
| `StateReconnecting` | Lost connection, exponential-backoff retry active |
| `StateError`        | Permanently failed; manual reconnect required     |

`Status.SetState(newState)` enforces the transition table — invalid transitions return
`ErrInvalidStateTransition`. Convenience methods also record timestamps and reset counters:

```go
status.SetConnected(protocol, version) // records ConnectedAt, clears error fields
status.SetDisconnected(reason)         // records DisconnectedAt
status.SetReconnecting(attempt, nextAt)
status.SetError(errMsg)                // records LastError, LastErrorTime
status.RecordHealthCheck(passed bool)  // tracks HealthChecksPassed/Failed
```

`DisconnectReason` encodes why the connection dropped:

```go
const (
    DisconnectReasonManual          // user action — no auto-reconnect
    DisconnectReasonNetworkFailure  // transient — triggers auto-reconnect
    DisconnectReasonAuthFailure     // config error — no auto-reconnect
    DisconnectReasonTimeout         // transient — triggers auto-reconnect
    DisconnectReasonCircuitOpen     // circuit breaker handles recovery
    DisconnectReasonShutdown        // graceful app exit
)
```

`reason.ShouldAutoReconnect()` returns `true` only for `NetworkFailure` and `Timeout`.

The `Status` struct surfaces all observable connection fields to the GraphQL API:

```go
type Status struct {
    State               State
    Protocol            string
    PreferredProtocol   string
    ConnectedAt         *time.Time
    DisconnectedAt      *time.Time
    LastError           string
    LastErrorTime       *time.Time
    DisconnectReason    DisconnectReason
    ReconnectAttempts   int
    NextReconnectAt     *time.Time
    CircuitBreakerState string   // "CLOSED", "OPEN", "HALF_OPEN"
    Version             string
    LastHealthCheck     *time.Time
    HealthChecksPassed  int
    HealthChecksFailed  int
}
```

---

### Connection Pool (`pool.go`)

`Pool` is a thread-safe map of `routerID → *Connection`:

```go
type Pool struct { /* sync.RWMutex-guarded map */ }

func NewPool() *Pool                       // unlimited connections
func NewPoolWithLimit(max int) *Pool       // returns nil from GetOrCreate if full

func (p *Pool) Get(routerID) *Connection
func (p *Pool) GetOrCreate(routerID, Config, *CircuitBreaker) *Connection
func (p *Pool) Add(conn *Connection)
func (p *Pool) Remove(routerID) *Connection
func (p *Pool) GetAll() []*Connection
func (p *Pool) Count() int
func (p *Pool) CountByState(state State) int
func (p *Pool) CloseAll(ctx) error   // cancels goroutines, disconnects all clients
```

`Connection` holds the per-router state:

```go
type Connection struct {
    RouterID        string
    Status          *Status
    Client          RouterClient
    CircuitBreaker  *CircuitBreaker
    // private: config, reconnectCancel, healthCancel, mu, manualDisconnect
}
```

Thread-safe accessors use `sync.RWMutex`:

```go
conn.IsConnected() bool
conn.UpdateStatus(func(*Status))     // atomic write with lock
conn.GetStatus() Status              // returns a copy
conn.SetClient(RouterClient)
conn.GetClient() RouterClient
conn.SetPreferredProtocol(Protocol)
conn.SetManuallyDisconnected(bool)
```

Reconnect rate-limiting (10-second minimum between manual attempts):

```go
canAttempt, waitTime := conn.CanAttemptReconnect()
conn.RecordReconnectAttempt()
```

`TransitionError` is returned when an invalid state transition is attempted:

```go
type TransitionError struct {
    RouterID string
    From, To State
    Reason   string
}
```

---

### Circuit Breaker (`circuit.go`)

Each router connection has its own `CircuitBreaker` instance backed by
`github.com/sony/gobreaker/v2`.

**Default configuration** (`DefaultCircuitBreakerConfig()`):

| Setting       | Default   | Meaning                             |
| ------------- | --------- | ----------------------------------- |
| `MaxFailures` | 3         | Consecutive failures before OPEN    |
| `Timeout`     | 5 minutes | Cooldown before HALF_OPEN probe     |
| `MaxRequests` | 1         | Probe requests allowed in HALF_OPEN |

**States:**

| State       | Behaviour                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `CLOSED`    | Normal; all requests pass through                                           |
| `OPEN`      | Rejects all requests immediately; starts `HealthMonitor` background probing |
| `HALF_OPEN` | Allows one probe request; success → CLOSED, failure → OPEN                  |

**State transition callback** — wired at `Manager` construction to update the connection's
`Status.CircuitBreakerState` and emit a log entry:

```go
func WithOnStateChange(fn func(routerID string, from, to gobreaker.State)) CircuitBreakerOption
```

**Execution wrappers:**

```go
// Wraps a function; returns "open circuit: <original error>" if OPEN
cb.Execute(func() (any, error)) (any, error)
cb.ExecuteWithContext(ctx, func(ctx) (any, error)) (any, error)

// Inspection
cb.State() gobreaker.State
cb.StateString() string   // "CLOSED" | "OPEN" | "HALF_OPEN"
cb.IsOpen() bool
cb.IsClosed() bool
cb.IsHalfOpen() bool
cb.Counts() gobreaker.Counts  // Requests, TotalSuccesses, TotalFailures, etc.
```

`CircuitBreakerFactory` creates per-router breakers from shared configuration:

```go
factory := NewCircuitBreakerFactory(config, onStateChangeFn)
cb := factory.Create(routerID) // named "router-<routerID>"
```

---

### Connection Manager (`manager.go`)

`Manager` orchestrates the pool, circuit breakers, reconnect loops, and health monitoring:

```go
type Manager struct {
    pool          *Pool
    cbFactory     *CircuitBreakerFactory
    eventBus      events.EventBus
    logger        *zap.Logger
    clientFactory ClientFactory
    backoffConfig BackoffConfig
    healthConfig  HealthConfig
    // private: mu, closed, wg
}
```

**Construction:**

```go
mgr := connection.NewManager(eventBus, clientFactory, logger, connection.DefaultManagerConfig())
```

`DefaultManagerConfig()` composes the defaults from all sub-systems:

| Sub-system      | Key Default                                    |
| --------------- | ---------------------------------------------- |
| Circuit breaker | 3 failures → OPEN, 5-min timeout               |
| Backoff         | initial=1s, max=30s, multiplier=2, jitter=0.5  |
| Health check    | interval=30s, timeout=5s, threshold=3 failures |

**Core operations:**

```go
// Establish connection (circuit-breaker-protected)
mgr.Connect(ctx, routerID, config) error

// Close connection with reason
mgr.Disconnect(routerID, DisconnectReason) error

// Manual reconnect (rate-limited: 10s between attempts)
mgr.Reconnect(ctx, routerID) error

// Retrieve status
mgr.GetStatus(routerID) (Status, error)
mgr.GetConnection(routerID) (*Connection, error)
mgr.GetAllConnections() []*Connection

// Change preferred protocol (for next connect)
mgr.SetPreferredProtocol(routerID, Protocol) error

// Remove and disconnect a router
mgr.RemoveConnection(routerID) error

// Graceful shutdown (waits for goroutines)
mgr.Close() error

// Aggregate statistics
mgr.Stats() ManagerStats  // TotalConnections, Connected, Connecting, …
```

**Connection error handling** — `handleConnectionError()`:

1. Updates `Status` to `StateError`.
2. Publishes a `StatusChanged` event on the event bus.
3. Unless manually disconnected or circuit breaker is OPEN, calls `startReconnection()`.

---

### Exponential Backoff Reconnection (`manager_reconnect.go`)

`startReconnection()` spawns a goroutine that calls `reconnectLoop()`:

```go
// BackoffConfig defaults (per story spec)
DefaultBackoffConfig() = {
    InitialInterval:     1 * time.Second,
    MaxInterval:         30 * time.Second,
    Multiplier:          2.0,
    RandomizationFactor: 0.5,   // ±50% jitter
    MaxElapsedTime:      0,      // never give up automatically
}
```

**Reconnect loop logic:**

1. Transition to `StateReconnecting`, publish event.
2. Create `backoff.ExponentialBackOffWithContext` (respects context cancellation).
3. On each attempt: a. Bail if `manualDisconnect` → `backoff.Permanent(err)`. b. Bail if circuit
   breaker is OPEN → `backoff.Permanent(err)`. c. Call `clientFactory.CreateClient()` +
   `client.Connect()` inside `cb.ExecuteWithContext()`. d. Record `lastReconnectAttempt`, increment
   `ReconnectAttempts`.
4. On permanent failure:
   - If manual disconnect: → `StateDisconnected`.
   - Otherwise: → `StateError`.
5. On success:
   - Set client on connection.
   - Transition to `StateConnected`.
   - Publish event.
   - Call `startHealthMonitoring()`.

The backoff goroutine holds a `context.CancelFunc` stored on `Connection.reconnectCancel` so it can
be cancelled by `Disconnect()` or `Close()`.

---

### Health Monitoring (`health.go`, `manager_health.go`)

**Periodic health checks** (`startHealthMonitoring`):

After a successful connection (or reconnection), a goroutine runs `Ping()` on the established client
every `HealthConfig.Interval` (default 30 s). Three consecutive failures (configurable via
`HealthConfig.FailureThreshold`) trigger automatic reconnection.

**`HealthMonitor`** — handles background probing during the OPEN circuit-breaker window:

```go
type HealthMonitor struct { /* manager, eventBus, interval=30s, timeout=5s */ }

// For circuit-OPEN routers: probe without going through the breaker
hm.StartBackgroundMonitoring(routerID)
hm.StopBackgroundMonitoring(routerID)
hm.StopAll()

// On-demand health check (goes through established client)
result, err := hm.CheckHealth(ctx, routerID)
// → HealthResult{RouterID, Healthy, CheckedAt, ResponseTimeMs, Error}

// Is the connection currently healthy?
hm.IsHealthy(routerID) bool

// Detailed stats
stats, err := hm.GetHealthStats(routerID)
// → HealthStats{RouterID, ConsecutivePassed, ConsecutiveFailed, LastCheck, IsHealthy}
```

Background health check events are published on the event bus as `MetricUpdatedEvent` with metric
name `"health_check"`.

---

## Package Reference: `internal/capability`

### Overview

Capability detection interrogates a connected router to build a complete profile of what it
supports: hardware specs, RouterOS version, installed packages, and container configuration. Results
are cached in an in-memory L1 cache with a 24-hour TTL and stale-while-revalidate at the 12-hour
mark.

---

### Core Types (`types.go`)

**Capability constants:**

```go
const (
    CapabilityContainer  Capability = "CONTAINER"
    CapabilityVIF        Capability = "VIF"
    CapabilityWireless   Capability = "WIRELESS"
    CapabilityRouting    Capability = "ROUTING"
    CapabilityFirewall   Capability = "FIREWALL"
    CapabilityMPLS       Capability = "MPLS"
    CapabilityIPv6       Capability = "IPV6"
    CapabilityWireGuard  Capability = "WIREGUARD"
    CapabilityRESTAPI    Capability = "REST_API"
    CapabilityBinaryAPI  Capability = "BINARY_API"
    CapabilityACME       Capability = "ACME"
    CapabilityWiFiWave2  Capability = "WIFI_WAVE2"
    // … and more
)
```

**Support levels:**

| Level           | Value | Meaning                                     |
| --------------- | ----- | ------------------------------------------- |
| `LevelNone`     | 0     | Not supported — hide in UI                  |
| `LevelBasic`    | 1     | Limited support — show with warnings        |
| `LevelAdvanced` | 2     | Full RouterOS native support                |
| `LevelFull`     | 3     | Complete including container-based features |

The `@capability` directive uses level ≥ 1 (`BASIC`) as its threshold.

**`Capabilities` struct** — the complete capability profile:

```go
type Capabilities struct {
    Hardware     HardwareInfo    // Architecture, Model, TotalMemory, CPUCount, etc.
    Software     SoftwareInfo    // Version (RouterOSVersion), InstalledPackages, LicenseLevel
    Container    ContainerInfo   // PackageInstalled, Enabled, StorageAvailable, MaxContainers
    Entries      map[Capability]Entry  // capability → {Level, Description, Guidance}
    DetectedAt   time.Time
    ExpiresAt    time.Time       // DetectedAt + 24h
    IsRefreshing bool
}
```

Key methods on `Capabilities`:

```go
caps.GetLevel(cap) Level
caps.HasCapability(cap, minLevel) bool
caps.IsExpired() bool
caps.IsStale() bool          // > 12h since detection → trigger background refresh
caps.SetEntry(cap, level, description, guidance)
caps.CheckVIFRequirements() VIFRequirements  // detailed VIF readiness report
caps.VIFGuidance() []VIFGuidanceStep         // step-by-step remediation
```

**`RouterOSVersion`** — parsed semantic version with feature gates:

```go
v.SupportsREST() bool        // 7.1+
v.SupportsContainers() bool  // 7.4+
v.SupportsVIF() bool         // 7.13+
v.SupportsWireGuard() bool   // 7.0+
```

---

### Detector (`detector.go`)

The detector queries the router through a `RouterPort` interface (satisfied by any router adapter):

```go
type RouterPort interface {
    QueryState(ctx context.Context, query StateQuery) (*StateResult, error)
}
```

`Detect(ctx, port)` runs five steps in sequence:

| Step | RouterOS Path         | Purpose                                                                                        |
| ---- | --------------------- | ---------------------------------------------------------------------------------------------- |
| 1    | `/system/resource`    | Version, architecture, CPU count, memory, storage, board                                       |
| 2    | `/system/package`     | Installed package list; sets `HasWirelessChip`, `HasLTEModule`, `PackageInstalled` (container) |
| 3    | `/system/routerboard` | Hardware model (non-fatal if missing)                                                          |
| 4    | `/container/config`   | Container enabled, registry configured; computes `MaxContainers`                               |
| 5    | (in-memory)           | `computeCapabilityLevels()` — derives `Entries` map from gathered data                         |

The routerboard step is non-fatal: CHR and cloud instances may not expose this path.

Container `MaxContainers` is estimated as: `min(totalMemory / 50MB, 10)`.

---

### Capability Cache (`cache.go`)

`Cache` interface backed by `memoryCache` (in-memory, no persistence):

```go
type Cache interface {
    Get(routerID string) (*Capabilities, bool)  // nil, false if expired
    Set(routerID string, caps *Capabilities)    // stores with ExpiresAt from caps
    Invalidate(routerID string)
    InvalidateAll()
    MarkRefreshing(routerID string, refreshing bool)
    IsRefreshing(routerID string) bool
}

func NewMemoryCache() Cache
```

`Get` returns a copy of capabilities with `IsRefreshing = true` injected if a background refresh is
in progress — so callers always get a valid snapshot, never a stale pointer.

---

### Capability Service (`cache.go`)

`Service` wraps detector + cache with stale-while-revalidate semantics:

```go
type Service struct {
    detector Detector
    cache    Cache
}

func NewService(detector, cache) *Service
```

**`GetCapabilities(ctx, routerID, portGetter)`:**

1. Cache hit → return immediately.
2. If cached but stale (> 12h) and not already refreshing → spawn `backgroundRefresh()` goroutine,
   still return cached data.
3. Cache miss → `detectAndCache()` (blocking).

**`RefreshCapabilities(ctx, routerID, portGetter)`** — force re-detect, bypass cache.

**`Invalidate(routerID)`** — used when the router is disconnected or credentials change.

Background refresh is silent on failure — it never degrades currently-serving cached data.

---

### Version Compatibility Integration (`version_integration.go`)

`VersionCapabilityIntegration` bridges the hardware-detected `Capabilities` with the version-based
`router/compatibility.Service`:

```go
integration := capability.NewVersionCapabilityIntegration()

// Enrich capabilities entries based on version feature gates
integration.EnhanceCapabilities(caps, isCHR)

// Query specific feature support (version + package check)
info := integration.GetFeatureSupport(caps, "rest_api", isCHR)
// → FeatureSupportInfo{Supported, Reason, UpgradeURL, RequiredPkg}

// Batch queries
supported := integration.GetSupportedFeatures(caps, isCHR)
unsupported := integration.GetUnsupportedFeatures(caps, isCHR)
```

`EnhanceCapabilities` sets capability entries for: `REST_API`, `BINARY_API`, `ZEROTIER`, `ACME`,
`WIFI_WAVE2` — combining version gate checks with installed-package checks.

Version conversion helpers:

```go
capability.ConvertToCompatibilityVersion(RouterOSVersion) compatibility.Version
capability.ConvertFromCompatibilityVersion(compatibility.Version) RouterOSVersion
```

---

## Interaction with Router Adapters

The `connection.Manager` depends on a `ClientFactory` that is provided at construction. The factory
is responsible for selecting and constructing the correct protocol adapter (REST, API, SSH, Telnet).
This is wired during bootstrap:

```go
// See: application-bootstrap.md §Boot Sequence
mgr := connection.NewManager(eventBus, routerClientFactory, logger, cfg)
```

When `Manager.Connect()` is called, it passes the connection `Config` (host, port, credentials,
preferred protocol) to `ClientFactory.CreateClient()`. The factory implements fallback chain logic —
it tries the preferred protocol first, then falls back through REST → API → SSH → Telnet until one
succeeds. [See: router-communication.md §Fallback Chain]

---

## Edge Cases & Operational Notes

### Manual vs. Automatic Disconnect

`manualDisconnect = true` (set by `Disconnect(_, DisconnectReasonManual)`) suppresses:

- Automatic reconnect trigger after `handleConnectionError`.
- The reconnect loop's retry attempts (returns `backoff.Permanent`).
- The background health monitor's ability to re-establish the connection.

Calling `Reconnect()` clears this flag before attempting.

### Circuit Breaker and Reconnect Interaction

When the circuit breaker is OPEN:

- `reconnectLoop` returns `backoff.Permanent` immediately (avoids wasteful retries).
- `HealthMonitor.StartBackgroundMonitoring()` begins external probing at 30-second intervals without
  going through the breaker.
- If a probe succeeds, the event bus fires `health_check` passed → upstream logic can trigger a
  manual reconnect to close the breaker via the HALF_OPEN probe.

### Pool Limits

`NewPoolWithLimit(max)` creates a pool that returns `nil` from `GetOrCreate` when full. The Manager
logs a `Warn` and `Connect` returns an error. Default production configuration uses an unlimited
pool (`NewPool()`).

### Capability Cache Invalidation

Cache entries are automatically invalidated when:

- `Service.Invalidate(routerID)` is called explicitly (e.g., router removal).
- `Service.RefreshCapabilities()` is called (explicit re-detect).
- The 24-hour TTL expires (on next `Get` call).

There is no proactive eviction — stale entries remain until queried.

### VIF Requirements

The `CheckVIFRequirements()` method provides a structured checklist used by the UI to guide users
through enabling VIF:

```
1. RouterOS 7.13+ ✓ / ✗
2. Container package installed ✓ / ✗
3. Container feature enabled ✓ / ✗
4. ≥ 100 MB free storage ✓ / ✗
5. arm64/x86_64 architecture (network namespace) ✓ / ✗
```

`VIFGuidance()` returns ordered `VIFGuidanceStep` items with RouterOS commands for the resolver to
surface in the API.

---

## Cross-References

- [See: application-bootstrap.md §Boot Sequence] — Manager and capability service construction
- [See: router-communication.md §Protocol Adapters] — ClientFactory and RouterClient implementations
- [See: router-communication.md §Fallback Chain] — Protocol selection logic
- [See: event-system.md §Events] — `StatusChangedEvent`, `MetricUpdatedEvent` published by Manager
  and HealthMonitor
- [See: graphql-api.md §Directives] — `@capability` directive consuming `Capabilities` from context
- [See: error-handling.md §Error Types] — `TransitionError`, `RouterError` used in this package
