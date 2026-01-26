# Backend Architecture

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - Unified GraphQL + Event-Driven + Hexagonal

---

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Architecture Overview](#architecture-overview)
- [GraphQL API Architecture](#graphql-api-architecture)
- [Module Structure](#module-structure)
- [Core Patterns](#core-patterns)
  - [Virtual Interface Factory](#virtual-interface-factory)
  - [Shared Binary with Isolated Instances](#shared-binary-with-isolated-instances)
  - [IP-Binding Isolation Strategy](#ip-binding-isolation-strategy)
  - [Hexagonal Router Abstraction](#hexagonal-router-abstraction)
- [Component Architecture](#component-architecture)
- [Event-Driven Architecture](#event-driven-architecture)
- [Security & Authentication](#security--authentication)
- [Resource Constraints](#resource-constraints)
- [Technology Decisions](#technology-decisions)

---

## Core Philosophy

### The Dual Nature

NasNetConnect serves two distinct domains with unified foundation:

1. **Router Management** (Configuration Hub): Full CRUD for interfaces, firewall, VPN, fleet management
2. **Network Services** (Feature Marketplace): Downloadable services via Virtual Interface Factory

### Architectural Principles

| Principle | Implementation | Benefit |
|-----------|----------------|---------|
| **Schema-First** | GraphQL SDL generates Go structs + TypeScript types | End-to-end type safety, impossible to drift |
| **Event-Driven** | Watermill event bus with typed events | Decoupled, testable, extensible architecture |
| **Apply-Confirm** | Router is source of truth, backend synchronizes | Never assume success, always confirm |
| **Hexagonal** | RouterPort interface, adapter per platform | MikroTik today, OpenWRT/VyOS tomorrow |
| **Safety-First** | Staged pipeline, transactional, rollback | User trust through predictable behavior |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NASNETCONNECT BACKEND CONTAINER                         │
│                      (~4MB binary + ~1.5MB assets = ~6MB)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       GraphQL API Layer (gqlgen)                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │   POST       │  │   WS         │  │   GET        │               │ │
│  │  │  /graphql    │  │  /query      │  │ /playground  │               │ │
│  │  │  (Q & M)     │  │  (Subs)      │  │  (Dev only)  │               │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │ │
│  └───────────────────────────────┬────────────────────────────────────────┘ │
│                                  │                                           │
│  ┌───────────────────────────────┴────────────────────────────────────────┐ │
│  │                     GraphQL Resolvers (Type-Safe)                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│ │
│  │  │ Resource │  │ Feature  │  │  Device  │  │   User   │  │  System  ││ │
│  │  │ Resolver │  │ Resolver │  │ Resolver │  │ Resolver │  │ Resolver ││ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘│ │
│  └───────┼──────────────┼──────────────┼──────────────┼──────────────┼────┘ │
│          │              │              │              │              │      │
│  ┌───────┴──────────────┴──────────────┴──────────────┴──────────────┴────┐ │
│  │                        Service Layer (Business Logic)                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Router    │  │   Feature   │  │   State     │  │    Auth     │   │ │
│  │  │   Service   │  │   Service   │  │   Sync      │  │   Service   │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼──────────┘ │
│            │                │                │                │            │
│  ┌─────────┴────────────────┴────────────────┴────────────────┴──────────┐ │
│  │                     Orchestration Engine                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Feature   │  │  Instance   │  │   Process   │  │  Resource   │   │ │
│  │  │   Manager   │  │   Manager   │  │ Supervisor  │  │   Monitor   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Network Engine                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │    VLAN     │  │  Interface  │  │    PBR      │  │   Gateway   │   │ │
│  │  │  Allocator  │  │   Factory   │  │   Engine    │  │   Manager   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                   Infrastructure Layer                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │ │
│  │  │   ent    │  │  Router  │  │Watermill │  │  Config  │  │ Health │  │ │
│  │  │   ORM    │  │   Port   │  │EventBus  │  │   Mgmt   │  │ Check  │  │ │
│  │  │(SQLite)  │  │(Hexagonal│  │(Typed)   │  │          │  │        │  │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘  └────────┘  │ │
│  └───────┼──────────────┼──────────────┼──────────────────────────────────┘ │
│          │              │              │                                    │
│          ▼              ▼              ▼                                    │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                               │
│    │ SQLite   │  │ RouterOS │  │  Event   │                               │
│    │ (system  │  │(REST/API/│  │ Handlers │                               │
│    │  +router │  │ SSH/Tel) │  │          │                               │
│    │   DBs)   │  └──────────┘  └──────────┘                               │
│    └──────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## GraphQL API Architecture

### Unified GraphQL Endpoint

**Single Endpoint Philosophy:**
- `/graphql` serves ALL domains (resources, features, fleet, auth, monitoring, files, system)
- GraphQL Subscriptions handle ALL real-time communication
- REST only for industry standards (health checks, file downloads, OAuth)

**Domains Served:**

```graphql
type Query {
  # 1. Universal State - Resources
  node(uuid: ID!): Node
  resource(uuid: ID!): Resource
  resources(filter: ResourceFilter): ResourceConnection!
  
  # 2. Feature Marketplace
  marketplace: Marketplace!
  features(filter: FeatureFilter): FeatureConnection!
  
  # 3. Router Management (Fleet)
  devices: [Device!]!
  device(id: ID!): Device
  
  # 4. Auth/Users
  me: User
  users: [User!]! @auth(requires: "admin")
  
  # 5. Monitoring/Alerts
  alerts(severity: Severity): [Alert!]!
  metrics(resourceId: ID): MetricsData!
  
  # 6. File Operations (metadata + signed URLs)
  backups: [Backup!]!
  
  # 7. System/Health
  health: HealthStatus!
  capabilities: PlatformCapabilities!
}

type Mutation {
  # Resource CRUD
  createResource(input: CreateResourceInput!): ResourcePayload!
  updateResource(input: UpdateResourceInput!): ResourcePayload!
  deleteResource(uuid: ID!): DeletePayload!
  
  # Feature Marketplace
  installFeature(id: ID!): InstallPayload!
  uninstallFeature(id: ID!): UninstallPayload!
  
  # Configuration Apply
  applyConfiguration(input: ApplyInput!): ApplyPayload!
  
  # Auth
  login(username: String!, password: String!): AuthPayload!
  logout: Boolean!
  
  # File Operations (return signed URLs)
  createBackup(deviceId: ID!): BackupPayload!
  restoreBackup(backupId: ID!): RestorePayload!
}

type Subscription {
  # Resource updates
  resourceUpdated(resourceId: ID): ResourceUpdate!
  
  # Device status
  deviceStatus(deviceId: ID): DeviceStatusUpdate!
  
  # Job progress
  configApplyProgress(jobId: ID!): ConfigProgress!
  
  # Feature lifecycle
  featureStatus(featureId: ID): FeatureStatusUpdate!
}
```

### DataLoader for N+1 Prevention

```go
// Batching + caching per-request
type ResourceLoader struct {
    loader *dataloader.Loader
}

func NewResourceLoader(db *ent.Client) *ResourceLoader {
    return &ResourceLoader{
        loader: dataloader.NewBatchedLoader(func(ctx context.Context, keys []string) []*dataloader.Result {
            // Batch fetch all resources in single query
            resources, err := db.Resource.Query().
                Where(resource.UUIDIn(keys...)).
                All(ctx)
            
            // Map results to original key order
            results := make([]*dataloader.Result, len(keys))
            for i, key := range keys {
                result := findResourceByUUID(resources, key)
                results[i] = &dataloader.Result{Data: result, Error: err}
            }
            return results
        }),
    }
}

// Usage in resolver
func (r *resourceResolver) DependsOn(ctx context.Context, resource *Resource) ([]*Resource, error) {
    // Get dependency UUIDs from relationships
    deps := resource.Relationships.DependsOn  // ["uuid-1", "uuid-2", "uuid-3"]
    
    // DataLoader batches this into single query
    return r.resourceLoader.LoadMany(ctx, deps)
}
```

---

## Module Structure

### Package Organization

```
backend/
├── cmd/nnc/                    # Main binary entry point
│   └── main.go                # Server initialization
│
├── ent/                        # ORM GENERATED CODE
│   ├── schema/                # Entity definitions (input)
│   └── [generated files]      # Type-safe queries (output)
│
├── graph/                      # GRAPHQL GENERATED CODE
│   ├── schema/                # GraphQL schema files (.graphql)
│   │   ├── scalars.graphql
│   │   ├── directives.graphql
│   │   ├── resources/
│   │   ├── features/
│   │   ├── fleet/
│   │   ├── system/
│   │   └── auth/
│   ├── generated/             # gqlgen internals
│   ├── model/                 # GraphQL models
│   └── resolvers/             # Resolver implementations (IMPLEMENT)
│       ├── resource.resolvers.go
│       ├── feature.resolvers.go
│       ├── device.resolvers.go
│       ├── auth.resolvers.go
│       └── schema.resolvers.go  # Root resolver
│
├── internal/
│   ├── api/                   # REST Fallback Endpoints (Echo)
│   │   ├── health.go
│   │   ├── download.go
│   │   ├── upload.go
│   │   └── oauth.go
│   │
│   ├── services/              # BUSINESS LOGIC LAYER
│   │   ├── router_service.go  # Router CRUD, connection management
│   │   ├── feature_service.go # Feature installation, lifecycle
│   │   ├── state_service.go   # Universal State v2, sync, validation
│   │   ├── auth_service.go    # Authentication, sessions, API keys
│   │   ├── config_service.go  # Configuration apply, rollback
│   │   └── alert_service.go   # Monitoring, alerts, notifications
│   │
│   ├── orchestrator/          # ORCHESTRATION ENGINE
│   │   ├── feature_manager.go  # Download, install, update, remove
│   │   ├── instance_manager.go # Create, configure, lifecycle
│   │   ├── process_supervisor.go # Health, auto-restart, crash recovery
│   │   └── resource_monitor.go # RAM/CPU tracking, budgets
│   │
│   ├── network/               # NETWORK ORCHESTRATION
│   │   ├── vlan_allocator.go  # On-demand VLAN creation
│   │   ├── interface_factory.go # Virtual interfaces per service
│   │   ├── dhcp_manager.go    # DHCP client/server per interface
│   │   ├── pbr_engine.go      # Policy-based routing rules
│   │   ├── firewall_manager.go # Auto-manage firewall rules
│   │   ├── port_registry.go   # Port allocation, conflict prevention
│   │   └── gateway_manager.go # tun2socks/hev-socks5-tunnel
│   │
│   ├── config/                # CONFIGURATION GENERATION
│   │   ├── generator.go       # ConfigGenerator interface
│   │   ├── registry.go        # Generator registry
│   │   └── services/          # Built-in config generators
│   │       ├── tor.go
│   │       ├── singbox.go
│   │       ├── xray.go
│   │       └── adguard.go
│   │
│   ├── validation/            # VALIDATION PIPELINE
│   │   ├── engine.go          # 7-stage validation orchestrator
│   │   ├── schema.go          # Schema validation (Zod/GraphQL)
│   │   ├── syntax.go          # Syntax validation
│   │   ├── cross.go           # Cross-resource validation
│   │   ├── dependency.go      # Dependency checking
│   │   ├── platform.go        # Platform capability validation
│   │   └── dryrun.go          # Router dry-run simulation
│   │
│   ├── events/                # EVENT BUS & HANDLERS
│   │   ├── bus.go             # Watermill event bus wrapper
│   │   ├── types.go           # Typed event definitions
│   │   ├── publisher.go       # Event publishing
│   │   └── handlers/          # Event consumers
│   │       ├── cache.go       # Cache invalidation
│   │       ├── audit.go       # Audit logging
│   │       ├── websocket.go   # GraphQL subscription updates
│   │       └── alerts.go      # Alert triggers
│   │
│   ├── database/              # DATABASE ACCESS LAYER
│   │   ├── db.go              # Database manager (system + router DBs)
│   │   ├── migrations/        # Migration scripts (up/down)
│   │   └── repositories/      # Light repository pattern
│   │       ├── router_repo.go
│   │       ├── user_repo.go
│   │       └── apikey_repo.go
│   │
│   └── auth/                  # AUTHENTICATION & AUTHORIZATION
│       ├── jwt.go             # JWT signing/verification (RS256)
│       ├── session.go         # Session management
│       ├── password.go        # bcrypt hashing, NIST validation
│       ├── apikey.go          # API key generation, validation
│       └── middleware.go      # Auth middleware (multi-method)
│
└── pkg/                       # PUBLIC PACKAGES (Reusable)
    ├── router/                # ROUTER ABSTRACTION (Hexagonal)
    │   ├── ports.go           # RouterPort interface
    │   ├── module.go          # Router Module (dispatcher)
    │   └── adapters/
    │       ├── mikrotik/      # MikroTik adapter (REST → SSH → API)
    │       │   ├── adapter.go
    │       │   ├── rest.go
    │       │   ├── ssh.go
    │       │   ├── api.go
    │       │   └── capabilities.go
    │       ├── openwrt/       # Future: OpenWRT support
    │       └── vyos/          # Future: VyOS support
    │
    ├── registry/              # Feature download & verification
    │   ├── github.go          # GitHub Releases API
    │   ├── http.go            # HTTP download with resume
    │   └── verifier.go        # SHA256/GPG verification
    │
    ├── manifest/              # Feature manifest parsing
    │   ├── manifest.go
    │   ├── schema.go
    │   └── validate.go
    │
    ├── isolation/             # Instance isolation utilities
    │   ├── binding.go         # IP binding helpers
    │   ├── directories.go     # Directory separation
    │   └── ports.go           # Port allocation
    │
    └── health/                # Composite health checking
        ├── checker.go
        ├── probes.go
        └── aggregator.go
```

---

## Core Patterns

### Virtual Interface Factory

Network services become **routeable interfaces** via auto-managed VLANs + gateway layer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VIRTUAL INTERFACE FACTORY                             │
│                                                                          │
│  User Action: Install Tor (US exits)                                    │
│                                                                          │
│  Automatic Infrastructure Creation:                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 1. VLAN Allocation                                                 │ │
│  │    • VLAN Allocator assigns VLAN 101                              │ │
│  │    • Name: nnc-vlan101                                             │ │
│  │    • IP: 10.99.101.1/24                                            │ │
│  │                                                                    │ │
│  │ 2. Router Interface Creation                                       │ │
│  │    • Interface Factory creates nnc-tor-usa                        │ │
│  │    • Attached to VLAN 101                                          │ │
│  │    • DHCP client configured                                        │ │
│  │                                                                    │ │
│  │ 3. Service Instance Launch                                         │ │
│  │    • Process Supervisor starts Tor                                │ │
│  │    • Config: ExitNodes {us}, SOCKSPort 10.99.101.1:9050          │ │
│  │    • Data dir: /features/tor/instances/usa/                       │ │
│  │                                                                    │ │
│  │ 4. Gateway Creation                                                │ │
│  │    • Gateway Manager launches hev-socks5-tunnel                   │ │
│  │    • SOCKS5 proxy: 10.99.101.1:9050                               │ │
│  │    • Creates TUN interface for routing                            │ │
│  │                                                                    │ │
│  │ 5. Policy-Based Routing                                            │ │
│  │    • PBR Engine creates mangle rules                              │ │
│  │    • Routing table entry created                                   │ │
│  │    • Interface nnc-tor-usa now routeable                          │ │
│  │                                                                    │ │
│  │ 6. Firewall Rules                                                  │ │
│  │    • Firewall Manager adds accept rules                           │ │
│  │    • NAT masquerade for outbound traffic                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  User Sees: Interface "nnc-tor-usa" available for routing              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Service Types:**

| Service | Interface Type | Gateway Required | DNS Capable |
|---------|---------------|------------------|-------------|
| **Tor** | Outbound | hev-socks5-tunnel | No |
| **sing-box** | Bidirectional | tun2socks | No |
| **Xray-core** | Bidirectional | tun2socks | No |
| **MTProxy** | Inbound | None (TCP proxy) | No |
| **Psiphon** | Outbound | hev-socks5-tunnel | No |
| **AdGuard Home** | DNS | None (DNS server) | Yes |

---

### Shared Binary with Isolated Instances

**Storage Optimization:** 10× savings by sharing binaries across instances.

```
/features/
├── tor/
│   ├── bin/tor                    # SHARED (read-only) ~10MB
│   ├── manifest.json
│   └── instances/
│       ├── usa/                   # Instance 1
│       │   ├── torrc             # Config: ExitNodes {us}
│       │   ├── data/             # Instance-specific data
│       │   └── .pid              # Process ID
│       ├── germany/               # Instance 2
│       │   ├── torrc             # Config: ExitNodes {de}
│       │   └── data/
│       └── random/                # Instance 3
│           ├── torrc             # Config: Random exits
│           └── data/
│
├── singbox/
│   ├── bin/sing-box               # SHARED ~15MB
│   ├── manifest.json
│   └── instances/
│       ├── vpn-out/               # Client instance
│       └── vpn-in/                # Server instance
│
└── adguard/
    ├── bin/AdGuardHome            # SHARED ~30MB
    ├── manifest.json
    └── instances/
        └── default/               # Single instance

Storage: 
- 3 Tor copies: 30MB → Shared: 10MB + 3×1MB = 13MB (57% savings)
- Benefits compound with more instances
```

---

### IP-Binding Isolation Strategy

**No Linux Namespaces Available → IP Binding + Directory Separation**

```
┌─────────────────────────────────────────────────────────────┐
│                   ISOLATION LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: IP BINDING (Primary Isolation)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Each instance binds ONLY to its VLAN IP             ││
│  │  • Tor USA:     SOCKSPort 10.99.101.1:9050             ││
│  │  │  Tor Germany: SOCKSPort 10.99.102.1:9050             ││
│  │  • Prevents port conflicts, isolates traffic           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 2: DIRECTORY SEPARATION                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • /features/tor/instances/usa/data/                   ││
│  │  • /features/tor/instances/germany/data/               ││
│  │  • Each instance isolated config + data dirs           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 3: PORT REGISTRY                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Global port allocation registry in memory           ││
│  │  • Conflict detection before service start             ││
│  │  • Dynamic port assignment for new instances           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Layer 4: PROCESS SUPERVISION                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  • Go supervisor tracks all child processes            ││
│  │  • Health monitoring per instance                       ││
│  │  • Exponential backoff restart (1s → 30s max)          ││
│  │  • Graceful shutdown with process groups               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Hexagonal Router Abstraction

**Platform-Agnostic Operations:**

```go
// pkg/router/ports.go - The Contract
type RouterPort interface {
    // Connection lifecycle
    Connect(ctx context.Context) error
    Disconnect() error
    IsConnected() bool
    Health(ctx context.Context) HealthStatus
    
    // Capabilities
    Capabilities() PlatformCapabilities
    Info() (*RouterInfo, error)
    
    // VLAN Management
    CreateVLAN(ctx context.Context, opts VLANOptions) error
    DeleteVLAN(ctx context.Context, vlanID int) error
    ListVLANs(ctx context.Context) ([]VLAN, error)
    AttachVLAN(ctx context.Context, vlanID int, containerName string) error
    
    // DHCP Management
    CreateDHCPClient(ctx context.Context, opts DHCPClientOptions) error
    CreateDHCPServer(ctx context.Context, opts DHCPServerOptions) error
    
    // Policy-Based Routing
    AddMangleRule(ctx context.Context, rule MangleRule) error
    AddRoutingTable(ctx context.Context, table RoutingTable) error
    AddRoutingMark(ctx context.Context, mark string, gateway net.IP) error
    
    // Firewall
    AddFilterRule(ctx context.Context, rule FilterRule) error
    AddNATRule(ctx context.Context, rule NATRule) error
    
    // Resource Operations (Generic)
    ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error)
    QueryState(ctx context.Context, query StateQuery) (*StateResult, error)
}
```

**MikroTik Adapter Implementation:**

```go
// pkg/router/adapters/mikrotik/adapter.go
type MikroTikAdapter struct {
    config ConnectionConfig
    
    // Protocol clients
    restClient   *RESTClient
    sshClient    *SSHClient
    apiClient    *APIClient
    telnetClient *TelnetClient
    
    // Current protocol
    currentProtocol Protocol
    
    // Resilience
    breaker *gobreaker.CircuitBreaker
    
    // Capabilities
    capabilities PlatformCapabilities
}

// Protocol fallback chain
func (a *MikroTikAdapter) Connect(ctx context.Context) error {
    // Try REST (RouterOS 7.1+)
    if err := a.tryREST(ctx); err == nil {
        a.currentProtocol = ProtocolREST
        return nil
    }
    
    // Try Binary API
    if err := a.tryAPI(ctx); err == nil {
        a.currentProtocol = ProtocolAPI
        return nil
    }
    
    // Try SSH (universal fallback)
    if err := a.trySSH(ctx); err == nil {
        a.currentProtocol = ProtocolSSH
        return nil
    }
    
    // All protocols failed
    a.breaker.Open()
    return ErrAllProtocolsFailed
}

// Command execution with protocol translation
func (a *MikroTikAdapter) ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error) {
    switch a.currentProtocol {
    case ProtocolREST:
        return a.restClient.Execute(ctx, translateToREST(cmd))
    case ProtocolAPI:
        return a.apiClient.Execute(ctx, translateToAPI(cmd))
    case ProtocolSSH:
        return a.sshClient.Execute(ctx, translateToSSH(cmd))
    default:
        return nil, ErrNotConnected
    }
}
```

---

## Component Architecture

### Service Layer (Business Logic)

#### Router Service

```go
type RouterService struct {
    systemDB    *ent.Client
    routerDBs   *DatabaseManager
    routerPort  router.RouterPort
    eventBus    *EventBus
}

// CRUD operations
func (s *RouterService) CreateRouter(ctx context.Context, input CreateRouterInput) (*Router, error)
func (s *RouterService) GetRouter(ctx context.Context, id string) (*Router, error)
func (s *RouterService) UpdateRouter(ctx context.Context, id string, input UpdateRouterInput) (*Router, error)
func (s *RouterService) DeleteRouter(ctx context.Context, id string) error

// Connection management
func (s *RouterService) Connect(ctx context.Context, id string) error
func (s *RouterService) Disconnect(ctx context.Context, id string) error
func (s *RouterService) SyncState(ctx context.Context, id string) error
```

#### State Service (Universal State v2)

```go
type StateService struct {
    dbManager     *DatabaseManager
    routerService *RouterService
    validator     *ValidationEngine
    eventBus      *EventBus
}

// Apply-Confirm-Merge pattern
func (s *StateService) UpdateResource(ctx context.Context, uuid ulid.ULID, config map[string]interface{}) error {
    // 1. Validate (7-stage pipeline)
    result, err := s.validator.Validate(ctx, config)
    if err != nil {
        return err
    }
    
    // 2. Apply to router (transactional)
    deployResult, err := s.routerService.Apply(ctx, config)
    if err != nil {
        return s.rollback(ctx, uuid)
    }
    
    // 3. Confirm from router (query actual state)
    actualState, err := s.routerService.Query(ctx, uuid)
    if err != nil {
        return s.rollback(ctx, uuid)
    }
    
    // 4. Merge into Universal State (transaction: event + table)
    tx, _ := s.dbManager.BeginTx(ctx)
    
    // 4a. Write event (append-only)
    event := tx.ResourceEvent.Create().
        SetResourceUUID(uuid).
        SetEventType("updated").
        SetPayload(actualState).
        SetAggregateVersion(resource.Version + 1).
        Save(ctx)
    
    // 4b. Update current state
    resource := tx.Resource.UpdateOneID(uuid).
        SetDeployment(actualState).
        SetVersion(resource.Version + 1).
        SaveX(ctx)
    
    tx.Commit()
    
    // 5. Publish event (after commit)
    s.eventBus.Publish(ResourceUpdatedEvent{
        ResourceUUID: uuid,
        NewVersion:   resource.Version + 1,
    })
    
    return nil
}
```

---

## Event-Driven Architecture

### Watermill Event Bus with Typed Events

**Typed Events Replace String Topics:**

```go
// Old approach (string topics)
eventBus.Publish("router.123.status", map[string]any{"status": "online"})

// New approach (typed events)
eventBus.Publish(RouterStatusChangedEvent{
    RouterID:       "router-main",
    Status:         RouterStatusOnline,
    PreviousStatus: RouterStatusOffline,
    Timestamp:      time.Now(),
})
```

**Event Type Definitions:**

```go
// events/types.go
type Event interface {
    EventType() string
    EventID() string
    CorrelationID() string
    Timestamp() time.Time
}

type RouterStatusChangedEvent struct {
    BaseEvent
    RouterID       string
    Status         RouterStatus
    PreviousStatus RouterStatus
    Uptime         time.Duration
}

func (e RouterStatusChangedEvent) EventType() string {
    return "router.status.changed"
}

type ResourceUpdatedEvent struct {
    BaseEvent
    ResourceUUID   ulid.ULID
    ResourceType   string
    NewVersion     int
    ChangedFields  []string
    UpdatedBy      string
}

func (e ResourceUpdatedEvent) EventType() string {
    return "resource.updated"
}

type FeatureCrashedEvent struct {
    BaseEvent
    FeatureID      string
    InstanceID     string
    ExitCode       int
    ErrorMessage   string
    CrashCount     int
}

func (e FeatureCrashedEvent) EventType() string {
    return "feature.crashed"
}
```

**Event Handlers:**

```go
// Setup event consumers
func SetupEventConsumers(bus *EventBus, services *Services) {
    // GraphQL subscription updates
    bus.Subscribe(RouterStatusChangedEvent{}, services.Subscriptions.HandleRouterStatus)
    bus.Subscribe(ResourceUpdatedEvent{}, services.Subscriptions.HandleResourceUpdate)
    bus.Subscribe(FeatureCrashedEvent{}, services.Subscriptions.HandleFeatureCrash)
    
    // Cache invalidation
    bus.Subscribe(ResourceUpdatedEvent{}, services.Cache.InvalidateResource)
    bus.Subscribe(RouterStatusChangedEvent{}, services.Cache.InvalidateRouter)
    
    // Audit logging
    bus.Subscribe(ResourceUpdatedEvent{}, services.Audit.LogResourceChange)
    bus.Subscribe(FeatureCrashedEvent{}, services.Audit.LogFeatureCrash)
    
    // Alert triggers
    bus.Subscribe(FeatureCrashedEvent{}, services.Alerts.TriggerCrashAlert)
    bus.Subscribe(RouterStatusChangedEvent{}, services.Alerts.CheckConnectionAlert)
}
```

**5-Level Priority System:**

```go
const (
    PriorityImmediate   = 0  // <100ms - router offline, VPN crashed, security breach
    PriorityCritical    = 1  // <1s - status changes, user action feedback
    PriorityNormal      = 2  // <5s - config applied, feature installed
    PriorityLow         = 3  // <30s - batched updates, non-critical status
    PriorityBackground  = 4  // <60s - metrics, logs, historical data
)

var eventPriorities = map[string]Priority{
    "router.status.changed":      PriorityImmediate,
    "feature.crashed":            PriorityImmediate,
    "resource.validation.failed": PriorityCritical,
    "resource.updated":           PriorityNormal,
    "metrics.updated":            PriorityBackground,
}
```

---

## Security & Authentication

### Multi-Method Authentication

```go
// Auth middleware supports 3 methods
func authMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        // Method 1: JWT (Bearer token)
        if token := extractBearer(c); token != "" {
            if user, err := validateJWT(token); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "jwt")
                return next(c)
            }
        }
        
        // Method 2: API Key (X-API-Key header)
        if apiKey := c.Request().Header.Get("X-API-Key"); apiKey != "" {
            if user, err := validateAPIKey(apiKey); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "api_key")
                return next(c)
            }
        }
        
        // Method 3: Session Cookie (HttpOnly)
        if cookie, err := c.Cookie("session"); err == nil {
            if user, err := validateSession(cookie.Value); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "session")
                return next(c)
            }
        }
        
        return echo.NewHTTPError(401, "Unauthorized")
    }
}
```

### JWT with Sliding Sessions

```go
type JWTConfig struct {
    PrivateKey      *rsa.PrivateKey  // RS256 signing
    PublicKey       *rsa.PublicKey   // RS256 verification
    TokenDuration   time.Duration    // 1 hour
    SessionDuration time.Duration    // 7 days max
    SlideThreshold  time.Duration    // 30 minutes
}

type Claims struct {
    jwt.RegisteredClaims
    UserID      string   `json:"uid"`
    Username    string   `json:"username"`
    Role        string   `json:"role"`
    Permissions []string `json:"perms"`
    SessionID   string   `json:"sid"`
}

// Sliding session: extend if < 30 min remaining
func (s *AuthService) ValidateToken(token string) (*Claims, error) {
    claims, err := parseToken(token)
    if err != nil {
        return nil, err
    }
    
    // Validate session not revoked
    if !s.sessions.IsValid(claims.SessionID) {
        return nil, ErrSessionRevoked
    }
    
    // Slide session if close to expiry
    remaining := time.Until(claims.ExpiresAt.Time)
    if remaining < s.config.SlideThreshold {
        newToken, _ := s.issueToken(claims)
        // Return new token to client via Set-Cookie
    }
    
    return claims, nil
}
```

### Password Security

```go
// NIST-compliant password rules
type PasswordPolicy struct {
    MinLength       int   // 8 characters
    MaxLength       int   // 128 characters
    RequireComplex  bool  // false (no forced symbols/uppercase)
    CheckCommonList bool  // true (check against common passwords)
}

// bcrypt with cost 10 (~100ms)
func HashPassword(password string) (string, error) {
    return bcrypt.GenerateFromPassword([]byte(password), 10)
}

func VerifyPassword(hash, password string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
```

---

## Resource Constraints

### Runtime Targets

| Resource | Base | Per Router | Per Feature | Total Example |
|----------|------|------------|-------------|---------------|
| **Memory** | ~100MB | +8-10MB | +16-128MB | ~200MB (2 routers, 1 feature) |
| **Disk** | ~6MB | +4-8MB | +10-50MB | ~30MB (2 routers, 2 features) |
| **CPU** | <5% idle | <10% sync | Variable | Shared, no hard limit |

### Configuration Limits

```yaml
# config.yaml - All limits configurable
resources:
  cache:
    max_size_mb: 20
  
  connections:
    db_max_open: 10
    db_max_idle: 5
    websocket_max: 100
    router_max: 50
  
  buffers:
    websocket_read_kb: 4
    websocket_write_kb: 4
    event_queue_size: 500
  
  features:
    max_instances_per_feature: 10
    max_total_features: 20
```

---

## Technology Decisions

### Core Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **GraphQL Server** | gqlgen | Schema-first, type-safe, production-proven |
| **ORM** | ent | Graph-based, perfect for Universal State, type-safe |
| **Database** | SQLite WAL | Embedded, ACID, concurrent reads, crash-safe |
| **HTTP** | Echo v4 | Minimal for REST fallbacks (health, files, OAuth) |
| **Event Bus** | Watermill | Typed events, hierarchical topics, swappable backends |
| **Circuit Breaker** | Sony gobreaker | Resilience for router API calls |
| **Logging** | zap | Structured, high performance, JSON output |
| **Identifiers** | ULID | Time-sortable, debuggable, globally unique |

### Libraries

```go
// go.mod dependencies
require (
    github.com/99designs/gqlgen v0.17+
    github.com/labstack/echo/v4 v4.12+
    github.com/ThreeDotsLabs/watermill v1.3+
    entgo.io/ent v0.14+
    github.com/sony/gobreaker v1.0+
    go.uber.org/zap v1.27+
    github.com/oklog/ulid/v2 latest
    golang.org/x/crypto latest
    modernc.org/sqlite latest  // Pure Go SQLite
)
```

---

## Related Documents

- [API Contracts](./api-contracts.md) - GraphQL schema and patterns
- [Data Architecture](./data-architecture.md) - Database and Universal State v2
- [Security Architecture](./security-architecture.md) - Auth, encryption, access control
- [Deployment Architecture](./deployment-architecture.md) - Container and update system
- [ADR-011: Unified GraphQL Architecture](./adrs/011-unified-graphql-architecture.md)

---
