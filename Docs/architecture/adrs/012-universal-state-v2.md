# ADR-012: Universal State v2 - 8-Layer Resource Model

**Date:** 2026-01-20  
**Status:** Accepted  
**Deciders:** Technical Architect, BMad  
**Category:** Architecture / State Management  
**Source Session:** brainstorming-session-universal-state-2025-12-29.md  
**Related ADRs:** ADR-002 (State Management), ADR-011 (Unified GraphQL)

---

## Context

NasNetConnect manages complex network resources (VPNs, firewalls, interfaces, features) across a fleet of routers with different platforms (MikroTik, OpenWRT, VyOS). The application needs to:

1. **Track Desired vs Actual State:** User intent vs router reality
2. **Support Multiple Platforms:** Platform-specific naming without hardcoded platform blocks
3. **Enable Fleet Management:** Multi-router orchestration
4. **Provide Complete Auditability:** Every change recorded with time-travel capability
5. **Ensure Type Safety:** End-to-end from frontend to backend
6. **Enable Infinite Extensibility:** New protocols, features, plugins without core changes

**Previous Approach (ConnectSetup Wizard):**
- Flat state model with router-specific fields mixed together
- No separation between user config and router-generated fields
- No audit trail or time-travel capability
- Platform-specific code scattered throughout

**Problem:**
- Hard to extend for new platforms (requires code changes everywhere)
- No clear distinction between what user configures vs what router generates
- Cannot answer "what was the state last Tuesday?" or "who changed this?"
- Difficult to implement impact analysis ("what breaks if I delete this WAN?")

---

## Decision

Implement **Universal State v2** with an **8-Layer Resource Model** that standardizes how all network resources are represented across the entire system.

### Core Principles

1. **Router as Source of Truth:** Application tracks desired state, router holds actual state, backend synchronizes
2. **Apply-Confirm-Merge Flow:** User submits config → Backend applies → Backend confirms from router → State updated
3. **8 Optional Layers:** Each resource can have up to 8 layers, only configuration and metadata are mandatory
4. **Event Sourcing:** All changes recorded as events for complete audit trail
5. **Fleet Multi-Device:** Each device has platform-specific state using native naming
6. **Graph Structure:** Resources form a graph with relationships tracked both embedded and explicitly

---

## 8-Layer Resource Model

Every resource implements up to 8 layers:

| Layer | Purpose | Source | Optional | Example Data |
|-------|---------|--------|----------|--------------|
| **1. configuration** | User's desired config | Frontend | No (mandatory) | `{ name: "USA VPN", privateKey: "...", wanInterface: "wan-domestic" }` |
| **2. validation** | Pre-flight check results | Backend | Yes | `{ canApply: true, warnings: [], errors: [], requiredDeps: [...] }` |
| **3. deployment** | What's on router | Backend | Yes | `{ routerInterfaceId: "*1A", publicKey: "...", appliedAt: "..." }` |
| **4. runtime** | Live operational state | Router | Yes | `{ isConnected: true, bytesIn: 1048576, lastHandshake: "2s ago" }` |
| **5. telemetry** | Time-series metrics | Backend | Yes | `{ bandwidthHistory: [...], uptimeGraph: [...] }` |
| **6. metadata** | Lifecycle info | Backend | No (mandatory) | `{ createdAt: "...", createdBy: "admin", tags: ["prod"], version: 5 }` |
| **7. relationships** | Dependencies | User+System | Yes | `{ routesVia: "wan-uuid" } + relationship table` |
| **8. platform** | Capabilities | Adapter | Yes | `{ current: "mikrotik", capabilities: {...}, fieldMappings: {...} }` |

### Apply-Confirm-Merge Flow

```
User submits configuration
         ↓
Backend validates (7-stage pipeline)
         ↓
Backend applies to router (transactional)
         ↓
Backend queries router for confirmation
(includes router-generated fields)
         ↓
Universal State updated with router reality
(deployment layer populated)
         ↓
Event published to Event Bus
         ↓
GraphQL subscription notifies frontend
         ↓
Apollo cache automatically updates UI

On Error: Rollback entire transaction
```

### Resource Categories

Resources organized beyond simple topology:

| Category | Examples | Driven By |
|----------|----------|-----------|
| **Networks** | WAN Links, LAN Networks, VLANs | Topology |
| **VPN** | WireGuard Client/Server, OpenVPN | Connectivity |
| **Infrastructure** | Certificates, NTP, DDNS | System-level |
| **Application** | Port Forwarding, Game Rules | User workload |
| **Features** | Tor, AdGuard, sing-box | Marketplace |
| **Plugins** | Community Extensions | Third-party |

---

## Rationale

### Why 8 Layers?

**Separation of Concerns:**
- **configuration:** What user wants (mutable)
- **deployment:** What router has (immutable after apply)
- **runtime:** What's happening now (continuously updated)
- **validation:** Can we apply? (computed)
- **telemetry:** Historical analysis (optional)
- **metadata:** System bookkeeping (required)
- **relationships:** Impact analysis (both embedded and explicit)
- **platform:** Multi-platform support (adapter-driven)

**Prevents Common Mistakes:**
- Mixing user input with router-generated fields
- Assuming apply succeeded without confirmation
- Losing audit trail of changes
- Hardcoding platform-specific logic

### Why Event Sourcing?

**Benefits:**
- **Complete Audit Trail:** Every change recorded, who/what/when
- **Time Travel:** View network state at any point in history
- **Rollback:** Revert to previous state by replaying events
- **Compliance:** Meets "everything in detail" requirement
- **Debugging:** Trace how system reached current state

**Trade-offs Accepted:**
- Higher storage usage (mitigated by 3-tier event storage)
- Slightly more complex writes (event + table in single transaction)
- Worth it for auditability and rollback capabilities

### Why Fleet Multi-Device Architecture?

**Problem with Single-Platform Model:**
```go
// Bad: Platform-specific blocks everywhere
if router.Platform == "mikrotik" {
    config.FieldName = "private-key"
} else if router.Platform == "openwrt" {
    config.FieldName = "private_key"
}
```

**Solution: Each Device Uses Native Naming:**
```go
// Good: Each router has platform-specific state
routers := {
    "router-mikrotik": {
        platform: "mikrotik",
        resources: { /* uses MikroTik field names */ }
    },
    "router-openwrt": {
        platform: "openwrt",
        resources: { /* uses OpenWRT field names */ }
    }
}
```

---

## Consequences

### Positive

- **Complete Auditability:** Event sourcing provides full history
- **Time Travel Debugging:** Can inspect state at any point in past
- **Platform Extensibility:** Adding OpenWRT/VyOS requires adapter only, no core changes
- **Type Safety:** GraphQL schema generates types for all 8 layers
- **Impact Analysis:** Relationship tracking enables "what breaks if I delete this?"
- **Flexible Data Fetching:** Mobile gets minimal layers, desktop gets all 8
- **Clear Separation:** Never confuse user input with router-generated data

### Negative

- **Complexity:** 8 layers more complex than flat model
- **Storage:** Event sourcing uses more disk space
- **Learning Curve:** Team must understand layer semantics

### Mitigations

- **Documentation:** Clear explanation of each layer's purpose
- **Code Generation:** GraphQL schema generates types, reduces boilerplate
- **3-Tier Storage:** Hot (tmpfs) / Warm (flash) / Cold (external) minimizes flash wear
- **Lazy Loading:** Only load layers needed for current operation
- **Training:** Team onboarding includes state model deep dive

---

## Implementation

### GraphQL Schema

```graphql
interface Resource {
  uuid: ID!
  id: String!  # Scoped ULID: "vpn.wg.client:usa-vpn:a1b2"
  type: String!
  category: ResourceCategory!
  
  # 8-Layer Model
  configuration: JSON!
  validation: ValidationResult
  deployment: DeploymentState
  runtime: RuntimeState
  telemetry: TelemetryData
  metadata: ResourceMetadata!
  relationships: ResourceRelationships
  platform: PlatformInfo
}

type WireGuardClient implements Resource {
  uuid: ID!
  id: String!
  type: String!  # "vpn.wireguard.client"
  category: ResourceCategory!  # VPN
  
  # Layer 1: Configuration
  configuration: WireGuardClientConfig!
  
  # Layers 2-8 (optional, fetched on demand)
  validation: ValidationResult
  deployment: WireGuardDeployment
  runtime: WireGuardRuntime
  telemetry: BandwidthTelemetry
  metadata: ResourceMetadata!
  relationships: ResourceRelationships
  platform: PlatformInfo
}
```

### ent Schema

```go
// ent/schema/resource.go
type Resource struct {
    ent.Schema
}

func (Resource) Fields() []ent.Field {
    return []ent.Field{
        field.String("uuid").GoType(ulid.ULID{}).Unique(),
        field.String("id"),  // Scoped ULID
        field.String("type"),
        field.String("category"),
        
        // 8-Layer Model (JSON for flexibility)
        field.JSON("configuration", map[string]interface{}{}),
        field.JSON("validation", map[string]interface{}).Optional(),
        field.JSON("deployment", map[string]interface{}).Optional(),
        field.JSON("runtime", map[string]interface{}).Optional(),
        field.JSON("telemetry", map[string]interface{}).Optional(),
        field.JSON("metadata", map[string]interface{}{}),
        field.JSON("relationships", map[string]interface{}).Optional(),
        field.JSON("platform", map[string]interface{}).Optional(),
        
        field.Int("version"),  // Optimistic locking
        field.Time("created_at"),
        field.Time("updated_at"),
    }
}
```

---

## Alternatives Considered

### Flat State Model (Rejected)

```typescript
// All fields mixed together
type VPN = {
    name: string;              // User provides
    privateKey: string;        // User provides
    publicKey?: string;        // Router generates
    routerInterfaceId?: string; // Router generates
    isConnected?: boolean;     // Router runtime
    bytesIn?: number;          // Router runtime
}
```

**Why rejected:**
- No clear separation between user input and router output
- Cannot distinguish configured vs deployed vs runtime
- Hard to implement validation (which fields to validate?)
- No audit trail or history
- Platform-specific fields pollute schema

### Spec/Status Split Only (Rejected)

```typescript
type VPN = {
    spec: { name, privateKey, listenPort },  // User input
    status: { publicKey, isConnected, bytes } // Router output
}
```

**Why rejected:**
- Only 2 layers insufficient for complex needs
- No validation results layer (where to show errors?)
- No deployment tracking (what was actually applied?)
- No telemetry layer (where to store historical metrics?)
- Missing metadata for lifecycle management

### Kubernetes-Style (Partially Adopted)

Kubernetes uses `spec` + `status` + `metadata`. We expanded this to 8 layers for richer modeling.

---

## Performance Metrics

**After Implementation:**
- GraphQL query for minimal layers (config + runtime): <50ms
- GraphQL query for all 8 layers: <200ms
- Database size per router: 4-8MB (acceptable)
- Event storage overhead: Mitigated by 3-tier storage strategy

---

## Review Date

Review after 3 months of production use:
- Assess if 8 layers justified or if some can be merged
- Evaluate storage overhead from event sourcing
- Check if layer semantics clear to team
- Consider adjustments based on real-world usage patterns

---

## References

- Brainstorming Session: `Docs/brainstorming-sessions/brainstorming-session-universal-state-2025-12-29.md`
- Data Architecture: `architecture/data-architecture.md`
- API Contracts: `architecture/api-contracts.md`
- Backend Architecture: `architecture/backend-architecture.md`

---
