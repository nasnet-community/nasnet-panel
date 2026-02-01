/**
 * Universal State v2 Zod Schemas
 *
 * Validation schemas for resource types.
 * Reference: ADR-012 - Universal State v2
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const ResourceCategorySchema = z.enum([
  'NETWORK',
  'VPN',
  'INFRASTRUCTURE',
  'APPLICATION',
  'FEATURE',
  'PLUGIN',
]);

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

export const ValidationSeveritySchema = z.enum(['ERROR', 'WARNING', 'INFO']);

export const ConflictTypeSchema = z.enum([
  'PORT',
  'IP_ADDRESS',
  'ROUTE',
  'INTERFACE',
  'NAME',
  'CONFIGURATION',
]);

export const DriftActionSchema = z.enum(['REAPPLY', 'ACCEPT', 'REVIEW']);

export const RuntimeHealthSchema = z.enum([
  'HEALTHY',
  'WARNING',
  'DEGRADED',
  'FAILED',
  'UNKNOWN',
]);

export const ChangeTypeSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);

export const RouterPlatformSchema = z.enum([
  'MIKROTIK',
  'OPENWRT',
  'VYOS',
  'GENERIC',
]);

export const CapabilityLevelSchema = z.enum([
  'NONE',
  'BASIC',
  'ADVANCED',
  'FULL',
]);

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

export const ValidationIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  field: z.string().nullable().optional(),
  severity: ValidationSeveritySchema,
  suggestedFix: z.string().nullable().optional(),
  docsUrl: z.string().url().nullable().optional(),
});

export const ResourceConflictSchema = z.object({
  type: ConflictTypeSchema,
  conflictingResourceUuid: z.string().min(1),
  description: z.string().min(1),
  resolution: z.string().nullable().optional(),
});

export const DependencyStatusSchema = z.object({
  resourceUuid: z.string().min(1),
  resourceType: z.string().min(1),
  isActive: z.boolean(),
  state: ResourceLifecycleStateSchema,
  reason: z.string().min(1),
});

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

export const DriftFieldSchema = z.object({
  path: z.string().min(1),
  expected: z.unknown(),
  actual: z.unknown(),
});

export const DriftInfoSchema = z.object({
  detectedAt: z.string().datetime(),
  driftedFields: z.array(DriftFieldSchema),
  suggestedAction: DriftActionSchema,
});

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

export const BandwidthDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  bytesIn: z.number().nonnegative(),
  bytesOut: z.number().nonnegative(),
  periodSeconds: z.number().int().positive(),
});

export const UptimeDataPointSchema = z.object({
  timestamp: z.string().datetime(),
  isUp: z.boolean(),
  periodSeconds: z.number().int().positive(),
});

export const HourlyStatsSchema = z.object({
  hour: z.string().datetime(),
  totalBytesIn: z.number().nonnegative(),
  totalBytesOut: z.number().nonnegative(),
  uptimePercent: z.number().min(0).max(100),
  errorCount: z.number().int().nonnegative(),
});

export const DailyStatsSchema = z.object({
  date: z.string().datetime(),
  totalBytesIn: z.number().nonnegative(),
  totalBytesOut: z.number().nonnegative(),
  uptimePercent: z.number().min(0).max(100),
  errorCount: z.number().int().nonnegative(),
  peakThroughputIn: z.number().nonnegative(),
  peakThroughputOut: z.number().nonnegative(),
});

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

export const ChangeLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  user: z.string().min(1),
  changeType: ChangeTypeSchema,
  changedFields: z.array(z.string()),
  summary: z.string().nullable().optional(),
});

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

export const ResourceReferenceSchema = z.object({
  uuid: z.string().min(1),
  id: z.string().min(1),
  type: z.string().min(1),
  category: ResourceCategorySchema,
  state: ResourceLifecycleStateSchema,
});

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

export const PlatformCapabilitiesSchema = z.object({
  isSupported: z.boolean(),
  level: CapabilityLevelSchema,
  minVersion: z.string().nullable().optional(),
  requiredPackages: z.array(z.string()).nullable().optional(),
  details: z.unknown().optional(),
});

export const PlatformLimitationSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  affectedFields: z.array(z.string()).nullable().optional(),
  workaround: z.string().nullable().optional(),
});

export const PlatformFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  description: z.string().nullable().optional(),
});

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

export const ResourceRelationshipsInputSchema = z.object({
  dependsOn: z.array(z.string().min(1)).optional(),
  routesVia: z.string().min(1).optional(),
  parent: z.string().min(1).optional(),
  custom: z.unknown().optional(),
});

export const CreateResourceInputSchema = z.object({
  routerId: z.string().min(1),
  type: z.string().min(1),
  category: ResourceCategorySchema,
  configuration: z.unknown(),
  relationships: ResourceRelationshipsInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const UpdateResourceInputSchema = z.object({
  configuration: z.unknown().optional(),
  relationships: ResourceRelationshipsInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type ResourceSchemaType = z.infer<typeof ResourceSchema>;
export type ValidationResultSchemaType = z.infer<typeof ValidationResultSchema>;
export type DeploymentStateSchemaType = z.infer<typeof DeploymentStateSchema>;
export type RuntimeStateSchemaType = z.infer<typeof RuntimeStateSchema>;
export type TelemetryDataSchemaType = z.infer<typeof TelemetryDataSchema>;
export type ResourceMetadataSchemaType = z.infer<typeof ResourceMetadataSchema>;
export type ResourceRelationshipsSchemaType = z.infer<
  typeof ResourceRelationshipsSchema
>;
export type PlatformInfoSchemaType = z.infer<typeof PlatformInfoSchema>;
export type CreateResourceInputSchemaType = z.infer<
  typeof CreateResourceInputSchema
>;
export type UpdateResourceInputSchemaType = z.infer<
  typeof UpdateResourceInputSchema
>;
