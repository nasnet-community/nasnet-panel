# Network Services

> Stateless service layer for firewall rules, DNS lookups, network scanning, bridge management, and
> internet troubleshooting — all operating through the `RouterPort` abstraction.

**Packages:** `internal/firewall/`, `internal/dns/`, `internal/router/scanner/`,
`internal/services/bridge/`, `internal/troubleshoot/`, `internal/services/netif/`,
`internal/services/networking/` **Key Files:** `firewall/address_list_service.go`, `dns/service.go`,
`router/scanner/scanner.go`, `services/bridge/service.go`, `troubleshoot/service.go`
**Prerequisites:** [See: 04-router-communication.md §RouterPort Interface], [See: 05-event-system.md
§Publishing Events]

---

## Overview

Network Services is the collection of focused service packages that sit above the `RouterPort`
abstraction. They do not manage connection state — they receive a `RouterPort` (or an embedded
`base.Service`) and issue structured commands, parse responses, and return domain types.

Key design principles across all network service packages:

- **Stateless services** — the `RouterPort` is injected per-operation or once at construction;
  services hold no mutable connection state
- **Parallel fetching** — goroutines with `sync.WaitGroup` for independent sub-queries (e.g.,
  referencing rule counts across multiple address lists)
- **Domain types, not ent types** — each package defines its own `Data`, `Input`, `Result` types
- **Cursor/offset pagination** — where applicable, default page size of 50 entries
- **Undo windows** — mutating services support a 10-second undo via `UndoStore`

---

## Architecture

```
                     GraphQL Resolvers
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
   │  firewall   │  │    dns      │  │   troubleshoot  │
   │  (stateless)│  │  Service    │  │    Service      │
   └──────┬──────┘  └──────┬──────┘  └─────┬──────────┘
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
   │  services/  │  │  scanner/   │  │  diagnostics/  │
   │   bridge    │  │   ScanIP    │  │  (circuit,dns, │
   │  (UndoStore)│  │             │  │   routelookup) │
   └──────┬──────┘  └──────┬──────┘  └─────┬──────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                      RouterPort
                    (FallbackChain)
```

---

## Package Reference

### `internal/firewall`

Provides firewall address list, NAT, port knocking, and filter rule operations for MikroTik routers.

#### `address_list_service.go` — `AddressListService`

```go
// Stateless service — RouterPort is passed per operation, not stored
type AddressListService struct{}

func NewAddressListService() *AddressListService
```

**`GetAddressLists(ctx, port RouterPort) ([]AddressListAggregate, error)`**

1. Fetches all address list entries via
   `ExecuteCommand({Path: "/ip/firewall/address-list", Action: "print"})`
2. Groups entries by list name into `AddressListAggregate{Name, EntryCount, DynamicCount}`
3. Spawns a goroutine per list name to fetch `ReferencingRulesCount` in parallel (`sync.WaitGroup` +
   `sync.Mutex`)
4. Default page size: 50 entries per page (cursor-based)

```go
type AddressListAggregate struct {
    Name                 string
    EntryCount           int
    DynamicCount         int
    ReferencingRulesCount int
}
```

**Other methods (following the same stateless pattern):**

| Method                                  | RouterOS Path               | Action              |
| --------------------------------------- | --------------------------- | ------------------- |
| `GetEntries(ctx, port, listName, page)` | `/ip/firewall/address-list` | `print` with filter |
| `AddEntry(ctx, port, input)`            | `/ip/firewall/address-list` | `add`               |
| `RemoveEntry(ctx, port, id)`            | `/ip/firewall/address-list` | `remove`            |
| `GetFilterRules(ctx, port)`             | `/ip/firewall/filter`       | `print`             |
| `GetNATRules(ctx, port)`                | `/ip/firewall/nat`          | `print`             |

#### `nat/portforward.go` and `nat/service.go`

NAT port forwarding with structured input validation:

```go
type PortForwardInput struct {
    Protocol    string  // "tcp", "udp"
    DstPort     int
    ToAddresses string
    ToPort      int
    SrcAddress  string
    Comment     string
}
```

Validates port ranges and protocol before issuing `/ip/firewall/nat add` commands.

#### `portknock.go` — Port Knocking Service

Manages port knock sequences. Each sequence is a series of ports that must be contacted in order to
open a firewall rule.

```go
type KnockSequence struct {
    Name    string
    Ports   []KnockPort  // {Port, Protocol, Timeout}
    Action  string       // firewall action to trigger
    Comment string
}
```

---

### `internal/dns`

Provides DNS lookup and benchmark operations through the router.

#### `service.go` — `Service`

```go
type Service struct {
    routerPort router.RouterPort
}

func NewService(rp router.RouterPort) *Service
```

**`PerformLookup(ctx, input *LookupInput) (*LookupResult, error)`**

Routing logic for DNS resolution:

```go
type LookupInput struct {
    Hostname   string
    RecordType string   // "A", "AAAA", "MX", "TXT", "CNAME", "NS", "PTR"
    Server     *string  // nil = use router's DNS
}
```

Resolution strategy:

| Condition                          | Method                | Authoritative field                   |
| ---------------------------------- | --------------------- | ------------------------------------- |
| `A` or `AAAA` and no custom server | `lookupViaRouterOS`   | true if from router's static table    |
| Any other record type              | `lookupViaGoResolver` | always false (net package limitation) |

`lookupViaRouterOS` issues `/ip dns cache print` or `/ip dns static print` commands and parses the
response. The `authoritative` flag is set true when the answer comes from the router's own static
DNS table.

`lookupViaGoResolver` uses Go's `net.DefaultResolver` with a `net.Resolver{PreferGo: true}`
configured to use the specified server.

```go
type LookupResult struct {
    Hostname      string
    RecordType    string
    Status        string     // "NOERROR", "NXDOMAIN", "SERVFAIL", "TIMEOUT"
    Records       []Record   // {Type, Value, TTL}
    Server        string
    QueryTime     int        // milliseconds
    Authoritative bool
    Error         *string
    Timestamp     string     // RFC3339
}
```

**Benchmark support** (`dns_benchmark.go`):

Queries multiple DNS servers in parallel (up to 5 concurrent workers) and returns latency + result
for each server:

```go
type BenchmarkInput struct {
    Hostname string
    Servers  []string  // IP addresses or "router" for native lookup
}

type BenchmarkResult struct {
    Server    string
    Latency   int     // milliseconds
    Success   bool
    Records   []Record
}
```

---

### `internal/router/scanner`

Stateless network discovery — no service struct, just package-level functions.

#### `scanner.go`

```go
type Device struct {
    IP       string
    Hostname string
    Ports    []int
    Type     string    // "mikrotik", "unknown"
    Vendor   string    // "MikroTik", "unknown"
    Services []string  // detected service names
}

type Config struct {
    MaxWorkers  int           // default: 20
    Timeout     time.Duration // default: 2s
    TargetPorts []int         // default: [80, 443, 8728, 8729, 8291]
}
```

**`ScanIP(ctx, ip string, ports []int, timeout time.Duration) *Device`**

For a single IP address:

1. Spawns one goroutine per port (semaphore limit: 5 concurrent)
2. Calls `IsPortOpen(ctx, ip, port, timeout)` — TCP dial with deadline
3. For port 80/443: HTTP GET to detect MikroTik via response headers/body
4. For port 8728/8729: Binary API handshake attempt to detect MikroTik
5. Returns `Device` with all open ports and detected vendor

**`ParseIPRange(subnet string) ([]string, error)`**

Parses three formats:

- CIDR: `192.168.88.0/24` → expands all host addresses
- Dash range: `192.168.1.1-192.168.1.50`
- Single IP: `192.168.88.1`

**`ScanSubnet(ctx, subnet string, cfg Config) ([]*Device, error)`** (in `discovery.go`)

Calls `ParseIPRange`, then concurrently scans all IPs up to `MaxWorkers` parallel goroutines.

**Port-to-service mapping:**

| Port | Service                     |
| ---- | --------------------------- |
| 80   | HTTP / MikroTik REST API    |
| 443  | HTTPS                       |
| 8728 | MikroTik RouterOS API       |
| 8729 | MikroTik RouterOS API (TLS) |
| 8291 | MikroTik Winbox             |

---

### `internal/services/bridge`

Bridge configuration service with 10-second undo support.

#### `service.go` — `Service`

```go
type Service struct {
    base.Service    // embeds Port() method and EnsureConnected()
    eventBus  events.EventBus
    undoStore *UndoStore   // 10-second undo window
}

func NewService(config base.ServiceConfig) *Service
```

Every mutating operation follows the **read-snapshot → mutate → store-undo** pattern:

**`CreateBridge(ctx, routerID, input *CreateBridgeInput) (*Data, string, error)`**

```go
// Builds args with base.NewCommandArgsBuilder()
// Issues: /interface/bridge add name=... protocol=... priority=...
// undoStore.Add("create", "bridge", nil)  → returns operationID
```

**`UpdateBridge(ctx, uuid, input *UpdateBridgeInput) (*Data, string, error)`**

```go
previousState, _ := s.GetBridge(ctx, uuid)   // snapshot before change
// Issues: /interface/bridge set .id=uuid protocol=... priority=...
undoStore.Add("update", "bridge", previousState)  → operationID
```

**`DeleteBridge(ctx, uuid) (string, error)`**

```go
previousState, _ := s.GetBridge(ctx, uuid)   // snapshot before delete
// Issues: /interface/bridge remove .id=uuid
undoStore.Add("delete", "bridge", previousState)  → operationID
```

**`UndoBridgeOperation(ctx, operationID) (*Data, error)`**

Retrieves the stored `UndoOperation` and reverses based on type:

| Original op | Undo action                                     |
| ----------- | ----------------------------------------------- |
| `create`    | not yet implemented                             |
| `update`    | restore `previousState` via `UpdateBridge`      |
| `delete`    | recreate via `CreateBridge` with previous state |

After successful undo: `undoStore.Delete(operationID)`.

**`GetImpact(ctx, uuid) (*Impact, error)`**

Analyzes deletion impact without making changes:

```go
type Impact struct {
    PortsToRelease      []string
    IPAddressesToRemove []string
    DHCPServersAffected []string
    RoutesAffected      []string
}
```

**`GetBridges`** additionally fetches ports, VLANs, and STP status for each bridge (3 extra commands
per bridge):

```
/interface/bridge/port print
/interface/bridge/vlan print
/interface/bridge/host print  (for STP)
```

#### `UndoStore`

In-memory store with 10-second TTL. Operations are automatically expired.

```go
type UndoOperation struct {
    ID            string
    Type          string    // "create", "update", "delete"
    ResourceType  string    // "bridge", "port", "vlan"
    PreviousState []byte    // JSON-encoded previous state
    CreatedAt     time.Time
}
```

---

### `internal/troubleshoot`

Session-based internet connectivity diagnostics with fix suggestions and automated fix application.

#### `service.go` — `Service`

```go
type Service struct {
    sessionStore       *SessionStore
    routerPort         router.RouterPort
    circuitBreakerDiag *diagnostics.CircuitBreakerDiagnostics
    dnsDiag            *diagnostics.DNSDiagnostics
    routeLookupDiag    *diagnostics.RouteLookupDiagnostics
    logger             *zap.Logger
}
```

**Session lifecycle:**

```
StartTroubleshoot(ctx, routerID)
    → sessionStore.Create(routerID)            // generates random session ID
    → DetectNetworkConfig(ctx, routerID)       // discovers WAN interface + gateway
    → session.Status = SessionStatusRunning
    → return session (with 5 pre-initialized steps)

RunTroubleshootStep(ctx, sessionID, stepType)
    → sessionStore.Get(sessionID)
    → step.Status = StepStatusRunning
    → executeDiagnosticCheck(ctx, stepType, wanInterface, gateway)
    → step.Status = StepStatusPassed | StepStatusFailed
    → if failed: step.Fix = GetFix(result.IssueCode)
    → return step

ApplyTroubleshootFix(ctx, sessionID, issueCode)
    → GetFix(issueCode)
    → if fix.IsManualFix || fix.Command == "": return FixStatusAvailable
    → session.Status = SessionStatusApplyingFix
    → executeFixCommand(ctx, routerID, fix.Command)
    → session.AppliedFixes = append(..., issueCode)
    → return FixStatusApplied

CancelTroubleshoot(ctx, sessionID)
    → session.Status = SessionStatusCanceled
    → session.CompletedAt = time.Now()
```

**Step types and their diagnostic backends:**

| StepType           | Diagnostic                                | What it checks                 |
| ------------------ | ----------------------------------------- | ------------------------------ |
| `StepTypeWAN`      | `CircuitBreakerDiagnostics.CheckWAN`      | WAN interface link status      |
| `StepTypeGateway`  | `CircuitBreakerDiagnostics.CheckGateway`  | Gateway reachability (ping)    |
| `StepTypeInternet` | `CircuitBreakerDiagnostics.CheckInternet` | External internet reachability |
| `StepTypeDNS`      | `DNSDiagnostics.CheckDNS`                 | DNS resolution correctness     |
| `StepTypeNAT`      | `CircuitBreakerDiagnostics.CheckNAT`      | NAT masquerade rule presence   |

**Session statuses:**

```go
SessionStatusIdle         // just created
SessionStatusInitializing // detecting network config
SessionStatusRunning      // steps can be executed
SessionStatusApplyingFix  // fix command in progress
SessionStatusCompleted    // all steps done
SessionStatusCanceled     // user canceled
```

**Step statuses:**

```go
StepStatusPending  // not yet run
StepStatusRunning  // currently executing
StepStatusPassed   // diagnostic passed
StepStatusFailed   // diagnostic failed, Fix populated
StepStatusSkipped  // not applicable
```

#### `session_store.go` — `SessionStore`

In-memory, thread-safe session store. Sessions expire after 1 hour via a background cleanup
goroutine.

```go
type SessionStore struct {
    sessions   map[string]*Session
    sessionTTL time.Duration  // 1 hour
    mu         sync.RWMutex
}
```

Session IDs are generated as 16-byte random hex strings (`crypto/rand`).

#### `diagnostics/` sub-package

Three diagnostic engines, each operating via `RouterPort`:

**`circuit_breaker.go` — `CircuitBreakerDiagnostics`**

```go
func (d *CircuitBreakerDiagnostics) CheckWAN(ctx, wanInterface) (*StepResult, error)
func (d *CircuitBreakerDiagnostics) CheckGateway(ctx, gateway) (*StepResult, error)
func (d *CircuitBreakerDiagnostics) CheckInternet(ctx) (*StepResult, error)
func (d *CircuitBreakerDiagnostics) CheckNAT(ctx, wanInterface) (*StepResult, error)
```

Each returns `StepResult{Success, Message, Details, ExecutionTimeMs, IssueCode, Target}`.

**`dns.go` — `DNSDiagnostics`**

```go
func (d *DNSDiagnostics) CheckDNS(ctx) (*StepResult, error)
```

Tests DNS by resolving a known hostname and checking for valid answers.

**`route_lookup.go` — `RouteLookupDiagnostics`**

```go
func (d *RouteLookupDiagnostics) DetectNetworkConfig(ctx, routerID) (*NetworkConfig, error)
func (d *RouteLookupDiagnostics) DetectWanInterface(ctx, routerID) (string, error)
func (d *RouteLookupDiagnostics) DetectGateway(ctx, routerID) (string, error)
func (d *RouteLookupDiagnostics) DetectISP(ctx, wanIP) (*ISPInfo, error)
```

`DetectWanInterface` queries `/ip/route/print` for the default route (`dst-address=0.0.0.0/0`) and
extracts the `gateway-interface` field.

`DetectISP` makes an HTTP call to `ip-api.com` with the router's WAN IP to retrieve ISP name, phone,
and URL.

---

### `internal/services/netif`

Network interface IP address management.

**`ip_address_service.go`** — CRUD for IP addresses assigned to interfaces:

```go
// GetIPAddresses(ctx, port, interfaceName) — /ip/address print where interface=name
// AddIPAddress(ctx, port, input)           — /ip/address add address=... interface=...
// RemoveIPAddress(ctx, port, id)           — /ip/address remove .id=...
// SetIPAddress(ctx, port, id, input)       — /ip/address set .id=...
```

**`ip_conflicts.go`** — Detects conflicting IP addresses across interfaces by comparing assigned
addresses and checking for overlapping subnets.

---

### `internal/services/networking/vlan`

VLAN registry and allocation.

**`operations.go`** — Manages VLAN IDs across bridges and interfaces:

```go
// AllocateVLAN(ctx, db, bridgeName, purpose) → VLANAllocation{ID, VLAN, Bridge}
// ReleaseVLAN(ctx, db, vlanID)
// GetVLANRegistry(ctx, db) → []VLANRegistryEntry
```

Uses the ent-backed `VLANAllocationRepository` from `internal/adapters/ent_vlan_allocation_repo.go`.

---

## Data Flow

### Firewall Address List Query

```
resolver → firewall.GetAddressLists(ctx, port)
         → fetchAddressListEntries(ctx, port)
             → port.ExecuteCommand({Path: "/ip/firewall/address-list", Action: "print"})
             → parse response → []AddressListEntry
         → group by name → map[name]*AddressListAggregate
         → for each name: goroutine → fetchRules(ctx, port, name) → count rules
         → wg.Wait()
         → return []AddressListAggregate
```

### DNS Lookup (RouterOS native A record)

```
resolver → dns.PerformLookup(ctx, &LookupInput{Hostname: "google.com", RecordType: "A"})
         → s.resolveServer(ctx, input) → "" (router's own DNS)
         → input.RecordType == "A" && server == "" → lookupViaRouterOS(ctx, input)
             → port.ExecuteCommand({Path: "/ip/dns/cache", Action: "print"})
             → parse response → records, authoritative
         → return LookupResult{Records, QueryTime, Authoritative}
```

### Troubleshoot Session Flow

```
resolver → troubleshoot.StartTroubleshoot(ctx, routerID)
         → session created (5 pending steps: WAN, Gateway, Internet, DNS, NAT)
         → DetectNetworkConfig → discover WAN iface + gateway from routing table

resolver → RunTroubleshootStep(ctx, sessionID, StepTypeGateway)
         → step.Status = running
         → circuitBreakerDiag.CheckGateway(ctx, session.Gateway)
             → port.ExecuteCommand({Path: "/tool/ping", ...})
         → step.Status = passed | failed
         → if failed: GetFix("NO_GATEWAY_REPLY") → FixSuggestion{Command, IsManualFix}

resolver → ApplyTroubleshootFix(ctx, sessionID, "NO_GATEWAY_REPLY")
         → fix.Command → parseRouterOSCommand → router.Command
         → port.ExecuteCommand(cmd)
         → session.AppliedFixes = ["NO_GATEWAY_REPLY"]
```

### Network Scan Flow

```
resolver → scanner.ScanSubnet(ctx, "192.168.88.0/24", DefaultConfig())
         → ParseIPRange("192.168.88.0/24") → []string{all 254 host IPs}
         → semaphore (MaxWorkers=20)
         → for each ip: goroutine → ScanIP(ctx, ip, [80,443,8728,8729,8291], 2s)
             → for each port: goroutine (semaphore=5) → IsPortOpen (TCP dial)
             → if port 8728 open: MikroTik binary API probe → vendor = "MikroTik"
             → if port 80 open: HTTP GET, check response headers
         → collect []Device
         → return []Device (MikroTik devices + other open-port devices)
```

---

## Configuration

| Setting                    | Default                          | Package                          |
| -------------------------- | -------------------------------- | -------------------------------- |
| Scanner max workers        | `20`                             | `router/scanner.DefaultConfig()` |
| Scanner port timeout       | `2s`                             | `router/scanner.DefaultConfig()` |
| Scanner target ports       | `[80, 443, 8728, 8729, 8291]`    | `router/scanner.DefaultConfig()` |
| Scanner per-IP concurrency | `5` (semaphore)                  | `scanner.ScanIP`                 |
| DNS benchmark concurrency  | `5` workers                      | `dns` package                    |
| Bridge undo TTL            | `10 seconds`                     | `UndoStore`                      |
| Troubleshoot session TTL   | `1 hour`                         | `SessionStore`                   |
| DNS lookup timeout         | inherits from RouterPort context | `dns.Service`                    |

---

## Error Handling

**Firewall services** return wrapped errors with operation context:

```go
fmt.Errorf("failed to fetch address list entries: %w", err)
```

A `nil` `RouterPort` passed to stateless services returns an immediate error without panicking.

**DNS service** never returns an error for lookup failures — it encodes the failure in
`LookupResult.Status` and `LookupResult.Error`. Only structural errors (nil input, missing hostname)
return a Go error.

**Scanner** returns `nil` for an IP if context is canceled before scanning completes. The caller
(subnet scan) skips nil results.

**Troubleshoot service** returns typed sentinel errors:

```go
var (
    ErrStepNotFound        = errors.New("diagnostic step not found")
    ErrFixNotFound         = errors.New("fix not found for issue code")
    ErrUnknownStepType     = errors.New("unknown diagnostic step type")
    ErrNilDiagnosticResult = errors.New("diagnostic check returned nil result")
)
```

Fix application returns `(success bool, message string, status FixApplicationStatus, err error)` —
distinguishing between "fix not available" (`FixStatusAvailable`, no error) and "fix failed"
(`FixStatusFailed`, with error).

---

## Testing

- **Firewall tests** use mock `RouterPort` that returns pre-canned command results; parallel
  goroutine tests verify the `sync.WaitGroup` pattern
- **Scanner tests** use `net.Listener` on random ports to simulate open ports; `ParseIPRange` has
  table-driven unit tests for all three input formats
- **DNS tests** mock `RouterPort` for RouterOS-native path; Go resolver path tested with real DNS or
  a local DNS server fixture
- **Troubleshoot tests** use mock diagnostic engines returning controlled `StepResult`; session
  store tested for TTL expiry and concurrent access
- **Bridge service tests** verify the undo chain: create → undo, update → undo, delete → undo;
  `UndoStore` TTL tested with a fast clock

---

## Cross-References

- [See: 04-router-communication.md §RouterPort Interface] — the `RouterPort` that all services operate
  through
- [See: 04-router-communication.md §Batch Executor] — batch commands used for bulk firewall rule imports
- [See: 08-provisioning-engine.md §Network Provisioning] — how provisioning stages call firewall and
  bridge services
- [See: 06-service-orchestrator.md §VIF System] — VIF uses bridge service for interface creation
- Pattern reference: `Docs/architecture/backend-architecture.md §Service Layer`
