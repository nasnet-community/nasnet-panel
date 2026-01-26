# API Contracts

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Unified GraphQL Architecture - Schema-First

---

## Table of Contents

- [Overview](#overview)
- [GraphQL Schema Structure](#graphql-schema-structure)
- [Schema-First Development](#schema-first-development)
- [Custom Directives](#custom-directives)
- [Domain Organization](#domain-organization)
- [Query Patterns](#query-patterns)
- [Mutation Patterns](#mutation-patterns)
- [Subscription Patterns](#subscription-patterns)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [REST Fallback Endpoints](#rest-fallback-endpoints)
- [Performance & Security](#performance--security)

---

## Overview

NasNetConnect uses a **Unified GraphQL Architecture** where the GraphQL schema is the **single source of truth** for all API contracts, type definitions, and validation rules.

### Key Principles

1. **Schema-First:** GraphQL SDL defined first, generates all code (TypeScript + Go + Zod)
2. **Unified Endpoint:** Single `/graphql` endpoint serves all domains
3. **Type Safety:** End-to-end types prevent frontend/backend drift
4. **Real-time:** GraphQL Subscriptions replace custom WebSocket
5. **Pragmatic REST:** Industry standards (health, files, OAuth) remain REST

### API Endpoints

```
# GraphQL Endpoints
POST /graphql              → GraphQL queries & mutations
WS   /query                → GraphQL subscriptions (graphql-ws protocol)
GET  /playground           → GraphQL Playground (dev mode only)

# REST Fallbacks (Industry Standards Only)
GET  /health               → Health checks (Kubernetes/Docker/orchestrators)
GET  /metrics              → Prometheus metrics (optional monitoring)
GET  /download/:file       → File downloads (proper Content-Disposition headers)
POST /upload               → File uploads (multipart/form-data)
POST /oauth/callback       → OAuth redirect callbacks (third-party services)
```

---

## GraphQL Schema Structure

### Core Schema Organization

```
schema/
├── scalars.graphql          # Custom scalars (Time, ULID, JSON)
├── directives.graphql       # Custom directives (@validate, @mikrotik, etc.)
├── interfaces.graphql       # Node interface, MutationResponse
│
├── resources/               # Resource type definitions
│   ├── common.graphql       # Resource interface, ResourceConnection
│   ├── network.graphql      # WAN Link, LAN Network, Interface
│   ├── vpn.graphql          # WireGuard, OpenVPN, L2TP, SSTP
│   ├── firewall.graphql     # Filter Rules, NAT Rules, Mangle
│   ├── wireless.graphql     # WiFi, CAPsMAN
│   └── infrastructure.graphql # Certificates, NTP, DDNS
│
├── features/                # Feature Marketplace
│   ├── feature.graphql      # Feature, FeatureInstance
│   └── marketplace.graphql  # Marketplace queries, installation
│
├── fleet/                   # Multi-router management
│   ├── device.graphql       # Device, DeviceConnection
│   └── fleet.graphql        # Fleet operations, topology
│
├── system/                  # System & monitoring
│   ├── system.graphql       # System info, health
│   ├── monitoring.graphql   # Metrics, alerts
│   └── logs.graphql         # Log streaming, search
│
├── auth/                    # Authentication & authorization
│   ├── user.graphql         # User, Session, APIKey
│   └── auth.graphql         # Login, logout, permissions
│
└── operations/              # File operations, jobs
    ├── files.graphql        # Backup, restore, config export
    └── jobs.graphql         # Async operations, progress tracking
```

---

## Schema-First Development

### Code Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│              SCHEMA-FIRST GENERATION PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  schema.graphql (Single Source of Truth)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  type WireGuardClient {                                       │  │
│  │    uuid: ID!                                                  │  │
│  │    name: String! @validate(minLength: 1, maxLength: 100)    │  │
│  │    privateKey: String!                                        │  │
│  │      @validate(regex: "^[A-Za-z0-9+/]{43}=$")              │  │
│  │      @sensitive                                              │  │
│  │      @mikrotik(field: "private-key")                         │  │
│  │      @openwrt(field: "private")                             │  │
│  │    listenPort: Int!                                          │  │
│  │      @validate(min: 1, max: 65535)                          │  │
│  │      @mikrotik(field: "listen-port")                         │  │
│  │      @openwrt(field: "port")                                │  │
│  │  }                                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                     ↓ Build Pipeline ↓                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  graphql-codegen (Frontend)                                   │  │
│  │  ├─→ TypeScript types                                         │  │
│  │  ├─→ Zod schemas (from @validate)                            │  │
│  │  ├─→ React hooks (useQuery, useMutation)                     │  │
│  │  ├─→ Platform mappings (@mikrotik, @openwrt)                 │  │
│  │  └─→ Operation types                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  gqlgen (Backend)                                             │  │
│  │  ├─→ Go structs                                               │  │
│  │  ├─→ Resolver interfaces                                      │  │
│  │  ├─→ Go validators (from @validate)                          │  │
│  │  └─→ Platform adapter mappings                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Generation Commands:**

```bash
# Frontend type generation
npm run generate:graphql

# Backend resolver generation  
cd backend && go run github.com/99designs/gqlgen generate

# Watch mode during development
nx run-many --target=generate --watch
```

---

## Custom Directives

### Validation Directives

```graphql
"""
Validation rules for fields - generates Zod schemas and Go validators
"""
directive @validate(
  min: Int                    # Minimum numeric value
  max: Int                    # Maximum numeric value
  minLength: Int              # Minimum string length
  maxLength: Int              # Maximum string length
  regex: String               # Regular expression pattern
  format: String              # Predefined format: "email", "cidr", "ipv4", "mac", "uuid"
  minItems: Int               # Minimum array items
  maxItems: Int               # Maximum array items
) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

"""
Mark field as sensitive - excluded from logs and error messages
"""
directive @sensitive on FIELD_DEFINITION

"""
Authorization requirement for field access
"""
directive @auth(requires: String!) on FIELD_DEFINITION | OBJECT
```

### Platform Mapping Directives

```graphql
"""
Map GraphQL field to platform-specific field name
"""
directive @mikrotik(field: String!) on FIELD_DEFINITION
directive @openwrt(field: String!) on FIELD_DEFINITION
directive @vyos(field: String!) on FIELD_DEFINITION
```

### Usage Example

```graphql
type WireGuardClient {
  uuid: ID!
  
  """
  Human-readable name for this VPN client (1-100 characters)
  
  ## Platform Mappings
  - **MikroTik:** `name` field
  - **OpenWRT:** `uci set network.{name}.name`
  - **VyOS:** `set interfaces wireguard {name}`
  
  ## Validation
  - Minimum: 1 character
  - Maximum: 100 characters
  - Allowed: Letters, numbers, hyphens, underscores
  """
  name: String! 
    @validate(minLength: 1, maxLength: 100)
  
  """
  WireGuard private key (base64, 44 characters)
  
  **Security:** This field is sensitive and will be:
  - Excluded from logs
  - Redacted in error messages
  - Encrypted at rest (AES-256-GCM)
  
  ## Platform Mappings
  - **MikroTik:** `/interface/wireguard` → `private-key` field
  - **OpenWRT:** `uci set network.{name}.private_key`
  """
  privateKey: String! 
    @validate(regex: "^[A-Za-z0-9+/]{43}=$")
    @sensitive
    @mikrotik(field: "private-key")
    @openwrt(field: "private_key")
  
  """
  UDP port for incoming WireGuard connections (1-65535)
  
  **Default:** 51820 (WireGuard standard)
  **Alternatives:** 51821, 51822 if port conflict
  
  ## Platform Mappings
  - **MikroTik:** `/interface/wireguard` → `listen-port` field
  - **OpenWRT:** `uci set network.{name}.listen_port`
  
  ## Common Issues
  - Port conflict: Choose different port or stop conflicting instance
  - Firewall: Ensure port allowed in router firewall
  """
  listenPort: Int! 
    @validate(min: 1, max: 65535)
    @mikrotik(field: "listen-port")
    @openwrt(field: "listen_port")
  
  """
  WireGuard peers (VPN servers to connect to)
  
  ## Validation
  - Minimum: 1 peer required
  - Maximum: 100 peers (platform-dependent)
  """
  peers: [WireGuardPeer!]!
    @validate(minItems: 1, maxItems: 100)
}
```

---

## Schema-First Development

### How It Works

```
1. Define GraphQL Schema
   schema/resources/vpn.graphql

2. Run Code Generation
   npm run generate:graphql
   cd backend && go generate

3. Implement Resolvers (Backend)
   graph/resolvers/vpn.resolvers.go
   
4. Use Generated Hooks (Frontend)
   import { useWireGuardClientsQuery, useCreateWireGuardClientMutation }
   
5. Validation Automatic
   - Frontend: Zod schemas auto-generated from @validate directives
   - Backend: Go validators auto-generated from @validate directives
```

### Frontend Generated Code

```typescript
// Auto-generated by graphql-codegen

// TypeScript type (from schema)
export type WireGuardClient = {
  __typename?: 'WireGuardClient';
  uuid: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
  listenPort: Scalars['Int']['output'];
  peers: Array<WireGuardPeer>;
};

// Zod schema (from @validate directives)
export const wireGuardClientSchema = z.object({
  name: z.string().min(1).max(100),
  privateKey: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
  listenPort: z.number().int().min(1).max(65535),
  peers: z.array(wireGuardPeerSchema).min(1).max(100),
});

// Platform mappings (from @mikrotik/@openwrt directives)
export const wireGuardPlatformMappings = {
  mikrotik: {
    privateKey: 'private-key',
    listenPort: 'listen-port',
  },
  openwrt: {
    privateKey: 'private_key',
    listenPort: 'listen_port',
  },
};

// React hooks
export function useWireGuardClientsQuery(
  baseOptions?: Apollo.QueryHookOptions<WireGuardClientsQuery, WireGuardClientsQueryVariables>
) {
  return Apollo.useQuery<WireGuardClientsQuery, WireGuardClientsQueryVariables>(
    WireGuardClientsDocument,
    baseOptions
  );
}

export function useCreateWireGuardClientMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateWireGuardClientMutation, CreateWireGuardClientMutationVariables>
) {
  return Apollo.useMutation<CreateWireGuardClientMutation, CreateWireGuardClientMutationVariables>(
    CreateWireGuardClientDocument,
    baseOptions
  );
}
```

### Backend Generated Code

```go
// Auto-generated by gqlgen

// Go struct (from schema)
type WireGuardClient struct {
    UUID       string              `json:"uuid"`
    Name       string              `json:"name"`
    PrivateKey string              `json:"privateKey"`
    ListenPort int                 `json:"listenPort"`
    Peers      []WireGuardPeer     `json:"peers"`
}

// Resolver interface (implement this)
type QueryResolver interface {
    WireGuardClients(ctx context.Context) ([]*WireGuardClient, error)
}

type MutationResolver interface {
    CreateWireGuardClient(ctx context.Context, input WireGuardClientInput) (*WireGuardClient, error)
}

// Validator (from @validate directives)
func ValidateWireGuardClientInput(input WireGuardClientInput) error {
    if len(input.Name) < 1 || len(input.Name) > 100 {
        return errors.New("name must be 1-100 characters")
    }
    
    matched, _ := regexp.MatchString(`^[A-Za-z0-9+/]{43}=$`, input.PrivateKey)
    if !matched {
        return errors.New("privateKey must be valid base64 (44 chars)")
    }
    
    if input.ListenPort < 1 || input.ListenPort > 65535 {
        return errors.New("listenPort must be 1-65535")
    }
    
    if len(input.Peers) < 1 || len(input.Peers) > 100 {
        return errors.New("peers must have 1-100 items")
    }
    
    return nil
}

// Platform adapter uses mappings
func (a *MikroTikAdapter) CreateWireGuardClient(client *WireGuardClient) error {
    cmd := Command{
        Path: "/interface/wireguard",
        Action: ActionAdd,
        Params: map[string]interface{}{
            "name":        client.Name,
            "private-key": client.PrivateKey,  // @mikrotik mapping
            "listen-port": client.ListenPort,  // @mikrotik mapping
        },
    }
    return a.Execute(cmd)
}
```

---

## Custom Directives

### @validate - Field Validation

Defines validation rules that generate Zod schemas (frontend) and Go validators (backend).

```graphql
directive @validate(
  min: Int                    # Minimum numeric value
  max: Int                    # Maximum numeric value
  minLength: Int              # Minimum string length
  maxLength: Int              # Maximum string length
  regex: String               # Regular expression pattern
  format: String              # Predefined format
  minItems: Int               # Minimum array items
  maxItems: Int               # Maximum array items
) on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
```

**Predefined formats:**
- `email` - Valid email address
- `cidr` - Valid CIDR notation (e.g., 192.168.1.0/24)
- `ipv4` - Valid IPv4 address
- `ipv6` - Valid IPv6 address
- `mac` - Valid MAC address (various formats)
- `uuid` - Valid UUID
- `ulid` - Valid ULID
- `hostname` - Valid hostname
- `url` - Valid URL

**Example:**

```graphql
type DHCPServerConfig {
  subnet: String! @validate(format: "cidr")
  gateway: String! @validate(format: "ipv4")
  dnsServers: [String!]! 
    @validate(minItems: 1, maxItems: 4)
  leaseTime: Int! 
    @validate(min: 300, max: 86400)  # 5 min to 24 hours
}
```

### @sensitive - Security Marker

Marks fields as sensitive - automatically excluded from logs and error messages.

```graphql
directive @sensitive on FIELD_DEFINITION

type User {
  password: String! @sensitive         # Never logged
  apiKey: String! @sensitive           # Redacted in errors
  totpSecret: String @sensitive        # Excluded from audit
}
```

### @auth - Authorization Requirements

Declares permission requirements for field or type access.

```graphql
directive @auth(requires: String!) on FIELD_DEFINITION | OBJECT

type Query {
  # Public - no auth required
  systemStatus: SystemStatus!
  
  # Requires authentication
  resources: [Resource!]! @auth(requires: "authenticated")
  
  # Requires specific permission
  users: [User!]! @auth(requires: "admin")
  
  # Requires any of multiple permissions
  dangerousOperation: Boolean! @auth(requires: "admin,superuser")
}
```

### @platform - Platform Field Mappings

Maps GraphQL field names to platform-specific field names.

```graphql
directive @mikrotik(field: String!, path: String) on FIELD_DEFINITION
directive @openwrt(field: String!, uciPath: String) on FIELD_DEFINITION
directive @vyos(field: String!, configPath: String) on FIELD_DEFINITION

type Interface {
  mtu: Int!
    @mikrotik(field: "mtu", path: "/interface")
    @openwrt(field: "mtu", uciPath: "network.{name}.mtu")
    @vyos(field: "mtu", configPath: "interfaces.ethernet.{name}.mtu")
}
```

---

## Domain Organization

### Unified Schema Domains

```graphql
type Query {
  # 1. Universal State (Resources)
  node(uuid: ID!): Node
  resource(uuid: ID!): Resource
  resources(filter: ResourceFilter): ResourceConnection!
  
  # 2. Feature Marketplace
  marketplace: Marketplace!
  feature(id: ID!): Feature
  features(filter: FeatureFilter): FeatureConnection!
  
  # 3. Router Management
  devices: [Device!]!
  device(id: ID!): Device
  
  # 4. Auth/Users
  me: User
  users: [User!]! @auth(requires: "admin")
  sessions: [Session!]!
  
  # 5. Monitoring/Alerts
  alerts(severity: Severity): [Alert!]!
  metrics(resourceId: ID, timeRange: TimeRange): MetricsData!
  
  # 6. File Operations
  backups: [Backup!]!
  backup(id: ID!): Backup
  
  # 7. System/Health
  health: HealthStatus!
  capabilities: PlatformCapabilities!
}
```

---

## Query Patterns

### Resource Queries with 8-Layer Model

```graphql
query GetVPNWithFullContext {
  resource(uuid: "vpn-uuid-here") {
    uuid
    id  # Scoped ULID: "vpn.wg.client:usa-vpn:a1b2"
    
    # Layer 1: Configuration (user-editable)
    configuration {
      ... on WireGuardClientConfig {
        name
        privateKey
        listenPort
        peers {
          publicKey
          endpoint
          allowedIPs
        }
      }
    }
    
    # Layer 2: Validation (pre-flight check results)
    validation {
      canApply
      warnings {
        code
        message
      }
      errors {
        field
        message
      }
    }
    
    # Layer 3: Deployment (router-applied state)
    deployment {
      routerInterfaceId
      appliedAt
      appliedBy
      routerGeneratedFields {
        publicKey
      }
    }
    
    # Layer 4: Runtime (live operational state)
    runtime {
      isConnected
      bytesIn
      bytesOut
      lastHandshake
      currentPeers
    }
    
    # Layer 5: Telemetry (time-series - optional)
    telemetry {
      bandwidthHistory(last: 24h) {
        timestamp
        bytesIn
        bytesOut
      }
    }
    
    # Layer 6: Metadata
    metadata {
      createdAt
      updatedAt
      createdBy
      tags
      description
      version  # For optimistic locking
    }
    
    # Layer 7: Relationships
    relationships {
      dependsOn {
        uuid
        type
        name
      }
      dependents {
        uuid
        type
        name
      }
    }
    
    # Layer 8: Platform
    platform {
      current
      capabilities {
        wireguard
        multiPeer
        presharedKey
      }
    }
  }
}
```

### Flexible Data Fetching (Mobile vs Desktop)

```graphql
# Mobile - minimal data for bandwidth savings
query GetVPNsMobile {
  resources(filter: { type: "vpn" }) {
    edges {
      node {
        uuid
        id
        
        configuration {
          ... on WireGuardClientConfig {
            name
          }
        }
        
        runtime {
          isConnected
        }
      }
    }
  }
}

# Desktop - comprehensive data for power users
query GetVPNsDesktop {
  resources(filter: { type: "vpn" }) {
    edges {
      node {
        uuid
        id
        
        # All 8 layers
        configuration { ... }
        validation { ... }
        deployment { ... }
        runtime { ... }
        telemetry { ... }
        metadata { ... }
        relationships { ... }
        platform { ... }
      }
    }
  }
}
```

---

## Mutation Patterns

### Full State Update with Change Tracking

```graphql
mutation UpdateResource {
  updateResource(
    input: {
      uuid: "vpn-uuid-here"
      
      # Full state (not delta)
      configuration: {
        name: "USA VPN Updated"
        privateKey: "abc...="
        listenPort: 51821
        peers: [...]
      }
      
      # Change intelligence
      changeInfo: {
        changedFields: ["listenPort"]
        previousValues: { listenPort: 51820 }
        reason: "Port conflict with MTProxy"
        changeType: "user-edit"
      }
      
      # Optimistic locking
      expectedVersion: 5
    }
  ) {
    resource {
      uuid
      metadata {
        version  # Incremented to 6
      }
    }
    
    conflict {
      currentVersion
      conflictingFields
    }
  }
}
```

### Staged Configuration Apply

```graphql
mutation ApplyConfiguration {
  applyConfiguration(
    input: {
      deviceId: "router-main"
      changeSetId: "changeset-123"
      dryRun: false
    }
  ) {
    jobId
    estimatedDuration
    
    # Subscribe to progress
    subscription {
      configApplyProgress(jobId: jobId)
    }
  }
}
```

---

## Subscription Patterns

### Resource Updates

```graphql
subscription ResourceUpdated {
  resourceUpdated(
    resourceId: "vpn-uuid"
    layers: [RUNTIME, VALIDATION]
  ) {
    resource {
      uuid
      runtime {
        isConnected
        bytesIn
      }
      validation {
        canApply
        warnings
      }
    }
    
    changeType  # "created" | "updated" | "deleted"
    previousValue  # For diff display
  }
}
```

### Device Status

```graphql
subscription DeviceStatus {
  deviceStatus(
    deviceId: "router-main"
    eventTypes: [CONNECTION, ERROR, WARNING]
  ) {
    deviceId
    status  # "online" | "offline" | "degraded"
    eventType
    timestamp
    details
  }
}
```

### Job Progress

```graphql
subscription JobProgress {
  configApplyProgress(jobId: "job-123") {
    jobId
    stage  # "validate" | "preview" | "apply" | "verify"
    percentage  # 0-100
    message
    errors {
      stage
      code
      message
    }
  }
}
```

---

## Error Handling

### Rich Error Context

```json
{
  "errors": [{
    "message": "Failed to update VPN configuration",
    "path": ["updateResource", "resource"],
    "locations": [{ "line": 2, "column": 3 }],
    
    "extensions": {
      "code": "RESOURCE_UPDATE_FAILED",
      
      "resourceId": "vpn-uuid",
      "resourceType": "vpn.wireguard.client",
      "deviceId": "router-main",
      
      "stage": "deployment",
      "failedCommand": "/interface/wireguard/add",
      "routerError": "interface name already exists",
      
      "suggestedFix": "Delete existing interface 'vpn-usa' first or choose different name",
      
      "relatedResources": [
        { "uuid": "iface-uuid-123", "type": "interface", "name": "vpn-usa" }
      ],
      
      "documentationUrl": "https://docs.nasnet.io/troubleshooting/vpn-name-conflicts",
      
      "canRetry": false,
      "userAction": "required",
      
      "troubleshootingSteps": [
        "1. Check existing interfaces: query { device { interfaces { name } } }",
        "2. Delete conflicting interface or rename this VPN",
        "3. Retry mutation with updated name"
      ]
    }
  }]
}
```

### Error Codes Hierarchy

```
AUTH.*
├─ AUTH.INVALID_CREDENTIALS
├─ AUTH.SESSION_EXPIRED
├─ AUTH.SESSION_REVOKED
├─ AUTH.PERMISSION_DENIED
└─ AUTH.RATE_LIMITED

RESOURCE.*
├─ RESOURCE.NOT_FOUND
├─ RESOURCE.VALIDATION_FAILED
├─ RESOURCE.UPDATE_FAILED
├─ RESOURCE.CONFLICT
└─ RESOURCE.DEPENDENCY_ERROR

ROUTER.*
├─ ROUTER.OFFLINE
├─ ROUTER.CONNECTION_TIMEOUT
├─ ROUTER.CONNECTION_REFUSED
├─ ROUTER.AUTH_FAILED
├─ ROUTER.COMMAND_FAILED
└─ ROUTER.CAPABILITY_UNSUPPORTED

FEATURE.*
├─ FEATURE.NOT_FOUND
├─ FEATURE.INSTALLATION_FAILED
├─ FEATURE.CRASHED
└─ FEATURE.INCOMPATIBLE

SYSTEM.*
├─ SYSTEM.DATABASE_ERROR
├─ SYSTEM.INTERNAL_ERROR
└─ SYSTEM.MAINTENANCE
```

---

## Pagination

### Relay Cursor-Based Pagination

```graphql
"""
Standard Relay connection pattern for all paginated lists
"""
type ResourceConnection {
  edges: [ResourceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ResourceEdge {
  node: Resource!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Usage
query GetResourcesPaginated {
  resources(
    first: 20
    after: "cursor-abc123"
    filter: { category: "vpn" }
  ) {
    edges {
      node {
        uuid
        configuration { ... }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

---

## REST Fallback Endpoints

### Health Checks

```
GET /health

Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "router": "healthy",
    "eventBus": "healthy"
  }
}
```

### File Downloads

```
GET /download/:file

Headers:
  Content-Disposition: attachment; filename="backup-2026-01-20.rsc"
  Content-Type: application/octet-stream
  Content-Length: 1234567

# Signed URLs generated by GraphQL mutation
mutation {
  createBackup(deviceId: "router-main") {
    backupId
    filename
    downloadUrl      # "/download/backup-abc123.rsc"
    expiresAt        # URL expires in 15 minutes
  }
}
```

### File Uploads

```
POST /upload

Content-Type: multipart/form-data
```

---

## Performance & Security

### Query Complexity Limits

```graphql
# Complexity scoring prevents expensive queries
query ExpensiveQuery {
  # Base complexity: 1 per field
  devices {  # +1
    resources {  # +10 (list field multiplier)
      runtime {  # +100 (requires router poll!)
        bytesIn
      }
    }
  }
}

# Total complexity: 1 + 10 + 100 = 111
# Thresholds:
# - Warn: 750 points
# - Max sync: 1000 points
# - Auto-async: >1000 (returns job ID, poll for results)
```

**Complexity Calculation:**

```go
func calculateQueryComplexity(query *ast.Query) int {
    complexity := 0
    
    complexity += fieldCount * 1
    complexity += listFieldCount * 10
    complexity += relationshipDepth * 50
    complexity += requiresRouterPoll * 100
    complexity += databaseJoinCount * 20
    
    return complexity
}
```

### Depth Limits

```graphql
# Maximum 5 levels of nesting

query TooDeep {  # REJECTED
  device {  # 1
    resources {  # 2
      relationships {  # 3
        dependents {  # 4
          relationships {  # 5
            dependents {  # 6 - REJECTED!
              ...
            }
          }
        }
      }
    }
  }
}
```

### Rate Limiting

```
Per-user rate limits:
- Queries: 100 requests/minute
- Mutations: 30 requests/minute
- Subscriptions: 10 concurrent connections

Per-IP rate limits (unauthenticated):
- All operations: 20 requests/minute
```

---

## Related Documents

- [Backend Architecture](./backend-architecture.md) - GraphQL resolvers and service layer
- [Data Architecture](./data-architecture.md) - Universal State v2 and database design
- [Security Architecture](./security-architecture.md) - Authentication and authorization
- [ADR-011: Unified GraphQL Architecture](./adrs/011-unified-graphql-architecture.md) - Architecture decision

---
