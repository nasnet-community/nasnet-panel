# Data Architecture

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - Universal State v2 + Hybrid Database + Event Sourcing

---

## Table of Contents

- [Universal State v2 Overview](#universal-state-v2-overview)
- [8-Layer Resource Model](#8-layer-resource-model)
- [Frontend State Architecture](#frontend-state-architecture)
- [Backend Data Model](#backend-data-model)
- [Hybrid Database Architecture](#hybrid-database-architecture)
- [Event Sourcing & Time Travel](#event-sourcing--time-travel)
- [Three-Tier Event Storage](#three-tier-event-storage)
- [Cross-Database Relationships](#cross-database-relationships)
- [Migration Strategy](#migration-strategy)
- [Performance Optimization](#performance-optimization)

---

## Universal State v2 Overview

### Core Philosophy

1. **Router as Source of Truth:** Application tracks "Desired State", router holds "Actual State". Backend synchronizes between them.
2. **8-Layer Resource Model:** Standardized structure for any network resource (VPN, Interface, Firewall Rule, Feature).
3. **Schema-First:** GraphQL schema is single source of truth for types, validation, and API contracts.
4. **Fleet Multi-Device:** Each device has platform-specific state using native naming (no platform blocks needed).

### State Flow: Apply → Confirm → Merge

```
┌─────────────────────────────────────────────────────────────┐
│              APPLY-CONFIRM-MERGE PATTERN                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User submits configuration (partial or full)               │
│           ↓                                                  │
│  Backend validates (7-stage validation pipeline)            │
│           ↓                                                  │
│  Backend applies to router (transactional)                  │
│           ↓                                                  │
│  Backend queries router for confirmation                     │
│  (includes router-generated fields)                         │
│           ↓                                                  │
│  Universal State updated with router reality                │
│  (deployment layer populated)                               │
│           ↓                                                  │
│  Event published to Event Bus                               │
│  (audit trail, real-time updates)                           │
│           ↓                                                  │
│  GraphQL subscription notifies frontend                      │
│           ↓                                                  │
│  Apollo cache automatically updates UI                       │
│                                                              │
│  On Error: Rollback entire transaction                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8-Layer Resource Model

Every resource (VPN, WAN Link, Firewall Rule, LAN Network, Feature) implements up to **8 optional layers**:

```
┌─────────────────────────────────────────────────────────────┐
│                  8-LAYER RESOURCE MODEL                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: CONFIGURATION                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • User's desired config (mutable by user)             ││
│  │  • Source: Frontend                                     ││
│  │  • Validated: Zod on client, GraphQL on server         ││
│  │  • Example: { name: "USA VPN", privateKey: "...",      ││
│  │              wanInterface: "wan-domestic" }             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 2: VALIDATION                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Pre-flight check results (computed by backend)      ││
│  │  • Source: Backend (7-stage validation pipeline)       ││
│  │  • Updated: On every configuration change              ││
│  │  • Example: { canApply: true, warnings: [],            ││
│  │              conflicts: [], requiredDeps: [...] }       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 3: DEPLOYMENT                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • What's actually on router (written after apply)     ││
│  │  • Source: Backend (after Apply-Confirm)               ││
│  │  • Includes router-generated fields                     ││
│  │  • Example: { routerInterfaceId: "*1A",                ││
│  │              publicKey: "abc...",                       ││
│  │              appliedAt: "2026-01-20T10:30:00Z" }        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 4: RUNTIME                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Live operational state (polled/streamed from router)││
│  │  • Source: Router                                       ││
│  │  • Updated: Polling (5-60s) or WebSocket push          ││
│  │  • Example: { isConnected: true, bytesIn: 1048576,     ││
│  │              lastHandshake: "2s ago", currentPeers: 1 }││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 5: TELEMETRY (optional)                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Time-series metrics (historical data)               ││
│  │  • Source: Backend (collected over time)               ││
│  │  • Example: { bandwidthHistory: [...],                 ││
│  │              uptimeGraph: [...], hourlyStats: [...] }   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 6: METADATA                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Resource lifecycle info, tags, ownership            ││
│  │  • Source: Backend (system-managed)                     ││
│  │  • Example: { createdAt: "...", createdBy: "admin",    ││
│  │              tags: ["prod"], description: "...",        ││
│  │              version: 5 }                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 7: RELATIONSHIPS                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Dependencies (embedded in config + explicit table)  ││
│  │  • Embedded: User-defined relationships                 ││
│  │  • Table: System-discovered dependencies               ││
│  │  • Example: { routesVia: "wan-domestic" } +            ││
│  │    relationship_table: { from: "vpn", to: "wan",       ││
│  │                          type: "routes-via" }           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 8: PLATFORM (optional)                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Capabilities and field mappings                      ││
│  │  • Source: Platform adapter                             ││
│  │  • Example: { current: "mikrotik",                      ││
│  │              capabilities: { wireguard: "advanced" },   ││
│  │              fieldMappings: {...} }                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Resource Categories

Resources organized into 6 categories beyond simple topology:

| Category | Examples | Characteristics |
|----------|----------|-----------------|
| **Networks** | WAN Links, LAN Networks, VLANs | Topology-driven, infrastructure |
| **VPN** | WireGuard Client/Server, OpenVPN | Connectivity-driven, security |
| **Infrastructure** | Certificates, NTP, DDNS, Services | System-level, operational |
| **Application** | Port Forwarding, Game Rules | User workload, application-specific |
| **Features** | Tor, AdGuard, sing-box | Marketplace, downloadable, dynamic |
| **Plugins** | Community Extensions | Third-party, runtime-defined schemas |

---

## Frontend State Architecture

### Four-Layer State Separation

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND STATE ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: SERVER STATE (Apollo Client)                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Normalized graph cache (automatic deduplication)    ││
│  │  • Entities: Router, Resource, Feature, User           ││
│  │  • Auto-updates via GraphQL Subscriptions              ││
│  │  • Optimistic updates for instant feedback             ││
│  │  • Cache policies per entity type                      ││
│  │  • Persistence via apollo3-cache-persist (optional)    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 2: UI STATE (Zustand)                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Theme preference (dark/light/system)                ││
│  │  • Sidebar state (collapsed/expanded)                   ││
│  │  • Active tab, selected router, active filters         ││
│  │  • Modal state (open/closed)                            ││
│  │  • Connection status (online/offline/degraded)         ││
│  │  • Persisted to localStorage via middleware            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 3: COMPLEX FLOWS (XState)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • VPN Connection Lifecycle:                            ││
│  │    idle → validating → applying → monitoring → error   ││
│  │  • Configuration Safety Pipeline:                       ││
│  │    edit → diff → confirm → apply → verify → committed  ││
│  │  • Setup Wizard Flow:                                   ││
│  │    choose → wan → lan → extra → review → apply         ││
│  │  • Guards prevent invalid transitions                   ││
│  │  • Actor model for concurrent processes                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  LAYER 4: FORM STATE (React Hook Form + Zod)                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Isolated form contexts (no global state pollution)  ││
│  │  • Zod schemas auto-generated from GraphQL directives  ││
│  │  • Field-level validation with instant feedback        ││
│  │  • Uncontrolled inputs (minimal re-renders)            ││
│  │  • Watch API for dependent fields                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### State Management Decision Tree

```
Is it data from the router (server)?
├─ Yes → Use Apollo Client (GraphQL queries/subscriptions)
│         Cache: Normalized, auto-update on subscriptions
│         
└─ No → Is it a complex multi-step workflow?
    ├─ Yes → Use XState (state machines)
    │         Examples: VPN connection, safety pipeline, wizard
    │         
    └─ No → Use Zustand (global UI state)
              Examples: Theme, sidebar, modals, preferences
```

---

## Backend Data Model

### Hybrid Database Architecture

**Dual Storage Strategy for Fleet Management:**

```
┌─────────────────────────────────────────────────────────────┐
│            HYBRID DATABASE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  system.db (~6 MB)                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • routers (metadata + capabilities)                    ││
│  │  • users, sessions, api_keys                            ││
│  │  • global_settings                                       ││
│  │  • marketplace_features (catalog)                       ││
│  │  • fleet_metrics (materialized summaries)               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  router-{id}.db × N (~4-8 MB each)                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Router-Specific Data:                                  ││
│  │  • resources (configuration for this router)            ││
│  │  • resource_events (config change history)              ││
│  │  • router_metrics (detailed time-series)                ││
│  │  • router_logs (operational logs)                        ││
│  │  • config_snapshots (milestone backups)                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Benefits:                                                   │
│  ✓ Clean isolation (router failure doesn't affect others)  │
│  ✓ Parallel operations (concurrent router queries)          │
│  ✓ Independent failures (one DB corrupt ≠ total loss)      │
│  ✓ Efficient queries (no cross-router JOINs needed)        │
│  ✓ Soft delete routers (keep DB file, archive later)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Database Lifecycle:**
- **system.db:** Always open (singleton)
- **router-{id}.db:** Lazy-loaded on-demand, cached while active (5min idle timeout)
- **Memory:** Base 15MB (system) + 8-10MB per active router
- **Peak:** ~35MB (1-2 active routers typical)

---

### Core Entities (ent Schemas)

#### System Database Entities

```go
// ent/schema/router.go
type Router struct {
    ent.Schema
}

func (Router) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("name"),
        field.String("host"),
        field.Int("port"),
        field.Enum("platform").Values("mikrotik", "openwrt", "vyos"),
        field.String("model"),
        field.String("version"),
        field.Enum("status").Values("online", "offline", "degraded"),
        field.Time("last_seen"),
        field.Time("created_at"),
        field.Time("updated_at"),
    }
}

func (Router) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("secret", RouterSecret.Type).Unique(),
        edge.To("settings", RouterSettings.Type),
    }
}

// ent/schema/router_secret.go (Separate table for security)
type RouterSecret struct {
    ent.Schema
}

func (RouterSecret) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("router_id").GoType(ulid.ULID{}),
        field.String("username_enc").Sensitive(),  // AES-256 encrypted
        field.String("password_enc").Sensitive(),
        field.String("api_port"),
        field.String("ssh_port"),
        field.Bytes("ssh_key_enc").Optional().Sensitive(),
        field.Bool("prefer_ssl"),
    }
}

// ent/schema/user.go
type User struct {
    ent.Schema
}

func (User) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("username").Unique(),
        field.String("password_hash"),  // bcrypt cost 10
        field.String("email").Optional(),
        field.Enum("role").Values("admin", "viewer"),
        field.Bool("is_active"),
        field.Time("created_at"),
        field.Time("updated_at"),
    }
}

// ent/schema/session.go
type Session struct {
    ent.Schema
}

func (Session) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("user_id").GoType(ulid.ULID{}),
        field.String("token_hash"),  // Hashed session token
        field.String("ip_address"),
        field.String("user_agent"),
        field.Time("expires_at"),
        field.Time("created_at"),
        field.Bool("is_revoked"),
    }
}

// ent/schema/api_key.go
type APIKey struct {
    ent.Schema
}

func (APIKey) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("user_id").GoType(ulid.ULID{}),
        field.String("name"),  // "CI/CD Pipeline", "Mobile App"
        field.String("key_prefix"),  // First 12 chars: "nas_abc12345"
        field.String("key_hash"),  // bcrypt hash of full key
        field.JSON("scopes", []string{}),  // ["router:read", "router:write"]
        field.Time("last_used_at").Optional(),
        field.Time("expires_at").Optional(),
        field.Time("created_at"),
    }
}

// ent/schema/global_settings.go
type GlobalSettings struct {
    ent.Schema
}

func (GlobalSettings) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("category"),  // "discovery", "ui", "security", "notifications"
        field.JSON("settings", map[string]interface{}{}),  // Flexible JSON
        field.Int("schema_version"),
        field.Time("updated_at"),
    }
}
```

#### Router-Specific Database Entities

```go
// ent/schema/resource.go (in router-{id}.db)
type Resource struct {
    ent.Schema
}

func (Resource) Fields() []ent.Field {
    return []ent.Field{
        field.String("uuid").GoType(ulid.ULID{}).Unique(),
        field.String("id"),  // Scoped ULID: "vpn.wg.client:usa-vpn:a1b2"
        field.String("type"),  // "vpn.wireguard.client"
        field.String("category"),  // "vpn", "network", "infrastructure"
        
        // 8-Layer Model
        field.JSON("configuration", map[string]interface{}{}),
        field.JSON("validation", map[string]interface{}).Optional(),
        field.JSON("deployment", map[string]interface{}).Optional(),
        field.JSON("runtime", map[string]interface{}).Optional(),
        field.JSON("telemetry", map[string]interface{}).Optional(),
        field.JSON("metadata", map[string]interface{}{}),
        field.JSON("relationships", map[string]interface{}).Optional(),
        field.JSON("platform", map[string]interface{}).Optional(),
        
        // Lifecycle
        field.Enum("state").Values(
            "draft", "validating", "valid", "applying", 
            "active", "degraded", "error", "deprecated", "archived",
        ),
        field.Int("version"),  // Optimistic locking
        field.Time("created_at"),
        field.Time("updated_at"),
    }
}

// ent/schema/resource_event.go (Event Sourcing)
type ResourceEvent struct {
    ent.Schema
}

func (ResourceEvent) Fields() []ent.Field {
    return []ent.Field{
        field.String("ulid").GoType(ulid.ULID{}).Unique(),  // Time-sortable ID
        field.String("resource_uuid").GoType(ulid.ULID{}),
        field.String("event_type"),  // "created", "updated", "deleted"
        field.JSON("payload", map[string]interface{}{}),  // Full event data
        field.Bytes("payload_compressed").Optional(),  // zstd for large payloads
        field.String("user_id").Optional(),
        field.String("correlation_id"),
        field.Int("aggregate_version"),  // Resource version at time of event
        field.Enum("priority").Values("immediate", "critical", "normal", "low", "background"),
        field.Time("created_at"),
    }
}

func (ResourceEvent) Indexes() []ent.Index {
    return []ent.Index{
        index.Fields("resource_uuid", "created_at"),
        index.Fields("event_type"),
        index.Fields("correlation_id"),
        index.Fields("created_at"),  // For retention cleanup
    }
}

// ent/schema/config_snapshot.go
type ConfigSnapshot struct {
    ent.Schema
}

func (ConfigSnapshot) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.JSON("configuration", map[string]interface{}{}),  // Full router state
        field.String("created_by"),
        field.String("comment").Optional(),
        field.Bool("is_milestone"),  // User-marked important
        field.JSON("tags", []string{}).Optional(),
        field.Time("created_at"),
    }
}
```

### Database Connection Management

```go
type DatabaseManager struct {
    systemDB     *ent.Client  // Always open
    routerDBs    map[string]*ent.Client  // Lazy-loaded, cached
    mu           sync.RWMutex
    idleTimeout  time.Duration  // 5 minutes
}

func (dm *DatabaseManager) GetRouterDB(routerID string) (*ent.Client, error) {
    dm.mu.RLock()
    client, exists := dm.routerDBs[routerID]
    dm.mu.RUnlock()
    
    if exists {
        dm.touchActivity(routerID)  // Reset idle timer
        return client, nil
    }
    
    // Lazy load
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    dbPath := fmt.Sprintf("/data/router-%s.db", routerID)
    client, err := ent.Open("sqlite3", dbPath+"?_journal_mode=WAL")
    if err != nil {
        return nil, err
    }
    
    dm.routerDBs[routerID] = client
    dm.scheduleIdleClose(routerID)
    return client, nil
}
```

---

## Event Sourcing & Time Travel

### Write-Ahead Event Log Pattern

**Every mutation writes to BOTH event log AND current state tables in single transaction:**

```go
func (s *ResourceService) UpdateResource(ctx context.Context, uuid ulid.ULID, config map[string]interface{}) error {
    tx, err := s.db.Tx(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // 1. Get current resource
    resource, err := tx.Resource.Get(ctx, uuid)
    if err != nil {
        return err
    }
    
    // 2. Create event (append-only)
    event := tx.ResourceEvent.Create().
        SetResourceUUID(uuid).
        SetEventType("updated").
        SetPayload(map[string]interface{}{
            "previous": resource.Configuration,
            "updated": config,
            "changes": calculateChanges(resource.Configuration, config),
        }).
        SetUserID(getUserFromContext(ctx)).
        SetCorrelationID(getCorrelationID(ctx)).
        SetAggregateVersion(resource.Version + 1).
        SetPriority("normal").
        Save(ctx)
    
    if err != nil {
        return err
    }
    
    // 3. Update current state
    _, err = resource.Update().
        SetConfiguration(config).
        SetVersion(resource.Version + 1).
        SetUpdatedAt(time.Now()).
        Save(ctx)
    
    if err != nil {
        return err
    }
    
    // 4. Commit transaction (atomic)
    if err := tx.Commit(); err != nil {
        return err
    }
    
    // 5. Publish event to Event Bus (after commit)
    s.eventBus.Publish(ResourceUpdatedEvent{
        ResourceUUID: uuid,
        NewVersion: resource.Version + 1,
    })
    
    return nil
}
```

### Time Travel Queries

```go
// Reconstruct resource state at any point in time
func (s *ResourceService) GetResourceAtTime(ctx context.Context, uuid ulid.ULID, timestamp time.Time) (*Resource, error) {
    // Strategy 1: Find nearest snapshot before timestamp
    snapshot, err := s.db.ConfigSnapshot.Query().
        Where(
            configsnapshot.CreatedAtLTE(timestamp),
        ).
        Order(ent.Desc("created_at")).
        First(ctx)
    
    if err != nil {
        // No snapshot found, start from creation
        snapshot = &ConfigSnapshot{Configuration: map[string]interface{}{}}
    }
    
    // Strategy 2: Replay events from snapshot to target time
    events, err := s.db.ResourceEvent.Query().
        Where(
            resourceevent.ResourceUUID(uuid),
            resourceevent.CreatedAtGT(snapshot.CreatedAt),
            resourceevent.CreatedAtLTE(timestamp),
        ).
        Order(ent.Asc("created_at")).
        All(ctx)
    
    // Strategy 3: Apply events sequentially
    state := snapshot.Configuration
    for _, event := range events {
        state = applyEvent(state, event)
    }
    
    return &Resource{Configuration: state}, nil
}
```

---

## Three-Tier Event Storage

### Hot / Warm / Cold Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              THREE-TIER EVENT STORAGE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HOT TIER (tmpfs - /tmp/events.db)                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Duration: 24 hours                                   ││
│  │  • Events: ALL events (no filtering)                    ││
│  │  • Writes: Unlimited (tmpfs)                            ││
│  │  • Volatility: Lost on power failure (acceptable)      ││
│  │  • Purpose: Fast queries, recent history               ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ Daily sync (critical events only)│
│                                                              │
│  WARM TIER (flash - /var/router-{id}.db)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Duration: 7-30 days (configurable per event type)   ││
│  │  • Events: Critical only (filtered)                     ││
│  │  • Compression: zstd for large payloads                 ││
│  │  • Writes: Minimized (flash wear concern)              ││
│  │  • Volatility: Persistent                               ││
│  │  • Purpose: Audit trail, compliance, rollback          ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼ Weekly archive (if external mount)│
│                                                              │
│  COLD TIER (external - /mnt/usb/events-archive/)            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Duration: Unlimited (user-managed)                   ││
│  │  • Events: Complete archive                             ││
│  │  • Compression: zstd level 9 (maximum)                  ││
│  │  • Format: Partitioned by month                         ││
│  │  • Volatility: Persistent (optional external storage)  ││
│  │  • Purpose: Long-term audit, forensics                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Event Retention Policy:**

| Event Type | Hot (tmpfs) | Warm (flash) | Cold (external) |
|------------|-------------|--------------|-----------------|
| **Critical** (WAN created/deleted, VPN changes, auth events) | 24h | 30 days | Unlimited |
| **Normal** (config applied, feature installed) | 24h | 7 days | Unlimited |
| **Low Value** (metrics updated, logs appended) | 24h | 1 day | Optional |

**Sync Strategy:**
- Critical events: Sync to warm tier immediately (within seconds)
- Normal events: Sync daily at 2 AM
- Low-value events: Accept loss on power failure (tmpfs volatile)

---

## Cross-Database Relationships

### Three-Pattern Hybrid Strategy

**Pattern 1: Virtual Edges (GraphQL Resolvers)**

```go
// GraphQL schema
type Router {
    id: ID!
    resources: [Resource!]!  # Resolver bridges databases
}

// Resolver implementation
func (r *routerResolver) Resources(ctx context.Context, router *Router) ([]*Resource, error) {
    // Get router-specific DB
    routerDB, err := r.dbManager.GetRouterDB(router.ID)
    if err != nil {
        return nil, err
    }
    
    // Query resources with DataLoader batching
    return r.resourceLoader.Load(ctx, router.ID)
}
```

**Pattern 2: Denormalized Foreign Keys**

```go
// Resources store router_id as string (not ent FK)
type Resource struct {
    UUID     ulid.ULID
    RouterID string  // Not ent.Edge - denormalized for quick lookup
    Type     string
    Config   map[string]interface{}
}

// Fast queries without cross-DB joins
func GetResourcesByRouter(routerID string) ([]*Resource, error) {
    routerDB := getRouterDB(routerID)
    return routerDB.Resource.Query().All(ctx)
}
```

**Pattern 3: ATTACH for Complex Fleet Queries**

```sql
-- SQLite ATTACH for fleet-wide analytics
ATTACH DATABASE '/data/router-main.db' AS router_main;
ATTACH DATABASE '/data/router-office.db' AS router_office;

SELECT r.router_id, COUNT(*) as resource_count
FROM router_main.resources r
UNION ALL
SELECT r.router_id, COUNT(*) as resource_count
FROM router_office.resources r;

-- Used for: Fleet dashboards, cross-router analytics
-- Bypasses ent, uses raw SQL for complex joins
```

---

## Migration Strategy

### Transactional Migrations with Pre-Flight Validation

```go
type Migration struct {
    Version   string
    Name      string
    Up        []MigrationStep   // Forward migration
    Down      []MigrationStep   // Reverse migration (rollback)
    PreCheck  string            // Validation query before applying
}

func (m *Migrator) ApplyMigration(ctx context.Context, migration Migration) error {
    // 1. Pre-flight validation
    if migration.PreCheck != "" {
        if violations := m.runPreCheck(ctx, migration.PreCheck); len(violations) > 0 {
            return fmt.Errorf("pre-check failed: %v", violations)
        }
    }
    
    // 2. Backup database (SQL dump)
    if err := m.backupDatabase(ctx); err != nil {
        return fmt.Errorf("backup failed: %w", err)
    }
    
    // 3. Start transaction
    tx, err := m.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // 4. Apply all steps atomically
    for i, step := range migration.Up {
        if _, err := tx.ExecContext(ctx, step.SQL); err != nil {
            return fmt.Errorf("migration step %d failed: %w", i, err)
        }
    }
    
    // 5. Record migration
    _, err = tx.ExecContext(ctx,
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        migration.Version, time.Now(),
    )
    if err != nil {
        return err
    }
    
    // 6. Commit transaction (all-or-nothing)
    if err := tx.Commit(); err != nil {
        return err
    }
    
    // 7. Verify schema integrity
    if err := m.verifyIntegrity(ctx); err != nil {
        // Restore from backup if verification fails
        return m.restoreFromBackup(ctx)
    }
    
    return nil
}
```

### Parallel + Lazy Migration

```go
// System DB migrations: Run on startup (blocking)
func (s *Server) migrateSystemDB(ctx context.Context) error {
    return s.systemMigrator.Migrate(ctx)
}

// Router DB migrations: Parallel for active routers
func (s *Server) migrateRouterDBs(ctx context.Context) error {
    activeRouters, err := s.getActiveRouters(ctx)
    if err != nil {
        return err
    }
    
    // Migrate up to 5 routers in parallel
    sem := make(chan struct{}, 5)
    errCh := make(chan error, len(activeRouters))
    
    for _, router := range activeRouters {
        go func(r *Router) {
            sem <- struct{}{}
            defer func() { <-sem }()
            
            if err := s.migrateRouterDB(ctx, r.ID); err != nil {
                log.Printf("Router %s migration failed: %v", r.ID, err)
                errCh <- err
                // Mark router offline, but don't fail startup
                s.markRouterOffline(r.ID, fmt.Sprintf("Migration failed: %v", err))
            } else {
                errCh <- nil
            }
        }(router)
    }
    
    // Wait for all migrations
    var errors []error
    for range activeRouters {
        if err := <-errCh; err != nil {
            errors = append(errors, err)
        }
    }
    
    // Partial failure OK - keep operational routers running
    if len(errors) > 0 {
        log.Printf("Warning: %d router migrations failed", len(errors))
    }
    
    return nil
}

// Inactive routers: Lazy migration on first access
func (dm *DatabaseManager) GetRouterDB(ctx context.Context, routerID string) (*ent.Client, error) {
    client := dm.routerDBs[routerID]
    if client == nil {
        // Open and migrate on first access
        client, err := dm.openAndMigrate(ctx, routerID)
        if err != nil {
            return nil, err
        }
        dm.routerDBs[routerID] = client
    }
    return client, nil
}
```

---

## Performance Optimization

### Aggressive Indexing Strategy

```go
func (Resource) Indexes() []ent.Index {
    return []ent.Index{
        // Primary lookup
        index.Fields("uuid").Unique(),
        
        // List queries
        index.Fields("router_id", "type"),
        index.Fields("router_id", "category"),
        index.Fields("router_id", "state"),
        
        // Time-based queries
        index.Fields("created_at"),
        index.Fields("updated_at"),
        
        // Full-text search (if needed)
        // index.Fields("name").StorageKey("idx_resource_name_fts"),
    }
}

func (ResourceEvent) Indexes() []ent.Index {
    return []ent.Index{
        // Time-travel queries
        index.Fields("resource_uuid", "created_at"),
        index.Fields("resource_uuid", "aggregate_version"),
        
        // Event type filtering
        index.Fields("event_type", "created_at"),
        
        // Correlation tracking
        index.Fields("correlation_id"),
        
        // Retention cleanup
        index.Fields("created_at"),
        index.Fields("priority", "created_at"),
    }
}
```

### Query Optimization Patterns

**DataLoader for N+1 Prevention:**

```go
// Batch load resources across multiple routers
type ResourceLoader struct {
    loader *dataloader.Loader
}

func NewResourceLoader(dbManager *DatabaseManager) *ResourceLoader {
    return &ResourceLoader{
        loader: dataloader.NewBatchedLoader(func(ctx context.Context, keys []string) []*dataloader.Result {
            results := make([]*dataloader.Result, len(keys))
            
            // Group keys by router for batching
            byRouter := groupByRouter(keys)
            
            for routerID, resourceUUIDs := range byRouter {
                db, _ := dbManager.GetRouterDB(ctx, routerID)
                resources, err := db.Resource.Query().
                    Where(resource.UUIDIn(resourceUUIDs...)).
                    All(ctx)
                
                // Map results back to original order
                for i, uuid := range resourceUUIDs {
                    results[i] = &dataloader.Result{Data: findResource(resources, uuid), Error: err}
                }
            }
            
            return results
        }),
    }
}
```

**Materialized Views for Fleet Dashboard:**

```go
// Pre-computed fleet summaries in system.db
type FleetMetrics struct {
    TotalRouters      int
    OnlineRouters     int
    TotalResources    int
    ResourcesByType   map[string]int
    LastUpdated       time.Time
}

// Updated via background job every 60s
func (s *MetricsService) UpdateFleetMetrics(ctx context.Context) error {
    metrics := FleetMetrics{
        TotalRouters: s.systemDB.Router.Query().Count(ctx),
        OnlineRouters: s.systemDB.Router.Query().
            Where(router.StatusEQ("online")).Count(ctx),
        LastUpdated: time.Now(),
    }
    
    // Query each router DB in parallel
    var wg sync.WaitGroup
    resourceCounts := make(map[string]map[string]int)
    
    for _, router := range s.getActiveRouters(ctx) {
        wg.Add(1)
        go func(r *Router) {
            defer wg.Done()
            db, _ := s.dbManager.GetRouterDB(ctx, r.ID)
            counts := db.Resource.Query().
                GroupBy("type").
                Aggregate(ent.Count()).
                IntsX(ctx)
            resourceCounts[r.ID] = counts
        }(router)
    }
    wg.Wait()
    
    // Aggregate results
    metrics.ResourcesByType = aggregateCounts(resourceCounts)
    
    // Store in system.db
    s.systemDB.GlobalSettings.Create().
        SetCategory("fleet_metrics").
        SetSettings(metrics).
        Save(ctx)
    
    return nil
}
```

**Parallel Database Operations:**

```go
// Query multiple router DBs concurrently
func (s *FleetService) GetResourcesAcrossFleet(ctx context.Context, resourceType string) ([]*Resource, error) {
    routers, err := s.systemDB.Router.Query().
        Where(router.StatusEQ("online")).
        All(ctx)
    
    resultCh := make(chan []*Resource, len(routers))
    errCh := make(chan error, len(routers))
    
    // Query in parallel
    for _, r := range routers {
        go func(router *Router) {
            db, err := s.dbManager.GetRouterDB(ctx, router.ID)
            if err != nil {
                errCh <- err
                return
            }
            
            resources, err := db.Resource.Query().
                Where(resource.TypeEQ(resourceType)).
                All(ctx)
            
            if err != nil {
                errCh <- err
            } else {
                resultCh <- resources
            }
        }(r)
    }
    
    // Collect results
    var allResources []*Resource
    for range routers {
        select {
        case res := <-resultCh:
            allResources = append(allResources, res...)
        case err := <-errCh:
            log.Printf("Router query failed: %v", err)
            // Continue with partial results
        }
    }
    
    return allResources, nil
}
```

---

## Identifiers

### ULID (Universally Unique Lexicographically Sortable Identifier)

**All primary keys use ULID:**

```
 01HN8Z4G9XKQR3P7YMW6VZTN2C
 └┬─┘└─────┬─────┘└──────┬──────┘
  │        │             │
Timestamp  Randomness    Randomness
(48 bits)  (80 bits total)
```

**Benefits:**
- **Time-sortable:** Can ORDER BY id to get chronological order
- **No fragmentation:** Sequential IDs don't fragment B-tree indexes like UUID v4
- **Debuggable:** First 10 chars encode timestamp, readable in logs
- **URL-safe:** 26-character string, no special characters
- **Collision-resistant:** 80 bits of randomness

**Scoped IDs for Readability:**

```go
// Dual ID system
type Resource struct {
    UUID ulid.ULID  // Stable, used in DB relationships
    ID   string     // Scoped, readable: "vpn.wg.client:usa-vpn:a1b2"
}

// Generate scoped ID
func GenerateScopedID(category, name string) string {
    slug := slugify(name)  // "USA VPN" → "usa-vpn"
    hash := shortHash(ulid.Make())  // First 4 chars of ULID
    return fmt.Sprintf("%s:%s:%s", category, slug, hash)
    // Result: "vpn.wg.client:usa-vpn:a1b2"
}
```

**ID Usage:**
- **UUID:** Database foreign keys, relationships, migrations, stable references
- **Scoped ID:** User-facing, debugging, logs, GraphQL queries (human-readable)

---

## Related Documents

- [Backend Architecture](./backend-architecture.md) - Service layer and orchestration
- [API Contracts](./api-contracts.md) - GraphQL schema and patterns
- [Security Architecture](./security-architecture.md) - Encryption and access control
- [ADR-012: Universal State v2 - 8-Layer Resource Model](#) - Detailed decision record
- [ADR-013: Three-Tier Event Storage Strategy](#) - Event architecture decision
- [ADR-014: Hybrid Database Architecture](#) - Multi-database design

---
