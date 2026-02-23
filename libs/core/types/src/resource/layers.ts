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
 * Stages of the validation pipeline executed before a resource can be applied.
 *
 * The validation pipeline executes multiple stages in sequence to ensure configuration
 * validity before being applied to the router. Each stage checks different aspects:
 * schema correctness, business rules, dependencies, conflicts, etc.
 *
 * @constant
 * @see ValidationResult for pipeline results
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

/** Inferred type for validation stages */
export type ValidationStage =
  (typeof ValidationStage)[keyof typeof ValidationStage];

/**
 * Severity levels for validation issues.
 *
 * Determines whether a validation issue blocks resource application
 * or is informational/advisory.
 *
 * @constant
 * @see ValidationIssue for issue details
 * @see ValidationResult.errors vs warnings
 */
export const ValidationSeverity = {
  /** Blocks apply, must be fixed */
  ERROR: 'ERROR',
  /** Does not block, but recommended to address */
  WARNING: 'WARNING',
  /** Informational notice */
  INFO: 'INFO',
} as const;

/** Inferred type for validation severity */
export type ValidationSeverity =
  (typeof ValidationSeverity)[keyof typeof ValidationSeverity];

/**
 * Single validation issue (error or warning) from the validation pipeline.
 *
 * Contains detailed information about what went wrong, where, and suggestions
 * for fixing it. Severity determines if it blocks application.
 *
 * @see ValidationResult for the complete validation result
 * @see ValidationSeverity for severity levels
 */
export interface ValidationIssue {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Human-readable message */
  readonly message: string;
  /** Field path that caused the issue (e.g., "config.ipAddress") */
  readonly field?: string | null;
  /** Severity level determining if it blocks application */
  readonly severity: ValidationSeverity;
  /** Suggested fix or workaround */
  readonly suggestedFix?: string | null;
  /** Link to documentation */
  readonly docsUrl?: string | null;
}

/**
 * Types of conflicts that can occur between resources.
 *
 * Used to classify conflicts detected during validation, helping users
 * understand the nature of the problem and potential solutions.
 *
 * @constant
 * @see ResourceConflict for conflict details
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

/** Inferred type for conflict types */
export type ConflictType = (typeof ConflictType)[keyof typeof ConflictType];

/**
 * Conflict detected between this resource and another during validation.
 *
 * Indicates a collision or incompatibility that prevents both resources
 * from being applied simultaneously. Resolution options are provided.
 *
 * @see ConflictType for conflict classification
 * @see ValidationResult.conflicts for validation results
 */
export interface ResourceConflict {
  /** Type of conflict */
  readonly type: ConflictType;
  /** Conflicting resource UUID */
  readonly conflictingResourceUuid: string;
  /** Description of the conflict */
  readonly description: string;
  /** Suggested resolution */
  readonly resolution?: string | null;
}

/**
 * Status of a resource dependency checked during validation.
 *
 * Reports whether a required dependency exists, is active, and in what state.
 * Helps users understand why application might fail if dependencies are not met.
 *
 * @see ValidationResult.requiredDependencies for full validation results
 * @see ResourceLifecycleState for lifecycle states
 */
export interface DependencyStatus {
  /** Dependency resource UUID */
  readonly resourceUuid: string;
  /** Dependency resource type */
  readonly resourceType: string;
  /** Whether the dependency is active and usable */
  readonly isActive: boolean;
  /** Current state of the dependency */
  readonly state: ResourceLifecycleState;
  /** Why this dependency is required */
  readonly reason: string;
}

/**
 * Complete validation result from the 7-stage backend validation pipeline.
 *
 * Layer 2 of the 8-layer resource model. Contains all validation issues,
 * conflicts, dependency status, and whether the resource is safe to apply.
 *
 * The validation pipeline checks:
 * 1. Schema conformance (Zod/GraphQL)
 * 2. Semantic validity (business rules)
 * 3. Dependency availability
 * 4. Conflicts with existing resources
 * 5. Platform capabilities
 * 6. Resource quotas
 * 7. Pre-flight simulation
 *
 * @see ValidationStage for pipeline stages
 * @see ValidationIssue for individual issues
 * @see ValidationSeverity for error vs warning distinction
 */
export interface ValidationResult {
  /** Whether the resource can be applied (no blocking errors) */
  readonly canApply: boolean;
  /** Current validation stage in the pipeline */
  readonly stage: ValidationStage;
  /** Validation errors (blocking, must be fixed) */
  readonly errors: readonly ValidationIssue[];
  /** Validation warnings (non-blocking, informational) */
  readonly warnings: readonly ValidationIssue[];
  /** Resource conflicts detected */
  readonly conflicts: readonly ResourceConflict[];
  /** Required dependencies and their status */
  readonly requiredDependencies: readonly DependencyStatus[];
  /** When validation was performed (ISO 8601 timestamp) */
  readonly validatedAt: string;
  /** Duration of validation in milliseconds */
  readonly validationDurationMs: number;
}

// =============================================================================
// Layer 3: Deployment State
// =============================================================================

/**
 * Actions to resolve configuration drift.
 *
 * When deployment state diverges from configuration, users can choose how to
 * reconcile: push configuration to router, accept router's version, or review manually.
 *
 * @constant
 * @see DriftInfo for drift detection details
 */
export const DriftAction = {
  /** Re-apply configuration to router */
  REAPPLY: 'REAPPLY',
  /** Update configuration to match router */
  ACCEPT: 'ACCEPT',
  /** Manual review required */
  REVIEW: 'REVIEW',
} as const;

/** Inferred type for drift actions */
export type DriftAction = (typeof DriftAction)[keyof typeof DriftAction];

/**
 * Single field that has drifted between configuration and deployment.
 *
 * Represents a difference detected during drift reconciliation. Can occur when
 * router modifies fields, external systems change state, or network issues occur.
 *
 * @see DriftInfo for the collection of drifted fields
 */
export interface DriftField {
  /** Field path (dot-notation, e.g., "config.ipAddress") */
  readonly path: string;
  /** Expected value (from configuration) */
  readonly expected: unknown;
  /** Actual value (from router) */
  readonly actual: unknown;
}

/**
 * Configuration drift information detected during synchronization.
 *
 * Indicates that the configuration and deployment state have diverged.
 * Provides details on what drifted and recommends resolution action.
 *
 * @see DriftAction for resolution options
 * @see DriftField for individual field drifts
 * @see DeploymentState.drift for inclusion in deployment
 */
export interface DriftInfo {
  /** When drift was detected (ISO 8601 timestamp) */
  readonly detectedAt: string;
  /** Fields that have drifted */
  readonly driftedFields: readonly DriftField[];
  /** Suggested action to resolve drift */
  readonly suggestedAction: DriftAction;
}

/**
 * Deployment state of a resource on the router.
 *
 * Layer 3 of the 8-layer resource model. Contains what's actually on the router
 * after an Apply-Confirm operation, including router-generated fields, version info,
 * and drift information if the deployment has diverged from configuration.
 *
 * @see Resource.deployment for inclusion in resource interface
 * @see DriftInfo for drift detection
 */
export interface DeploymentState {
  /** Router-generated resource ID (may differ from configuration ID) */
  readonly routerResourceId?: string | null;
  /** When the resource was applied (ISO 8601 timestamp) */
  readonly appliedAt: string;
  /** User who applied the resource */
  readonly appliedBy?: string | null;
  /** Version number on router (for optimistic locking) */
  readonly routerVersion?: number | null;
  /** Router-generated fields (vendor-specific properties) */
  readonly generatedFields?: unknown;
  /** Whether deployment matches configuration */
  readonly isInSync: boolean;
  /** Detected drift from configuration */
  readonly drift?: DriftInfo | null;
  /** Apply operation ID for audit trail and rollback */
  readonly applyOperationId?: string | null;
}

// =============================================================================
// Layer 4: Runtime State
// =============================================================================

/**
 * Runtime health status of an active resource.
 *
 * Indicates the operational health of a resource running on the router,
 * from fully healthy to critically failed states.
 *
 * @constant
 * @see RuntimeState.health for inclusion in runtime state
 */
export const RuntimeHealth = {
  /** Resource is healthy and operating normally */
  HEALTHY: 'HEALTHY',
  /** Resource is running but with warnings */
  WARNING: 'WARNING',
  /** Resource is running but degraded */
  DEGRADED: 'DEGRADED',
  /** Resource is in critical state */
  CRITICAL: 'CRITICAL',
  /** Resource has failed */
  FAILED: 'FAILED',
  /** Health status unknown */
  UNKNOWN: 'UNKNOWN',
} as const;

/** Inferred type for runtime health status */
export type RuntimeHealth = (typeof RuntimeHealth)[keyof typeof RuntimeHealth];

/**
 * Runtime metrics and operational statistics for a resource.
 *
 * Contains network traffic, error statistics, and performance metrics collected
 * from the resource during normal operation. Resource-type-specific metrics
 * can be added via the custom field.
 *
 * @see RuntimeState.metrics for inclusion in runtime state
 */
export interface RuntimeMetrics {
  /** Bytes received */
  readonly bytesIn?: number | null;
  /** Bytes transmitted */
  readonly bytesOut?: number | null;
  /** Packets received */
  readonly packetsIn?: number | null;
  /** Packets transmitted */
  readonly packetsOut?: number | null;
  /** Error count */
  readonly errors?: number | null;
  /** Drops count */
  readonly drops?: number | null;
  /** Current throughput in (bytes/sec) */
  readonly throughputIn?: number | null;
  /** Current throughput out (bytes/sec) */
  readonly throughputOut?: number | null;
  /** Resource-specific custom metrics (vendor/type-specific) */
  readonly custom?: unknown;
}

/**
 * Live operational state of a resource polled/streamed from the router.
 *
 * Layer 4 of the 8-layer resource model. Contains real-time operational data
 * updated via polling or WebSocket streams. Read-only and continuously updated.
 *
 * @see Resource.runtime for inclusion in resource interface
 * @see RuntimeHealth for health status values
 * @see RuntimeMetrics for detailed metrics
 */
export interface RuntimeState {
  /** Whether the resource is currently running/active */
  readonly isRunning: boolean;
  /** Health status of the resource */
  readonly health: RuntimeHealth;
  /** Error message if resource is unhealthy */
  readonly errorMessage?: string | null;
  /** Resource-specific operational metrics */
  readonly metrics?: RuntimeMetrics | null;
  /** Last time runtime was updated (ISO 8601 timestamp) */
  readonly lastUpdated: string;
  /** Time since last successful operation (ISO 8601 timestamp) */
  readonly lastSuccessfulOperation?: string | null;
  /** Current peer/connection count (varies by resource type) */
  readonly activeConnections?: number | null;
  /** Resource uptime duration (ISO 8601 duration) */
  readonly uptime?: string | null;
}

// =============================================================================
// Layer 5: Telemetry Data
// =============================================================================

/**
 * Bandwidth measurement for a time period in telemetry data.
 *
 * @see TelemetryData.bandwidthHistory for usage in telemetry
 */
export interface BandwidthDataPoint {
  /** Measurement timestamp (ISO 8601) */
  readonly timestamp: string;
  /** Bytes in during this period */
  readonly bytesIn: number;
  /** Bytes out during this period */
  readonly bytesOut: number;
  /** Period duration in seconds */
  readonly periodSeconds: number;
}

/**
 * Uptime measurement for a time period in telemetry data.
 *
 * @see TelemetryData.uptimeHistory for usage in telemetry
 */
export interface UptimeDataPoint {
  /** Measurement timestamp (ISO 8601) */
  readonly timestamp: string;
  /** Whether resource was up during this period */
  readonly isUp: boolean;
  /** Period duration in seconds */
  readonly periodSeconds: number;
}

/**
 * Hourly aggregated statistics for telemetry data.
 *
 * @see TelemetryData.hourlyStats for usage in telemetry
 */
export interface HourlyStats {
  /** Hour start timestamp (ISO 8601) */
  readonly hour: string;
  /** Total bytes in during this hour */
  readonly totalBytesIn: number;
  /** Total bytes out during this hour */
  readonly totalBytesOut: number;
  /** Uptime percentage (0-100) */
  readonly uptimePercent: number;
  /** Error count during this hour */
  readonly errorCount: number;
}

/**
 * Daily aggregated statistics for telemetry data.
 *
 * @see TelemetryData.dailyStats for usage in telemetry
 */
export interface DailyStats {
  /** Date (UTC, ISO 8601) */
  readonly date: string;
  /** Total bytes in during this day */
  readonly totalBytesIn: number;
  /** Total bytes out during this day */
  readonly totalBytesOut: number;
  /** Uptime percentage (0-100) */
  readonly uptimePercent: number;
  /** Error count during this day */
  readonly errorCount: number;
  /** Peak throughput in (bytes/sec) during this day */
  readonly peakThroughputIn: number;
  /** Peak throughput out (bytes/sec) during this day */
  readonly peakThroughputOut: number;
}

/**
 * Historical time-series metrics and aggregated statistics.
 *
 * Layer 5 of the 8-layer resource model. Contains bandwidth, uptime, and
 * aggregated statistics from the resource's operational history. Read-only,
 * automatically collected by the telemetry pipeline.
 *
 * @see Resource.telemetry for inclusion in resource interface
 * @see BandwidthDataPoint, UptimeDataPoint for raw data
 * @see HourlyStats, DailyStats for aggregates
 */
export interface TelemetryData {
  /** Bandwidth history (last 24h of raw data points) */
  readonly bandwidthHistory?: readonly BandwidthDataPoint[] | null;
  /** Uptime history (last 24h of raw data points) */
  readonly uptimeHistory?: readonly UptimeDataPoint[] | null;
  /** Hourly aggregated statistics */
  readonly hourlyStats?: readonly HourlyStats[] | null;
  /** Daily aggregated statistics */
  readonly dailyStats?: readonly DailyStats[] | null;
  /** First data point timestamp (ISO 8601) */
  readonly dataStartedAt?: string | null;
  /** Last data point timestamp (ISO 8601) */
  readonly lastUpdatedAt?: string | null;
  /** Data retention period in days */
  readonly retentionDays: number;
}

// =============================================================================
// Layer 6: Resource Metadata
// =============================================================================

/**
 * Types of changes tracked in the resource audit log.
 *
 * @constant
 * @see ChangeLogEntry for log entries
 * @see ResourceMetadata.recentChanges for audit trail
 */
export const ChangeType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

/** Inferred type for change types */
export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];

/**
 * Single entry in a resource's audit log.
 *
 * Tracks who changed what and when, part of the metadata
 * for audit trail and historical analysis.
 *
 * @see ResourceMetadata.recentChanges for inclusion
 * @see ChangeType for operation types
 */
export interface ChangeLogEntry {
  /** Change timestamp (ISO 8601) */
  readonly timestamp: string;
  /** User who made the change */
  readonly user: string;
  /** Type of change (create/update/delete) */
  readonly changeType: ChangeType;
  /** Fields that were changed (dotted paths) */
  readonly changedFields: readonly string[];
  /** Brief description of the change */
  readonly summary?: string | null;
}

/**
 * Resource lifecycle metadata and operational information.
 *
 * Layer 6 of the 8-layer resource model. Contains creation/update timestamps,
 * lifecycle state, version for optimistic locking, tags, descriptions, and
 * audit trail. System-managed but with user-customizable fields (tags, description, notes).
 *
 * @see Resource.metadata for inclusion in resource interface
 * @see ResourceLifecycleState for state values
 * @see ChangeLogEntry for audit trail entries
 */
export interface ResourceMetadata {
  /** Resource creation timestamp (ISO 8601) */
  readonly createdAt: string;
  /** User who created the resource */
  readonly createdBy: string;
  /** Last update timestamp (ISO 8601) */
  readonly updatedAt: string;
  /** User who last updated the resource */
  readonly updatedBy?: string | null;
  /** Current lifecycle state (draft, valid, active, etc.) */
  readonly state: ResourceLifecycleState;
  /** Version number for optimistic concurrency control */
  readonly version: number;
  /** User-defined tags for organization and filtering */
  readonly tags: readonly string[];
  /** User-provided description */
  readonly description?: string | null;
  /** Whether resource is marked as favorite */
  readonly isFavorite: boolean;
  /** Whether resource is pinned to dashboard */
  readonly isPinned: boolean;
  /** Custom user notes */
  readonly notes?: string | null;
  /** Audit trail of recent changes */
  readonly recentChanges?: readonly ChangeLogEntry[] | null;
}

// =============================================================================
// Layer 7: Resource Relationships
// =============================================================================

/**
 * Dependencies and relationships with other resources.
 *
 * Layer 7 of the 8-layer resource model. Contains information about:
 * - Direct dependencies (resources this depends on)
 * - Dependents (resources depending on this one)
 * - Routing paths (traffic routing via this resource)
 * - Hierarchy (parent-child relationships)
 * - Custom relationships (domain-specific)
 *
 * Used for dependency analysis, impact calculation, and cascading operations.
 *
 * @see Resource.relationships for inclusion in resource interface
 * @see ResourceReference for reference structure
 */
export interface ResourceRelationships {
  /** Resources this resource depends on */
  readonly dependsOn: readonly ResourceReference[];
  /** Resources that depend on this resource */
  readonly dependents: readonly ResourceReference[];
  /** Resource this routes traffic via */
  readonly routesVia?: ResourceReference | null;
  /** Resources that route traffic via this resource */
  readonly routedBy: readonly ResourceReference[];
  /** Parent resource in hierarchy */
  readonly parent?: ResourceReference | null;
  /** Child resources in hierarchy */
  readonly children: readonly ResourceReference[];
  /** Custom relationships (domain/vendor-specific) */
  readonly custom?: unknown;
}

// =============================================================================
// Layer 8: Platform Info
// =============================================================================

/**
 * Supported router platforms for the Universal State model.
 *
 * @constant
 * @see PlatformInfo for platform capabilities
 */
export const RouterPlatform = {
  MIKROTIK: 'MIKROTIK',
  OPENWRT: 'OPENWRT',
  VYOS: 'VYOS',
  GENERIC: 'GENERIC',
} as const;

/** Inferred type for router platforms */
export type RouterPlatform =
  (typeof RouterPlatform)[keyof typeof RouterPlatform];

/**
 * Capability levels for resource support on different platforms.
 *
 * Indicates the degree of support available for a resource type on
 * a specific router platform.
 *
 * @constant
 * @see PlatformCapabilities for capability details
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

/** Inferred type for capability levels */
export type CapabilityLevel =
  (typeof CapabilityLevel)[keyof typeof CapabilityLevel];

/**
 * Platform-specific capabilities and requirements for a resource type.
 *
 * Indicates whether and how a resource type is supported on a specific platform,
 * including version requirements and package dependencies.
 *
 * @see PlatformInfo for platform details
 * @see CapabilityLevel for support levels
 */
export interface PlatformCapabilities {
  /** Whether this resource type is supported on this platform */
  readonly isSupported: boolean;
  /** Capability level (none/basic/advanced/full) */
  readonly level: CapabilityLevel;
  /** Minimum platform version required */
  readonly minVersion?: string | null;
  /** Required packages or modules */
  readonly requiredPackages?: readonly string[] | null;
  /** Capability-specific details (platform/resource-specific) */
  readonly details?: unknown;
}

/**
 * Platform-specific limitation or constraint on a resource.
 *
 * Describes restrictions or limitations that apply to this resource type
 * on the current platform, with suggested workarounds if available.
 *
 * @see PlatformInfo.limitations for inclusion
 */
export interface PlatformLimitation {
  /** Limitation identifier code */
  readonly code: string;
  /** Human-readable description */
  readonly description: string;
  /** Fields affected by this limitation (dotted paths) */
  readonly affectedFields?: readonly string[] | null;
  /** Suggested workaround if available */
  readonly workaround?: string | null;
}

/**
 * Platform-specific optional feature available for this resource.
 *
 * Represents an optional enhancement or feature that can be enabled/disabled
 * on the platform for this resource type.
 *
 * @see PlatformInfo.features for inclusion
 */
export interface PlatformFeature {
  /** Feature identifier */
  readonly id: string;
  /** Feature name */
  readonly name: string;
  /** Whether feature is currently enabled */
  readonly enabled: boolean;
  /** Feature description */
  readonly description?: string | null;
}

/**
 * Platform capabilities and constraints for a resource.
 *
 * Layer 8 of the 8-layer resource model. Contains platform adapter information:
 * what capabilities are available, field mappings, limitations, and optional features.
 * Router-specific behavior is captured here.
 *
 * @see Resource.platform for inclusion in resource interface
 * @see RouterPlatform for supported platforms
 * @see PlatformCapabilities for capability details
 */
export interface PlatformInfo {
  /** Current router platform */
  readonly current: RouterPlatform;
  /** Platform-specific capabilities for this resource type */
  readonly capabilities: PlatformCapabilities;
  /** Field mappings between GraphQL schema and platform-native field names */
  readonly fieldMappings?: unknown;
  /** Platform-specific limitations or constraints */
  readonly limitations?: readonly PlatformLimitation[] | null;
  /** Platform-specific optional features available */
  readonly features?: readonly PlatformFeature[] | null;
}
