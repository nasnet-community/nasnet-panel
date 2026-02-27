# Core Types Reference

Complete documentation of all types exported from `@nasnet/core/types`. This library provides the complete type system for NasNetConnect, including the Universal State v2 model, resource management, and domain-specific types.

**Location:** `libs/core/types/src/`

**Import Path:** `@nasnet/core/types`

---

## Table of Contents

1. [Resource Types (Universal State v2)](#resource-types-universal-state-v2)
2. [Layer Types (8-Layer Model)](#layer-types-8-layer-model)
3. [Lifecycle Types](#lifecycle-types)
4. [Composite Resources](#composite-resources)
5. [Change Set Types](#change-set-types)
6. [API Types](#api-types)
7. [Configuration Types](#configuration-types)
8. [Router Types](#router-types)
9. [Firewall Types](#firewall-types)
10. [Services Types](#services-types)
11. [Type Guards](#type-guards)

---

## Resource Types (Universal State v2)

### Core Resource Interface

The `Resource<TConfig>` interface is the foundation of the Universal State v2 model. Every managed resource in NasNetConnect implements this interface with 8 independent layers.

```typescript
interface Resource<TConfig = unknown> {
  // Identity
  uuid: string;                    // Globally unique ULID identifier
  id: string;                      // Scoped readable ID (e.g., 'vpn.wg.client:usa-vpn')
  type: string;                    // Resource type (e.g., 'vpn.wireguard.client')
  category: ResourceCategory;      // One of 6 categories

  // 8-Layer Model
  configuration: TConfig;          // Layer 1: User's desired config (mutable)
  validation?: ValidationResult;   // Layer 2: Pre-flight check results
  deployment?: DeploymentState;    // Layer 3: What's on router (after Apply-Confirm)
  runtime?: RuntimeState;          // Layer 4: Live operational state (polled/streamed)
  telemetry?: TelemetryData;       // Layer 5: Time-series metrics (historical)
  metadata: ResourceMetadata;      // Layer 6: Lifecycle info, tags, ownership
  relationships?: ResourceRelationships;  // Layer 7: Dependencies
  platform?: PlatformInfo;         // Layer 8: Capabilities and field mappings
}
```

### Resource Categories

```typescript
type ResourceCategory =
  | 'NETWORK'        // WAN links, LAN networks, VLANs, bridges, routing
  | 'VPN'            // WireGuard, OpenVPN, IPsec
  | 'INFRASTRUCTURE' // Certificates, NTP, DDNS
  | 'APPLICATION'    // Port forwarding, game rules
  | 'FEATURE'        // Marketplace features (Tor, AdGuard, sing-box)
  | 'PLUGIN';        // Community extensions
```

### Resource Layers

```typescript
type ResourceLayer =
  | 'CONFIGURATION'  // User's desired config
  | 'VALIDATION'     // Pre-flight check results
  | 'DEPLOYMENT'     // What's on router
  | 'RUNTIME'        // Live operational state
  | 'TELEMETRY'      // Time-series metrics
  | 'METADATA'       // Lifecycle info
  | 'RELATIONSHIPS'  // Dependencies
  | 'PLATFORM';      // Capabilities
```

### Resource List and Card Views

```typescript
interface ResourceListItem {
  uuid: string;
  id: string;
  type: string;
  category: ResourceCategory;
  readonly metadata: Pick<
    ResourceMetadata,
    'state' | 'tags' | 'updatedAt' | 'isFavorite'
  >;
  readonly runtime?: Pick<
    RuntimeState,
    'isRunning' | 'health' | 'lastUpdated'
  > | null;
}

interface ResourceCardData {
  uuid: string;
  id: string;
  type: string;
  category: ResourceCategory;
  configuration: unknown;
  readonly metadata: Pick<
    ResourceMetadata,
    'state' | 'version' | 'tags' | 'description' | 'isFavorite' | 'isPinned'
  >;
  readonly runtime?: Pick<
    RuntimeState,
    'isRunning' | 'health' | 'errorMessage' | 'activeConnections' | 'uptime'
  > | null;
}
```

### Resource References and Relationships

```typescript
interface ResourceReference {
  readonly uuid: string;
  readonly id: string;
  readonly type: string;
  readonly category: ResourceCategory;
  readonly state: ResourceLifecycleState;
}

type ResourceRelationshipType =
  | 'DEPENDS_ON'     // Child depends on parent
  | 'ROUTES_VIA'     // Traffic routes via this resource
  | 'PARENT_CHILD'   // Parent-child hierarchy
  | 'GROUP'          // Resources in the same group
  | 'CUSTOM';        // Custom relationship

interface ResourceRelationshipEdge {
  readonly from: string;        // Source resource UUID
  readonly to: string;          // Target resource UUID
  readonly type: ResourceRelationshipType;
}

interface ResourceRelationships {
  readonly dependsOn: readonly ResourceReference[];      // This depends on...
  readonly dependents: readonly ResourceReference[];     // These depend on this
  readonly routesVia?: ResourceReference | null;        // Routes traffic via...
  readonly routedBy: readonly ResourceReference[];       // Traffic routed by...
  readonly parent?: ResourceReference | null;           // Parent resource
  readonly children: readonly ResourceReference[];       // Child resources
  readonly custom?: unknown;                            // Domain-specific
}
```

---

## Layer Types (8-Layer Model)

### Layer 2: Validation Result

```typescript
type ValidationStage =
  | 'SCHEMA'        // Schema validation (Zod/GraphQL)
  | 'SEMANTIC'      // Semantic validation (business rules)
  | 'DEPENDENCY'    // Dependency validation (required resources exist)
  | 'CONFLICT'      // Conflict detection (port/IP/route conflicts)
  | 'PLATFORM'      // Platform validation (capability checks)
  | 'QUOTA'         // Quota validation (resource limits)
  | 'SIMULATION'    // Pre-flight simulation
  | 'COMPLETE';     // All stages complete

type ValidationSeverity =
  | 'ERROR'         // Blocks apply, must be fixed
  | 'WARNING'       // Non-blocking, informational
  | 'INFO';         // Informational notice

interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly field?: string | null;          // e.g., "config.ipAddress"
  readonly severity: ValidationSeverity;
  readonly suggestedFix?: string | null;
  readonly docsUrl?: string | null;
}

type ConflictType =
  | 'PORT'          // Port number conflict
  | 'IP_ADDRESS'    // IP address conflict
  | 'ROUTE'         // Route overlap
  | 'INTERFACE'     // Interface conflict
  | 'NAME'          // Name collision
  | 'CONFIGURATION'; // Configuration incompatibility

interface ResourceConflict {
  readonly type: ConflictType;
  readonly conflictingResourceUuid: string;
  readonly description: string;
  readonly resolution?: string | null;
}

interface DependencyStatus {
  readonly resourceUuid: string;
  readonly resourceType: string;
  readonly isActive: boolean;
  readonly state: ResourceLifecycleState;
  readonly reason: string;
}

interface ValidationResult {
  readonly canApply: boolean;
  readonly stage: ValidationStage;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
  readonly conflicts: readonly ResourceConflict[];
  readonly requiredDependencies: readonly DependencyStatus[];
  readonly validatedAt: string;       // ISO 8601 timestamp
  readonly validationDurationMs: number;
}
```

### Layer 3: Deployment State

```typescript
type DriftAction =
  | 'REAPPLY'       // Re-apply configuration to router
  | 'ACCEPT'        // Update configuration to match router
  | 'REVIEW';       // Manual review required

interface DriftField {
  readonly path: string;             // Dot-notation, e.g., "config.ipAddress"
  readonly expected: unknown;
  readonly actual: unknown;
}

interface DriftInfo {
  readonly detectedAt: string;       // ISO 8601 timestamp
  readonly driftedFields: readonly DriftField[];
  readonly suggestedAction: DriftAction;
}

interface DeploymentState {
  readonly routerResourceId?: string | null;
  readonly appliedAt: string;        // ISO 8601 timestamp
  readonly appliedBy?: string | null;
  readonly routerVersion?: number | null;    // For optimistic locking
  readonly generatedFields?: unknown;
  readonly isInSync: boolean;
  readonly drift?: DriftInfo | null;
  readonly applyOperationId?: string | null;
}
```

### Layer 4: Runtime State

```typescript
type RuntimeHealth =
  | 'HEALTHY'       // Operating normally
  | 'WARNING'       // Running with warnings
  | 'DEGRADED'      // Running but degraded
  | 'CRITICAL'      // Critical state
  | 'FAILED'        // Failed
  | 'UNKNOWN';      // Unknown status

interface RuntimeMetrics {
  readonly bytesIn?: number | null;
  readonly bytesOut?: number | null;
  readonly packetsIn?: number | null;
  readonly packetsOut?: number | null;
  readonly errors?: number | null;
  readonly drops?: number | null;
  readonly throughputIn?: number | null;   // Bytes/sec
  readonly throughputOut?: number | null;  // Bytes/sec
  readonly custom?: unknown;               // Vendor-specific
}

interface RuntimeState {
  readonly isRunning: boolean;
  readonly health: RuntimeHealth;
  readonly errorMessage?: string | null;
  readonly metrics?: RuntimeMetrics | null;
  readonly lastUpdated: string;          // ISO 8601 timestamp
  readonly lastSuccessfulOperation?: string | null;
  readonly activeConnections?: number | null;
  readonly uptime?: string | null;       // ISO 8601 duration
}
```

### Layer 5: Telemetry Data

```typescript
interface BandwidthDataPoint {
  readonly timestamp: string;    // ISO 8601
  readonly bytesIn: number;
  readonly bytesOut: number;
  readonly periodSeconds: number;
}

interface UptimeDataPoint {
  readonly timestamp: string;    // ISO 8601
  readonly isUp: boolean;
  readonly periodSeconds: number;
}

interface HourlyStats {
  readonly hour: string;         // ISO 8601
  readonly totalBytesIn: number;
  readonly totalBytesOut: number;
  readonly uptimePercent: number;   // 0-100
  readonly errorCount: number;
}

interface DailyStats {
  readonly date: string;         // UTC, ISO 8601
  readonly totalBytesIn: number;
  readonly totalBytesOut: number;
  readonly uptimePercent: number;   // 0-100
  readonly errorCount: number;
  readonly peakThroughputIn: number;    // Bytes/sec
  readonly peakThroughputOut: number;   // Bytes/sec
}

interface TelemetryData {
  readonly bandwidthHistory?: readonly BandwidthDataPoint[] | null;
  readonly uptimeHistory?: readonly UptimeDataPoint[] | null;
  readonly hourlyStats?: readonly HourlyStats[] | null;
  readonly dailyStats?: readonly DailyStats[] | null;
  readonly dataStartedAt?: string | null;
  readonly lastUpdatedAt?: string | null;
  readonly retentionDays: number;
}
```

### Layer 6: Resource Metadata

```typescript
type ChangeType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE';

interface ChangeLogEntry {
  readonly timestamp: string;
  readonly user: string;
  readonly changeType: ChangeType;
  readonly changedFields: readonly string[];
  readonly summary?: string | null;
}

interface ResourceMetadata {
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy?: string | null;
  readonly state: ResourceLifecycleState;
  readonly version: number;           // For optimistic concurrency control
  readonly tags: readonly string[];
  readonly description?: string | null;
  readonly isFavorite: boolean;
  readonly isPinned: boolean;
  readonly notes?: string | null;
  readonly recentChanges?: readonly ChangeLogEntry[] | null;
}
```

### Layer 8: Platform Info

```typescript
type RouterPlatform =
  | 'MIKROTIK'
  | 'OPENWRT'
  | 'VYOS'
  | 'GENERIC';

type CapabilityLevel =
  | 'NONE'        // Not supported
  | 'BASIC'       // Limited support
  | 'ADVANCED'    // Full RouterOS native support
  | 'FULL';       // Complete support with container features

interface PlatformCapabilities {
  readonly isSupported: boolean;
  readonly level: CapabilityLevel;
  readonly minVersion?: string | null;
  readonly requiredPackages?: readonly string[] | null;
  readonly details?: unknown;
}

interface PlatformLimitation {
  readonly code: string;
  readonly description: string;
  readonly affectedFields?: readonly string[] | null;
  readonly workaround?: string | null;
}

interface PlatformFeature {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly description?: string | null;
}

interface PlatformInfo {
  readonly current: RouterPlatform;
  readonly capabilities: PlatformCapabilities;
  readonly fieldMappings?: unknown;
  readonly limitations?: readonly PlatformLimitation[] | null;
  readonly features?: readonly PlatformFeature[] | null;
}
```

---

## Lifecycle Types

### Resource Lifecycle States

```typescript
type ResourceLifecycleState =
  | 'DRAFT'      // Initial creation, not yet validated
  | 'VALIDATING' // Backend validation in progress
  | 'VALID'      // Passed validation, ready to apply
  | 'APPLYING'   // Being applied to router
  | 'ACTIVE'     // Successfully applied and running
  | 'DEGRADED'   // Running but with issues
  | 'ERROR'      // Failed state (validation or apply)
  | 'DEPRECATED' // Marked for removal
  | 'ARCHIVED';  // Final state, no longer active
```

### Lifecycle Events and Transitions

```typescript
type ResourceLifecycleEvent =
  | 'VALIDATE'   // Start validation process
  | 'APPLY'      // Apply resource to router
  | 'CONFIRM'    // Confirm apply succeeded
  | 'DEGRADE'    // Resource has degraded
  | 'RECOVER'    // Recovered from degraded
  | 'RETRY'      // Retry failed operation
  | 'EDIT'       // Edit resource (go back to draft)
  | 'DEPRECATE'  // Deprecate resource
  | 'RESTORE'    // Restore deprecated resource
  | 'ARCHIVE';   // Archive resource permanently

// Valid transitions table
const LIFECYCLE_TRANSITIONS = {
  DRAFT: { VALIDATE: VALIDATING },
  VALIDATING: {},  // Transitions handled by validation result
  VALID: { APPLY: APPLYING, EDIT: DRAFT },
  APPLYING: {},    // Transitions handled by apply result
  ACTIVE: { DEGRADE: DEGRADED, DEPRECATE: DEPRECATED, EDIT: DRAFT },
  DEGRADED: { RECOVER: ACTIVE, DEPRECATE: DEPRECATED },
  ERROR: { RETRY: VALIDATING, EDIT: DRAFT },
  DEPRECATED: { ARCHIVE: ARCHIVED, RESTORE: ACTIVE },
  ARCHIVED: {},    // Final state - no transitions
};
```

### Lifecycle State Predicates

```typescript
// State categories
const ACTIVE_STATES = [ACTIVE, DEGRADED];           // Running on router
const EDITABLE_STATES = [DRAFT, VALID, ACTIVE, ERROR];
const PENDING_STATES = [VALIDATING, APPLYING];
const ERROR_STATES = [ERROR, DEGRADED];
const TERMINAL_STATES = [ARCHIVED];

// Helper functions
function isActiveOnRouter(state: ResourceLifecycleState): boolean;
function isEditable(state: ResourceLifecycleState): boolean;
function isPending(state: ResourceLifecycleState): boolean;
function hasErrors(state: ResourceLifecycleState): boolean;
function isTerminal(state: ResourceLifecycleState): boolean;
function isValidTransition(currentState, event): boolean;
function getNextState(currentState, event): ResourceLifecycleState | null;
function getValidEvents(state): ResourceLifecycleEvent[];
```

### Display Information

```typescript
interface StateDisplayInfo {
  readonly label: string;          // e.g., "Active"
  readonly description: string;    // e.g., "Running on router"
  readonly color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
  readonly icon: 'draft' | 'spinner' | 'check' | 'warning' | 'error' | 'archive';
  readonly showSpinner: boolean;
}

function getStateDisplayInfo(state: ResourceLifecycleState): StateDisplayInfo;
```

---

## Composite Resources

Composite resources aggregate a root resource with its sub-resources and relationship graph. Common patterns:
- WireGuard Server + Clients
- LAN Network + DHCP Server + Leases
- Bridge + Member Interfaces
- Feature + Sub-resources

```typescript
interface CompositeResource<TRoot extends Resource = Resource> {
  readonly root: TRoot;
  readonly children: readonly Resource[];
  readonly relationships: readonly ResourceRelationshipEdge[];
}

interface CompositeResourceStatus {
  readonly totalCount: number;
  readonly activeCount: number;
  readonly errorCount: number;
  readonly degradedCount: number;
  readonly pendingCount: number;
  readonly overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  readonly allRunning: boolean;
  readonly hasDrift: boolean;
  readonly isFullySynced: boolean;
}

interface CompositeResourceNode {
  readonly uuid: string;
  readonly id: string;
  readonly type: string;
  readonly state: ResourceLifecycleState;
  readonly isRunning: boolean;
  readonly health: RuntimeState['health'];
  readonly children: readonly CompositeResourceNode[];
  readonly depth: number;
}

interface DependencyOrder {
  readonly roots: readonly string[];        // Resources with no dependencies
  readonly ordered: readonly string[];       // Dependency sorted order
  readonly circular: readonly string[];      // Circular dependencies
}
```

### Composite Resource Utility Functions

```typescript
// Building and tree operations
function buildCompositeResource<TRoot extends Resource>(
  root: TRoot,
  subResources: Resource[]
): CompositeResource<TRoot>;

function resourceToReference(resource: Resource): ResourceReference;
function buildResourceTree(composite: CompositeResource, maxDepth?: number): CompositeResourceNode;
function flattenResourceTree(tree: CompositeResourceNode): CompositeResourceNode[];
function findNodeInTree(tree: CompositeResourceNode, uuid: string): CompositeResourceNode | undefined;

// Status aggregation
function aggregateCompositeStatus(subResources: Resource[]): CompositeResourceStatus;
function calculateHealthPercentage(status: CompositeResourceStatus): number;

// Dependency resolution
function resolveDependencyOrder(resources: Resource[]): DependencyOrder;
function canSafelyDelete(
  resource: Resource,
  allResources: Resource[]
): { readonly canDelete: boolean; readonly blockedBy: readonly ResourceReference[] };

// Filtering and grouping
function groupResourcesByType(resources: Resource[]): Map<string, Resource[]>;
function groupResourcesByCategory(resources: Resource[]): Map<ResourceCategory, Resource[]>;
function filterResourcesByState(resources: Resource[], states: ResourceLifecycleState[]): Resource[];
function filterResourcesByHealth(resources: Resource[], health: RuntimeHealth[]): Resource[];
function findDependents(resource: Resource, allResources: Resource[]): Resource[];
function findDependencies(resource: Resource, allResources: Resource[]): Resource[];

// Type guards
function hasSubResources(resource: Resource): boolean;
function isRootResource(resource: Resource): boolean;
function isLeafResource(resource: Resource): boolean;
```

---

## Change Set Types

Change sets enable atomic multi-resource operations. All items in a change set either succeed together or rollback together.

### Change Set Status and Operations

```typescript
type ChangeSetStatus =
  | 'DRAFT'           // Adding items, not yet validated
  | 'VALIDATING'      // Running validation on all items
  | 'READY'           // All items validated, ready to apply
  | 'APPLYING'        // Applying resources in dependency order
  | 'COMPLETED'       // All resources applied successfully
  | 'FAILED'          // Apply failed, may have partial application
  | 'ROLLING_BACK'    // Rolling back applied changes
  | 'ROLLED_BACK'     // Rollback completed successfully
  | 'PARTIAL_FAILURE' // Rollback partially failed
  | 'CANCELLED';      // User cancelled the operation

type ChangeOperation =
  | 'CREATE'          // Create a new resource
  | 'UPDATE'          // Update an existing resource
  | 'DELETE';         // Delete an existing resource

type ChangeSetItemStatus =
  | 'PENDING'
  | 'APPLYING'
  | 'APPLIED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'ROLLBACK_FAILED'
  | 'SKIPPED';        // Skipped due to dependency failure

type RollbackOperation =
  | 'DELETE'          // Delete a created resource
  | 'RESTORE'         // Restore a deleted resource
  | 'REVERT';         // Revert an updated resource
```

### Change Set Items and Validation

```typescript
interface ChangeSetItem<TConfig = Record<string, unknown>> {
  readonly id: string;
  readonly resourceType: string;
  readonly resourceCategory: ResourceCategory;
  readonly resourceUuid: string | null;    // null for create operations
  readonly name: string;
  readonly description?: string;
  readonly operation: ChangeOperation;
  readonly configuration: TConfig;
  readonly previousState: TConfig | null;  // For rollback
  readonly dependencies: readonly string[];
  readonly status: ChangeSetItemStatus;
  readonly error: string | null;
  readonly applyStartedAt: Date | null;
  readonly applyCompletedAt: Date | null;
  readonly confirmedState: TConfig | null;
  readonly applyOrder: number;
}

interface RollbackStep<TConfig = Record<string, unknown>> {
  readonly itemId: string;
  readonly operation: RollbackOperation;
  readonly restoreState: TConfig | null;
  readonly resourceUuid: string | null;
  readonly success: boolean;
  readonly error: string | null;
  readonly rollbackOrder: number;
}

interface ChangeSetError {
  readonly message: string;
  readonly failedItemId: string;
  readonly code?: string;
  readonly partiallyAppliedItemIds: readonly string[];
  readonly failedRollbackItemIds: readonly string[];
  readonly requiresManualIntervention: boolean;
  readonly stack?: string;   // Dev only
}

interface ChangeSetValidationError {
  readonly itemId: string;
  readonly field: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
  readonly code?: string;
}

interface ChangeSetConflict {
  readonly itemId1: string;
  readonly itemId2OrResourceUuid: string;
  readonly isExternalConflict: boolean;
  readonly description: string;
  readonly resolution?: string;
}

interface ChangeSetValidationResult {
  readonly canApply: boolean;
  readonly errors: readonly ChangeSetValidationError[];
  readonly warnings: readonly ChangeSetValidationError[];
  readonly conflicts: readonly ChangeSetConflict[];
  readonly missingDependencies: ReadonlyArray<{
    readonly itemId: string;
    readonly missingResourceType: string;
    readonly missingResourceId: string;
  }>;
  readonly circularDependencies: ReadonlyArray<readonly string[]> | null;
}
```

### Change Set Container

```typescript
interface ChangeSet<TConfig = Record<string, unknown>> {
  readonly id: string;           // ULID
  readonly name: string;
  readonly description?: string;
  readonly routerId: string;
  readonly items: readonly ChangeSetItem<TConfig>[];
  readonly status: ChangeSetStatus;
  readonly validation: ChangeSetValidationResult | null;
  readonly rollbackPlan: readonly RollbackStep<TConfig>[];
  readonly error: ChangeSetError | null;
  readonly createdAt: Date;
  readonly applyStartedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdBy?: string;
  readonly source?: string;      // Originating wizard/feature
  readonly version: number;      // For optimistic concurrency control
}

interface ChangeSetSummary {
  readonly id: string;
  readonly name: string;
  readonly status: ChangeSetStatus;
  readonly operationCounts: {
    readonly create: number;
    readonly update: number;
    readonly delete: number;
  };
  readonly totalItems: number;
  readonly createdAt: Date;
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
}

interface ChangeSetProgressEvent {
  readonly changeSetId: string;
  readonly status: ChangeSetStatus;
  readonly currentItem: {
    readonly id: string;
    readonly name: string;
    readonly operation: ChangeOperation;
    readonly status: ChangeSetItemStatus;
  } | null;
  readonly appliedCount: number;
  readonly totalCount: number;
  readonly progressPercent: number;
  readonly estimatedRemainingMs: number | null;
  readonly error: ChangeSetError | null;
  readonly timestamp: Date;
}
```

### Change Set Utility Functions

```typescript
function isChangeSetPending(status: ChangeSetStatus): boolean;
function isChangeSetProcessing(status: ChangeSetStatus): boolean;
function isChangeSetFinal(status: ChangeSetStatus): boolean;
function isChangeSetCancellable(status: ChangeSetStatus): boolean;
function requiresManualIntervention(status: ChangeSetStatus): boolean;
function getChangeSetStatusDisplayInfo(status: ChangeSetStatus): ChangeSetStatusDisplayInfo;
function getOperationColor(operation: ChangeOperation): 'green' | 'amber' | 'red';
function getOperationLabel(operation: ChangeOperation): string;
```

---

## API Types

### Request/Response Types

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    pageSize?: number;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;
```

### Router Status and Information

```typescript
interface RouterStatusResponse {
  isOnline: boolean;
  uptime: number;                  // Seconds
  cpuUsage: number;                // 0-100
  memoryUsage: number;             // 0-100
  diskUsage: number;               // 0-100
  timestamp: Date;
}

interface RouterInfoResponse {
  model: string;                   // e.g., "CCR2216-1G-12XS"
  routerOSVersion: string;         // e.g., "7.10.1"
  architecture: string;            // e.g., "arm64"
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareRevision?: string;
}
```

### Configuration Operations

```typescript
interface ConfigApplyRequest {
  config: Record<string, unknown>;
  dryRun?: boolean;                // Validate without applying
}

interface ConfigApplyResponse {
  success: boolean;
  appliedAt: Date;
  snapshotId?: string;             // For rollback
  readonly changes: readonly string[];
}

interface ConfigRollbackRequest {
  snapshotId: string;
}

interface ConfigRollbackResponse {
  success: boolean;
  rolledBackAt: Date;
  previousConfig?: Record<string, unknown>;
}

interface ConfigHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'apply' | 'rollback';
  status: 'success' | 'failed' | 'rolled_back';
  readonly changes?: readonly string[];
  errorMessage?: string;
  snapshotId?: string;
}
```

### VPN Operations

```typescript
interface VPNConnectRequest {
  connectionId: string;
}

interface VPNConnectResponse {
  connectionId: string;
  status: 'connected' | 'connecting' | 'error';
  connectedAt?: Date;
  error?: string;
}

interface VPNListResponse {
  readonly connections: ReadonlyArray<{
    id: string;
    name: string;
    protocol: string;
    status: 'connected' | 'disconnected' | 'connecting';
    lastConnectedAt?: Date;
  }>;
}
```

---

## Configuration Types

### Application Configuration

```typescript
type ThemeMode = 'light' | 'dark' | 'system';

interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;               // Milliseconds
  };
  ui: {
    theme: ThemeMode;
    language: string;              // e.g., 'en', 'es'
  };
  router: {
    defaultPort: number;           // RouterOS API port
    retryAttempts: number;
    retryDelay: number;            // Milliseconds
  };
  features: {
    isWireGuardVPNEnabled: boolean;
    isDHCPMonitoringEnabled: boolean;
    isFirewallViewerEnabled: boolean;
    isSafetyPipelineEnabled: boolean;
  };
}

interface RouterConnectionConfig {
  address: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
  verifyCertificate: boolean;
  timeout: number;                 // Milliseconds
}

interface ApplicationState {
  currentRouter?: RouterConnectionConfig;
  readonly savedRouters: readonly RouterConnectionConfig[];
  userPreferences: {
    theme: ThemeMode;
    language: string;
    autoRefreshInterval: number;   // Milliseconds, 0 to disable
  };
}
```

---

## Router Types

### Router Discovery

```typescript
type RouterConnectionStatus =
  | 'online'      // Reachable and authenticated
  | 'offline'     // Previously connected, now unreachable
  | 'unknown'     // Never connected or untested
  | 'connecting'; // Authentication in progress

type RouterDiscoveryMethod =
  | 'scan'        // Auto-discovered via network scan
  | 'manual';     // Manually added by user

interface Router {
  id: string;                          // UUID
  ipAddress: string;
  name?: string;
  model?: string;                      // e.g., "RB5009"
  routerOsVersion?: string;            // e.g., "7.16"
  connectionStatus: RouterConnectionStatus;
  lastConnected?: Date;
  discoveryMethod: RouterDiscoveryMethod;
  createdAt: Date;
  macAddress?: string;
}

interface RouterCredentials {
  username: string;                    // Default: "admin"
  password: string;
}

interface ScanResult {
  ipAddress: string;
  isReachable: boolean;
  responseTime?: number;               // Milliseconds
  httpPort?: number;                   // 80 or 443
  model?: string;
  routerOsVersion?: string;
  macAddress?: string;
}

interface ScanProgress {
  totalHosts: number;
  scannedHosts: number;
  foundRouters: number;
  currentIp: string;
  isScanning: boolean;
}
```

---

## Firewall Types

Firewall types are partially shown here. See `libs/core/types/src/firewall/` for complete firewall definitions including:
- Filter Rules (input, forward, output chains)
- NAT Rules (source/destination NAT)
- Mangle Rules (connection marking, packet modification)
- Raw Rules (connection tracking)
- Service Ports (well-known port definitions)
- Port Knocking (sequence-based access)
- Rate Limiting (bandwidth throttling)
- Templates (reusable rule sets)
- Firewall Logs (traffic audit trail)

```typescript
type FilterChain = 'input' | 'forward' | 'output';
type FilterAction = 'accept' | 'drop' | 'reject' | 'log' | 'jump' | 'tarpit' | 'passthrough';
type FilterProtocol = 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all';

interface FilterRule {
  // Identity and chain
  id?: string;
  chain: FilterChain;
  action: FilterAction;
  order?: number;

  // Basic matchers
  protocol?: FilterProtocol;
  srcAddress?: string;               // IP or CIDR
  dstAddress?: string;               // IP or CIDR
  srcPort?: string;                  // Port or range
  dstPort?: string;                  // Port or range

  // Address lists
  srcAddressList?: string;
  dstAddressList?: string;

  // ... additional fields (see firewall types file)
}
```

---

## Services Types

Services types include:
- Schedule types (service scheduling/automation)
- Update stage types (update progression)

See `libs/core/types/src/services/` for complete definitions.

---

## Type Guards

The library provides comprehensive type guards for runtime type checking.

### Category Guards

```typescript
function isVPNResource(resource: Resource): boolean;
function isNetworkResource(resource: Resource): boolean;
function isInfrastructureResource(resource: Resource): boolean;
function isApplicationResource(resource: Resource): boolean;
function isFeatureResource(resource: Resource): boolean;
function isPluginResource(resource: Resource): boolean;
function isResourceCategory(resource: Resource, category: ResourceCategory): boolean;
```

### Type-Specific Guards

```typescript
function isWireGuardClient(resource: Resource): boolean;
function isWireGuardServer(resource: Resource): boolean;
function isLANNetwork(resource: Resource): boolean;
function isWANLink(resource: Resource): boolean;
function isFirewallRule(resource: Resource): boolean;
function isDHCPServer(resource: Resource): boolean;
function isBridge(resource: Resource): boolean;
function isRoute(resource: Resource): boolean;
function hasResourceTypePrefix(resource: Resource, prefix: string): boolean;
```

### Layer Presence Guards

These are type predicates that narrow the resource type to include optional layers:

```typescript
function hasValidation(resource: Resource): resource is Resource & { validation: ValidationResult };
function hasDeployment(resource: Resource): resource is Resource & { deployment: DeploymentState };
function hasRuntime(resource: Resource): resource is Resource & { runtime: RuntimeState };
function hasTelemetry(resource: Resource): resource is Resource & { telemetry: TelemetryData };
function hasRelationships(resource: Resource): resource is Resource & { relationships: ResourceRelationships };
function hasPlatform(resource: Resource): resource is Resource & { platform: PlatformInfo };
```

### Composite Resource Guards

```typescript
function isCompositeResource(value: unknown): value is CompositeResource;
```

### State Guards

```typescript
// Specific states
function isDraft(resource: Resource): boolean;
function isValidating(resource: Resource): boolean;
function isValid(resource: Resource): boolean;
function isApplying(resource: Resource): boolean;
function isActive(resource: Resource): boolean;
function isDegraded(resource: Resource): boolean;
function isError(resource: Resource): boolean;
function isDeprecated(resource: Resource): boolean;
function isArchived(resource: Resource): boolean;

// Generic
function isInState(resource: Resource, state: ResourceLifecycleState): boolean;
```

### Health Guards

```typescript
function isHealthy(resource: Resource): boolean;
function isRunning(resource: Resource): boolean;
function hasDrift(resource: Resource): boolean;
function isInSync(resource: Resource): boolean;
```

### Validation Guards

```typescript
function canApply(resource: Resource): boolean;
function hasValidationErrors(resource: Resource): boolean;
function hasValidationWarnings(resource: Resource): boolean;
function hasConflicts(resource: Resource): boolean;
```

### Generic Object Guards

```typescript
function isResource(value: unknown): value is Resource;
function isResourceMetadata(value: unknown): value is ResourceMetadata;
```

---

## Usage Examples

### Creating and Validating a Resource

```typescript
import type { Resource } from '@nasnet/core/types';
import { hasValidation, canApply } from '@nasnet/core/types';

async function configureResource(resource: Resource<VPNConfig>) {
  // Check if validation data is available
  if (hasValidation(resource)) {
    if (!canApply(resource)) {
      console.error('Resource has validation errors:', resource.validation.errors);
      return;
    }
  }

  // Safe to apply
  await applyResource(resource);
}
```

### Working with Composite Resources

```typescript
import { buildCompositeResource, aggregateCompositeStatus } from '@nasnet/core/types';

async function manageWireGuardServer(server: Resource, clients: Resource[]) {
  const composite = buildCompositeResource(server, clients);
  const status = aggregateCompositeStatus(clients);

  if (status.overallHealth === 'CRITICAL') {
    console.warn('Some clients are unhealthy');
  }

  console.log(`Health: ${status.activeCount}/${status.totalCount} active`);
}
```

### Processing Change Sets

```typescript
import type { ChangeSet, ChangeSetStatus } from '@nasnet/core/types';
import { isChangeSetProcessing, isChangeSetFinal } from '@nasnet/core/types';

function handleChangeSetUpdate(changeSet: ChangeSet) {
  if (isChangeSetProcessing(changeSet.status)) {
    showProgressSpinner();
  } else if (isChangeSetFinal(changeSet.status)) {
    showResults();
  }
}
```

### Type Filtering and Guards

```typescript
import { isVPNResource, isActive, filterResourcesByState } from '@nasnet/core/types';

function getActiveVPNResources(resources: Resource[]) {
  return resources
    .filter(isVPNResource)
    .filter(isActive);
}

// Or using the functional filter
function getAllActiveResources(resources: Resource[]) {
  return filterResourcesByState(resources, ['ACTIVE']);
}
```

---

## Related Documentation

- **Universal State v2:** See `Docs/architecture/data-architecture.md` for the complete 8-layer model design
- **ADR-012:** See `Docs/architecture/adrs/012-universal-state-v2.md` for architecture decision record
- **GraphQL Contracts:** See `Docs/architecture/api-contracts.md` for GraphQL schema patterns
- **Change Sets:** See feature requirements for atomic multi-resource operations
- **Type Validation:** Zod schemas are co-located with type definitions (`.ts` files)

---

## Summary

The `@nasnet/core/types` library provides:

1. **Universal State v2 Model** - 8-layer resource architecture for complete state management
2. **Type Safety** - Comprehensive TypeScript types for all domains
3. **Type Guards** - Runtime validation predicates for safe type narrowing
4. **Lifecycle Management** - Complete state machine with valid transitions
5. **Relationship Modeling** - Rich dependency and relationship types
6. **Change Sets** - Atomic multi-resource operations with rollback
7. **Domain-Specific Types** - Router, firewall, VPN, DHCP, and service types
8. **API Contracts** - Request/response types for backend communication

All types are immutable (readonly) where appropriate, strictly typed, and designed for frontend-backend type safety across GraphQL and REST APIs.
