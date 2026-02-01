/**
 * Universal State v2 Layer Types
 *
 * Type definitions for each of the 8 layers in the resource model.
 * Reference: ADR-012 - Universal State v2
 */

import type { ResourceLifecycleState } from './lifecycle';
import type { ResourceCategory, ResourceReference } from './resource';

// =============================================================================
// Layer 2: Validation Result
// =============================================================================

/**
 * Validation pipeline stages
 */
export const ValidationStage = {
  /** Schema validation (Zod/GraphQL) */
  SCHEMA: 'SCHEMA',
  /** Semantic validation (business rules) */
  SEMANTIC: 'SEMANTIC',
  /** Dependency validation (required resources exist) */
  DEPENDENCY: 'DEPENDENCY',
  /** Conflict detection (port/IP/route conflicts) */
  CONFLICT: 'CONFLICT',
  /** Platform validation (capability checks) */
  PLATFORM: 'PLATFORM',
  /** Quota validation (resource limits) */
  QUOTA: 'QUOTA',
  /** Pre-flight simulation */
  SIMULATION: 'SIMULATION',
  /** All stages complete */
  COMPLETE: 'COMPLETE',
} as const;

export type ValidationStage =
  (typeof ValidationStage)[keyof typeof ValidationStage];

/**
 * Validation issue severity
 */
export const ValidationSeverity = {
  /** Blocks apply, must be fixed */
  ERROR: 'ERROR',
  /** Does not block, but recommended to address */
  WARNING: 'WARNING',
  /** Informational notice */
  INFO: 'INFO',
} as const;

export type ValidationSeverity =
  (typeof ValidationSeverity)[keyof typeof ValidationSeverity];

/**
 * A validation issue (error or warning)
 */
export interface ValidationIssue {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Field path that caused the issue */
  field?: string | null;
  /** Severity level */
  severity: ValidationSeverity;
  /** Suggested fix */
  suggestedFix?: string | null;
  /** Link to documentation */
  docsUrl?: string | null;
}

/**
 * Types of resource conflicts
 */
export const ConflictType = {
  /** Port number conflict */
  PORT: 'PORT',
  /** IP address conflict */
  IP_ADDRESS: 'IP_ADDRESS',
  /** Route overlap */
  ROUTE: 'ROUTE',
  /** Interface conflict */
  INTERFACE: 'INTERFACE',
  /** Name collision */
  NAME: 'NAME',
  /** Configuration incompatibility */
  CONFIGURATION: 'CONFIGURATION',
} as const;

export type ConflictType = (typeof ConflictType)[keyof typeof ConflictType];

/**
 * Conflict with another resource
 */
export interface ResourceConflict {
  /** Type of conflict */
  type: ConflictType;
  /** Conflicting resource UUID */
  conflictingResourceUuid: string;
  /** Description of the conflict */
  description: string;
  /** Suggested resolution */
  resolution?: string | null;
}

/**
 * Status of a required dependency
 */
export interface DependencyStatus {
  /** Dependency resource UUID */
  resourceUuid: string;
  /** Dependency resource type */
  resourceType: string;
  /** Whether the dependency is active */
  isActive: boolean;
  /** Current state of the dependency */
  state: ResourceLifecycleState;
  /** Why this dependency is required */
  reason: string;
}

/**
 * Layer 2: Validation result from 7-stage backend validation pipeline
 */
export interface ValidationResult {
  /** Whether the resource can be applied */
  canApply: boolean;
  /** Current validation stage */
  stage: ValidationStage;
  /** Validation errors (blocking) */
  errors: ValidationIssue[];
  /** Validation warnings (non-blocking) */
  warnings: ValidationIssue[];
  /** Resource conflicts detected */
  conflicts: ResourceConflict[];
  /** Required dependencies that must be active */
  requiredDependencies: DependencyStatus[];
  /** When validation was performed */
  validatedAt: string;
  /** Duration of validation in milliseconds */
  validationDurationMs: number;
}

// =============================================================================
// Layer 3: Deployment State
// =============================================================================

/**
 * Actions to resolve drift
 */
export const DriftAction = {
  /** Re-apply configuration to router */
  REAPPLY: 'REAPPLY',
  /** Update configuration to match router */
  ACCEPT: 'ACCEPT',
  /** Manual review required */
  REVIEW: 'REVIEW',
} as const;

export type DriftAction = (typeof DriftAction)[keyof typeof DriftAction];

/**
 * A field that has drifted from configuration
 */
export interface DriftField {
  /** Field path */
  path: string;
  /** Expected value (from configuration) */
  expected: unknown;
  /** Actual value (from router) */
  actual: unknown;
}

/**
 * Information about configuration drift
 */
export interface DriftInfo {
  /** When drift was detected */
  detectedAt: string;
  /** Fields that have drifted */
  driftedFields: DriftField[];
  /** Suggested action to resolve drift */
  suggestedAction: DriftAction;
}

/**
 * Layer 3: What's actually on router after Apply-Confirm
 */
export interface DeploymentState {
  /** Router-generated resource ID */
  routerResourceId?: string | null;
  /** When the resource was applied */
  appliedAt: string;
  /** User who applied the resource */
  appliedBy?: string | null;
  /** Version number on router */
  routerVersion?: number | null;
  /** Router-generated fields */
  generatedFields?: unknown;
  /** Whether deployment matches configuration */
  isInSync: boolean;
  /** Detected drift from configuration */
  drift?: DriftInfo | null;
  /** Apply operation ID for audit trail */
  applyOperationId?: string | null;
}

// =============================================================================
// Layer 4: Runtime State
// =============================================================================

/**
 * Runtime health status
 */
export const RuntimeHealth = {
  /** Resource is healthy and operating normally */
  HEALTHY: 'HEALTHY',
  /** Resource is running but with warnings */
  WARNING: 'WARNING',
  /** Resource is running but degraded */
  DEGRADED: 'DEGRADED',
  /** Resource has failed */
  FAILED: 'FAILED',
  /** Health status unknown */
  UNKNOWN: 'UNKNOWN',
} as const;

export type RuntimeHealth = (typeof RuntimeHealth)[keyof typeof RuntimeHealth];

/**
 * Resource-specific runtime metrics
 */
export interface RuntimeMetrics {
  /** Bytes received */
  bytesIn?: number | null;
  /** Bytes transmitted */
  bytesOut?: number | null;
  /** Packets received */
  packetsIn?: number | null;
  /** Packets transmitted */
  packetsOut?: number | null;
  /** Error count */
  errors?: number | null;
  /** Drops count */
  drops?: number | null;
  /** Current throughput in (bytes/sec) */
  throughputIn?: number | null;
  /** Current throughput out (bytes/sec) */
  throughputOut?: number | null;
  /** Resource-specific custom metrics */
  custom?: unknown;
}

/**
 * Layer 4: Live operational state polled/streamed from router
 */
export interface RuntimeState {
  /** Whether the resource is currently running/active */
  isRunning: boolean;
  /** Health status of the resource */
  health: RuntimeHealth;
  /** Error message if resource is unhealthy */
  errorMessage?: string | null;
  /** Resource-specific runtime metrics */
  metrics?: RuntimeMetrics | null;
  /** Last time runtime was updated */
  lastUpdated: string;
  /** Time since last successful operation */
  lastSuccessfulOperation?: string | null;
  /** Current peers/connections */
  activeConnections?: number | null;
  /** Resource uptime */
  uptime?: string | null;
}

// =============================================================================
// Layer 5: Telemetry Data
// =============================================================================

/**
 * A bandwidth data point
 */
export interface BandwidthDataPoint {
  /** Timestamp */
  timestamp: string;
  /** Bytes in during this period */
  bytesIn: number;
  /** Bytes out during this period */
  bytesOut: number;
  /** Period duration in seconds */
  periodSeconds: number;
}

/**
 * An uptime data point
 */
export interface UptimeDataPoint {
  /** Timestamp */
  timestamp: string;
  /** Whether resource was up during this period */
  isUp: boolean;
  /** Period duration in seconds */
  periodSeconds: number;
}

/**
 * Hourly statistics
 */
export interface HourlyStats {
  /** Hour start timestamp */
  hour: string;
  /** Total bytes in */
  totalBytesIn: number;
  /** Total bytes out */
  totalBytesOut: number;
  /** Uptime percentage (0-100) */
  uptimePercent: number;
  /** Error count */
  errorCount: number;
}

/**
 * Daily statistics
 */
export interface DailyStats {
  /** Date (UTC) */
  date: string;
  /** Total bytes in */
  totalBytesIn: number;
  /** Total bytes out */
  totalBytesOut: number;
  /** Uptime percentage (0-100) */
  uptimePercent: number;
  /** Error count */
  errorCount: number;
  /** Peak throughput in (bytes/sec) */
  peakThroughputIn: number;
  /** Peak throughput out (bytes/sec) */
  peakThroughputOut: number;
}

/**
 * Layer 5: Time-series metrics and historical data
 */
export interface TelemetryData {
  /** Bandwidth history (last 24h) */
  bandwidthHistory?: BandwidthDataPoint[] | null;
  /** Uptime history */
  uptimeHistory?: UptimeDataPoint[] | null;
  /** Hourly statistics */
  hourlyStats?: HourlyStats[] | null;
  /** Daily statistics */
  dailyStats?: DailyStats[] | null;
  /** First data point timestamp */
  dataStartedAt?: string | null;
  /** Last data point timestamp */
  lastUpdatedAt?: string | null;
  /** Data retention period */
  retentionDays: number;
}

// =============================================================================
// Layer 6: Resource Metadata
// =============================================================================

/**
 * Change types for audit log
 */
export const ChangeType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];

/**
 * An entry in the change log
 */
export interface ChangeLogEntry {
  /** Change timestamp */
  timestamp: string;
  /** User who made the change */
  user: string;
  /** Type of change */
  changeType: ChangeType;
  /** Changed fields */
  changedFields: string[];
  /** Brief description of the change */
  summary?: string | null;
}

/**
 * Layer 6: Resource lifecycle info, tags, ownership
 */
export interface ResourceMetadata {
  /** Resource creation timestamp */
  createdAt: string;
  /** User who created the resource */
  createdBy: string;
  /** Last update timestamp */
  updatedAt: string;
  /** User who last updated the resource */
  updatedBy?: string | null;
  /** Current lifecycle state */
  state: ResourceLifecycleState;
  /** Optimistic locking version */
  version: number;
  /** User-defined tags for organization */
  tags: string[];
  /** Resource description */
  description?: string | null;
  /** Whether resource is marked as favorite */
  isFavorite: boolean;
  /** Whether resource is pinned */
  isPinned: boolean;
  /** Custom user notes */
  notes?: string | null;
  /** Audit trail of recent changes */
  recentChanges?: ChangeLogEntry[] | null;
}

// =============================================================================
// Layer 7: Resource Relationships
// =============================================================================

/**
 * Layer 7: Dependencies and relationships between resources
 */
export interface ResourceRelationships {
  /** Resources this resource depends on */
  dependsOn: ResourceReference[];
  /** Resources that depend on this resource */
  dependents: ResourceReference[];
  /** Resource this routes traffic via */
  routesVia?: ResourceReference | null;
  /** Resources that route traffic via this resource */
  routedBy: ResourceReference[];
  /** Parent resource */
  parent?: ResourceReference | null;
  /** Child resources */
  children: ResourceReference[];
  /** Custom relationships */
  custom?: unknown;
}

// =============================================================================
// Layer 8: Platform Info
// =============================================================================

/**
 * Router platforms
 */
export const RouterPlatform = {
  MIKROTIK: 'MIKROTIK',
  OPENWRT: 'OPENWRT',
  VYOS: 'VYOS',
  GENERIC: 'GENERIC',
} as const;

export type RouterPlatform =
  (typeof RouterPlatform)[keyof typeof RouterPlatform];

/**
 * Capability levels
 */
export const CapabilityLevel = {
  /** Feature not supported */
  NONE: 'NONE',
  /** Limited support */
  BASIC: 'BASIC',
  /** Full RouterOS native support */
  ADVANCED: 'ADVANCED',
  /** Complete support including container-based features */
  FULL: 'FULL',
} as const;

export type CapabilityLevel =
  (typeof CapabilityLevel)[keyof typeof CapabilityLevel];

/**
 * Platform capabilities for a resource type
 */
export interface PlatformCapabilities {
  /** Whether this resource type is supported */
  isSupported: boolean;
  /** Capability level */
  level: CapabilityLevel;
  /** Minimum platform version required */
  minVersion?: string | null;
  /** Required packages */
  requiredPackages?: string[] | null;
  /** Capability-specific details */
  details?: unknown;
}

/**
 * A platform-specific limitation
 */
export interface PlatformLimitation {
  /** Limitation identifier */
  code: string;
  /** Human-readable description */
  description: string;
  /** Affected fields */
  affectedFields?: string[] | null;
  /** Workaround if available */
  workaround?: string | null;
}

/**
 * A platform-specific feature
 */
export interface PlatformFeature {
  /** Feature identifier */
  id: string;
  /** Feature name */
  name: string;
  /** Whether feature is enabled */
  enabled: boolean;
  /** Feature description */
  description?: string | null;
}

/**
 * Layer 8: Platform-specific capabilities and field mappings
 */
export interface PlatformInfo {
  /** Current platform */
  current: RouterPlatform;
  /** Platform-specific capabilities for this resource type */
  capabilities: PlatformCapabilities;
  /** Field mappings between GraphQL and platform-native names */
  fieldMappings?: unknown;
  /** Platform-specific limitations or constraints */
  limitations?: PlatformLimitation[] | null;
  /** Platform-specific features available */
  features?: PlatformFeature[] | null;
}
