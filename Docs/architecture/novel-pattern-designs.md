# Novel Pattern Designs

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - 8 Breakthrough Architectural Innovations

---

## Overview

NasNetConnect introduces **8 breakthrough architectural patterns** that differentiate it from existing router management solutions. These patterns emerged from comprehensive brainstorming and validation sessions.

---

## Table of Contents

1. [Virtual Interface Factory Pattern](#1-virtual-interface-factory-pattern)
2. [Unified GraphQL Schema-First Architecture](#2-unified-graphql-schema-first-architecture)
3. [Universal State v2 - 8-Layer Resource Model](#3-universal-state-v2---8-layer-resource-model)
4. [Headless + Platform Presenters UI Pattern](#4-headless--platform-presenters-ui-pattern)
5. [Three-Tier Event Storage](#5-three-tier-event-storage)
6. [Hybrid Database Architecture](#6-hybrid-database-architecture)
7. [Pull-Based Update System](#7-pull-based-update-system)
8. [Apply-Confirm-Merge State Flow](#8-apply-confirm-merge-state-flow)

---

## 1. Virtual Interface Factory Pattern

**Innovation:** Network services (VPNs, proxies, Tor, AdGuard) become native MikroTik router interfaces via auto-managed VLANs.

### The Problem

Traditional approach for routing traffic through services:
1. User manually creates VLAN
2. User configures bridge
3. User sets up DHCP
4. User writes mangle rules
5. User creates routing table
6. User adds firewall rules
7. User starts service
8. User configures service to bind to VLAN IP

**8 manual steps, expert knowledge required, error-prone**

### The Innovation

```
User clicks: "Install Tor (US exits)"
         ↓
Interface appears: nnc-tor-usa
         ↓
User routes traffic: "IoT VLAN → nnc-tor-usa"
         ↓
DONE
```

**Behind the scenes (fully automatic):**
```
┌─────────────────────────────────────────────────────────────┐
│         VIRTUAL INTERFACE FACTORY - AUTO-CREATION            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. VLAN Allocation                                         │
│     • Allocator assigns VLAN 101                            │
│     • Name: nnc-vlan101                                     │
│     • IP: 10.99.101.1/24                                    │
│                                                              │
│  2. Router Interface Creation                                │
│     • Interface Factory creates nnc-tor-usa                 │
│     • Attached to VLAN 101                                   │
│     • DHCP client configured                                 │
│                                                              │
│  3. Service Launch                                           │
│     • Tor starts with ExitNodes {us}                        │
│     • SOCKSPort bound to 10.99.101.1:9050                   │
│                                                              │
│  4. Gateway Creation                                         │
│     • hev-socks5-tunnel creates TUN interface              │
│     • SOCKS5 proxy at 10.99.101.1:9050                      │
│                                                              │
│  5. Policy-Based Routing                                     │
│     • Mangle rules for marked traffic                       │
│     • Routing table entry created                           │
│     • nnc-tor-usa now routeable                             │
│                                                              │
│  6. Firewall Rules                                           │
│     • Accept rules for VLAN traffic                         │
│     • NAT masquerade for outbound                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Breakthrough Benefits

- **Zero User Complexity:** Install service, route traffic - that's it
- **Native Integration:** Services ARE router interfaces (not external boxes)
- **Policy-Based Routing:** Built into RouterOS, no custom iptables
- **Multiple Instances:** Run Tor US + Tor DE + Tor Random simultaneously
- **Instant Switching:** Change routing policy per device with single click

**Use Cases Enabled:**
- Route IoT devices through Tor while gaming uses low-latency VPN
- Run multiple instances of same service (different exit regions)
- Instantly A/B test different proxy services
- Per-device routing policies without firewall expertise

**Related ADR:** [ADR-006: Virtual Interface Factory Pattern](./adrs/006-virtual-interface-factory.md)

---

## 2. Unified GraphQL Schema-First Architecture

**Innovation:** GraphQL schema is the single source of truth for TypeScript types, Go structs, Zod validation, and platform mappings.

### The Problem

**Traditional Multi-Language Development:**
```
TypeScript types (frontend) ──┐
                               ├──> Manually kept in sync ❌
Go structs (backend) ─────────┘     (Drift over time)

Validation rules scattered:
  - Zod schemas (frontend)
  - Go validators (backend)
  - API documentation (outdated)
```

**Issues:**
- Frontend/backend drift apart (breaking changes missed)
- Duplicate validation logic (bugs in one but not other)
- Manual documentation (outdated, incomplete)
- No platform mapping coordination

### The Innovation

```graphql
# schema.graphql - SINGLE SOURCE OF TRUTH

type WireGuardClient {
  uuid: ID!
  name: String! @validate(minLength: 1, maxLength: 100)
  privateKey: String! 
    @validate(regex: "^[A-Za-z0-9+/]{43}=$")
    @sensitive
    @mikrotik(field: "private-key")
    @openwrt(field: "private_key")
  listenPort: Int! 
    @validate(min: 1, max: 65535)
    @mikrotik(field: "listen-port")
}
```

**Build Pipeline Auto-Generates:**

```
schema.graphql
      │
      ├──> graphql-codegen ──> TypeScript types
      │                     └─> Zod schemas (from @validate)
      │                     └─> React hooks (useQuery, useMutation)
      │                     └─> Platform mappings
      │
      └──> gqlgen ──────────> Go structs
                            └─> Resolver interfaces
                            └─> Go validators (from @validate)
```

### Breakthrough Benefits

- **End-to-End Type Safety:** Impossible for frontend/backend to drift
- **Single Schema Update:** Change schema once, types update everywhere
- **Validation Synchronized:** Frontend Zod = Backend Go validators
- **Self-Documenting:** Schema IS the API documentation (GraphQL Playground)
- **Platform Abstraction:** Mappings in schema, not scattered in code

**Example Generated Code:**

```typescript
// Auto-generated TypeScript (frontend)
export type WireGuardClient = {
  uuid: string;
  name: string;
  privateKey: string;
  listenPort: number;
};

export const wireGuardClientSchema = z.object({
  name: z.string().min(1).max(100),
  privateKey: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
  listenPort: z.number().min(1).max(65535),
});

export function useWireGuardClient(uuid: string) {
  return useQuery(GET_WIREGUARD_CLIENT, { variables: { uuid } });
}
```

```go
// Auto-generated Go (backend)
type WireGuardClient struct {
    UUID       string `json:"uuid"`
    Name       string `json:"name"`
    PrivateKey string `json:"privateKey"`
    ListenPort int    `json:"listenPort"`
}

func ValidateWireGuardClient(input WireGuardClientInput) error {
    if len(input.Name) < 1 || len(input.Name) > 100 {
        return errors.New("name must be 1-100 characters")
    }
    // ... auto-generated from @validate directives
}
```

**Related ADR:** [ADR-011: Unified GraphQL Architecture](./adrs/011-unified-graphql-architecture.md)

---

## 3. Universal State v2 - 8-Layer Resource Model

**Innovation:** Every resource (VPN, Firewall, Interface, Feature) implements a standardized 8-layer model separating user intent from router reality.

### The Problem

**Traditional Flat State:**
```typescript
type VPN = {
    name: string;              // User provides
    privateKey: string;        // User provides
    publicKey?: string;        // Router generates - but when?
    routerInterfaceId?: string; // Router assigns - optional? required?
    isConnected?: boolean;     // Runtime - how often updated?
    bytesIn?: number;          // Metrics - where stored?
}
```

**Issues:**
- Unclear which fields user edits vs router generates
- Cannot tell if data is stale (no updated timestamp)
- No validation results (did pre-flight check pass?)
- No audit trail (who changed what when?)
- No deployment tracking (what's actually on router?)

### The Innovation

**8 Layers with Clear Semantics:**

| Layer | Purpose | Source | Updated | Example |
|-------|---------|--------|---------|---------|
| **configuration** | User intent | Frontend | User edits | `{ name, privateKey, wanInterface }` |
| **validation** | Pre-flight checks | Backend | On change | `{ canApply: true, warnings: [] }` |
| **deployment** | Router reality | Backend | After apply | `{ routerInterfaceId, publicKey, appliedAt }` |
| **runtime** | Live state | Router | Polling/Push | `{ isConnected, bytesIn, lastHandshake }` |
| **telemetry** | Historical | Backend | Continuous | `{ bandwidthHistory, uptimeGraph }` |
| **metadata** | Lifecycle | Backend | System | `{ createdAt, createdBy, version, tags }` |
| **relationships** | Dependencies | User+System | Both | `{ dependsOn: [...], dependents: [...] }` |
| **platform** | Capabilities | Adapter | Adapter | `{ current: "mikrotik", capabilities }` |

**GraphQL Query:**

```graphql
query GetVPN {
  resource(uuid: "vpn-uuid") {
    # Layer 1: What user configured
    configuration {
      name
      privateKey
    }
    
    # Layer 3: What's on router
    deployment {
      routerInterfaceId
      publicKey
      appliedAt
    }
    
    # Layer 4: What's happening now
    runtime {
      isConnected
      bytesIn
      lastHandshake
    }
  }
}
```

### Breakthrough Benefits

- **Clear Separation:** Never confuse user input with router output
- **Flexible Fetching:** Mobile gets minimal layers, desktop gets all 8
- **Validation Tracking:** Know if config can be applied before trying
- **Audit Trail:** Event sourcing on all layers
- **Time Travel:** Reconstruct state at any point in history
- **Impact Analysis:** Relationship layer enables "what breaks if I delete?"

**Related ADR:** [ADR-012: Universal State v2](./adrs/012-universal-state-v2.md)

---

## 4. Headless + Platform Presenters UI Pattern

**Innovation:** Separate component behavior (headless hooks) from presentation (Mobile/Tablet/Desktop variants).

### The Problem

**Traditional Responsive Design:**
```tsx
// Single component with media query classes
<Card className="p-2 md:p-4 lg:p-6">
  <h3 className="text-sm md:text-base lg:text-lg">{name}</h3>
  <div className="flex flex-col md:flex-row lg:flex-row">
    {/* Complex nested responsive classes */}
  </div>
</Card>
```

**Issues:**
- Component becomes CSS spaghetti
- Can't fundamentally change structure (cards vs table)
- Mobile gets "shrunk desktop" not "mobile-first"
- Testing requires simulating all breakpoints
- Duplicate logic when structure MUST differ

### The Innovation

**Headless Hook (Logic - Write Once):**

```tsx
export function useResourceCard<T extends Resource>(props) {
  const { resource, actions } = props;
  
  // Business logic shared across all presenters
  const status = resource.runtime?.status || 'unknown';
  const isOnline = status === 'online';
  const statusColor = getStatusColor(status);
  
  return {
    status,
    isOnline,
    statusColor,
    primaryAction: actions?.[0],
    secondaryActions: actions?.slice(1),
    handlePrimaryAction: () => actions?.[0]?.onClick(),
  };
}
```

**Platform Presenters (Presentation - Optimal per Device):**

```tsx
// Mobile: Bottom sheet, large buttons, essential info
export function ResourceCardMobile<T>(props) {
  const state = useResourceCard(props);
  return (
    <Card>
      <h3>{props.resource.configuration.name}</h3>
      <StatusBadge {...state} />
      <Button fullWidth onClick={state.handlePrimaryAction}>
        {state.primaryAction?.label}
      </Button>
    </Card>
  );
}

// Desktop: Dropdown menu, compact, detailed
export function ResourceCardDesktop<T>(props) {
  const state = useResourceCard(props);
  return (
    <Card className="flex items-center justify-between">
      <div>
        <h3>{props.resource.configuration.name}</h3>
        <StatusBadge {...state} />
        <p className="text-sm">{props.resource.metadata.description}</p>
      </div>
      <DropdownMenu>
        {state.secondaryActions?.map(action => (
          <DropdownMenuItem onClick={action.onClick}>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </Card>
  );
}

// Auto-detect platform
export function ResourceCard<T>(props) {
  const platform = usePlatform();  // mobile | tablet | desktop
  return platform === 'mobile' 
    ? <ResourceCardMobile {...props} />
    : <ResourceCardDesktop {...props} />;
}
```

### Breakthrough Benefits

- **Write Logic Once:** Business logic shared across all presenters (80% code reuse)
- **Optimal UX per Device:** Mobile gets touch-friendly, desktop gets dense/powerful
- **Easy Maintenance:** Fix bug in headless hook, all presenters benefit
- **Easy Testing:** Test headless logic once (unit), visual test presenters (Chromatic)
- **Automatic Detection:** Features don't think about responsive (patterns handle it)

**Related ADR:** [ADR-018: Headless + Platform Presenters](./adrs/018-headless-platform-presenters.md)

---

## 5. Three-Tier Event Storage

**Innovation:** Hot (tmpfs) / Warm (flash) / Cold (external) event storage minimizes flash wear while preserving audit trail.

### The Problem

**Event Sourcing on Flash Storage:**
- Metrics update every 5-60s = 17,280 writes/day per router
- Flash has limited write cycles (~10,000-100,000)
- Need complete audit trail for compliance
- Limited flash space (~70MB usable)

**Direct Conflict:** Event sourcing (many writes) vs Flash longevity (few writes)

### The Innovation

```
┌─────────────────────────────────────────────────────────────┐
│              THREE-TIER EVENT STORAGE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HOT TIER (tmpfs - /tmp/events.db)                          │
│  ├─ Duration: 24 hours                                      │
│  ├─ Events: ALL (no filtering)                              │
│  ├─ Writes: Unlimited (tmpfs = no wear)                     │
│  ├─ Speed: <1ms writes, 10,000+ events/sec                 │
│  └─ Volatile: Lost on power failure (acceptable)           │
│                                                              │
│           ↓ Daily sync (critical events only)               │
│                                                              │
│  WARM TIER (flash - /var/router-{id}.db)                    │
│  ├─ Duration: 7-30 days (per event type)                   │
│  ├─ Events: Critical only (filtered)                        │
│  ├─ Compression: zstd (10x faster than gzip)               │
│  ├─ Writes: Minimized (flash protected)                    │
│  └─ Persistent: Survives reboots                           │
│                                                              │
│           ↓ Weekly archive (if external storage)            │
│                                                              │
│  COLD TIER (external - /mnt/usb/archive/)                   │
│  ├─ Duration: Unlimited                                     │
│  ├─ Events: Complete archive                                │
│  ├─ Compression: zstd level 9 (maximum)                     │
│  ├─ Format: Partitioned by month                            │
│  └─ Optional: Works without external storage               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Event Classification:**
- **Critical** (30 days warm): Config changes, auth events, deletions
- **Normal** (7 days warm): Resource CRUD, feature lifecycle
- **Low-value** (24h hot only): Metrics, logs, polling

### Breakthrough Benefits

- **Flash Longevity:** 99% of writes to tmpfs, minimal flash wear
- **Fast Queries:** Recent events (90% of queries) served from tmpfs (<10ms)
- **Complete Audit:** Critical events persist to flash
- **Unlimited History:** Optional external storage for compliance
- **Graceful Degradation:** Works without external mount

**Related ADR:** [ADR-013: Three-Tier Event Storage](./adrs/013-three-tier-event-storage.md)

---

## 6. Hybrid Database Architecture

**Innovation:** system.db (fleet coordination) + router-{id}.db × N (per-router isolation).

### The Problem

**Single Database for Fleet:**
```sql
-- Everything in one database
CREATE TABLE resources (
    uuid TEXT PRIMARY KEY,
    router_id TEXT NOT NULL,  -- On every table!
    ...
);

-- Every query needs router_id filter
SELECT * FROM resources WHERE router_id = 'router-main';
```

**Issues:**
- Lock contention (all routers share tables)
- Blast radius (corruption affects all routers)
- Inefficient (router_id filter on every query)
- Complex migrations (all-or-nothing)

### The Innovation

```
system.db (Global - 6MB)
├─ routers, router_secrets
├─ users, sessions, api_keys
├─ global_settings
├─ marketplace_features
└─ fleet_metrics (materialized views)

router-main.db (4-8MB)
├─ resources (8-layer model)
├─ resource_events (event sourcing)
├─ resource_relationships
└─ config_snapshots

router-office.db (4-8MB)
├─ [Same structure]

... (up to 10+ routers)
```

**Database Manager:**
```go
// system.db always open
// router-{id}.db lazy-loaded on demand, cached 5 min idle timeout

db := dbManager.GetRouterDB("router-main")
resources := db.Resource.Query().All(ctx)
// No router_id filter needed - implicit in DB selection
```

### Breakthrough Benefits

- **Clean Isolation:** Router failure contained, doesn't affect others
- **Parallel Operations:** Query multiple routers without contention
- **Independent Failures:** One DB corrupt ≠ total loss
- **Efficient Queries:** No router_id overhead
- **Soft Delete:** Keep router-{id}.db file, archive later
- **Scalable Migrations:** Parallel + lazy migration (1-2 min vs 10 min)

**Related ADR:** [ADR-014: Hybrid Database Architecture](./adrs/014-hybrid-database-architecture.md)

---

## 7. Pull-Based Update System

**Innovation:** Routers check for updates on their schedule (pull), server is stateless (infinite scale with CDN).

### The Problem

**Push-Based Updates (Traditional):**
- Server pushes updates to clients
- Requires persistent connection or inbound connectivity
- Server tracks state for millions of devices
- Users interrupted during critical network usage
- Complex infrastructure (push notifications, state tracking)

### The Innovation

```
Router (Active Agent)              Update Server (Passive)
┌───────────────────┐             ┌──────────────────┐
│ • Checks manifest │ ──PULL───>  │ • Hosts files    │
│   on schedule     │             │ • No push        │
│ • Downloads in    │ <──────────  │ • Stateless      │
│   background      │             │ • CDN-friendly   │
│ • Decides when    │             └──────────────────┘
│   to apply        │
│ • Respects local  │
│   conditions      │
└───────────────────┘
```

**Smart Timing:**
```go
func shouldCheckNow() bool {
    return !isQuietHour() &&        // Not 2-6 AM
           !isHighTraffic() &&      // Not during gaming
           !isMetered() &&          // Not on cellular
           timesinceLastCheck() > interval
}
```

### Breakthrough Benefits

- **User Control:** Updates on user's schedule, not server's
- **Infinite Scale:** CDN serves static files, no server state
- **NAT-Friendly:** Works behind any firewall (outbound HTTPS only)
- **Resilient:** Retry on router's schedule, no timeout pressure
- **Cost-Effective:** No push infrastructure needed

**Auto-Apply Matrix:**
- Security hotfix → Auto-apply immediately
- Minor patch → Auto-apply during idle
- Major version → Ask user
- Breaking changes → Require review

**Related ADR:** [ADR-016: Pull-Based Update System](./adrs/016-pull-based-update-system.md)

---

## 8. Apply-Confirm-Merge State Flow

**Innovation:** Never assume configuration applied successfully - always confirm from router.

### The Problem

**Traditional Optimistic Apply:**
```go
// Apply config to router
router.Execute("/interface/wireguard/add", params)

// Assume success, update local state immediately
localState.vpns = append(localState.vpns, newVPN)
```

**Issues:**
- Router may reject (name conflict, resource limit, invalid params)
- Partial success (some commands succeed, others fail)
- State drift (local state ≠ router reality)
- No router-generated fields captured (public key, interface ID)

### The Innovation

**Apply → Confirm → Merge Pattern:**

```
1. User submits configuration (partial or full state)
         ↓
2. Backend validates (7-stage pipeline)
         ↓
3. Backend applies to router (transactional)
         ↓
4. Backend queries router for confirmation
   (includes router-generated fields: publicKey, etc.)
         ↓
5. State updated with router's reality
   (deployment layer populated)
         ↓
6. Event published to Event Bus
         ↓
7. GraphQL subscription updates frontend
         ↓
8. Apollo cache automatically updates UI

On Error: Rollback transaction, state unchanged
```

**Implementation:**

```go
func (s *StateService) UpdateResource(uuid ulid.ULID, config map[string]interface{}) error {
    // 1. Validate
    if err := s.validator.Validate(config); err != nil {
        return err
    }
    
    // 2. Apply to router (transactional)
    deployResult, err := s.router.Apply(config)
    if err != nil {
        return s.rollback(uuid)
    }
    
    // 3. Confirm from router (CRITICAL - query actual state)
    actualState, err := s.router.Query(uuid)
    if err != nil {
        return s.rollback(uuid)
    }
    
    // 4. Merge into state (what router confirmed, not what we sent)
    tx, _ := s.db.BeginTx(ctx)
    
    // Event + Table in single transaction
    tx.ResourceEvent.Create().SetPayload(actualState).Save(ctx)
    tx.Resource.UpdateOne(uuid).SetDeployment(actualState).Save(ctx)
    
    tx.Commit()
    
    // 5. Publish event
    s.eventBus.Publish(ResourceUpdatedEvent{UUID: uuid})
    
    return nil
}
```

### Breakthrough Benefits

- **Router is Truth:** State always reflects router reality, not assumptions
- **Captures Generated Fields:** Gets publicKey, routerInterfaceId from router
- **Handles Partial Success:** If router rejects, state unchanged
- **Atomic Updates:** Event + Table in single transaction
- **Audit Trail:** Every apply recorded in event log
- **Rollback Safety:** Can revert because we have actual applied state

**vs Optimistic Apply:**

| Aspect | Optimistic | Apply-Confirm-Merge |
|--------|-----------|---------------------|
| **Speed** | Fast (no confirmation) | +1 router query | 
| **Accuracy** | Assumes success | Confirms reality |
| **Generated Fields** | Missing | Captured |
| **Error Handling** | Complex (state/router diverged) | Simple (state unchanged on error) |
| **Audit Trail** | Incomplete | Complete |

**Verdict:** Slight latency cost (+50-100ms) worth it for correctness and auditability

---

## Comparison with Existing Solutions

| Pattern | NasNetConnect | Competitors | Advantage |
|---------|--------------|-------------|-----------|
| **Virtual Interface Factory** | Auto-managed VLANs → router interfaces | Manual VLAN/routing config | Zero user complexity |
| **Schema-First GraphQL** | Single source → TS + Go + Zod | Separate definitions per layer | End-to-end type safety |
| **Universal State v2** | 8-layer resource model | Flat state | Complete lifecycle visibility |
| **Headless + Presenters** | Logic once, optimal UX per device | CSS-only responsive | True platform optimization |
| **Three-Tier Events** | Hot/Warm/Cold storage | All to flash OR all volatile | Flash longevity + audit |
| **Hybrid Database** | system + per-router DBs | Single monolith | Isolation + performance |
| **Pull-Based Updates** | Router-initiated, stateless server | Server-push, stateful | Infinite scale, user control |
| **Apply-Confirm-Merge** | Router confirms every apply | Optimistic assume success | State = router reality |

---

## Innovation Summary

These 8 patterns work together to create a system that is:
- **Simple for Users:** Virtual interfaces hide complexity
- **Safe by Default:** Apply-Confirm-Merge prevents state drift
- **Scalable:** Pull-based updates + hybrid DB + stateless GraphQL
- **Maintainable:** Schema-first + headless components + event sourcing
- **Performant:** Three-tier storage + CDN + lazy-loading
- **Extensible:** Platform adapters + marketplace features + layered state

**Validation:** All patterns validated through:
- 17 brainstorming sessions (5 techniques each)
- 19 technical research reports
- Alignment with 40+ PRD documents
- Complete UX design specification

---

## Related Documents

- [Backend Architecture](./backend-architecture.md)
- [Data Architecture](./data-architecture.md)
- [API Contracts](./api-contracts.md)
- [Deployment Architecture](./deployment-architecture.md)
- [All ADRs](./architecture-decision-records-adrs.md)

---
