# Universal State v2: The 8-Layer Resource Model

**Reference:** ADR-012 - Universal State v2 | `libs/core/types/src/resource/`

## Table of Contents

- [Problem Statement](#problem-statement)
- [The 8-Layer Model](#the-8-layer-model)
- [Resource Lifecycle](#resource-lifecycle)
- [Composite Resources](#composite-resources)
- [Type Guards and Runtime Checking](#type-guards-and-runtime-checking)
- [Form Integration](#form-integration)
- [Change Set Ordering](#change-set-ordering)
- [Practical Examples](#practical-examples)

---

## Problem Statement

Managing router configuration is complex because multiple systems need to track different aspects of the same resource:

- **Backend** has the authoritative source (what's on the router)
- **Caches** need to optimize queries (TanStack Query)
- **Forms** need draft state (React Hook Form)
- **Optimistic UI** needs instant feedback before confirmation
- **Validation** happens across multiple stages
- **Runtime** state changes independently (health, metrics)
- **Telemetry** tracks historical data
- **Metadata** tracks who changed what

Without a unified model, these concerns scatter across the codebase, causing:
- Stale data conflicts
- Lost user edits
- Cache invalidation bugs
- Form validation mismatches
- Impossible dependency tracking

**Universal State v2** solves this by defining 8 orthogonal layers that never conflict.

---

## The 8-Layer Model

Each resource passes through 8 distinct layers, each with a specific responsibility:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: SOURCE (Backend / Router State)                    │
│ ├─ The authoritative data from the router                   │
│ ├─ Updated by: apply-confirm operations                    │
│ └─ Accessed by: cache, optimistic UI baseline               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: VALIDATION RESULT (Pipeline Output)                │
│ ├─ 7-stage validation pipeline output                       │
│ ├─ Schema, semantic, dependency, conflict, platform, quota, │
│ │  dry-run validation results                               │
│ └─ Updated by: validation service                           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: DEPLOYMENT STATE (Router-Confirmed)                │
│ ├─ What's actually on the router after apply               │
│ ├─ Router-generated fields, version info                   │
│ ├─ Drift detection (config vs deployment mismatch)         │
│ └─ Updated by: apply-confirm mutation                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: RUNTIME STATE (Live Operational)                   │
│ ├─ Real-time health, metrics, uptime                        │
│ ├─ Continuously updated via polling/streams                │
│ └─ Read-only, system-managed                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: TELEMETRY (Historical Data)                        │
│ ├─ Bandwidth history, uptime trends                         │
│ ├─ Hourly/daily aggregates                                  │
│ └─ Automatically collected, retention-managed               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: METADATA (Lifecycle & Audit)                       │
│ ├─ Created/updated timestamps, lifecycle state              │
│ ├─ Version number (optimistic locking)                      │
│ ├─ Tags, description, audit trail                           │
│ └─ Partially user-editable (description, tags, notes)       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 7: RELATIONSHIPS (Dependencies & Links)               │
│ ├─ Direct dependencies (requires these resources)           │
│ ├─ Dependents (resources depending on this)                 │
│ ├─ Routing paths, hierarchy, custom relationships           │
│ └─ Computed and stored for quick lookups                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 8: PLATFORM INFO (Router Capabilities)                │
│ ├─ Platform type (MikroTik, OpenWRT, VyOS)                  │
│ ├─ Capability level (none/basic/advanced/full)              │
│ ├─ Field mappings, limitations, optional features           │
│ └─ Determines which operations are supported                │
└─────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

#### Layer 1: Source (Backend / Router State)

The authoritative data from the router. This is the "source of truth" that everything else syncs against.

```typescript
import type { Resource } from '@nasnet/core/types';

// Example: WireGuard Server resource
const wgServer: Resource = {
  uuid: 'wg-srv-001',
  id: 'wireguard-server',
  type: 'services.wireguard.server',
  category: 'SERVICE',
  // Layer 1: Source data
  configuration: {
    enabled: true,
    port: 51820,
    privateKey: '...',
    ipAddress: '10.0.0.1/24',
  },
  // Layers 2-8 attached...
};
```

**When it updates:**
- After a successful apply-confirm operation
- When re-fetching from the backend
- Via cache updates (TanStack Query mutations)

**Accessed by:**
- Optimistic UI to establish baseline
- Forms to pre-fill with current values
- Validation to detect conflicts

---

#### Layer 2: Validation Result

Output from the 7-stage validation pipeline (schema, semantic, dependency, conflict, platform, quota, dry-run).

```typescript
import type { ValidationResult, ValidationStage } from '@nasnet/core/types';

const validationResult: ValidationResult = {
  // Can apply if no blocking errors
  canApply: true,

  // Current stage in pipeline
  stage: 'SIMULATION' as ValidationStage,

  // Blocking errors (must fix before apply)
  errors: [
    {
      code: 'PORT_CONFLICT',
      message: 'Port 51820 already used by OpenVPN',
      field: 'port',
      severity: 'ERROR',
      suggestedFix: 'Use port 51821 or higher',
    },
  ],

  // Non-blocking warnings (informational)
  warnings: [
    {
      code: 'HIGH_SECURITY_RISK',
      message: 'Consider enabling perfect forward secrecy',
      severity: 'WARNING',
    },
  ],

  // Conflicts with other resources
  conflicts: [
    {
      type: 'PORT',
      conflictingResourceUuid: 'openvpn-001',
      description: 'OpenVPN server also uses port 51820',
      resolution: 'Change one of the ports',
    },
  ],

  // Status of required dependencies
  requiredDependencies: [
    {
      resourceUuid: 'lan-network-001',
      resourceType: 'network.bridge',
      isActive: true,
      state: 'ACTIVE',
      reason: 'WireGuard needs a LAN to tunnel through',
    },
  ],

  validatedAt: '2024-02-27T10:15:00Z',
  validationDurationMs: 1250,
};
```

**Pipeline stages:**

1. **SCHEMA** - Zod/GraphQL type validation
2. **SEMANTIC** - Business rule validation
3. **DEPENDENCY** - Required resources exist
4. **CONFLICT** - Port/IP/route conflicts
5. **PLATFORM** - Router capability checks
6. **QUOTA** - Resource limit checks
7. **SIMULATION** - Pre-flight dry-run

**Severity levels:**
- `ERROR` - Blocks apply (must fix)
- `WARNING` - Non-blocking (informational)
- `INFO` - Help text

---

#### Layer 3: Deployment State

What's actually on the router after apply. Includes router-generated fields and drift information.

```typescript
import type { DeploymentState, DriftInfo } from '@nasnet/core/types';

const deployment: DeploymentState = {
  // Router-assigned ID (may differ from config)
  routerResourceId: '.id=*5C',

  // When applied
  appliedAt: '2024-02-27T09:50:00Z',
  appliedBy: 'admin@example.com',

  // For optimistic locking (conflict detection)
  routerVersion: 42,

  // Router-generated vendor fields
  generatedFields: {
    hwAddress: '02:11:22:33:44:55',
    uptime: '4d 8h 15m',
  },

  // Matches configuration?
  isInSync: true,

  // Drift detected?
  drift: {
    detectedAt: '2024-02-27T10:00:00Z',
    driftedFields: [
      {
        path: 'configuration.enabled',
        expected: true,
        actual: false,  // User disabled on router
      },
    ],
    suggestedAction: 'REAPPLY', // or ACCEPT or REVIEW
  },

  // For audit/undo trail
  applyOperationId: 'op-2024-02-27-001',
};
```

**Drift scenarios:**
- User manually changes on router → `actual` differs from `expected`
- Suggest: `REAPPLY` (push config), `ACCEPT` (accept router), or `REVIEW` (manual)

---

#### Layer 4: Runtime State

Live operational data, updated continuously via polling/WebSocket.

```typescript
import type { RuntimeState, RuntimeHealth } from '@nasnet/core/types';

const runtime: RuntimeState = {
  // Is the resource running right now?
  isRunning: true,

  // Health status
  health: 'HEALTHY' as RuntimeHealth,

  // Error if unhealthy
  errorMessage: null,

  // Metrics collected from router
  metrics: {
    bytesIn: 1024000,
    bytesOut: 512000,
    packetsIn: 10000,
    packetsOut: 5000,
    errors: 0,
    drops: 0,
    throughputIn: 12500,  // bytes/sec
    throughputOut: 6250,
  },

  lastUpdated: '2024-02-27T10:14:59Z',
  lastSuccessfulOperation: '2024-02-27T09:50:00Z',

  // WireGuard specific
  activeConnections: 3,  // connected peers
  uptime: 'PT4H15M',  // ISO 8601 duration
};
```

**Updated by:** Polling service, WebSocket stream, health checker

**Never manually modified:** System-managed, read-only in forms

---

#### Layer 5: Telemetry

Historical time-series data and aggregated statistics.

```typescript
import type { TelemetryData, BandwidthDataPoint } from '@nasnet/core/types';

const telemetry: TelemetryData = {
  // Raw bandwidth history (last 24h)
  bandwidthHistory: [
    {
      timestamp: '2024-02-27T09:00:00Z',
      bytesIn: 1000000,
      bytesOut: 500000,
      periodSeconds: 300,
    },
    // ... more points
  ],

  // Raw uptime history (last 24h)
  uptimeHistory: [
    {
      timestamp: '2024-02-27T09:00:00Z',
      isUp: true,
      periodSeconds: 300,
    },
    // ... more points
  ],

  // Hourly aggregates
  hourlyStats: [
    {
      hour: '2024-02-27T09:00:00Z',
      totalBytesIn: 1000000,
      totalBytesOut: 500000,
      uptimePercent: 100,
      errorCount: 0,
    },
  ],

  // Daily aggregates
  dailyStats: [
    {
      date: '2024-02-27',
      totalBytesIn: 24000000,
      totalBytesOut: 12000000,
      uptimePercent: 99.8,
      errorCount: 2,
      peakThroughputIn: 50000,
      peakThroughputOut: 25000,
    },
  ],

  dataStartedAt: '2024-01-30T10:15:00Z',
  lastUpdatedAt: '2024-02-27T10:14:59Z',
  retentionDays: 30,
};
```

**Automatically collected** by telemetry pipeline

**Retention:** Configurable (default 30 days)

---

#### Layer 6: Metadata

Lifecycle information, audit trail, and user-customizable fields.

```typescript
import type { ResourceMetadata, ChangeLogEntry } from '@nasnet/core/types';

const metadata: ResourceMetadata = {
  // Creation timestamp
  createdAt: '2024-02-20T08:30:00Z',
  createdBy: 'setup-wizard',

  // Last update
  updatedAt: '2024-02-27T09:50:00Z',
  updatedBy: 'admin@example.com',

  // Lifecycle state
  state: 'ACTIVE',

  // Version for optimistic locking
  version: 5,

  // User-defined organization
  tags: ['production', 'vpn-gateway', 'critical'],
  description: 'Primary WireGuard server for remote access',
  isFavorite: true,
  isPinned: true,
  notes: 'Backup to wg-srv-002 if this fails',

  // Audit trail (last 10 changes)
  recentChanges: [
    {
      timestamp: '2024-02-27T09:50:00Z',
      user: 'admin@example.com',
      changeType: 'UPDATE',
      changedFields: ['configuration.enabled', 'configuration.port'],
      summary: 'Enabled server and changed port',
    },
    {
      timestamp: '2024-02-20T08:30:00Z',
      user: 'setup-wizard',
      changeType: 'CREATE',
      changedFields: ['configuration'],
      summary: 'Created via wizard',
    },
  ],
};
```

**User-editable fields:** `tags`, `description`, `notes`, `isFavorite`, `isPinned`

**System-managed:** `createdAt`, `updatedAt`, `state`, `version`, `recentChanges`

---

#### Layer 7: Relationships

Dependencies and connections with other resources.

```typescript
import type { ResourceRelationships } from '@nasnet/core/types';

const relationships: ResourceRelationships = {
  // This resource depends on these
  dependsOn: [
    {
      uuid: 'lan-network-001',
      id: 'lan',
      type: 'network.bridge',
      category: 'NETWORK',
      state: 'ACTIVE',
    },
  ],

  // These resources depend on this
  dependents: [
    {
      uuid: 'firewall-rule-001',
      id: 'wg-allow-in',
      type: 'firewall.filter',
      category: 'FIREWALL',
      state: 'ACTIVE',
    },
  ],

  // Routes via this interface
  routesVia: {
    uuid: 'wan-interface-001',
    id: 'wan',
    type: 'network.interface',
    category: 'NETWORK',
    state: 'ACTIVE',
  },

  // Routed via this resource
  routedBy: [
    {
      uuid: 'split-tunnel-rule-001',
      id: 'split-rule',
      type: 'routing.policy',
      category: 'ROUTING',
      state: 'ACTIVE',
    },
  ],

  // Parent in hierarchy
  parent: null,

  // Child resources
  children: [
    {
      uuid: 'wg-peer-001',
      id: 'client-alice',
      type: 'services.wireguard.peer',
      category: 'SERVICE',
      state: 'ACTIVE',
    },
    {
      uuid: 'wg-peer-002',
      id: 'client-bob',
      type: 'services.wireguard.peer',
      category: 'SERVICE',
      state: 'ACTIVE',
    },
  ],
};
```

**Used for:**
- Dependency graph construction
- Impact analysis (deleting parent deletes children?)
- Change set ordering
- Cascading operations

---

#### Layer 8: Platform Info

Router platform capabilities and constraints.

```typescript
import type { PlatformInfo, RouterPlatform } from '@nasnet/core/types';

const platform: PlatformInfo = {
  // Current platform
  current: 'MIKROTIK' as RouterPlatform,

  // Capability level for this resource type
  capabilities: {
    isSupported: true,
    level: 'FULL',
    minVersion: '6.48.0',
    requiredPackages: ['routeros-system', 'routeros-routing'],
    details: {
      maxPeers: 1000,
      maxTunnels: 100,
    },
  },

  // Field mappings: GraphQL schema → platform-native
  fieldMappings: {
    'configuration.enabled': '/ip/service/wireguard/.../enabled',
    'configuration.port': '/ip/service/wireguard/.../listen-port',
    'configuration.privateKey': '/ip/service/wireguard/.../private-key',
  },

  // Platform-specific limitations
  limitations: [
    {
      code: 'MTK_WG_PEERS_LIMIT',
      description: 'MikroTik limits WireGuard to 1000 peers',
      affectedFields: ['configuration.peers'],
      workaround: 'Use multiple servers to distribute load',
    },
  ],

  // Optional features
  features: [
    {
      id: 'ipv6-support',
      name: 'IPv6 Support',
      enabled: true,
      description: 'Support for IPv6 addresses in WireGuard',
    },
  ],
};
```

**Accessed by:**
- Validation (check capabilities before apply)
- Forms (hide unsupported fields)
- Dashboard (show capability warnings)

---

## Resource Lifecycle

Resources progress through lifecycle states as they are created, validated, deployed, and managed.

```typescript
import type { ResourceLifecycleState } from '@nasnet/core/types';

type LifecycleState =
  | 'DRAFT'        // User is editing, not yet validated
  | 'VALID'        // Validation passed, ready to apply
  | 'APPLYING'     // Apply operation in progress
  | 'ACTIVE'       // Successfully deployed on router
  | 'UPDATING'     // Update operation in progress
  | 'DELETING'     // Delete operation in progress
  | 'DELETED'      // Soft-deleted (for audit trail)
  | 'ERROR'        // Failed to apply, waiting for retry
  | 'DEPRECATED';  // Superseded by newer version
```

**State diagram:**

```
     ┌─────────────┐
     │   DRAFT     │ ← User is editing
     └──────┬──────┘
            │ validate()
     ┌──────▼──────┐
     │   VALID     │ ← Ready to apply
     └──────┬──────┘
            │ apply()
     ┌──────▼──────┐
     │  APPLYING   │ ← In progress
     └──────┬──────┘
            │ ✓ success / ✗ error
     ┌──────▼──────┐      ┌───────┐
     │   ACTIVE    │ ───→ │ ERROR │ ← Needs retry
     └──────┬──────┘      └───┬───┘
            │ update()        │ retry()
     ┌──────▼──────┐          │
     │  UPDATING   │──────────┘
     └──────┬──────┘
            │ ✓
     ┌──────▼──────┐
     │   ACTIVE    │
     └──────┬──────┘
            │ delete()
     ┌──────▼──────┐
     │  DELETING   │ ← In progress
     └──────┬──────┘
            │ ✓
     ┌──────▼──────┐
     │  DELETED    │ ← Soft-deleted
     └─────────────┘
```

---

## Composite Resources

Composite resources aggregate multiple sub-resources (e.g., WireGuard Server + Clients, LAN Network + DHCP + Leases).

```typescript
import type { CompositeResource, CompositeResourceStatus } from '@nasnet/core/types';

// Root resource + sub-resources
const composite: CompositeResource = {
  root: wgServer,  // WireGuard server
  children: [      // WireGuard clients
    wgClient1,
    wgClient2,
    wgClient3,
  ],
  relationships: [
    { from: 'wg-srv-001', to: 'wg-peer-001', type: 'PARENT_CHILD' },
    { from: 'wg-srv-001', to: 'wg-peer-002', type: 'PARENT_CHILD' },
    // ...
  ],
};

// Aggregated status
const status: CompositeResourceStatus = {
  totalCount: 3,
  activeCount: 3,
  errorCount: 0,
  degradedCount: 0,
  pendingCount: 0,
  overallHealth: 'HEALTHY',
  allRunning: true,
  hasDrift: false,
  isFullySynced: true,
};

// Check status
if (status.overallHealth === 'CRITICAL') {
  // Handle critical state
}
```

---

## Type Guards and Runtime Checking

Runtime type guards for checking resource states and capabilities.

```typescript
import type { Resource } from '@nasnet/core/types';
import {
  isResourceActive,
  isResourcePending,
  canResourceApply,
} from '@nasnet/core/types';

function handleResource(resource: Resource) {
  // Is the resource currently deployed and running?
  if (isResourceActive(resource)) {
    console.log('Resource is running on router');
  }

  // Is the resource waiting for something?
  if (isResourcePending(resource)) {
    console.log('Resource is pending:', resource.metadata?.state);
  }

  // Can this resource be applied right now?
  if (canResourceApply(resource)) {
    console.log('Resource validation passed');
  }

  // Check validation errors
  if (resource.validation?.errors?.length) {
    resource.validation.errors.forEach((err) => {
      console.error(`${err.code}: ${err.message}`);
    });
  }

  // Check conflicts
  if (resource.validation?.conflicts?.length) {
    resource.validation.conflicts.forEach((conflict) => {
      console.warn(`Conflict: ${conflict.description}`);
    });
  }
}
```

---

## Form Integration

Synchronizing forms with Universal State v2 using `useFormResourceSync`.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormResourceSync } from '@nasnet/core/forms';
import { z } from 'zod';

const schema = z.object({
  port: z.number().min(1).max(65535),
  enabled: z.boolean(),
});

function WireGuardServerForm({ server }: { server: Resource }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: server.configuration,
  });

  // Sync form with 8-layer state
  const { state, actions, canSave, changedFields } = useFormResourceSync({
    sourceData: server.configuration,
    resourceId: server.uuid,
    resourceVersion: server.metadata?.version?.toString(),
    onSave: async (data) => {
      // Apply changes
    },
  });

  // React to form changes
  useEffect(() => {
    if (state.hasSourceChanged) {
      // Source was updated while user was editing
      alert('Configuration changed elsewhere. Merge or discard?');
    }
  }, [state.hasSourceChanged]);

  return (
    <form onSubmit={form.handleSubmit(() => actions.startSave())}>
      {/* Form fields */}

      {/* Show changed fields */}
      {changedFields.length > 0 && (
        <p>Changed: {changedFields.join(', ')}</p>
      )}

      {/* Show validation errors */}
      {state.validation.errors.map((err) => (
        <Alert key={err.code}>{err.message}</Alert>
      ))}

      {/* Conflict resolution */}
      {state.error && (
        <ConflictDialog
          onMerge={() => actions.mergeSourceChanges(customMerger)}
          onDiscard={() => actions.discardChanges()}
        />
      )}

      <button type="submit" disabled={!canSave}>
        Save
      </button>
    </form>
  );
}
```

---

## Change Set Ordering

Change sets use dependency graphs to determine application order.

```typescript
import { topologicalSort, getParallelApplicableNodes } from '@nasnet/core/utils';

// Items with dependencies
const changeSet = [
  { id: 'bridge', dependencies: [] },       // No dependencies - apply first
  { id: 'dhcp', dependencies: ['bridge'] }, // Depends on bridge
  { id: 'firewall', dependencies: ['bridge'] }, // Also depends on bridge
];

// Compute apply order
const sorted = topologicalSort(changeSet);
if (sorted.success) {
  console.log('Apply order:', sorted.sortedIds);
  // ['bridge', 'dhcp', 'firewall'] or ['bridge', 'firewall', 'dhcp']
}

// Find nodes that can apply in parallel
const applied = new Set(['bridge']);
const parallel = getParallelApplicableNodes(changeSet, applied);
console.log('Can apply in parallel:', parallel);
// ['dhcp', 'firewall']
```

---

## Practical Examples

### Example 1: Create LAN Network with DHCP

```typescript
import { ChangeSet, ChangeSetItem, ChangeOperation } from '@nasnet/core/types';

const lanSetup: ChangeSet = {
  id: 'cs-lan-setup-001',
  name: 'Create LAN Network',
  routerId: 'router-01',
  status: 'DRAFT',

  items: [
    // Step 1: Create bridge (no dependencies)
    {
      id: 'bridge-1',
      resourceType: 'network.bridge',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        name: 'br-lan',
        mtu: 1500,
      },
      dependencies: [],
    },

    // Step 2: Add interfaces to bridge (depends on bridge)
    {
      id: 'bridge-port-eth1',
      resourceType: 'network.bridge-port',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        interface: 'ether1',
        bridge: 'br-lan',
      },
      dependencies: ['bridge-1'],
    },

    // Step 3: Create DHCP server (depends on bridge)
    {
      id: 'dhcp-1',
      resourceType: 'dhcp.server',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        interface: 'br-lan',
        addressPool: '192.168.1.100-200',
        gateway: '192.168.1.1',
        dns1: '8.8.8.8',
      },
      dependencies: ['bridge-1'],
    },

    // Step 4: Create firewall rule (depends on bridge existing)
    {
      id: 'firewall-1',
      resourceType: 'firewall.nat',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        chain: 'dstnat',
        'in-interface': 'br-lan',
        action: 'accept',
      },
      dependencies: ['bridge-1'],
    },
  ],

  // Apply order computed from dependencies:
  // 1. bridge-1 (no deps)
  // 2. bridge-port-eth1, dhcp-1, firewall-1 (all depend on bridge-1, can run parallel)
};
```

### Example 2: Update with Conflict Detection

```typescript
function updateWireGuardServer(server: Resource, updates: Partial<Resource>) {
  // Check if configuration drifted
  if (server.deployment?.drift) {
    const drift = server.deployment.drift;

    console.error('Configuration drift detected:');
    drift.driftedFields.forEach((field) => {
      console.error(
        `  ${field.path}: expected ${field.expected}, actual ${field.actual}`
      );
    });

    // Suggest resolution
    switch (drift.suggestedAction) {
      case 'REAPPLY':
        console.log('→ Re-apply configuration to router');
        break;
      case 'ACCEPT':
        console.log('→ Accept router version');
        break;
      case 'REVIEW':
        console.log('→ Manual review required');
        break;
    }
  }

  // Check dependencies
  server.relationships?.dependents?.forEach((dependent) => {
    console.log(
      `Warning: ${dependent.id} depends on this resource`
    );
  });

  // Perform update with full validation
  const updated: Resource = {
    ...server,
    configuration: { ...server.configuration, ...updates },
    metadata: {
      ...server.metadata,
      updatedAt: new Date().toISOString(),
      version: (server.metadata?.version || 0) + 1,
    },
  };

  return updated;
}
```

### Example 3: Optimistic Updates in React

```typescript
import { useApolloClient } from '@apollo/client';

function useOptimisticResourceUpdate() {
  const client = useApolloClient();

  async function updateResource(
    resourceId: string,
    updates: Partial<Resource>
  ) {
    // Read current state (Layer 1: Source)
    const current = client.cache.readQuery({
      query: GET_RESOURCE,
      variables: { id: resourceId },
    });

    // Create optimistic version (combine Layers 1 + 4)
    const optimistic: Resource = {
      ...current,
      configuration: { ...current.configuration, ...updates },
      metadata: {
        ...current.metadata,
        updatedAt: new Date().toISOString(),
      },
      // Clear old validation since we're updating
      validation: null,
    };

    // Update cache immediately (optimistic)
    client.cache.writeQuery({
      query: GET_RESOURCE,
      variables: { id: resourceId },
      data: optimistic,
    });

    try {
      // Actually apply to router
      const result = await client.mutate({
        mutation: UPDATE_RESOURCE,
        variables: { id: resourceId, input: updates },
      });

      // Update cache with confirmed state (Layer 3: Deployment)
      client.cache.writeQuery({
        query: GET_RESOURCE,
        variables: { id: resourceId },
        data: result.data.updateResource,
      });
    } catch (error) {
      // Rollback on error
      client.cache.writeQuery({
        query: GET_RESOURCE,
        variables: { id: resourceId },
        data: current,
      });
      throw error;
    }
  }

  return { updateResource };
}
```

---

## See Also

- **types.md** - Complete type reference for all resource interfaces
- **validation-pipeline.md** - 7-stage validation pipeline details
- **change-set-operations.md** - Atomic multi-resource operations
- **forms.md** - React Hook Form integration patterns

