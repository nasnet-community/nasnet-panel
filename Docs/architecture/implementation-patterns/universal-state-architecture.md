# Universal State Architecture

## 8-Layer Resource Model

Every resource in the system follows this layered model:

```typescript
interface Resource<T> {
  // Layer 1: Configuration
  config: T;

  // Layer 2: Validation
  validation: {
    status: 'valid' | 'invalid' | 'pending';
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };

  // Layer 3: Deployment
  deployment: {
    status: 'deployed' | 'pending' | 'failed' | 'draft';
    lastDeployed: Date | null;
    deploymentId: string | null;
  };

  // Layer 4: Runtime
  runtime: {
    status: 'active' | 'disabled' | 'error';
    metrics: RuntimeMetrics;
    health: HealthStatus;
  };

  // Layer 5: Telemetry
  telemetry: {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    lastUpdated: Date;
  };

  // Layer 6: Metadata
  metadata: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags: string[];
    annotations: Record<string, string>;
  };

  // Layer 7: Relationships
  relationships: {
    parent: ResourceRef | null;
    children: ResourceRef[];
    dependencies: ResourceRef[];
    dependents: ResourceRef[];
  };

  // Layer 8: Platform
  platform: {
    type: PlatformType;
    nativeId: string;
    capabilities: string[];
    limitations: string[];
  };
}
```

## Fleet-Based Resource Graph

```typescript
// Two-level hierarchy
interface FleetState {
  id: string;
  name: string;
  devices: Map<DeviceId, DeviceState>;

  // Fleet-wide resources
  templates: Map<TemplateId, ConfigTemplate>;
  policies: Map<PolicyId, Policy>;

  // Aggregated metrics
  health: FleetHealth;
  compliance: ComplianceStatus;
}

interface DeviceState {
  id: DeviceId;
  platform: PlatformType;
  connection: ConnectionState;

  // Device resources following 8-layer model
  resources: Map<ResourceType, Map<ResourceId, Resource<any>>>;

  // Device-specific
  capabilities: Capabilities;
  lastSync: Date;
  driftStatus: DriftStatus;
}
```

## Zod as Single Source of Truth

```typescript
// Schema definition
const InterfaceSchema = z.object({
  name: z.string().min(1).max(15),
  type: z.enum(['ethernet', 'vlan', 'bridge', 'wireless']),
  enabled: z.boolean().default(true),
  mtu: z.number().min(68).max(65535).default(1500),
  addresses: z.array(z.object({
    address: z.string().ip(),
    prefix: z.number().min(0).max(128),
  })),
});

// Type inference
type Interface = z.infer<typeof InterfaceSchema>;

// Go struct generation (build time)
// Generates: internal/domain/interface.go
// struct Interface {
//   Name      string     `json:"name" validate:"min=1,max=15"`
//   Type      string     `json:"type" validate:"oneof=ethernet vlan bridge wireless"`
//   Enabled   bool       `json:"enabled"`
//   MTU       int        `json:"mtu" validate:"min=68,max=65535"`
//   Addresses []Address  `json:"addresses"`
// }
```

## Event Sourcing Pattern

```typescript
interface StateEvent {
  id: EventId;
  timestamp: Date;
  type: EventType;
  aggregateId: string;
  aggregateType: AggregateType;

  // Event data
  payload: unknown;

  // Audit
  actor: ActorInfo;
  correlationId: string;
  causationId: string | null;

  // Metadata
  version: number;
  metadata: Record<string, unknown>;
}

// Event types
type EventType =
  | 'ResourceCreated'
  | 'ResourceUpdated'
  | 'ResourceDeleted'
  | 'ConfigDeployed'
  | 'ConfigRolledBack'
  | 'DriftDetected'
  | 'DriftResolved'
  | 'ValidationFailed'
  | 'HealthChanged';

// Event store operations
interface EventStore {
  append(events: StateEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<StateEvent[]>;
  getEventsByType(type: EventType, since?: Date): Promise<StateEvent[]>;
  subscribe(pattern: EventPattern, handler: EventHandler): Subscription;
}
```

## Lifecycle State Machine

```typescript
type ResourceLifecycle =
  | 'draft'           // Initial creation, not validated
  | 'validating'      // Validation in progress
  | 'invalid'         // Validation failed
  | 'pending'         // Validated, awaiting deployment
  | 'deploying'       // Deployment in progress
  | 'deployed'        // Successfully deployed
  | 'deploy_failed'   // Deployment failed
  | 'active'          // Deployed and healthy
  | 'degraded'        // Deployed but with issues
  | 'disabled'        // Explicitly disabled
  | 'deleting'        // Deletion in progress
  | 'deleted';        // Soft deleted (retained for history)

// Valid transitions
const LifecycleTransitions: Record<ResourceLifecycle, ResourceLifecycle[]> = {
  'draft':        ['validating', 'deleted'],
  'validating':   ['pending', 'invalid'],
  'invalid':      ['validating', 'deleted'],
  'pending':      ['deploying', 'draft', 'deleted'],
  'deploying':    ['deployed', 'deploy_failed'],
  'deployed':     ['active', 'degraded', 'disabled'],
  'deploy_failed': ['pending', 'draft', 'deleted'],
  'active':       ['degraded', 'disabled', 'deleting'],
  'degraded':     ['active', 'disabled', 'deleting'],
  'disabled':     ['active', 'deleting'],
  'deleting':     ['deleted'],
  'deleted':      [],
};
```

## Dual Relationship Tracking

```typescript
// Approach: Embedded + Separate Table

// 1. Embedded in resource (fast read)
interface ResourceRelationships {
  parent: ResourceRef | null;
  children: ResourceRef[];
  dependencies: ResourceRef[];  // What I depend on
  dependents: ResourceRef[];    // What depends on me
}

// 2. Separate relationship table (complex queries)
interface Relationship {
  id: string;
  sourceType: ResourceType;
  sourceId: ResourceId;
  targetType: ResourceType;
  targetId: ResourceId;
  relationshipType: RelationType;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

type RelationType =
  | 'parent_child'
  | 'depends_on'
  | 'references'
  | 'member_of'
  | 'routes_to';
```

---
