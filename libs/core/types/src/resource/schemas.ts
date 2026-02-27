/**
 * Universal State v2 Zod Schemas
 *
 * Validation schemas for resource types.
 * Reference: ADR-012 - Universal State v2
 *
 * @module @nasnet/core/types/resource
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

/**
 * Resource category enumeration schema.
 * Defines the top-level categorization of resources.
 */
export const ResourceCategorySchema = z.enum([
  'NETWORK',
  'VPN',
  'INFRASTRUCTURE',
  'APPLICATION',
  'FEATURE',
  'PLUGIN',
]);

/**
 * Resource lifecycle state enumeration schema.
 * Defines the state progression of a resource through creation, validation,
 * application, and decommissioning.
 */
export const ResourceLifecycleStateSchema = z.enum([
  'DRAFT',
  'VALIDATING',
  'VALID',
  'APPLYING',
  'ACTIVE',
  'DEGRADED',
  'ERROR',
  'DEPRECATED',
  'ARCHIVED',
]);

/**
 * Resource layer enumeration schema.
 * Identifies the 8 layers of the Universal State v2 model.
 */
export const ResourceLayerSchema = z.enum([
  'CONFIGURATION',
  'VALIDATION',
  'DEPLOYMENT',
  'RUNTIME',
  'TELEMETRY',
  'METADATA',
  'RELATIONSHIPS',
  'PLATFORM',
]);

/**
 * Validation stage enumeration schema.
 * Defines the progression of validation checks through multiple stages.
 */
export const ValidationStageSchema = z.enum([
  'SCHEMA',
  'SEMANTIC',
  'DEPENDENCY',
  'CONFLICT',
  'PLATFORM',
  'QUOTA',
  'SIMULATION',
  'COMPLETE',
]);

/**
 * Validation severity enumeration schema.
 * Indicates the severity level of validation issues.
 */
export const ValidationSeveritySchema = z.enum(['ERROR', 'WARNING', 'INFO']);

/**
 * Conflict type enumeration schema.
 * Identifies the type of conflict detected during validation.
 */
export const ConflictTypeSchema = z.enum([
  'PORT',
  'IP_ADDRESS',
  'ROUTE',
  'INTERFACE',
  'NAME',
  'CONFIGURATION',
]);

/**
 * Drift action enumeration schema.
 * Defines the actions available to handle detected drift.
 */
export const DriftActionSchema = z.enum(['REAPPLY', 'ACCEPT', 'REVIEW']);

/**
 * Runtime health enumeration schema.
 * Indicates the health status of a resource at runtime.
 */
export const RuntimeHealthSchema = z.enum(['HEALTHY', 'WARNING', 'DEGRADED', 'FAILED', 'UNKNOWN']);

/**
 * Change type enumeration schema.
 * Identifies the type of change made to a resource.
 */
export const ChangeTypeSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);

/**
 * Router platform enumeration schema.
 * Identifies the target router platform for a resource.
 */
export const RouterPlatformSchema = z.enum(['MIKROTIK', 'OPENWRT', 'VYOS', 'GENERIC']);

/**
 * Capability level enumeration schema.
 * Indicates the level of capability support for a feature.
 */
export const CapabilityLevelSchema = z.enum(['NONE', 'BASIC', 'ADVANCED', 'FULL']);

/**
 * Resource relationship type enumeration schema.
 * Defines the types of relationships that can exist between resources.
 */
export const ResourceRelationshipTypeSchema = z.enum([
  'DEPENDS_ON',
  'ROUTES_VIA',
  'PARENT_CHILD',
  'GROUP',
  'CUSTOM',
]);

// =============================================================================
// Layer 2: Validation
// =============================================================================

/**
 * Validation issue schema.
 * Represents a single validation error, warning, or info message.
 */
export const ValidationIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  field: z.string().nullable().optional(),
  severity: ValidationSeveritySchema,
  suggestedFix: z.string().nullable().optional(),
  docsUrl: z.string().url().nullable().optional(),
});

/**
 * Resource conflict schema.
 * Represents a conflict detected between resources during validation.
 */
export const ResourceConflictSchema = z.object({
  type: ConflictTypeSchema,
  conflictingResourceUuid: z.string().min(1),
  description: z.string().min(1),
  resolution: z.string().nullable().optional(),
});

/**
 * Dependency status schema.
 * Tracks the status of a resource dependency.
 */
export const DependencyStatusSchema = z.object({
  resourceUuid: z.string().min(1),
  resourceType: z.string().min(1),
  isActive: z.boolean(),
  state: ResourceLifecycleStateSchema,
  reason: z.string().min(1),
});

/**
 * Validation result schema.
 * Complete validation outcome for a resource.
 */
export const ValidationResultSchema = z.object({
  canApply: z.boolean(),
  stage: ValidationStageSchema,
  errors: z.array(ValidationIssueSchema),
  warnings: z.array(ValidationIssueSchema),
  conflicts: z.array(ResourceConflictSchema),
  requiredDependencies: z.array(DependencyStatusSchema),
  validatedAt: z.string().datetime(),
  validationDurationMs: z.number().int().nonnegative(),
});

// =============================================================================
// Layer 3: Deployment
// =============================================================================

/**
 * Drift field schema.
 * Represents a single field that has drifted from expected configuration.
 */
export const DriftFieldSchema = z.object({
  path: z.string().min(1),
  expected: z.unknown(),
  actual: z.unknown(),
});

/**
 * Drift information schema.
 * Comprehensive drift detection information for a deployed resource.
 */
export const DriftInfoSchema = z.object({
  detectedAt: z.string().datetime(),
  driftedFields: z.array(DriftFieldSchema),
  suggestedAction: DriftActionSchema,
});

/**
 * Deployment state schema.
 * Tracks the deployment status and sync state of a resource.
 */
export const DeploymentStateSchema = z.object({
  routerResourceId: z.string().nullable().optional(),
  appliedAt: z.string().datetime(),
  appliedBy: z.string().nullable().optional(),
  routerVersion: z.number().int().nullable().optional(),
  generatedFields: z.unknown().optional(),
  isInSync: z.boolean(),
  drift: DriftInfoSchema.nullable().optional(),
  applyOperationId: z.string().nullable().optional(),
});

// =============================================================================
// Layer 4: Runtime
// =============================================================================

/**
 * Runtime metrics schema.
 * Performance and operational metrics for a running resource.
 */
export const RuntimeMetricsSchema = z.object({
  bytesIn: z.number().nonnegative().nullable().optional(),
  bytesOut: z.number().nonnegative().nullable().optional(),
  packetsIn: z.number().int().nonnegative().nullable().optional(),
  packetsOut: z.number().int().nonnegative().nullable().optional(),
  errors: z.number().int().nonnegative().nullable().optional(),
  drops: z.number().int().nonnegative().nullable().optional(),
  throughputIn: z.number().nonnegative().nullable().optional(),
  throughputOut: z.number().nonnegative().nullable().optional(),
  custom: z.unknown().optional(),
});

/**
 * Runtime state schema.
 * Complete runtime state of an active resource.
 */
export const RuntimeStateSchema = z.object({
  isRunning: z.boolean(),
  health: RuntimeHealthSchema,
  errorMessage: z.string().nullable().optional(),
  metrics: RuntimeMetricsSchema.nullable().optional(),
  lastUpdated: z.string().datetime(),
  lastSuccessfulOperation: z.string().datetime().nullable().optional(),
  activeConnections: z.number().int().nonnegative().nullable().optional(),
  uptime: z.string().nullable().optional(),
});

// =============================================================================
// Layer 5: Telemetry
// =============================================================================

/**
 * Bandwidth data point schema.
 * A single measurement of bandwidth usage.
 */
export const BandwidthDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  bytesIn: z.number().nonnegative(),
  bytesOut: z.number().nonnegative(),
  periodSeconds: z.number().int().positive(),
});

/**
 * Uptime data point schema.
 * A single measurement of resource availability.
 */
export const UptimeDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  isUp: z.boolean(),
  periodSeconds: z.number().int().positive(),
});

/**
 * Hourly statistics schema.
 * Aggregated statistics for an hour of resource operation.
 */
export const HourlyStatsSchema = z.object({
  hour: z.string().datetime(),
  totalBytesIn: z.number().nonnegative(),
  totalBytesOut: z.number().nonnegative(),
  uptimePercent: z.number().min(0).max(100),
  errorCount: z.number().int().nonnegative(),
});

/**
 * Daily statistics schema.
 * Aggregated statistics for a day of resource operation.
 */
export const DailyStatsSchema = z.object({
  date: z.string().datetime(),
  totalBytesIn: z.number().nonnegative(),
  totalBytesOut: z.number().nonnegative(),
  uptimePercent: z.number().min(0).max(100),
  errorCount: z.number().int().nonnegative(),
  peakThroughputIn: z.number().nonnegative(),
  peakThroughputOut: z.number().nonnegative(),
});

/**
 * Telemetry data schema.
 * Historical telemetry and performance metrics for a resource.
 */
export const TelemetryDataSchema = z.object({
  bandwidthHistory: z.array(BandwidthDataPointSchema).nullable().optional(),
  uptimeHistory: z.array(UptimeDataPointSchema).nullable().optional(),
  hourlyStats: z.array(HourlyStatsSchema).nullable().optional(),
  dailyStats: z.array(DailyStatsSchema).nullable().optional(),
  dataStartedAt: z.string().datetime().nullable().optional(),
  lastUpdatedAt: z.string().datetime().nullable().optional(),
  retentionDays: z.number().int().positive(),
});

// =============================================================================
// Layer 6: Metadata
// =============================================================================

/**
 * Change log entry schema.
 * Records a single change to a resource.
 */
export const ChangeLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  user: z.string().min(1),
  changeType: ChangeTypeSchema,
  changedFields: z.array(z.string()),
  summary: z.string().nullable().optional(),
});

/**
 * Resource metadata schema.
 * Metadata about a resource including creation, modification, and tagging.
 */
export const ResourceMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().nullable().optional(),
  state: ResourceLifecycleStateSchema,
  version: z.number().int().positive(),
  tags: z.array(z.string()),
  description: z.string().nullable().optional(),
  isFavorite: z.boolean(),
  isPinned: z.boolean(),
  notes: z.string().nullable().optional(),
  recentChanges: z.array(ChangeLogEntrySchema).nullable().optional(),
});

// =============================================================================
// Layer 7: Relationships
// =============================================================================

/**
 * Resource reference schema.
 * Lightweight reference to another resource.
 */
export const ResourceReferenceSchema = z.object({
  uuid: z.string().min(1),
  id: z.string().min(1),
  type: z.string().min(1),
  category: ResourceCategorySchema,
  state: ResourceLifecycleStateSchema,
});

/**
 * Resource relationships schema.
 * All relationships for a resource including dependencies and hierarchy.
 */
export const ResourceRelationshipsSchema = z.object({
  dependsOn: z.array(ResourceReferenceSchema),
  dependents: z.array(ResourceReferenceSchema),
  routesVia: ResourceReferenceSchema.nullable().optional(),
  routedBy: z.array(ResourceReferenceSchema),
  parent: ResourceReferenceSchema.nullable().optional(),
  children: z.array(ResourceReferenceSchema),
  custom: z.unknown().optional(),
});

// =============================================================================
// Layer 8: Platform
// =============================================================================

/**
 * Platform capabilities schema.
 * Defines supported capabilities on a specific router platform.
 */
export const PlatformCapabilitiesSchema = z.object({
  isSupported: z.boolean(),
  level: CapabilityLevelSchema,
  minVersion: z.string().nullable().optional(),
  requiredPackages: z.array(z.string()).nullable().optional(),
  details: z.unknown().optional(),
});

/**
 * Platform limitation schema.
 * Describes a limitation of a resource on a specific platform.
 */
export const PlatformLimitationSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  affectedFields: z.array(z.string()).nullable().optional(),
  workaround: z.string().nullable().optional(),
});

/**
 * Platform feature schema.
 * Describes an optional feature available on a platform.
 */
export const PlatformFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().nullable().optional(),
});

/**
 * Platform information schema.
 * Complete platform information and capabilities for a resource.
 */
export const PlatformInfoSchema = z.object({
  current: RouterPlatformSchema,
  capabilities: PlatformCapabilitiesSchema,
  fieldMappings: z.unknown().optional(),
  limitations: z.array(PlatformLimitationSchema).nullable().optional(),
  features: z.array(PlatformFeatureSchema).nullable().optional(),
});

// =============================================================================
// Base Resource Schema
// =============================================================================

/**
 * Complete resource schema.
 * Includes all 8 layers of Universal State v2.
 */
export const ResourceSchema = z.object({
  uuid: z.string().min(1),
  id: z.string().min(1),
  type: z.string().min(1),
  category: ResourceCategorySchema,
  configuration: z.unknown(),
  validation: ValidationResultSchema.nullable().optional(),
  deployment: DeploymentStateSchema.nullable().optional(),
  runtime: RuntimeStateSchema.nullable().optional(),
  telemetry: TelemetryDataSchema.nullable().optional(),
  metadata: ResourceMetadataSchema,
  relationships: ResourceRelationshipsSchema.nullable().optional(),
  platform: PlatformInfoSchema.nullable().optional(),
});

// =============================================================================
// Mutation Input Schemas
// =============================================================================

/**
 * Resource relationships input schema.
 * Relationships specification for creating or updating a resource.
 */
export const ResourceRelationshipsInputSchema = z.object({
  dependsOn: z.array(z.string().min(1)).optional(),
  routesVia: z.string().min(1).optional(),
  parent: z.string().min(1).optional(),
  custom: z.unknown().optional(),
});

/**
 * Create resource input schema.
 * Input validation for resource creation mutations.
 */
export const CreateResourceInputSchema = z.object({
  routerId: z.string().min(1),
  type: z.string().min(1),
  category: ResourceCategorySchema,
  configuration: z.unknown(),
  relationships: ResourceRelationshipsInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

/**
 * Update resource input schema.
 * Input validation for resource update mutations.
 */
export const UpdateResourceInputSchema = z.object({
  configuration: z.unknown().optional(),
  relationships: ResourceRelationshipsInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

/**
 * Inferred TypeScript type for complete Resource.
 * @example
 * const resource: ResourceSchemaType = { ... };
 */
export type ResourceSchemaType = z.infer<typeof ResourceSchema>;
/** Inferred TypeScript type for ValidationResult. */
export type ValidationResultSchemaType = z.infer<typeof ValidationResultSchema>;
/** Inferred TypeScript type for DeploymentState. */
export type DeploymentStateSchemaType = z.infer<typeof DeploymentStateSchema>;
/** Inferred TypeScript type for RuntimeState. */
export type RuntimeStateSchemaType = z.infer<typeof RuntimeStateSchema>;
/** Inferred TypeScript type for TelemetryData. */
export type TelemetryDataSchemaType = z.infer<typeof TelemetryDataSchema>;
/** Inferred TypeScript type for ResourceMetadata. */
export type ResourceMetadataSchemaType = z.infer<typeof ResourceMetadataSchema>;
/** Inferred TypeScript type for ResourceRelationships. */
export type ResourceRelationshipsSchemaType = z.infer<typeof ResourceRelationshipsSchema>;
/** Inferred TypeScript type for PlatformInfo. */
export type PlatformInfoSchemaType = z.infer<typeof PlatformInfoSchema>;
/** Inferred TypeScript type for CreateResourceInput. */
export type CreateResourceInputSchemaType = z.infer<typeof CreateResourceInputSchema>;
/** Inferred TypeScript type for UpdateResourceInput. */
export type UpdateResourceInputSchemaType = z.infer<typeof UpdateResourceInputSchema>;
