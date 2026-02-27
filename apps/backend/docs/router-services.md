# Router Services

## Overview

The `internal/services` layer contains all business logic that operates against MikroTik routers. Each service either embeds `base.Service` (which holds a `RouterPort` adapter) or depends on it directly. Services use a **hexagonal architecture**: they call the `RouterPort` interface (or sub-interfaces detected via type assertion), never concrete adapter types.

This document covers the router-level services and the two network allocation registries (PortRegistry and VLANAllocator) that underpin service isolation.

## Architecture

```
                         ┌─────────────────────────────────┐
                         │         base.Service             │
                         │  RouterPort (interface)          │
                         │    RunCommand / RunBatch         │
                         │    GetClient / GetConnection     │
                         └──────────────┬──────────────────┘
                                        │ embedded by / used by
          ┌─────────────────────────────┼──────────────────────────────┐
          │                             │                              │
          ▼                             ▼                              ▼
  RouterService                  PortMirrorService            RoutingService
  (session/status)               (monitoring)                 (ip/route CRUD)

  IPAddressService         TelemetryService           VLANOperations
  (ip/address CRUD)        (3-tier stats)             (vlan CRUD)

  WebhookService           ServiceAlertDigest         WAN Types
  (integration)            (svcalert)                 (data types)
```

```
Network Allocation Registries (package internal/network)
┌──────────────────────────────────────────────────────────────┐
│  PortRegistry                                                │
│    map[routerID:port:protocol]PortAllocationEntity           │
│    sync.RWMutex                                              │
│    reservedPorts map[int]bool                                │
│    AllocatePort / ReleasePort / IsPortAllocated              │
│    DetectOrphans / CleanupOrphans                            │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│  VLANAllocator                                               │
│    pool 100–199 (ingress 100–149, egress 150–199)            │
│    subnet template: 10.99.{vlan_id}.0/24                     │
│    IEEE 802.1Q: skip VLAN 1 and 4094                         │
│    sync.RWMutex + in-memory set                              │
│    AllocateVLAN / AllocateVLANWithPurpose / ReleaseVLAN      │
│    80% / 95% pool utilisation events                         │
└──────────────────────────────────────────────────────────────┘
```

## Package Reference

### `internal/services` — Router Session and Status

**`router_service_ops.go`**

`RouterService` maintains a session→routerID mapping so that each WebSocket/GraphQL subscription session knows which router it is talking to.

```go
// GetActiveRouter returns the router entity for a session, or nil if none set.
func (s *RouterService) GetActiveRouter(ctx context.Context, sessionID string) (*ent.Router, error)

// SetActiveRouter validates the router exists, then records sessionID→routerID.
func (s *RouterService) SetActiveRouter(ctx context.Context, sessionID, routerID string) error

// ClearActiveRouter removes the session's router binding.
func (s *RouterService) ClearActiveRouter(sessionID string)

// clearActiveRouterIfMatches removes all sessions bound to routerID (used on disconnect).
func (s *RouterService) clearActiveRouterIfMatches(routerID string)

// GetRouterStatus returns the current status string from the DB.
func (s *RouterService) GetRouterStatus(ctx context.Context, routerID string) (string, error)

// UpdateRouterStatus persists new status and publishes RouterStatusChangedEvent.
func (s *RouterService) UpdateRouterStatus(ctx context.Context, routerID, newStatus, previousStatus string) error

// GetAllRouters returns all routers (used by health checker to iterate).
func (s *RouterService) GetAllRouters(ctx context.Context) ([]*ent.Router, error)
```

**Credential testing:**

```go
// TestCredentials opens a test connection with supplied credentials.
// Returns CredentialTestResult without modifying stored credentials.
func (s *RouterService) TestCredentials(ctx context.Context, routerID, username, password string) *CredentialTestResult

type CredentialTestResult struct {
    Success        bool
    Status         string   // SUCCESS | AUTH_FAILED | TIMEOUT | CONNECTION_REFUSED | NETWORK_ERROR | ERROR
    Error          string
    ResponseTimeMs int
}
```

`TestCredentials` builds a temporary `connection.Config` with `ProtocolREST`, calls `connManager.Connect(ctx, testConnID, config)`, then immediately disconnects on success. The test connection ID uses the pattern `test-{routerID}-{nanoseconds}`.

**Error classification in `TestCredentials`:**

| Error string match | Status |
|---|---|
| authentication / login failed / unauthorized / permission denied | `AUTH_FAILED` |
| timeout / context deadline exceeded | `TIMEOUT` |
| connection refused / no route / network unreachable | `CONNECTION_REFUSED` |
| network / dial | `NETWORK_ERROR` |
| (other) | `ERROR` |

**Credential decryption:**

```go
// decryptCredentials decodes base64-encoded encrypted fields and decrypts.
// RouterSecret stores raw bytes; encryption service expects base64 strings.
func (s *RouterService) decryptCredentials(secrets *ent.RouterSecret) (username, password string, err error)
```

**Status parsing helpers:**

```go
func parseRouterStatus(status string) router.Status
// "online" → router.StatusOnline, "offline" → StatusOffline,
// "degraded" → StatusDegraded, else → StatusUnknown

func parseEventStatus(status string) events.RouterStatus
// "online"/"connected" → RouterStatusConnected
// "offline"/"disconnected" → RouterStatusDisconnected
// "reconnecting"/"connecting" → RouterStatusReconnecting
// "error" → RouterStatusError, else → RouterStatusUnknown
```

### `internal/services/wan` — WAN Data Types

**`types.go`**

```go
// WANInterfaceData is the enriched WAN struct returned by resolvers.
type WANInterfaceData struct {
    ID           string
    Name         string
    Type         string   // dhcp | pppoe | static | lte
    Status       string
    // Health fields
    UpSince      *time.Time
    DownSince    *time.Time
    // Protocol-specific sub-structs (nil if not applicable)
    DhcpClient   *DhcpClientData
    PppoeClient  *PppoeClientData
    StaticConfig *StaticIPConfigData
    LteModem     *LteModemData
    // Event history
    RecentEvents []ConnectionEventData
}

type DhcpClientData   { LeaseAddress, Gateway, DNSServers string; LeaseExpiry *time.Time }
type PppoeClientData  { ServiceName, Username string; SessionID int; RemoteAddress string }
type StaticIPConfigData { Address, Gateway string; DNSServers []string }
type LteModemData     { IMSI, IMEI, Operator string; SignalStrength int; APN string }
type ConnectionEventData { Timestamp time.Time; Event, Reason string }
```

Input types mirror the data structs but use pointer fields for optional updates:

```go
type DhcpClientInput  { Interface string; UseHostname bool; ... }
type PppoeClientInput  { Interface, Username, Password, ServiceName string; ... }
type StaticIPInput     { Address, Gateway string; DNS []string; ... }
type LteModemInput     { APNName, Username, Password string; ... }
type HealthCheckInput  { Enabled bool; CheckInterval time.Duration; Target string }
```

### `internal/services/monitoring` — Port Mirrors and Telemetry

**`port_mirror_service.go` + `port_mirror_service_ops.go`**

`PortMirrorService` embeds `base.Service` and checks for port-mirror capability via type assertion before any operation:

```go
type portMirrorCapable interface {
    GetPortMirrors(ctx context.Context) ([]map[string]string, error)
    CreatePortMirror(ctx context.Context, args map[string]string) error
    UpdatePortMirror(ctx context.Context, id string, args map[string]string) error
    DeletePortMirror(ctx context.Context, id string) error
    EnablePortMirror(ctx context.Context, id string) error
    DisablePortMirror(ctx context.Context, id string) error
}

// Capability check pattern:
cap, ok := s.Port().(portMirrorCapable)
if !ok {
    return nil, fmt.Errorf("router does not support port mirrors")
}
```

**Operations:**

```go
func (s *PortMirrorService) GetPortMirrors(ctx context.Context, routerID string) ([]*model.PortMirror, error)
func (s *PortMirrorService) GetPortMirror(ctx context.Context, routerID, mirrorID string) (*model.PortMirror, error)
func (s *PortMirrorService) CreatePortMirror(ctx context.Context, routerID string, input model.PortMirrorInput) (*model.PortMirror, error)
func (s *PortMirrorService) UpdatePortMirror(ctx context.Context, routerID, mirrorID string, input model.PortMirrorInput) (*model.PortMirror, error)
func (s *PortMirrorService) DeletePortMirror(ctx context.Context, routerID, mirrorID string) error
func (s *PortMirrorService) EnablePortMirror(ctx context.Context, routerID, mirrorID string) error
func (s *PortMirrorService) DisablePortMirror(ctx context.Context, routerID, mirrorID string) error
```

**Validation (CreatePortMirror):**
- `Name` must be non-empty
- At least one source interface required
- Destination interface must not appear in source list

**Statistics enrichment:** After fetching mirrors, `getPortMirrorStats` is called to attach live packet/byte counters from the router.

**Events published:** `port_mirror.created`, `port_mirror.updated`, `port_mirror.deleted` — each carries routerID + mirrorID payload.

**`telemetry_service.go`**

Three-tier telemetry stores interface traffic statistics at different resolutions:

| Tier | Storage | Resolution | Retention | Source |
|---|---|---|---|---|
| Hot | In-memory ring buffer (3600 points) | Full resolution | 1 hour | `stats.updated` events |
| Warm | 5-minute bucket aggregation | 5 minutes | 24 hours | Computed from Hot ring |
| Cold | `ServiceTrafficHourly` ent records | 1 hour | 30 days | Persisted from Warm |

```go
// GetInterfaceStatsHistory returns stats using the appropriate tier based on age.
// age ≤ 1h  → Hot tier (ring buffer)
// age ≤ 24h → Warm tier (5-min aggregation)
// else       → Cold tier (DB query)
func (s *TelemetryService) GetInterfaceStatsHistory(
    ctx context.Context,
    instanceID string,
    since time.Time,
) ([]model.TrafficDataPoint, error)
```

`subscribeToStatsEvents` registers a handler on the event bus for `stats.updated` events. Each event appends to the Hot ring buffer and triggers Warm/Cold aggregation when bucket boundaries are crossed.

### `internal/services/netif` — IP Address Service

**`ip_address_service.go`**

```go
// IPAddressService manages IP addresses on router interfaces.
// Embeds a routerPort and maintains a 10s TTL cache keyed by routerID.
type IPAddressService struct {
    routerPort RouterPort
    eventBus   events.EventBus
    cache      *ttlCache  // 10s TTL, invalidated on writes
}

func (s *IPAddressService) GetIPAddresses(ctx context.Context, routerID string) ([]*model.IPAddress, error)
func (s *IPAddressService) GetIPAddress(ctx context.Context, routerID, addrID string) (*model.IPAddress, error)
func (s *IPAddressService) CreateIPAddress(ctx context.Context, routerID string, input model.IPAddressInput) (*model.IPAddress, error)
func (s *IPAddressService) UpdateIPAddress(ctx context.Context, routerID, addrID string, input model.IPAddressInput) (*model.IPAddress, error)
func (s *IPAddressService) DeleteIPAddress(ctx context.Context, routerID, addrID string) error
func (s *IPAddressService) GetDependencies(ctx context.Context, routerID, addrID string) (*model.IPAddressDependencies, error)
```

**Cache strategy:** `GetIPAddresses` populates a `map[routerID][]IPAddress` cache with 10s TTL. Create/Update/Delete operations invalidate the cache for that routerID immediately.

**Events published:** `ip-address-created`, `ip-address-updated`, `ip-address-deleted`.

**`ip_conflicts.go`**

```go
// ConflictType describes the nature of an IP address conflict.
type ConflictType string
const (
    ConflictExact         ConflictType = "EXACT"           // Same IP, different interface
    ConflictSubnetOverlap ConflictType = "SUBNET_OVERLAP"  // Overlapping CIDR ranges
    ConflictBroadcast     ConflictType = "BROADCAST"       // Matches subnet broadcast addr
    ConflictNetwork       ConflictType = "NETWORK"         // Matches subnet network addr
)

type IPConflict struct {
    Type            ConflictType
    ConflictingAddr *model.IPAddress
    Message         string
}

// CheckConflict compares a candidate IP/prefix against all existing addresses.
func CheckConflict(candidate *model.IPAddress, existing []*model.IPAddress) []IPConflict

// GetDependencies fetches resources referencing this IP address.
func GetDependencies(ctx context.Context, routerPort RouterPort, routerID, addrID string) (*model.IPAddressDependencies, error)
```

`GetDependencies` queries the router for:
- DHCP server pools that use the IP's interface
- Static routes with this IP as gateway
- NAT rules targeting this IP
- Firewall filter/address-list rules referencing this IP

This data is surfaced to the UI before deletion to warn the user of downstream impacts.

### `internal/services/pollers` — Poller Configuration

**`types.go`**

Interval constants for the polling system:

```go
const (
    MinPollingInterval     = 1 * time.Second
    DefaultPollingInterval = 5 * time.Second
    MaxPollingInterval     = 30 * time.Second

    TrafficPollingInterval    = 10 * time.Second
    MinTrafficPollingInterval = 5 * time.Second
    MaxTrafficPollingInterval = 60 * time.Second
)
```

Helper functions for safely extracting RouterOS response values:

```go
func getStringOrEmpty(m map[string]string, key string) string
func getIntOrZero(m map[string]string, key string) int
func parseInt(s string) int       // returns 0 on parse failure
func parseBytes(s string) int64   // handles "K", "M", "G" suffixes
```

### `internal/services/routing` — IP Route CRUD

**`service.go`**

```go
// Service manages /ip/route entries on the MikroTik router.
type Service struct {
    base.Service
}

func (s *Service) CreateRoute(ctx context.Context, routerID string, input model.RouteInput) (*model.Route, error)
func (s *Service) UpdateRoute(ctx context.Context, routerID, routeID string, input model.RouteInput) (*model.Route, error)
func (s *Service) DeleteRoute(ctx context.Context, routerID, routeID string) error
```

Each operation maps to a RouterOS command:

| Method | RouterOS command |
|---|---|
| `CreateRoute` | `/ip/route/add` |
| `UpdateRoute` | `/ip/route/set` |
| `DeleteRoute` | `/ip/route/remove` |

Uses `base.CommandArgsBuilder` with `.IsSet()` guards for optional fields (gateway, distance, routing-mark, etc.) to avoid sending zero-value arguments to RouterOS.

### `internal/services/networking/vlan` — VLAN Port Operations

**`operations.go`**

```go
// CheckVlanIDAvailable queries the router to see if a VLAN ID is in use.
// excludeID: skip this VLAN entry (for update operations).
func CheckVlanIDAvailable(ctx context.Context, port RouterPort, routerID string, vlanID int, excludeID string) (bool, error)

// ConfigureVlanPort sets access or trunk mode on a bridge port.
func ConfigureVlanPort(ctx context.Context, port RouterPort, routerID, portID string, input model.VlanPortInput) error
```

**VLAN port modes:**

| Mode | RouterOS settings applied |
|---|---|
| `access` | `frame-types: admit-only-untagged`, pvid = `input.VLANID` |
| `trunk` | `frame-types: admit-all`, allowed VLAN list set |

Both modes call `/interface/bridge/port/set` with the appropriate arguments.

`mapVlanData` converts RouterOS string map responses to `model.Vlan` structs (handles ID, name, VLAN ID, interface, comment fields).

### `internal/services/integration` — Webhook Service

**`webhook_service.go`**

```go
// Service provides webhook CRUD with AES-256-GCM credential encryption.
type Service struct {
    db         *ent.Client
    encryption *encryption.Service
    dispatcher *notifications.Dispatcher
    eventBus   events.EventBus
    log        *zap.SugaredLogger
}

// WebhookCreateResult — signing secret is returned ONCE on creation only.
type WebhookCreateResult struct {
    Webhook                *ent.Webhook
    PlaintextSigningSecret string // ONE TIME ONLY — client must save this
}
```

**`CreateWebhook` flow:**
1. `validateWebhookURL(input.URL)` → SSRF protection via `channelshttp.ValidateWebhookURL`
2. Generate 32-byte random signing secret → `base64.StdEncoding.EncodeToString`
3. `encryption.Encrypt(plaintextSecret)` → AES-256-GCM ciphertext
4. `extractNonce(encryptedSecret)` → first 12 bytes of decoded ciphertext
5. Encrypt `AuthValue` map → JSON marshal → `encryption.EncryptBytes`; extract auth nonce
6. Persist to DB: `SetSigningSecretEncrypted`, `SetSigningNonce`, optional `SetAuthValueEncrypted`, `SetAuthNonce`
7. Publish `webhook.created` event
8. Return `WebhookCreateResult` with plaintext secret — **never stored in plaintext**

```go
func (s *Service) CreateWebhook(ctx context.Context, input CreateWebhookInput) (*WebhookCreateResult, error)
func (s *Service) GetWebhook(ctx context.Context, webhookID string) (*ent.Webhook, error)
// GetWebhookDecrypted is for internal use only — NEVER expose to GraphQL resolvers.
func (s *Service) GetWebhookDecrypted(ctx context.Context, webhookID string) (*ent.Webhook, map[string]string, error)
func (s *Service) UpdateWebhook(ctx context.Context, webhookID string, input UpdateWebhookInput) (*ent.Webhook, error)
func (s *Service) DeleteWebhook(ctx context.Context, webhookID string) error
func (s *Service) ListWebhooks(ctx context.Context, enabled *bool) ([]*ent.Webhook, error)
```

**`UpdateWebhook`:** Re-encrypts auth credentials only when `input.AuthValue` is non-nil. If `input.AuthValue` is an empty map, clears the stored encrypted fields (`ClearAuthValueEncrypted`, `ClearAuthNonce`). The signing secret is **never returned or regenerated** on update.

**`extractNonce`:**

```go
// Decodes base64 ciphertext and returns the first 12 bytes (AES-GCM nonce size).
func extractNonce(encryptedBase64 string) ([]byte, error)
```

Events published: `webhook.created`, `webhook.updated`, `webhook.deleted`.

### `internal/services/svcalert` — Alert Digest

**`service_digest.go`**

```go
// GetDigestQueueCount returns the number of pending alerts in the digest queue.
func GetDigestQueueCount(ctx context.Context, store DigestStore) (int, error)

// GetDigestHistory returns paginated digest history grouped by digestID.
// Each entry includes: digestID, period (e.g. "last 24h"), alert count, timestamp.
func GetDigestHistory(ctx context.Context, store DigestStore, limit, offset int) ([]*model.DigestEntry, error)

// TriggerDigestNow forces an immediate digest evaluation outside the normal schedule.
func TriggerDigestNow(ctx context.Context, engine DigestEngine) error
```

### `internal/network` — Port Registry

**`port_registry.go`**

```go
// PortRegistry allocates and tracks service ports across all router instances.
type PortRegistry struct {
    store         StorePort
    mu            sync.RWMutex
    cache         map[string]PortAllocationEntity  // key: "routerID:port:protocol"
    reservedPorts map[int]bool
}
```

**Base ports per service type:**

| Service | Ports |
|---|---|
| tor | 9050, 9151 |
| singbox | 1080 |
| xray | 1081 |
| mtproxy | 8888 |
| psiphon | 4443 |
| adguard | 53, 3000 |

**Reserved system ports (never allocated):**

| Port | Service |
|---|---|
| 22 | SSH |
| 53 | DNS |
| 80 | HTTP |
| 443 | HTTPS |
| 8080 | HTTP alt |
| 8291 | WinBox |
| 8728 | RouterOS API |
| 8729 | RouterOS API-SSL |

```go
// AllocatePort finds next available port from base, persists, caches, returns allocated port.
// Holds write lock for the entire find+persist cycle to prevent TOCTOU races.
func (r *PortRegistry) AllocatePort(ctx context.Context, req PortAllocationRequest) (int, error)

// ReleasePort removes the allocation from DB and cache.
func (r *PortRegistry) ReleasePort(ctx context.Context, instanceID string, port int) error

// IsPortAllocated checks if a specific port is registered to a specific instance.
func (r *PortRegistry) IsPortAllocated(ctx context.Context, instanceID string, port int) (bool, error)

// GetAllocationsByRouter returns all port allocations for a router.
func (r *PortRegistry) GetAllocationsByRouter(ctx context.Context, routerID string) ([]PortAllocationEntity, error)

// GetAllocationsByInstance returns all port allocations for a service instance.
func (r *PortRegistry) GetAllocationsByInstance(ctx context.Context, instanceID string) ([]PortAllocationEntity, error)

// DetectOrphans returns allocations whose instance no longer exists or is in "deleting" status.
func (r *PortRegistry) DetectOrphans(ctx context.Context) ([]PortAllocationEntity, error)

// CleanupOrphans releases all detected orphaned allocations.
func (r *PortRegistry) CleanupOrphans(ctx context.Context) (int, error)
```

**`findNextAvailablePortUnsafe`** (called under write lock):
1. Start at `basePort` for the service type
2. Skip if port is in `reservedPorts`
3. Skip if port already exists in `cache`
4. Return first available port or error if `basePort + maxSearch` exhausted

### `internal/network` — VLAN Allocator

**`vlan_allocator_types.go`**

```go
// Sentinel errors
var (
    ErrPoolExhausted      = errors.New("vlan pool exhausted")
    ErrInvalidRequest     = errors.New("invalid vlan request")
    ErrVLANNotFound       = errors.New("vlan allocation not found")
    ErrInvalidPoolConfig  = errors.New("invalid pool configuration")
)

// VLANAllocatorConfig defines the VLAN ID pool boundaries.
type VLANAllocatorConfig struct {
    MinVLAN int  // default 100
    MaxVLAN int  // default 199
}

// AllocateVLANRequest specifies what to allocate.
type AllocateVLANRequest struct {
    InstanceID string
    RouterID   string
    Purpose    string  // "ingress" | "egress" | "" (any)
    Label      string  // human-readable label
}

// AllocateVLANResponse contains the allocated VLAN details.
type AllocateVLANResponse struct {
    VLANID  int
    Subnet  string  // "10.99.{vlan_id}.0/24"
    Gateway string  // "10.99.{vlan_id}.1"
}

// VLANPoolStatus is returned by GetPoolStatus.
type VLANPoolStatus struct {
    Total     int
    Used      int
    Available int
    MinVLAN   int
    MaxVLAN   int
}
```

**`vlan_allocator.go` + `vlan_allocator_pool.go`**

```go
// VLANAllocator manages VLAN ID assignment with IEEE 802.1Q compliance.
type VLANAllocator struct {
    store          VlanServicePort
    eventBus       events.EventBus
    mu             sync.RWMutex
    allocated      map[int]bool  // in-memory set for fast lookup
    cfg            VLANAllocatorConfig
}

// AllocateVLAN allocates the next available VLAN from the full pool.
func (a *VLANAllocator) AllocateVLAN(ctx context.Context, req AllocateVLANRequest) (*AllocateVLANResponse, error)

// AllocateVLANWithPurpose allocates from a purpose-specific sub-pool:
//   "ingress" → IDs 100–149
//   "egress"  → IDs 150–199
func (a *VLANAllocator) AllocateVLANWithPurpose(ctx context.Context, req AllocateVLANRequest) (*AllocateVLANResponse, error)

// ReleaseVLAN removes an allocation by instanceID.
func (a *VLANAllocator) ReleaseVLAN(ctx context.Context, instanceID string) error

// GetPoolStatus returns current utilisation statistics.
func (a *VLANAllocator) GetPoolStatus(ctx context.Context) (*VLANPoolStatus, error)

// UpdatePoolConfig changes pool boundaries; rejects if orphaned allocations exist outside new range.
// Persists new config to GlobalSettings.
func (a *VLANAllocator) UpdatePoolConfig(ctx context.Context, cfg VLANAllocatorConfig) error
```

**IEEE 802.1Q compliance:** IDs `1` (default VLAN, reserved) and `4094` (implementation-reserved) are never allocated. The allocator skips these when scanning the pool.

**Subnet derivation:** For VLAN ID `N`, the allocated subnet is `10.99.N.0/24` with gateway `10.99.N.1`. This provides deterministic, non-overlapping address space for each service instance.

**Pool utilisation events (`checkAndEmitPoolWarningUnsafe`, called under write lock after each allocation):**

| Threshold | Event |
|---|---|
| ≥ 80% used | `vlan.pool.warning` (warning severity) |
| ≥ 95% used | `vlan.pool.critical` (critical severity) |

**Allocation flow (`AllocateVLAN`):**
1. Check in-memory `allocated` set (cache hit → skip)
2. Query DB via `VlanServicePort.GetExistingAllocations` (persistent state)
3. Query router via `VlanServicePort.CheckVlanConflict` (live router VLANs)
4. Find first free ID in pool range, skipping 1 and 4094
5. Persist via `VlanServicePort.PersistAllocation`
6. Add to in-memory set
7. Check and emit pool warning if applicable
8. Return `AllocateVLANResponse` with VLAN ID, subnet, and gateway

## Cross-References

- [See: 19-process-isolation.md §Layer 3: Ports] — IsolationVerifier calls `PortRegistry.IsPortAllocated`
- [See: 19-process-isolation.md §Layer 1: IP Binding] — VLAN bind IP validation at pre-start
- [See: 13-network-services.md §Service Lifecycle] — orchestrator calls AllocatePort and AllocateVLAN during install
- [See: 18-config-generation.md §ValidateBindIP] — bind IP for service config must come from VLANAllocator subnet
- [See: 11-alerts.md §Webhook Delivery] — WebhookService used by alert dispatcher for outbound notifications
