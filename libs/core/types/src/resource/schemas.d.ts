/**
 * Universal State v2 Zod Schemas
 *
 * Validation schemas for resource types.
 * Reference: ADR-012 - Universal State v2
 *
 * @module @nasnet/core/types/resource
 */
import { z } from 'zod';
/**
 * Resource category enumeration schema.
 * Defines the top-level categorization of resources.
 */
export declare const ResourceCategorySchema: z.ZodEnum<
  ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
>;
/**
 * Resource lifecycle state enumeration schema.
 * Defines the state progression of a resource through creation, validation,
 * application, and decommissioning.
 */
export declare const ResourceLifecycleStateSchema: z.ZodEnum<
  [
    'DRAFT',
    'VALIDATING',
    'VALID',
    'APPLYING',
    'ACTIVE',
    'DEGRADED',
    'ERROR',
    'DEPRECATED',
    'ARCHIVED',
  ]
>;
/**
 * Resource layer enumeration schema.
 * Identifies the 8 layers of the Universal State v2 model.
 */
export declare const ResourceLayerSchema: z.ZodEnum<
  [
    'CONFIGURATION',
    'VALIDATION',
    'DEPLOYMENT',
    'RUNTIME',
    'TELEMETRY',
    'METADATA',
    'RELATIONSHIPS',
    'PLATFORM',
  ]
>;
/**
 * Validation stage enumeration schema.
 * Defines the progression of validation checks through multiple stages.
 */
export declare const ValidationStageSchema: z.ZodEnum<
  ['SCHEMA', 'SEMANTIC', 'DEPENDENCY', 'CONFLICT', 'PLATFORM', 'QUOTA', 'SIMULATION', 'COMPLETE']
>;
/**
 * Validation severity enumeration schema.
 * Indicates the severity level of validation issues.
 */
export declare const ValidationSeveritySchema: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
/**
 * Conflict type enumeration schema.
 * Identifies the type of conflict detected during validation.
 */
export declare const ConflictTypeSchema: z.ZodEnum<
  ['PORT', 'IP_ADDRESS', 'ROUTE', 'INTERFACE', 'NAME', 'CONFIGURATION']
>;
/**
 * Drift action enumeration schema.
 * Defines the actions available to handle detected drift.
 */
export declare const DriftActionSchema: z.ZodEnum<['REAPPLY', 'ACCEPT', 'REVIEW']>;
/**
 * Runtime health enumeration schema.
 * Indicates the health status of a resource at runtime.
 */
export declare const RuntimeHealthSchema: z.ZodEnum<
  ['HEALTHY', 'WARNING', 'DEGRADED', 'FAILED', 'UNKNOWN']
>;
/**
 * Change type enumeration schema.
 * Identifies the type of change made to a resource.
 */
export declare const ChangeTypeSchema: z.ZodEnum<['CREATE', 'UPDATE', 'DELETE']>;
/**
 * Router platform enumeration schema.
 * Identifies the target router platform for a resource.
 */
export declare const RouterPlatformSchema: z.ZodEnum<['MIKROTIK', 'OPENWRT', 'VYOS', 'GENERIC']>;
/**
 * Capability level enumeration schema.
 * Indicates the level of capability support for a feature.
 */
export declare const CapabilityLevelSchema: z.ZodEnum<['NONE', 'BASIC', 'ADVANCED', 'FULL']>;
/**
 * Resource relationship type enumeration schema.
 * Defines the types of relationships that can exist between resources.
 */
export declare const ResourceRelationshipTypeSchema: z.ZodEnum<
  ['DEPENDS_ON', 'ROUTES_VIA', 'PARENT_CHILD', 'GROUP', 'CUSTOM']
>;
/**
 * Validation issue schema.
 * Represents a single validation error, warning, or info message.
 */
export declare const ValidationIssueSchema: z.ZodObject<
  {
    code: z.ZodString;
    message: z.ZodString;
    field: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    severity: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
    suggestedFix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    docsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    code: string;
    message: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    field?: string | null | undefined;
    suggestedFix?: string | null | undefined;
    docsUrl?: string | null | undefined;
  },
  {
    code: string;
    message: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    field?: string | null | undefined;
    suggestedFix?: string | null | undefined;
    docsUrl?: string | null | undefined;
  }
>;
/**
 * Resource conflict schema.
 * Represents a conflict detected between resources during validation.
 */
export declare const ResourceConflictSchema: z.ZodObject<
  {
    type: z.ZodEnum<['PORT', 'IP_ADDRESS', 'ROUTE', 'INTERFACE', 'NAME', 'CONFIGURATION']>;
    conflictingResourceUuid: z.ZodString;
    description: z.ZodString;
    resolution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
    description: string;
    conflictingResourceUuid: string;
    resolution?: string | null | undefined;
  },
  {
    type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
    description: string;
    conflictingResourceUuid: string;
    resolution?: string | null | undefined;
  }
>;
/**
 * Dependency status schema.
 * Tracks the status of a resource dependency.
 */
export declare const DependencyStatusSchema: z.ZodObject<
  {
    resourceUuid: z.ZodString;
    resourceType: z.ZodString;
    isActive: z.ZodBoolean;
    state: z.ZodEnum<
      [
        'DRAFT',
        'VALIDATING',
        'VALID',
        'APPLYING',
        'ACTIVE',
        'DEGRADED',
        'ERROR',
        'DEPRECATED',
        'ARCHIVED',
      ]
    >;
    reason: z.ZodString;
  },
  'strip',
  z.ZodTypeAny,
  {
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    resourceUuid: string;
    resourceType: string;
    isActive: boolean;
    reason: string;
  },
  {
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    resourceUuid: string;
    resourceType: string;
    isActive: boolean;
    reason: string;
  }
>;
/**
 * Validation result schema.
 * Complete validation outcome for a resource.
 */
export declare const ValidationResultSchema: z.ZodObject<
  {
    canApply: z.ZodBoolean;
    stage: z.ZodEnum<
      [
        'SCHEMA',
        'SEMANTIC',
        'DEPENDENCY',
        'CONFLICT',
        'PLATFORM',
        'QUOTA',
        'SIMULATION',
        'COMPLETE',
      ]
    >;
    errors: z.ZodArray<
      z.ZodObject<
        {
          code: z.ZodString;
          message: z.ZodString;
          field: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          severity: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
          suggestedFix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          docsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          code: string;
          message: string;
          severity: 'ERROR' | 'WARNING' | 'INFO';
          field?: string | null | undefined;
          suggestedFix?: string | null | undefined;
          docsUrl?: string | null | undefined;
        },
        {
          code: string;
          message: string;
          severity: 'ERROR' | 'WARNING' | 'INFO';
          field?: string | null | undefined;
          suggestedFix?: string | null | undefined;
          docsUrl?: string | null | undefined;
        }
      >,
      'many'
    >;
    warnings: z.ZodArray<
      z.ZodObject<
        {
          code: z.ZodString;
          message: z.ZodString;
          field: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          severity: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
          suggestedFix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          docsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          code: string;
          message: string;
          severity: 'ERROR' | 'WARNING' | 'INFO';
          field?: string | null | undefined;
          suggestedFix?: string | null | undefined;
          docsUrl?: string | null | undefined;
        },
        {
          code: string;
          message: string;
          severity: 'ERROR' | 'WARNING' | 'INFO';
          field?: string | null | undefined;
          suggestedFix?: string | null | undefined;
          docsUrl?: string | null | undefined;
        }
      >,
      'many'
    >;
    conflicts: z.ZodArray<
      z.ZodObject<
        {
          type: z.ZodEnum<['PORT', 'IP_ADDRESS', 'ROUTE', 'INTERFACE', 'NAME', 'CONFIGURATION']>;
          conflictingResourceUuid: z.ZodString;
          description: z.ZodString;
          resolution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
          description: string;
          conflictingResourceUuid: string;
          resolution?: string | null | undefined;
        },
        {
          type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
          description: string;
          conflictingResourceUuid: string;
          resolution?: string | null | undefined;
        }
      >,
      'many'
    >;
    requiredDependencies: z.ZodArray<
      z.ZodObject<
        {
          resourceUuid: z.ZodString;
          resourceType: z.ZodString;
          isActive: z.ZodBoolean;
          state: z.ZodEnum<
            [
              'DRAFT',
              'VALIDATING',
              'VALID',
              'APPLYING',
              'ACTIVE',
              'DEGRADED',
              'ERROR',
              'DEPRECATED',
              'ARCHIVED',
            ]
          >;
          reason: z.ZodString;
        },
        'strip',
        z.ZodTypeAny,
        {
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          resourceUuid: string;
          resourceType: string;
          isActive: boolean;
          reason: string;
        },
        {
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          resourceUuid: string;
          resourceType: string;
          isActive: boolean;
          reason: string;
        }
      >,
      'many'
    >;
    validatedAt: z.ZodString;
    validationDurationMs: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    errors: {
      code: string;
      message: string;
      severity: 'ERROR' | 'WARNING' | 'INFO';
      field?: string | null | undefined;
      suggestedFix?: string | null | undefined;
      docsUrl?: string | null | undefined;
    }[];
    canApply: boolean;
    stage:
      | 'SCHEMA'
      | 'SEMANTIC'
      | 'DEPENDENCY'
      | 'CONFLICT'
      | 'PLATFORM'
      | 'QUOTA'
      | 'SIMULATION'
      | 'COMPLETE';
    warnings: {
      code: string;
      message: string;
      severity: 'ERROR' | 'WARNING' | 'INFO';
      field?: string | null | undefined;
      suggestedFix?: string | null | undefined;
      docsUrl?: string | null | undefined;
    }[];
    conflicts: {
      type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
      description: string;
      conflictingResourceUuid: string;
      resolution?: string | null | undefined;
    }[];
    requiredDependencies: {
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      resourceUuid: string;
      resourceType: string;
      isActive: boolean;
      reason: string;
    }[];
    validatedAt: string;
    validationDurationMs: number;
  },
  {
    errors: {
      code: string;
      message: string;
      severity: 'ERROR' | 'WARNING' | 'INFO';
      field?: string | null | undefined;
      suggestedFix?: string | null | undefined;
      docsUrl?: string | null | undefined;
    }[];
    canApply: boolean;
    stage:
      | 'SCHEMA'
      | 'SEMANTIC'
      | 'DEPENDENCY'
      | 'CONFLICT'
      | 'PLATFORM'
      | 'QUOTA'
      | 'SIMULATION'
      | 'COMPLETE';
    warnings: {
      code: string;
      message: string;
      severity: 'ERROR' | 'WARNING' | 'INFO';
      field?: string | null | undefined;
      suggestedFix?: string | null | undefined;
      docsUrl?: string | null | undefined;
    }[];
    conflicts: {
      type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
      description: string;
      conflictingResourceUuid: string;
      resolution?: string | null | undefined;
    }[];
    requiredDependencies: {
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      resourceUuid: string;
      resourceType: string;
      isActive: boolean;
      reason: string;
    }[];
    validatedAt: string;
    validationDurationMs: number;
  }
>;
/**
 * Drift field schema.
 * Represents a single field that has drifted from expected configuration.
 */
export declare const DriftFieldSchema: z.ZodObject<
  {
    path: z.ZodString;
    expected: z.ZodUnknown;
    actual: z.ZodUnknown;
  },
  'strip',
  z.ZodTypeAny,
  {
    path: string;
    expected?: unknown;
    actual?: unknown;
  },
  {
    path: string;
    expected?: unknown;
    actual?: unknown;
  }
>;
/**
 * Drift information schema.
 * Comprehensive drift detection information for a deployed resource.
 */
export declare const DriftInfoSchema: z.ZodObject<
  {
    detectedAt: z.ZodString;
    driftedFields: z.ZodArray<
      z.ZodObject<
        {
          path: z.ZodString;
          expected: z.ZodUnknown;
          actual: z.ZodUnknown;
        },
        'strip',
        z.ZodTypeAny,
        {
          path: string;
          expected?: unknown;
          actual?: unknown;
        },
        {
          path: string;
          expected?: unknown;
          actual?: unknown;
        }
      >,
      'many'
    >;
    suggestedAction: z.ZodEnum<['REAPPLY', 'ACCEPT', 'REVIEW']>;
  },
  'strip',
  z.ZodTypeAny,
  {
    detectedAt: string;
    driftedFields: {
      path: string;
      expected?: unknown;
      actual?: unknown;
    }[];
    suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
  },
  {
    detectedAt: string;
    driftedFields: {
      path: string;
      expected?: unknown;
      actual?: unknown;
    }[];
    suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
  }
>;
/**
 * Deployment state schema.
 * Tracks the deployment status and sync state of a resource.
 */
export declare const DeploymentStateSchema: z.ZodObject<
  {
    routerResourceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    appliedAt: z.ZodString;
    appliedBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    routerVersion: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    generatedFields: z.ZodOptional<z.ZodUnknown>;
    isInSync: z.ZodBoolean;
    drift: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            detectedAt: z.ZodString;
            driftedFields: z.ZodArray<
              z.ZodObject<
                {
                  path: z.ZodString;
                  expected: z.ZodUnknown;
                  actual: z.ZodUnknown;
                },
                'strip',
                z.ZodTypeAny,
                {
                  path: string;
                  expected?: unknown;
                  actual?: unknown;
                },
                {
                  path: string;
                  expected?: unknown;
                  actual?: unknown;
                }
              >,
              'many'
            >;
            suggestedAction: z.ZodEnum<['REAPPLY', 'ACCEPT', 'REVIEW']>;
          },
          'strip',
          z.ZodTypeAny,
          {
            detectedAt: string;
            driftedFields: {
              path: string;
              expected?: unknown;
              actual?: unknown;
            }[];
            suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
          },
          {
            detectedAt: string;
            driftedFields: {
              path: string;
              expected?: unknown;
              actual?: unknown;
            }[];
            suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
          }
        >
      >
    >;
    applyOperationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    appliedAt: string;
    isInSync: boolean;
    routerResourceId?: string | null | undefined;
    appliedBy?: string | null | undefined;
    routerVersion?: number | null | undefined;
    generatedFields?: unknown;
    drift?:
      | {
          detectedAt: string;
          driftedFields: {
            path: string;
            expected?: unknown;
            actual?: unknown;
          }[];
          suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
        }
      | null
      | undefined;
    applyOperationId?: string | null | undefined;
  },
  {
    appliedAt: string;
    isInSync: boolean;
    routerResourceId?: string | null | undefined;
    appliedBy?: string | null | undefined;
    routerVersion?: number | null | undefined;
    generatedFields?: unknown;
    drift?:
      | {
          detectedAt: string;
          driftedFields: {
            path: string;
            expected?: unknown;
            actual?: unknown;
          }[];
          suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
        }
      | null
      | undefined;
    applyOperationId?: string | null | undefined;
  }
>;
/**
 * Runtime metrics schema.
 * Performance and operational metrics for a running resource.
 */
export declare const RuntimeMetricsSchema: z.ZodObject<
  {
    bytesIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    bytesOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    packetsIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    packetsOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    errors: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    drops: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    throughputIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    throughputOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    custom: z.ZodOptional<z.ZodUnknown>;
  },
  'strip',
  z.ZodTypeAny,
  {
    errors?: number | null | undefined;
    custom?: unknown;
    bytesIn?: number | null | undefined;
    bytesOut?: number | null | undefined;
    packetsIn?: number | null | undefined;
    packetsOut?: number | null | undefined;
    drops?: number | null | undefined;
    throughputIn?: number | null | undefined;
    throughputOut?: number | null | undefined;
  },
  {
    errors?: number | null | undefined;
    custom?: unknown;
    bytesIn?: number | null | undefined;
    bytesOut?: number | null | undefined;
    packetsIn?: number | null | undefined;
    packetsOut?: number | null | undefined;
    drops?: number | null | undefined;
    throughputIn?: number | null | undefined;
    throughputOut?: number | null | undefined;
  }
>;
/**
 * Runtime state schema.
 * Complete runtime state of an active resource.
 */
export declare const RuntimeStateSchema: z.ZodObject<
  {
    isRunning: z.ZodBoolean;
    health: z.ZodEnum<['HEALTHY', 'WARNING', 'DEGRADED', 'FAILED', 'UNKNOWN']>;
    errorMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metrics: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            bytesIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            bytesOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            packetsIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            packetsOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            errors: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            drops: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            throughputIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            throughputOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            custom: z.ZodOptional<z.ZodUnknown>;
          },
          'strip',
          z.ZodTypeAny,
          {
            errors?: number | null | undefined;
            custom?: unknown;
            bytesIn?: number | null | undefined;
            bytesOut?: number | null | undefined;
            packetsIn?: number | null | undefined;
            packetsOut?: number | null | undefined;
            drops?: number | null | undefined;
            throughputIn?: number | null | undefined;
            throughputOut?: number | null | undefined;
          },
          {
            errors?: number | null | undefined;
            custom?: unknown;
            bytesIn?: number | null | undefined;
            bytesOut?: number | null | undefined;
            packetsIn?: number | null | undefined;
            packetsOut?: number | null | undefined;
            drops?: number | null | undefined;
            throughputIn?: number | null | undefined;
            throughputOut?: number | null | undefined;
          }
        >
      >
    >;
    lastUpdated: z.ZodString;
    lastSuccessfulOperation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    activeConnections: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    uptime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    isRunning: boolean;
    health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
    lastUpdated: string;
    errorMessage?: string | null | undefined;
    metrics?:
      | {
          errors?: number | null | undefined;
          custom?: unknown;
          bytesIn?: number | null | undefined;
          bytesOut?: number | null | undefined;
          packetsIn?: number | null | undefined;
          packetsOut?: number | null | undefined;
          drops?: number | null | undefined;
          throughputIn?: number | null | undefined;
          throughputOut?: number | null | undefined;
        }
      | null
      | undefined;
    lastSuccessfulOperation?: string | null | undefined;
    activeConnections?: number | null | undefined;
    uptime?: string | null | undefined;
  },
  {
    isRunning: boolean;
    health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
    lastUpdated: string;
    errorMessage?: string | null | undefined;
    metrics?:
      | {
          errors?: number | null | undefined;
          custom?: unknown;
          bytesIn?: number | null | undefined;
          bytesOut?: number | null | undefined;
          packetsIn?: number | null | undefined;
          packetsOut?: number | null | undefined;
          drops?: number | null | undefined;
          throughputIn?: number | null | undefined;
          throughputOut?: number | null | undefined;
        }
      | null
      | undefined;
    lastSuccessfulOperation?: string | null | undefined;
    activeConnections?: number | null | undefined;
    uptime?: string | null | undefined;
  }
>;
/**
 * Bandwidth data point schema.
 * A single measurement of bandwidth usage.
 */
export declare const BandwidthDataPointSchema: z.ZodObject<
  {
    timestamp: z.ZodString;
    bytesIn: z.ZodNumber;
    bytesOut: z.ZodNumber;
    periodSeconds: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    bytesIn: number;
    bytesOut: number;
    timestamp: string;
    periodSeconds: number;
  },
  {
    bytesIn: number;
    bytesOut: number;
    timestamp: string;
    periodSeconds: number;
  }
>;
/**
 * Uptime data point schema.
 * A single measurement of resource availability.
 */
export declare const UptimeDataPointSchema: z.ZodObject<
  {
    timestamp: z.ZodString;
    isUp: z.ZodBoolean;
    periodSeconds: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    timestamp: string;
    periodSeconds: number;
    isUp: boolean;
  },
  {
    timestamp: string;
    periodSeconds: number;
    isUp: boolean;
  }
>;
/**
 * Hourly statistics schema.
 * Aggregated statistics for an hour of resource operation.
 */
export declare const HourlyStatsSchema: z.ZodObject<
  {
    hour: z.ZodString;
    totalBytesIn: z.ZodNumber;
    totalBytesOut: z.ZodNumber;
    uptimePercent: z.ZodNumber;
    errorCount: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    hour: string;
    totalBytesIn: number;
    totalBytesOut: number;
    uptimePercent: number;
    errorCount: number;
  },
  {
    hour: string;
    totalBytesIn: number;
    totalBytesOut: number;
    uptimePercent: number;
    errorCount: number;
  }
>;
/**
 * Daily statistics schema.
 * Aggregated statistics for a day of resource operation.
 */
export declare const DailyStatsSchema: z.ZodObject<
  {
    date: z.ZodString;
    totalBytesIn: z.ZodNumber;
    totalBytesOut: z.ZodNumber;
    uptimePercent: z.ZodNumber;
    errorCount: z.ZodNumber;
    peakThroughputIn: z.ZodNumber;
    peakThroughputOut: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    date: string;
    totalBytesIn: number;
    totalBytesOut: number;
    uptimePercent: number;
    errorCount: number;
    peakThroughputIn: number;
    peakThroughputOut: number;
  },
  {
    date: string;
    totalBytesIn: number;
    totalBytesOut: number;
    uptimePercent: number;
    errorCount: number;
    peakThroughputIn: number;
    peakThroughputOut: number;
  }
>;
/**
 * Telemetry data schema.
 * Historical telemetry and performance metrics for a resource.
 */
export declare const TelemetryDataSchema: z.ZodObject<
  {
    bandwidthHistory: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              timestamp: z.ZodString;
              bytesIn: z.ZodNumber;
              bytesOut: z.ZodNumber;
              periodSeconds: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
              bytesIn: number;
              bytesOut: number;
              timestamp: string;
              periodSeconds: number;
            },
            {
              bytesIn: number;
              bytesOut: number;
              timestamp: string;
              periodSeconds: number;
            }
          >,
          'many'
        >
      >
    >;
    uptimeHistory: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              timestamp: z.ZodString;
              isUp: z.ZodBoolean;
              periodSeconds: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
              timestamp: string;
              periodSeconds: number;
              isUp: boolean;
            },
            {
              timestamp: string;
              periodSeconds: number;
              isUp: boolean;
            }
          >,
          'many'
        >
      >
    >;
    hourlyStats: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              hour: z.ZodString;
              totalBytesIn: z.ZodNumber;
              totalBytesOut: z.ZodNumber;
              uptimePercent: z.ZodNumber;
              errorCount: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
              hour: string;
              totalBytesIn: number;
              totalBytesOut: number;
              uptimePercent: number;
              errorCount: number;
            },
            {
              hour: string;
              totalBytesIn: number;
              totalBytesOut: number;
              uptimePercent: number;
              errorCount: number;
            }
          >,
          'many'
        >
      >
    >;
    dailyStats: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              date: z.ZodString;
              totalBytesIn: z.ZodNumber;
              totalBytesOut: z.ZodNumber;
              uptimePercent: z.ZodNumber;
              errorCount: z.ZodNumber;
              peakThroughputIn: z.ZodNumber;
              peakThroughputOut: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
              date: string;
              totalBytesIn: number;
              totalBytesOut: number;
              uptimePercent: number;
              errorCount: number;
              peakThroughputIn: number;
              peakThroughputOut: number;
            },
            {
              date: string;
              totalBytesIn: number;
              totalBytesOut: number;
              uptimePercent: number;
              errorCount: number;
              peakThroughputIn: number;
              peakThroughputOut: number;
            }
          >,
          'many'
        >
      >
    >;
    dataStartedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastUpdatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    retentionDays: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    retentionDays: number;
    bandwidthHistory?:
      | {
          bytesIn: number;
          bytesOut: number;
          timestamp: string;
          periodSeconds: number;
        }[]
      | null
      | undefined;
    uptimeHistory?:
      | {
          timestamp: string;
          periodSeconds: number;
          isUp: boolean;
        }[]
      | null
      | undefined;
    hourlyStats?:
      | {
          hour: string;
          totalBytesIn: number;
          totalBytesOut: number;
          uptimePercent: number;
          errorCount: number;
        }[]
      | null
      | undefined;
    dailyStats?:
      | {
          date: string;
          totalBytesIn: number;
          totalBytesOut: number;
          uptimePercent: number;
          errorCount: number;
          peakThroughputIn: number;
          peakThroughputOut: number;
        }[]
      | null
      | undefined;
    dataStartedAt?: string | null | undefined;
    lastUpdatedAt?: string | null | undefined;
  },
  {
    retentionDays: number;
    bandwidthHistory?:
      | {
          bytesIn: number;
          bytesOut: number;
          timestamp: string;
          periodSeconds: number;
        }[]
      | null
      | undefined;
    uptimeHistory?:
      | {
          timestamp: string;
          periodSeconds: number;
          isUp: boolean;
        }[]
      | null
      | undefined;
    hourlyStats?:
      | {
          hour: string;
          totalBytesIn: number;
          totalBytesOut: number;
          uptimePercent: number;
          errorCount: number;
        }[]
      | null
      | undefined;
    dailyStats?:
      | {
          date: string;
          totalBytesIn: number;
          totalBytesOut: number;
          uptimePercent: number;
          errorCount: number;
          peakThroughputIn: number;
          peakThroughputOut: number;
        }[]
      | null
      | undefined;
    dataStartedAt?: string | null | undefined;
    lastUpdatedAt?: string | null | undefined;
  }
>;
/**
 * Change log entry schema.
 * Records a single change to a resource.
 */
export declare const ChangeLogEntrySchema: z.ZodObject<
  {
    timestamp: z.ZodString;
    user: z.ZodString;
    changeType: z.ZodEnum<['CREATE', 'UPDATE', 'DELETE']>;
    changedFields: z.ZodArray<z.ZodString, 'many'>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    user: string;
    timestamp: string;
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    changedFields: string[];
    summary?: string | null | undefined;
  },
  {
    user: string;
    timestamp: string;
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    changedFields: string[];
    summary?: string | null | undefined;
  }
>;
/**
 * Resource metadata schema.
 * Metadata about a resource including creation, modification, and tagging.
 */
export declare const ResourceMetadataSchema: z.ZodObject<
  {
    createdAt: z.ZodString;
    createdBy: z.ZodString;
    updatedAt: z.ZodString;
    updatedBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    state: z.ZodEnum<
      [
        'DRAFT',
        'VALIDATING',
        'VALID',
        'APPLYING',
        'ACTIVE',
        'DEGRADED',
        'ERROR',
        'DEPRECATED',
        'ARCHIVED',
      ]
    >;
    version: z.ZodNumber;
    tags: z.ZodArray<z.ZodString, 'many'>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isFavorite: z.ZodBoolean;
    isPinned: z.ZodBoolean;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    recentChanges: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              timestamp: z.ZodString;
              user: z.ZodString;
              changeType: z.ZodEnum<['CREATE', 'UPDATE', 'DELETE']>;
              changedFields: z.ZodArray<z.ZodString, 'many'>;
              summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            },
            'strip',
            z.ZodTypeAny,
            {
              user: string;
              timestamp: string;
              changeType: 'CREATE' | 'UPDATE' | 'DELETE';
              changedFields: string[];
              summary?: string | null | undefined;
            },
            {
              user: string;
              timestamp: string;
              changeType: 'CREATE' | 'UPDATE' | 'DELETE';
              changedFields: string[];
              summary?: string | null | undefined;
            }
          >,
          'many'
        >
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    version: number;
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    tags: string[];
    updatedAt: string;
    isFavorite: boolean;
    createdAt: string;
    createdBy: string;
    isPinned: boolean;
    description?: string | null | undefined;
    updatedBy?: string | null | undefined;
    notes?: string | null | undefined;
    recentChanges?:
      | {
          user: string;
          timestamp: string;
          changeType: 'CREATE' | 'UPDATE' | 'DELETE';
          changedFields: string[];
          summary?: string | null | undefined;
        }[]
      | null
      | undefined;
  },
  {
    version: number;
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    tags: string[];
    updatedAt: string;
    isFavorite: boolean;
    createdAt: string;
    createdBy: string;
    isPinned: boolean;
    description?: string | null | undefined;
    updatedBy?: string | null | undefined;
    notes?: string | null | undefined;
    recentChanges?:
      | {
          user: string;
          timestamp: string;
          changeType: 'CREATE' | 'UPDATE' | 'DELETE';
          changedFields: string[];
          summary?: string | null | undefined;
        }[]
      | null
      | undefined;
  }
>;
/**
 * Resource reference schema.
 * Lightweight reference to another resource.
 */
export declare const ResourceReferenceSchema: z.ZodObject<
  {
    uuid: z.ZodString;
    id: z.ZodString;
    type: z.ZodString;
    category: z.ZodEnum<['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']>;
    state: z.ZodEnum<
      [
        'DRAFT',
        'VALIDATING',
        'VALID',
        'APPLYING',
        'ACTIVE',
        'DEGRADED',
        'ERROR',
        'DEPRECATED',
        'ARCHIVED',
      ]
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    type: string;
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    uuid: string;
  },
  {
    id: string;
    type: string;
    state:
      | 'DRAFT'
      | 'VALIDATING'
      | 'VALID'
      | 'APPLYING'
      | 'ACTIVE'
      | 'DEGRADED'
      | 'ERROR'
      | 'DEPRECATED'
      | 'ARCHIVED';
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    uuid: string;
  }
>;
/**
 * Resource relationships schema.
 * All relationships for a resource including dependencies and hierarchy.
 */
export declare const ResourceRelationshipsSchema: z.ZodObject<
  {
    dependsOn: z.ZodArray<
      z.ZodObject<
        {
          uuid: z.ZodString;
          id: z.ZodString;
          type: z.ZodString;
          category: z.ZodEnum<
            ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
          >;
          state: z.ZodEnum<
            [
              'DRAFT',
              'VALIDATING',
              'VALID',
              'APPLYING',
              'ACTIVE',
              'DEGRADED',
              'ERROR',
              'DEPRECATED',
              'ARCHIVED',
            ]
          >;
        },
        'strip',
        z.ZodTypeAny,
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        },
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      >,
      'many'
    >;
    dependents: z.ZodArray<
      z.ZodObject<
        {
          uuid: z.ZodString;
          id: z.ZodString;
          type: z.ZodString;
          category: z.ZodEnum<
            ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
          >;
          state: z.ZodEnum<
            [
              'DRAFT',
              'VALIDATING',
              'VALID',
              'APPLYING',
              'ACTIVE',
              'DEGRADED',
              'ERROR',
              'DEPRECATED',
              'ARCHIVED',
            ]
          >;
        },
        'strip',
        z.ZodTypeAny,
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        },
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      >,
      'many'
    >;
    routesVia: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            uuid: z.ZodString;
            id: z.ZodString;
            type: z.ZodString;
            category: z.ZodEnum<
              ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
            >;
            state: z.ZodEnum<
              [
                'DRAFT',
                'VALIDATING',
                'VALID',
                'APPLYING',
                'ACTIVE',
                'DEGRADED',
                'ERROR',
                'DEPRECATED',
                'ARCHIVED',
              ]
            >;
          },
          'strip',
          z.ZodTypeAny,
          {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          },
          {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }
        >
      >
    >;
    routedBy: z.ZodArray<
      z.ZodObject<
        {
          uuid: z.ZodString;
          id: z.ZodString;
          type: z.ZodString;
          category: z.ZodEnum<
            ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
          >;
          state: z.ZodEnum<
            [
              'DRAFT',
              'VALIDATING',
              'VALID',
              'APPLYING',
              'ACTIVE',
              'DEGRADED',
              'ERROR',
              'DEPRECATED',
              'ARCHIVED',
            ]
          >;
        },
        'strip',
        z.ZodTypeAny,
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        },
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      >,
      'many'
    >;
    parent: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            uuid: z.ZodString;
            id: z.ZodString;
            type: z.ZodString;
            category: z.ZodEnum<
              ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
            >;
            state: z.ZodEnum<
              [
                'DRAFT',
                'VALIDATING',
                'VALID',
                'APPLYING',
                'ACTIVE',
                'DEGRADED',
                'ERROR',
                'DEPRECATED',
                'ARCHIVED',
              ]
            >;
          },
          'strip',
          z.ZodTypeAny,
          {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          },
          {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }
        >
      >
    >;
    children: z.ZodArray<
      z.ZodObject<
        {
          uuid: z.ZodString;
          id: z.ZodString;
          type: z.ZodString;
          category: z.ZodEnum<
            ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
          >;
          state: z.ZodEnum<
            [
              'DRAFT',
              'VALIDATING',
              'VALID',
              'APPLYING',
              'ACTIVE',
              'DEGRADED',
              'ERROR',
              'DEPRECATED',
              'ARCHIVED',
            ]
          >;
        },
        'strip',
        z.ZodTypeAny,
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        },
        {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      >,
      'many'
    >;
    custom: z.ZodOptional<z.ZodUnknown>;
  },
  'strip',
  z.ZodTypeAny,
  {
    children: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    dependsOn: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    dependents: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    routedBy: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    custom?: unknown;
    routesVia?:
      | {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      | null
      | undefined;
    parent?:
      | {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      | null
      | undefined;
  },
  {
    children: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    dependsOn: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    dependents: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    routedBy: {
      id: string;
      type: string;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
      uuid: string;
    }[];
    custom?: unknown;
    routesVia?:
      | {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      | null
      | undefined;
    parent?:
      | {
          id: string;
          type: string;
          state:
            | 'DRAFT'
            | 'VALIDATING'
            | 'VALID'
            | 'APPLYING'
            | 'ACTIVE'
            | 'DEGRADED'
            | 'ERROR'
            | 'DEPRECATED'
            | 'ARCHIVED';
          category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
          uuid: string;
        }
      | null
      | undefined;
  }
>;
/**
 * Platform capabilities schema.
 * Defines supported capabilities on a specific router platform.
 */
export declare const PlatformCapabilitiesSchema: z.ZodObject<
  {
    isSupported: z.ZodBoolean;
    level: z.ZodEnum<['NONE', 'BASIC', 'ADVANCED', 'FULL']>;
    minVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    requiredPackages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
    details: z.ZodOptional<z.ZodUnknown>;
  },
  'strip',
  z.ZodTypeAny,
  {
    isSupported: boolean;
    level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
    details?: unknown;
    minVersion?: string | null | undefined;
    requiredPackages?: string[] | null | undefined;
  },
  {
    isSupported: boolean;
    level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
    details?: unknown;
    minVersion?: string | null | undefined;
    requiredPackages?: string[] | null | undefined;
  }
>;
/**
 * Platform limitation schema.
 * Describes a limitation of a resource on a specific platform.
 */
export declare const PlatformLimitationSchema: z.ZodObject<
  {
    code: z.ZodString;
    description: z.ZodString;
    affectedFields: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
    workaround: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    code: string;
    description: string;
    affectedFields?: string[] | null | undefined;
    workaround?: string | null | undefined;
  },
  {
    code: string;
    description: string;
    affectedFields?: string[] | null | undefined;
    workaround?: string | null | undefined;
  }
>;
/**
 * Platform feature schema.
 * Describes an optional feature available on a platform.
 */
export declare const PlatformFeatureSchema: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    enabled: z.ZodBoolean;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    name: string;
    enabled: boolean;
    description?: string | null | undefined;
  },
  {
    id: string;
    name: string;
    enabled: boolean;
    description?: string | null | undefined;
  }
>;
/**
 * Platform information schema.
 * Complete platform information and capabilities for a resource.
 */
export declare const PlatformInfoSchema: z.ZodObject<
  {
    current: z.ZodEnum<['MIKROTIK', 'OPENWRT', 'VYOS', 'GENERIC']>;
    capabilities: z.ZodObject<
      {
        isSupported: z.ZodBoolean;
        level: z.ZodEnum<['NONE', 'BASIC', 'ADVANCED', 'FULL']>;
        minVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        requiredPackages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
        details: z.ZodOptional<z.ZodUnknown>;
      },
      'strip',
      z.ZodTypeAny,
      {
        isSupported: boolean;
        level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
        details?: unknown;
        minVersion?: string | null | undefined;
        requiredPackages?: string[] | null | undefined;
      },
      {
        isSupported: boolean;
        level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
        details?: unknown;
        minVersion?: string | null | undefined;
        requiredPackages?: string[] | null | undefined;
      }
    >;
    fieldMappings: z.ZodOptional<z.ZodUnknown>;
    limitations: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              code: z.ZodString;
              description: z.ZodString;
              affectedFields: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
              workaround: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            },
            'strip',
            z.ZodTypeAny,
            {
              code: string;
              description: string;
              affectedFields?: string[] | null | undefined;
              workaround?: string | null | undefined;
            },
            {
              code: string;
              description: string;
              affectedFields?: string[] | null | undefined;
              workaround?: string | null | undefined;
            }
          >,
          'many'
        >
      >
    >;
    features: z.ZodOptional<
      z.ZodNullable<
        z.ZodArray<
          z.ZodObject<
            {
              id: z.ZodString;
              name: z.ZodString;
              enabled: z.ZodBoolean;
              description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            },
            'strip',
            z.ZodTypeAny,
            {
              id: string;
              name: string;
              enabled: boolean;
              description?: string | null | undefined;
            },
            {
              id: string;
              name: string;
              enabled: boolean;
              description?: string | null | undefined;
            }
          >,
          'many'
        >
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
    capabilities: {
      isSupported: boolean;
      level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
      details?: unknown;
      minVersion?: string | null | undefined;
      requiredPackages?: string[] | null | undefined;
    };
    fieldMappings?: unknown;
    limitations?:
      | {
          code: string;
          description: string;
          affectedFields?: string[] | null | undefined;
          workaround?: string | null | undefined;
        }[]
      | null
      | undefined;
    features?:
      | {
          id: string;
          name: string;
          enabled: boolean;
          description?: string | null | undefined;
        }[]
      | null
      | undefined;
  },
  {
    current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
    capabilities: {
      isSupported: boolean;
      level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
      details?: unknown;
      minVersion?: string | null | undefined;
      requiredPackages?: string[] | null | undefined;
    };
    fieldMappings?: unknown;
    limitations?:
      | {
          code: string;
          description: string;
          affectedFields?: string[] | null | undefined;
          workaround?: string | null | undefined;
        }[]
      | null
      | undefined;
    features?:
      | {
          id: string;
          name: string;
          enabled: boolean;
          description?: string | null | undefined;
        }[]
      | null
      | undefined;
  }
>;
/**
 * Complete resource schema.
 * Includes all 8 layers of Universal State v2.
 */
export declare const ResourceSchema: z.ZodObject<
  {
    uuid: z.ZodString;
    id: z.ZodString;
    type: z.ZodString;
    category: z.ZodEnum<['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']>;
    configuration: z.ZodUnknown;
    validation: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            canApply: z.ZodBoolean;
            stage: z.ZodEnum<
              [
                'SCHEMA',
                'SEMANTIC',
                'DEPENDENCY',
                'CONFLICT',
                'PLATFORM',
                'QUOTA',
                'SIMULATION',
                'COMPLETE',
              ]
            >;
            errors: z.ZodArray<
              z.ZodObject<
                {
                  code: z.ZodString;
                  message: z.ZodString;
                  field: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                  severity: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
                  suggestedFix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                  docsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  code: string;
                  message: string;
                  severity: 'ERROR' | 'WARNING' | 'INFO';
                  field?: string | null | undefined;
                  suggestedFix?: string | null | undefined;
                  docsUrl?: string | null | undefined;
                },
                {
                  code: string;
                  message: string;
                  severity: 'ERROR' | 'WARNING' | 'INFO';
                  field?: string | null | undefined;
                  suggestedFix?: string | null | undefined;
                  docsUrl?: string | null | undefined;
                }
              >,
              'many'
            >;
            warnings: z.ZodArray<
              z.ZodObject<
                {
                  code: z.ZodString;
                  message: z.ZodString;
                  field: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                  severity: z.ZodEnum<['ERROR', 'WARNING', 'INFO']>;
                  suggestedFix: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                  docsUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  code: string;
                  message: string;
                  severity: 'ERROR' | 'WARNING' | 'INFO';
                  field?: string | null | undefined;
                  suggestedFix?: string | null | undefined;
                  docsUrl?: string | null | undefined;
                },
                {
                  code: string;
                  message: string;
                  severity: 'ERROR' | 'WARNING' | 'INFO';
                  field?: string | null | undefined;
                  suggestedFix?: string | null | undefined;
                  docsUrl?: string | null | undefined;
                }
              >,
              'many'
            >;
            conflicts: z.ZodArray<
              z.ZodObject<
                {
                  type: z.ZodEnum<
                    ['PORT', 'IP_ADDRESS', 'ROUTE', 'INTERFACE', 'NAME', 'CONFIGURATION']
                  >;
                  conflictingResourceUuid: z.ZodString;
                  description: z.ZodString;
                  resolution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
                  description: string;
                  conflictingResourceUuid: string;
                  resolution?: string | null | undefined;
                },
                {
                  type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
                  description: string;
                  conflictingResourceUuid: string;
                  resolution?: string | null | undefined;
                }
              >,
              'many'
            >;
            requiredDependencies: z.ZodArray<
              z.ZodObject<
                {
                  resourceUuid: z.ZodString;
                  resourceType: z.ZodString;
                  isActive: z.ZodBoolean;
                  state: z.ZodEnum<
                    [
                      'DRAFT',
                      'VALIDATING',
                      'VALID',
                      'APPLYING',
                      'ACTIVE',
                      'DEGRADED',
                      'ERROR',
                      'DEPRECATED',
                      'ARCHIVED',
                    ]
                  >;
                  reason: z.ZodString;
                },
                'strip',
                z.ZodTypeAny,
                {
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  resourceUuid: string;
                  resourceType: string;
                  isActive: boolean;
                  reason: string;
                },
                {
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  resourceUuid: string;
                  resourceType: string;
                  isActive: boolean;
                  reason: string;
                }
              >,
              'many'
            >;
            validatedAt: z.ZodString;
            validationDurationMs: z.ZodNumber;
          },
          'strip',
          z.ZodTypeAny,
          {
            errors: {
              code: string;
              message: string;
              severity: 'ERROR' | 'WARNING' | 'INFO';
              field?: string | null | undefined;
              suggestedFix?: string | null | undefined;
              docsUrl?: string | null | undefined;
            }[];
            canApply: boolean;
            stage:
              | 'SCHEMA'
              | 'SEMANTIC'
              | 'DEPENDENCY'
              | 'CONFLICT'
              | 'PLATFORM'
              | 'QUOTA'
              | 'SIMULATION'
              | 'COMPLETE';
            warnings: {
              code: string;
              message: string;
              severity: 'ERROR' | 'WARNING' | 'INFO';
              field?: string | null | undefined;
              suggestedFix?: string | null | undefined;
              docsUrl?: string | null | undefined;
            }[];
            conflicts: {
              type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
              description: string;
              conflictingResourceUuid: string;
              resolution?: string | null | undefined;
            }[];
            requiredDependencies: {
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              resourceUuid: string;
              resourceType: string;
              isActive: boolean;
              reason: string;
            }[];
            validatedAt: string;
            validationDurationMs: number;
          },
          {
            errors: {
              code: string;
              message: string;
              severity: 'ERROR' | 'WARNING' | 'INFO';
              field?: string | null | undefined;
              suggestedFix?: string | null | undefined;
              docsUrl?: string | null | undefined;
            }[];
            canApply: boolean;
            stage:
              | 'SCHEMA'
              | 'SEMANTIC'
              | 'DEPENDENCY'
              | 'CONFLICT'
              | 'PLATFORM'
              | 'QUOTA'
              | 'SIMULATION'
              | 'COMPLETE';
            warnings: {
              code: string;
              message: string;
              severity: 'ERROR' | 'WARNING' | 'INFO';
              field?: string | null | undefined;
              suggestedFix?: string | null | undefined;
              docsUrl?: string | null | undefined;
            }[];
            conflicts: {
              type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
              description: string;
              conflictingResourceUuid: string;
              resolution?: string | null | undefined;
            }[];
            requiredDependencies: {
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              resourceUuid: string;
              resourceType: string;
              isActive: boolean;
              reason: string;
            }[];
            validatedAt: string;
            validationDurationMs: number;
          }
        >
      >
    >;
    deployment: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            routerResourceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            appliedAt: z.ZodString;
            appliedBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            routerVersion: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            generatedFields: z.ZodOptional<z.ZodUnknown>;
            isInSync: z.ZodBoolean;
            drift: z.ZodOptional<
              z.ZodNullable<
                z.ZodObject<
                  {
                    detectedAt: z.ZodString;
                    driftedFields: z.ZodArray<
                      z.ZodObject<
                        {
                          path: z.ZodString;
                          expected: z.ZodUnknown;
                          actual: z.ZodUnknown;
                        },
                        'strip',
                        z.ZodTypeAny,
                        {
                          path: string;
                          expected?: unknown;
                          actual?: unknown;
                        },
                        {
                          path: string;
                          expected?: unknown;
                          actual?: unknown;
                        }
                      >,
                      'many'
                    >;
                    suggestedAction: z.ZodEnum<['REAPPLY', 'ACCEPT', 'REVIEW']>;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    detectedAt: string;
                    driftedFields: {
                      path: string;
                      expected?: unknown;
                      actual?: unknown;
                    }[];
                    suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
                  },
                  {
                    detectedAt: string;
                    driftedFields: {
                      path: string;
                      expected?: unknown;
                      actual?: unknown;
                    }[];
                    suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
                  }
                >
              >
            >;
            applyOperationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            appliedAt: string;
            isInSync: boolean;
            routerResourceId?: string | null | undefined;
            appliedBy?: string | null | undefined;
            routerVersion?: number | null | undefined;
            generatedFields?: unknown;
            drift?:
              | {
                  detectedAt: string;
                  driftedFields: {
                    path: string;
                    expected?: unknown;
                    actual?: unknown;
                  }[];
                  suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
                }
              | null
              | undefined;
            applyOperationId?: string | null | undefined;
          },
          {
            appliedAt: string;
            isInSync: boolean;
            routerResourceId?: string | null | undefined;
            appliedBy?: string | null | undefined;
            routerVersion?: number | null | undefined;
            generatedFields?: unknown;
            drift?:
              | {
                  detectedAt: string;
                  driftedFields: {
                    path: string;
                    expected?: unknown;
                    actual?: unknown;
                  }[];
                  suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
                }
              | null
              | undefined;
            applyOperationId?: string | null | undefined;
          }
        >
      >
    >;
    runtime: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            isRunning: z.ZodBoolean;
            health: z.ZodEnum<['HEALTHY', 'WARNING', 'DEGRADED', 'FAILED', 'UNKNOWN']>;
            errorMessage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            metrics: z.ZodOptional<
              z.ZodNullable<
                z.ZodObject<
                  {
                    bytesIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    bytesOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    packetsIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    packetsOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    errors: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    drops: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    throughputIn: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    throughputOut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                    custom: z.ZodOptional<z.ZodUnknown>;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    errors?: number | null | undefined;
                    custom?: unknown;
                    bytesIn?: number | null | undefined;
                    bytesOut?: number | null | undefined;
                    packetsIn?: number | null | undefined;
                    packetsOut?: number | null | undefined;
                    drops?: number | null | undefined;
                    throughputIn?: number | null | undefined;
                    throughputOut?: number | null | undefined;
                  },
                  {
                    errors?: number | null | undefined;
                    custom?: unknown;
                    bytesIn?: number | null | undefined;
                    bytesOut?: number | null | undefined;
                    packetsIn?: number | null | undefined;
                    packetsOut?: number | null | undefined;
                    drops?: number | null | undefined;
                    throughputIn?: number | null | undefined;
                    throughputOut?: number | null | undefined;
                  }
                >
              >
            >;
            lastUpdated: z.ZodString;
            lastSuccessfulOperation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            activeConnections: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            uptime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            isRunning: boolean;
            health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
            lastUpdated: string;
            errorMessage?: string | null | undefined;
            metrics?:
              | {
                  errors?: number | null | undefined;
                  custom?: unknown;
                  bytesIn?: number | null | undefined;
                  bytesOut?: number | null | undefined;
                  packetsIn?: number | null | undefined;
                  packetsOut?: number | null | undefined;
                  drops?: number | null | undefined;
                  throughputIn?: number | null | undefined;
                  throughputOut?: number | null | undefined;
                }
              | null
              | undefined;
            lastSuccessfulOperation?: string | null | undefined;
            activeConnections?: number | null | undefined;
            uptime?: string | null | undefined;
          },
          {
            isRunning: boolean;
            health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
            lastUpdated: string;
            errorMessage?: string | null | undefined;
            metrics?:
              | {
                  errors?: number | null | undefined;
                  custom?: unknown;
                  bytesIn?: number | null | undefined;
                  bytesOut?: number | null | undefined;
                  packetsIn?: number | null | undefined;
                  packetsOut?: number | null | undefined;
                  drops?: number | null | undefined;
                  throughputIn?: number | null | undefined;
                  throughputOut?: number | null | undefined;
                }
              | null
              | undefined;
            lastSuccessfulOperation?: string | null | undefined;
            activeConnections?: number | null | undefined;
            uptime?: string | null | undefined;
          }
        >
      >
    >;
    telemetry: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            bandwidthHistory: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      timestamp: z.ZodString;
                      bytesIn: z.ZodNumber;
                      bytesOut: z.ZodNumber;
                      periodSeconds: z.ZodNumber;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      bytesIn: number;
                      bytesOut: number;
                      timestamp: string;
                      periodSeconds: number;
                    },
                    {
                      bytesIn: number;
                      bytesOut: number;
                      timestamp: string;
                      periodSeconds: number;
                    }
                  >,
                  'many'
                >
              >
            >;
            uptimeHistory: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      timestamp: z.ZodString;
                      isUp: z.ZodBoolean;
                      periodSeconds: z.ZodNumber;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      timestamp: string;
                      periodSeconds: number;
                      isUp: boolean;
                    },
                    {
                      timestamp: string;
                      periodSeconds: number;
                      isUp: boolean;
                    }
                  >,
                  'many'
                >
              >
            >;
            hourlyStats: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      hour: z.ZodString;
                      totalBytesIn: z.ZodNumber;
                      totalBytesOut: z.ZodNumber;
                      uptimePercent: z.ZodNumber;
                      errorCount: z.ZodNumber;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      hour: string;
                      totalBytesIn: number;
                      totalBytesOut: number;
                      uptimePercent: number;
                      errorCount: number;
                    },
                    {
                      hour: string;
                      totalBytesIn: number;
                      totalBytesOut: number;
                      uptimePercent: number;
                      errorCount: number;
                    }
                  >,
                  'many'
                >
              >
            >;
            dailyStats: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      date: z.ZodString;
                      totalBytesIn: z.ZodNumber;
                      totalBytesOut: z.ZodNumber;
                      uptimePercent: z.ZodNumber;
                      errorCount: z.ZodNumber;
                      peakThroughputIn: z.ZodNumber;
                      peakThroughputOut: z.ZodNumber;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      date: string;
                      totalBytesIn: number;
                      totalBytesOut: number;
                      uptimePercent: number;
                      errorCount: number;
                      peakThroughputIn: number;
                      peakThroughputOut: number;
                    },
                    {
                      date: string;
                      totalBytesIn: number;
                      totalBytesOut: number;
                      uptimePercent: number;
                      errorCount: number;
                      peakThroughputIn: number;
                      peakThroughputOut: number;
                    }
                  >,
                  'many'
                >
              >
            >;
            dataStartedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            lastUpdatedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            retentionDays: z.ZodNumber;
          },
          'strip',
          z.ZodTypeAny,
          {
            retentionDays: number;
            bandwidthHistory?:
              | {
                  bytesIn: number;
                  bytesOut: number;
                  timestamp: string;
                  periodSeconds: number;
                }[]
              | null
              | undefined;
            uptimeHistory?:
              | {
                  timestamp: string;
                  periodSeconds: number;
                  isUp: boolean;
                }[]
              | null
              | undefined;
            hourlyStats?:
              | {
                  hour: string;
                  totalBytesIn: number;
                  totalBytesOut: number;
                  uptimePercent: number;
                  errorCount: number;
                }[]
              | null
              | undefined;
            dailyStats?:
              | {
                  date: string;
                  totalBytesIn: number;
                  totalBytesOut: number;
                  uptimePercent: number;
                  errorCount: number;
                  peakThroughputIn: number;
                  peakThroughputOut: number;
                }[]
              | null
              | undefined;
            dataStartedAt?: string | null | undefined;
            lastUpdatedAt?: string | null | undefined;
          },
          {
            retentionDays: number;
            bandwidthHistory?:
              | {
                  bytesIn: number;
                  bytesOut: number;
                  timestamp: string;
                  periodSeconds: number;
                }[]
              | null
              | undefined;
            uptimeHistory?:
              | {
                  timestamp: string;
                  periodSeconds: number;
                  isUp: boolean;
                }[]
              | null
              | undefined;
            hourlyStats?:
              | {
                  hour: string;
                  totalBytesIn: number;
                  totalBytesOut: number;
                  uptimePercent: number;
                  errorCount: number;
                }[]
              | null
              | undefined;
            dailyStats?:
              | {
                  date: string;
                  totalBytesIn: number;
                  totalBytesOut: number;
                  uptimePercent: number;
                  errorCount: number;
                  peakThroughputIn: number;
                  peakThroughputOut: number;
                }[]
              | null
              | undefined;
            dataStartedAt?: string | null | undefined;
            lastUpdatedAt?: string | null | undefined;
          }
        >
      >
    >;
    metadata: z.ZodObject<
      {
        createdAt: z.ZodString;
        createdBy: z.ZodString;
        updatedAt: z.ZodString;
        updatedBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        state: z.ZodEnum<
          [
            'DRAFT',
            'VALIDATING',
            'VALID',
            'APPLYING',
            'ACTIVE',
            'DEGRADED',
            'ERROR',
            'DEPRECATED',
            'ARCHIVED',
          ]
        >;
        version: z.ZodNumber;
        tags: z.ZodArray<z.ZodString, 'many'>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        isFavorite: z.ZodBoolean;
        isPinned: z.ZodBoolean;
        notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        recentChanges: z.ZodOptional<
          z.ZodNullable<
            z.ZodArray<
              z.ZodObject<
                {
                  timestamp: z.ZodString;
                  user: z.ZodString;
                  changeType: z.ZodEnum<['CREATE', 'UPDATE', 'DELETE']>;
                  changedFields: z.ZodArray<z.ZodString, 'many'>;
                  summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  user: string;
                  timestamp: string;
                  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
                  changedFields: string[];
                  summary?: string | null | undefined;
                },
                {
                  user: string;
                  timestamp: string;
                  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
                  changedFields: string[];
                  summary?: string | null | undefined;
                }
              >,
              'many'
            >
          >
        >;
      },
      'strip',
      z.ZodTypeAny,
      {
        version: number;
        state:
          | 'DRAFT'
          | 'VALIDATING'
          | 'VALID'
          | 'APPLYING'
          | 'ACTIVE'
          | 'DEGRADED'
          | 'ERROR'
          | 'DEPRECATED'
          | 'ARCHIVED';
        tags: string[];
        updatedAt: string;
        isFavorite: boolean;
        createdAt: string;
        createdBy: string;
        isPinned: boolean;
        description?: string | null | undefined;
        updatedBy?: string | null | undefined;
        notes?: string | null | undefined;
        recentChanges?:
          | {
              user: string;
              timestamp: string;
              changeType: 'CREATE' | 'UPDATE' | 'DELETE';
              changedFields: string[];
              summary?: string | null | undefined;
            }[]
          | null
          | undefined;
      },
      {
        version: number;
        state:
          | 'DRAFT'
          | 'VALIDATING'
          | 'VALID'
          | 'APPLYING'
          | 'ACTIVE'
          | 'DEGRADED'
          | 'ERROR'
          | 'DEPRECATED'
          | 'ARCHIVED';
        tags: string[];
        updatedAt: string;
        isFavorite: boolean;
        createdAt: string;
        createdBy: string;
        isPinned: boolean;
        description?: string | null | undefined;
        updatedBy?: string | null | undefined;
        notes?: string | null | undefined;
        recentChanges?:
          | {
              user: string;
              timestamp: string;
              changeType: 'CREATE' | 'UPDATE' | 'DELETE';
              changedFields: string[];
              summary?: string | null | undefined;
            }[]
          | null
          | undefined;
      }
    >;
    relationships: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            dependsOn: z.ZodArray<
              z.ZodObject<
                {
                  uuid: z.ZodString;
                  id: z.ZodString;
                  type: z.ZodString;
                  category: z.ZodEnum<
                    ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                  >;
                  state: z.ZodEnum<
                    [
                      'DRAFT',
                      'VALIDATING',
                      'VALID',
                      'APPLYING',
                      'ACTIVE',
                      'DEGRADED',
                      'ERROR',
                      'DEPRECATED',
                      'ARCHIVED',
                    ]
                  >;
                },
                'strip',
                z.ZodTypeAny,
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                },
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              >,
              'many'
            >;
            dependents: z.ZodArray<
              z.ZodObject<
                {
                  uuid: z.ZodString;
                  id: z.ZodString;
                  type: z.ZodString;
                  category: z.ZodEnum<
                    ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                  >;
                  state: z.ZodEnum<
                    [
                      'DRAFT',
                      'VALIDATING',
                      'VALID',
                      'APPLYING',
                      'ACTIVE',
                      'DEGRADED',
                      'ERROR',
                      'DEPRECATED',
                      'ARCHIVED',
                    ]
                  >;
                },
                'strip',
                z.ZodTypeAny,
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                },
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              >,
              'many'
            >;
            routesVia: z.ZodOptional<
              z.ZodNullable<
                z.ZodObject<
                  {
                    uuid: z.ZodString;
                    id: z.ZodString;
                    type: z.ZodString;
                    category: z.ZodEnum<
                      ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                    >;
                    state: z.ZodEnum<
                      [
                        'DRAFT',
                        'VALIDATING',
                        'VALID',
                        'APPLYING',
                        'ACTIVE',
                        'DEGRADED',
                        'ERROR',
                        'DEPRECATED',
                        'ARCHIVED',
                      ]
                    >;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    id: string;
                    type: string;
                    state:
                      | 'DRAFT'
                      | 'VALIDATING'
                      | 'VALID'
                      | 'APPLYING'
                      | 'ACTIVE'
                      | 'DEGRADED'
                      | 'ERROR'
                      | 'DEPRECATED'
                      | 'ARCHIVED';
                    category:
                      | 'VPN'
                      | 'NETWORK'
                      | 'INFRASTRUCTURE'
                      | 'APPLICATION'
                      | 'FEATURE'
                      | 'PLUGIN';
                    uuid: string;
                  },
                  {
                    id: string;
                    type: string;
                    state:
                      | 'DRAFT'
                      | 'VALIDATING'
                      | 'VALID'
                      | 'APPLYING'
                      | 'ACTIVE'
                      | 'DEGRADED'
                      | 'ERROR'
                      | 'DEPRECATED'
                      | 'ARCHIVED';
                    category:
                      | 'VPN'
                      | 'NETWORK'
                      | 'INFRASTRUCTURE'
                      | 'APPLICATION'
                      | 'FEATURE'
                      | 'PLUGIN';
                    uuid: string;
                  }
                >
              >
            >;
            routedBy: z.ZodArray<
              z.ZodObject<
                {
                  uuid: z.ZodString;
                  id: z.ZodString;
                  type: z.ZodString;
                  category: z.ZodEnum<
                    ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                  >;
                  state: z.ZodEnum<
                    [
                      'DRAFT',
                      'VALIDATING',
                      'VALID',
                      'APPLYING',
                      'ACTIVE',
                      'DEGRADED',
                      'ERROR',
                      'DEPRECATED',
                      'ARCHIVED',
                    ]
                  >;
                },
                'strip',
                z.ZodTypeAny,
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                },
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              >,
              'many'
            >;
            parent: z.ZodOptional<
              z.ZodNullable<
                z.ZodObject<
                  {
                    uuid: z.ZodString;
                    id: z.ZodString;
                    type: z.ZodString;
                    category: z.ZodEnum<
                      ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                    >;
                    state: z.ZodEnum<
                      [
                        'DRAFT',
                        'VALIDATING',
                        'VALID',
                        'APPLYING',
                        'ACTIVE',
                        'DEGRADED',
                        'ERROR',
                        'DEPRECATED',
                        'ARCHIVED',
                      ]
                    >;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    id: string;
                    type: string;
                    state:
                      | 'DRAFT'
                      | 'VALIDATING'
                      | 'VALID'
                      | 'APPLYING'
                      | 'ACTIVE'
                      | 'DEGRADED'
                      | 'ERROR'
                      | 'DEPRECATED'
                      | 'ARCHIVED';
                    category:
                      | 'VPN'
                      | 'NETWORK'
                      | 'INFRASTRUCTURE'
                      | 'APPLICATION'
                      | 'FEATURE'
                      | 'PLUGIN';
                    uuid: string;
                  },
                  {
                    id: string;
                    type: string;
                    state:
                      | 'DRAFT'
                      | 'VALIDATING'
                      | 'VALID'
                      | 'APPLYING'
                      | 'ACTIVE'
                      | 'DEGRADED'
                      | 'ERROR'
                      | 'DEPRECATED'
                      | 'ARCHIVED';
                    category:
                      | 'VPN'
                      | 'NETWORK'
                      | 'INFRASTRUCTURE'
                      | 'APPLICATION'
                      | 'FEATURE'
                      | 'PLUGIN';
                    uuid: string;
                  }
                >
              >
            >;
            children: z.ZodArray<
              z.ZodObject<
                {
                  uuid: z.ZodString;
                  id: z.ZodString;
                  type: z.ZodString;
                  category: z.ZodEnum<
                    ['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']
                  >;
                  state: z.ZodEnum<
                    [
                      'DRAFT',
                      'VALIDATING',
                      'VALID',
                      'APPLYING',
                      'ACTIVE',
                      'DEGRADED',
                      'ERROR',
                      'DEPRECATED',
                      'ARCHIVED',
                    ]
                  >;
                },
                'strip',
                z.ZodTypeAny,
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                },
                {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              >,
              'many'
            >;
            custom: z.ZodOptional<z.ZodUnknown>;
          },
          'strip',
          z.ZodTypeAny,
          {
            children: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            dependsOn: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            dependents: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            routedBy: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            custom?: unknown;
            routesVia?:
              | {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              | null
              | undefined;
            parent?:
              | {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              | null
              | undefined;
          },
          {
            children: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            dependsOn: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            dependents: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            routedBy: {
              id: string;
              type: string;
              state:
                | 'DRAFT'
                | 'VALIDATING'
                | 'VALID'
                | 'APPLYING'
                | 'ACTIVE'
                | 'DEGRADED'
                | 'ERROR'
                | 'DEPRECATED'
                | 'ARCHIVED';
              category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
              uuid: string;
            }[];
            custom?: unknown;
            routesVia?:
              | {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              | null
              | undefined;
            parent?:
              | {
                  id: string;
                  type: string;
                  state:
                    | 'DRAFT'
                    | 'VALIDATING'
                    | 'VALID'
                    | 'APPLYING'
                    | 'ACTIVE'
                    | 'DEGRADED'
                    | 'ERROR'
                    | 'DEPRECATED'
                    | 'ARCHIVED';
                  category:
                    | 'VPN'
                    | 'NETWORK'
                    | 'INFRASTRUCTURE'
                    | 'APPLICATION'
                    | 'FEATURE'
                    | 'PLUGIN';
                  uuid: string;
                }
              | null
              | undefined;
          }
        >
      >
    >;
    platform: z.ZodOptional<
      z.ZodNullable<
        z.ZodObject<
          {
            current: z.ZodEnum<['MIKROTIK', 'OPENWRT', 'VYOS', 'GENERIC']>;
            capabilities: z.ZodObject<
              {
                isSupported: z.ZodBoolean;
                level: z.ZodEnum<['NONE', 'BASIC', 'ADVANCED', 'FULL']>;
                minVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                requiredPackages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
                details: z.ZodOptional<z.ZodUnknown>;
              },
              'strip',
              z.ZodTypeAny,
              {
                isSupported: boolean;
                level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
                details?: unknown;
                minVersion?: string | null | undefined;
                requiredPackages?: string[] | null | undefined;
              },
              {
                isSupported: boolean;
                level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
                details?: unknown;
                minVersion?: string | null | undefined;
                requiredPackages?: string[] | null | undefined;
              }
            >;
            fieldMappings: z.ZodOptional<z.ZodUnknown>;
            limitations: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      code: z.ZodString;
                      description: z.ZodString;
                      affectedFields: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, 'many'>>>;
                      workaround: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      code: string;
                      description: string;
                      affectedFields?: string[] | null | undefined;
                      workaround?: string | null | undefined;
                    },
                    {
                      code: string;
                      description: string;
                      affectedFields?: string[] | null | undefined;
                      workaround?: string | null | undefined;
                    }
                  >,
                  'many'
                >
              >
            >;
            features: z.ZodOptional<
              z.ZodNullable<
                z.ZodArray<
                  z.ZodObject<
                    {
                      id: z.ZodString;
                      name: z.ZodString;
                      enabled: z.ZodBoolean;
                      description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      id: string;
                      name: string;
                      enabled: boolean;
                      description?: string | null | undefined;
                    },
                    {
                      id: string;
                      name: string;
                      enabled: boolean;
                      description?: string | null | undefined;
                    }
                  >,
                  'many'
                >
              >
            >;
          },
          'strip',
          z.ZodTypeAny,
          {
            current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
            capabilities: {
              isSupported: boolean;
              level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
              details?: unknown;
              minVersion?: string | null | undefined;
              requiredPackages?: string[] | null | undefined;
            };
            fieldMappings?: unknown;
            limitations?:
              | {
                  code: string;
                  description: string;
                  affectedFields?: string[] | null | undefined;
                  workaround?: string | null | undefined;
                }[]
              | null
              | undefined;
            features?:
              | {
                  id: string;
                  name: string;
                  enabled: boolean;
                  description?: string | null | undefined;
                }[]
              | null
              | undefined;
          },
          {
            current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
            capabilities: {
              isSupported: boolean;
              level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
              details?: unknown;
              minVersion?: string | null | undefined;
              requiredPackages?: string[] | null | undefined;
            };
            fieldMappings?: unknown;
            limitations?:
              | {
                  code: string;
                  description: string;
                  affectedFields?: string[] | null | undefined;
                  workaround?: string | null | undefined;
                }[]
              | null
              | undefined;
            features?:
              | {
                  id: string;
                  name: string;
                  enabled: boolean;
                  description?: string | null | undefined;
                }[]
              | null
              | undefined;
          }
        >
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    type: string;
    metadata: {
      version: number;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      tags: string[];
      updatedAt: string;
      isFavorite: boolean;
      createdAt: string;
      createdBy: string;
      isPinned: boolean;
      description?: string | null | undefined;
      updatedBy?: string | null | undefined;
      notes?: string | null | undefined;
      recentChanges?:
        | {
            user: string;
            timestamp: string;
            changeType: 'CREATE' | 'UPDATE' | 'DELETE';
            changedFields: string[];
            summary?: string | null | undefined;
          }[]
        | null
        | undefined;
    };
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    uuid: string;
    relationships?:
      | {
          children: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          dependsOn: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          dependents: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          routedBy: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          custom?: unknown;
          routesVia?:
            | {
                id: string;
                type: string;
                state:
                  | 'DRAFT'
                  | 'VALIDATING'
                  | 'VALID'
                  | 'APPLYING'
                  | 'ACTIVE'
                  | 'DEGRADED'
                  | 'ERROR'
                  | 'DEPRECATED'
                  | 'ARCHIVED';
                category:
                  | 'VPN'
                  | 'NETWORK'
                  | 'INFRASTRUCTURE'
                  | 'APPLICATION'
                  | 'FEATURE'
                  | 'PLUGIN';
                uuid: string;
              }
            | null
            | undefined;
          parent?:
            | {
                id: string;
                type: string;
                state:
                  | 'DRAFT'
                  | 'VALIDATING'
                  | 'VALID'
                  | 'APPLYING'
                  | 'ACTIVE'
                  | 'DEGRADED'
                  | 'ERROR'
                  | 'DEPRECATED'
                  | 'ARCHIVED';
                category:
                  | 'VPN'
                  | 'NETWORK'
                  | 'INFRASTRUCTURE'
                  | 'APPLICATION'
                  | 'FEATURE'
                  | 'PLUGIN';
                uuid: string;
              }
            | null
            | undefined;
        }
      | null
      | undefined;
    configuration?: unknown;
    validation?:
      | {
          errors: {
            code: string;
            message: string;
            severity: 'ERROR' | 'WARNING' | 'INFO';
            field?: string | null | undefined;
            suggestedFix?: string | null | undefined;
            docsUrl?: string | null | undefined;
          }[];
          canApply: boolean;
          stage:
            | 'SCHEMA'
            | 'SEMANTIC'
            | 'DEPENDENCY'
            | 'CONFLICT'
            | 'PLATFORM'
            | 'QUOTA'
            | 'SIMULATION'
            | 'COMPLETE';
          warnings: {
            code: string;
            message: string;
            severity: 'ERROR' | 'WARNING' | 'INFO';
            field?: string | null | undefined;
            suggestedFix?: string | null | undefined;
            docsUrl?: string | null | undefined;
          }[];
          conflicts: {
            type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
            description: string;
            conflictingResourceUuid: string;
            resolution?: string | null | undefined;
          }[];
          requiredDependencies: {
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            resourceUuid: string;
            resourceType: string;
            isActive: boolean;
            reason: string;
          }[];
          validatedAt: string;
          validationDurationMs: number;
        }
      | null
      | undefined;
    deployment?:
      | {
          appliedAt: string;
          isInSync: boolean;
          routerResourceId?: string | null | undefined;
          appliedBy?: string | null | undefined;
          routerVersion?: number | null | undefined;
          generatedFields?: unknown;
          drift?:
            | {
                detectedAt: string;
                driftedFields: {
                  path: string;
                  expected?: unknown;
                  actual?: unknown;
                }[];
                suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
              }
            | null
            | undefined;
          applyOperationId?: string | null | undefined;
        }
      | null
      | undefined;
    runtime?:
      | {
          isRunning: boolean;
          health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
          lastUpdated: string;
          errorMessage?: string | null | undefined;
          metrics?:
            | {
                errors?: number | null | undefined;
                custom?: unknown;
                bytesIn?: number | null | undefined;
                bytesOut?: number | null | undefined;
                packetsIn?: number | null | undefined;
                packetsOut?: number | null | undefined;
                drops?: number | null | undefined;
                throughputIn?: number | null | undefined;
                throughputOut?: number | null | undefined;
              }
            | null
            | undefined;
          lastSuccessfulOperation?: string | null | undefined;
          activeConnections?: number | null | undefined;
          uptime?: string | null | undefined;
        }
      | null
      | undefined;
    telemetry?:
      | {
          retentionDays: number;
          bandwidthHistory?:
            | {
                bytesIn: number;
                bytesOut: number;
                timestamp: string;
                periodSeconds: number;
              }[]
            | null
            | undefined;
          uptimeHistory?:
            | {
                timestamp: string;
                periodSeconds: number;
                isUp: boolean;
              }[]
            | null
            | undefined;
          hourlyStats?:
            | {
                hour: string;
                totalBytesIn: number;
                totalBytesOut: number;
                uptimePercent: number;
                errorCount: number;
              }[]
            | null
            | undefined;
          dailyStats?:
            | {
                date: string;
                totalBytesIn: number;
                totalBytesOut: number;
                uptimePercent: number;
                errorCount: number;
                peakThroughputIn: number;
                peakThroughputOut: number;
              }[]
            | null
            | undefined;
          dataStartedAt?: string | null | undefined;
          lastUpdatedAt?: string | null | undefined;
        }
      | null
      | undefined;
    platform?:
      | {
          current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
          capabilities: {
            isSupported: boolean;
            level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
            details?: unknown;
            minVersion?: string | null | undefined;
            requiredPackages?: string[] | null | undefined;
          };
          fieldMappings?: unknown;
          limitations?:
            | {
                code: string;
                description: string;
                affectedFields?: string[] | null | undefined;
                workaround?: string | null | undefined;
              }[]
            | null
            | undefined;
          features?:
            | {
                id: string;
                name: string;
                enabled: boolean;
                description?: string | null | undefined;
              }[]
            | null
            | undefined;
        }
      | null
      | undefined;
  },
  {
    id: string;
    type: string;
    metadata: {
      version: number;
      state:
        | 'DRAFT'
        | 'VALIDATING'
        | 'VALID'
        | 'APPLYING'
        | 'ACTIVE'
        | 'DEGRADED'
        | 'ERROR'
        | 'DEPRECATED'
        | 'ARCHIVED';
      tags: string[];
      updatedAt: string;
      isFavorite: boolean;
      createdAt: string;
      createdBy: string;
      isPinned: boolean;
      description?: string | null | undefined;
      updatedBy?: string | null | undefined;
      notes?: string | null | undefined;
      recentChanges?:
        | {
            user: string;
            timestamp: string;
            changeType: 'CREATE' | 'UPDATE' | 'DELETE';
            changedFields: string[];
            summary?: string | null | undefined;
          }[]
        | null
        | undefined;
    };
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    uuid: string;
    relationships?:
      | {
          children: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          dependsOn: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          dependents: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          routedBy: {
            id: string;
            type: string;
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
            uuid: string;
          }[];
          custom?: unknown;
          routesVia?:
            | {
                id: string;
                type: string;
                state:
                  | 'DRAFT'
                  | 'VALIDATING'
                  | 'VALID'
                  | 'APPLYING'
                  | 'ACTIVE'
                  | 'DEGRADED'
                  | 'ERROR'
                  | 'DEPRECATED'
                  | 'ARCHIVED';
                category:
                  | 'VPN'
                  | 'NETWORK'
                  | 'INFRASTRUCTURE'
                  | 'APPLICATION'
                  | 'FEATURE'
                  | 'PLUGIN';
                uuid: string;
              }
            | null
            | undefined;
          parent?:
            | {
                id: string;
                type: string;
                state:
                  | 'DRAFT'
                  | 'VALIDATING'
                  | 'VALID'
                  | 'APPLYING'
                  | 'ACTIVE'
                  | 'DEGRADED'
                  | 'ERROR'
                  | 'DEPRECATED'
                  | 'ARCHIVED';
                category:
                  | 'VPN'
                  | 'NETWORK'
                  | 'INFRASTRUCTURE'
                  | 'APPLICATION'
                  | 'FEATURE'
                  | 'PLUGIN';
                uuid: string;
              }
            | null
            | undefined;
        }
      | null
      | undefined;
    configuration?: unknown;
    validation?:
      | {
          errors: {
            code: string;
            message: string;
            severity: 'ERROR' | 'WARNING' | 'INFO';
            field?: string | null | undefined;
            suggestedFix?: string | null | undefined;
            docsUrl?: string | null | undefined;
          }[];
          canApply: boolean;
          stage:
            | 'SCHEMA'
            | 'SEMANTIC'
            | 'DEPENDENCY'
            | 'CONFLICT'
            | 'PLATFORM'
            | 'QUOTA'
            | 'SIMULATION'
            | 'COMPLETE';
          warnings: {
            code: string;
            message: string;
            severity: 'ERROR' | 'WARNING' | 'INFO';
            field?: string | null | undefined;
            suggestedFix?: string | null | undefined;
            docsUrl?: string | null | undefined;
          }[];
          conflicts: {
            type: 'PORT' | 'IP_ADDRESS' | 'ROUTE' | 'INTERFACE' | 'NAME' | 'CONFIGURATION';
            description: string;
            conflictingResourceUuid: string;
            resolution?: string | null | undefined;
          }[];
          requiredDependencies: {
            state:
              | 'DRAFT'
              | 'VALIDATING'
              | 'VALID'
              | 'APPLYING'
              | 'ACTIVE'
              | 'DEGRADED'
              | 'ERROR'
              | 'DEPRECATED'
              | 'ARCHIVED';
            resourceUuid: string;
            resourceType: string;
            isActive: boolean;
            reason: string;
          }[];
          validatedAt: string;
          validationDurationMs: number;
        }
      | null
      | undefined;
    deployment?:
      | {
          appliedAt: string;
          isInSync: boolean;
          routerResourceId?: string | null | undefined;
          appliedBy?: string | null | undefined;
          routerVersion?: number | null | undefined;
          generatedFields?: unknown;
          drift?:
            | {
                detectedAt: string;
                driftedFields: {
                  path: string;
                  expected?: unknown;
                  actual?: unknown;
                }[];
                suggestedAction: 'REAPPLY' | 'ACCEPT' | 'REVIEW';
              }
            | null
            | undefined;
          applyOperationId?: string | null | undefined;
        }
      | null
      | undefined;
    runtime?:
      | {
          isRunning: boolean;
          health: 'DEGRADED' | 'WARNING' | 'HEALTHY' | 'FAILED' | 'UNKNOWN';
          lastUpdated: string;
          errorMessage?: string | null | undefined;
          metrics?:
            | {
                errors?: number | null | undefined;
                custom?: unknown;
                bytesIn?: number | null | undefined;
                bytesOut?: number | null | undefined;
                packetsIn?: number | null | undefined;
                packetsOut?: number | null | undefined;
                drops?: number | null | undefined;
                throughputIn?: number | null | undefined;
                throughputOut?: number | null | undefined;
              }
            | null
            | undefined;
          lastSuccessfulOperation?: string | null | undefined;
          activeConnections?: number | null | undefined;
          uptime?: string | null | undefined;
        }
      | null
      | undefined;
    telemetry?:
      | {
          retentionDays: number;
          bandwidthHistory?:
            | {
                bytesIn: number;
                bytesOut: number;
                timestamp: string;
                periodSeconds: number;
              }[]
            | null
            | undefined;
          uptimeHistory?:
            | {
                timestamp: string;
                periodSeconds: number;
                isUp: boolean;
              }[]
            | null
            | undefined;
          hourlyStats?:
            | {
                hour: string;
                totalBytesIn: number;
                totalBytesOut: number;
                uptimePercent: number;
                errorCount: number;
              }[]
            | null
            | undefined;
          dailyStats?:
            | {
                date: string;
                totalBytesIn: number;
                totalBytesOut: number;
                uptimePercent: number;
                errorCount: number;
                peakThroughputIn: number;
                peakThroughputOut: number;
              }[]
            | null
            | undefined;
          dataStartedAt?: string | null | undefined;
          lastUpdatedAt?: string | null | undefined;
        }
      | null
      | undefined;
    platform?:
      | {
          current: 'MIKROTIK' | 'OPENWRT' | 'VYOS' | 'GENERIC';
          capabilities: {
            isSupported: boolean;
            level: 'NONE' | 'BASIC' | 'ADVANCED' | 'FULL';
            details?: unknown;
            minVersion?: string | null | undefined;
            requiredPackages?: string[] | null | undefined;
          };
          fieldMappings?: unknown;
          limitations?:
            | {
                code: string;
                description: string;
                affectedFields?: string[] | null | undefined;
                workaround?: string | null | undefined;
              }[]
            | null
            | undefined;
          features?:
            | {
                id: string;
                name: string;
                enabled: boolean;
                description?: string | null | undefined;
              }[]
            | null
            | undefined;
        }
      | null
      | undefined;
  }
>;
/**
 * Resource relationships input schema.
 * Relationships specification for creating or updating a resource.
 */
export declare const ResourceRelationshipsInputSchema: z.ZodObject<
  {
    dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    routesVia: z.ZodOptional<z.ZodString>;
    parent: z.ZodOptional<z.ZodString>;
    custom: z.ZodOptional<z.ZodUnknown>;
  },
  'strip',
  z.ZodTypeAny,
  {
    custom?: unknown;
    dependsOn?: string[] | undefined;
    routesVia?: string | undefined;
    parent?: string | undefined;
  },
  {
    custom?: unknown;
    dependsOn?: string[] | undefined;
    routesVia?: string | undefined;
    parent?: string | undefined;
  }
>;
/**
 * Create resource input schema.
 * Input validation for resource creation mutations.
 */
export declare const CreateResourceInputSchema: z.ZodObject<
  {
    routerId: z.ZodString;
    type: z.ZodString;
    category: z.ZodEnum<['NETWORK', 'VPN', 'INFRASTRUCTURE', 'APPLICATION', 'FEATURE', 'PLUGIN']>;
    configuration: z.ZodUnknown;
    relationships: z.ZodOptional<
      z.ZodObject<
        {
          dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          routesVia: z.ZodOptional<z.ZodString>;
          parent: z.ZodOptional<z.ZodString>;
          custom: z.ZodOptional<z.ZodUnknown>;
        },
        'strip',
        z.ZodTypeAny,
        {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        },
        {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      >
    >;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    description: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    type: string;
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    routerId: string;
    description?: string | undefined;
    tags?: string[] | undefined;
    relationships?:
      | {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      | undefined;
    configuration?: unknown;
  },
  {
    type: string;
    category: 'VPN' | 'NETWORK' | 'INFRASTRUCTURE' | 'APPLICATION' | 'FEATURE' | 'PLUGIN';
    routerId: string;
    description?: string | undefined;
    tags?: string[] | undefined;
    relationships?:
      | {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      | undefined;
    configuration?: unknown;
  }
>;
/**
 * Update resource input schema.
 * Input validation for resource update mutations.
 */
export declare const UpdateResourceInputSchema: z.ZodObject<
  {
    configuration: z.ZodOptional<z.ZodUnknown>;
    relationships: z.ZodOptional<
      z.ZodObject<
        {
          dependsOn: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          routesVia: z.ZodOptional<z.ZodString>;
          parent: z.ZodOptional<z.ZodString>;
          custom: z.ZodOptional<z.ZodUnknown>;
        },
        'strip',
        z.ZodTypeAny,
        {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        },
        {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      >
    >;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    description: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    description?: string | undefined;
    tags?: string[] | undefined;
    relationships?:
      | {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      | undefined;
    configuration?: unknown;
  },
  {
    description?: string | undefined;
    tags?: string[] | undefined;
    relationships?:
      | {
          custom?: unknown;
          dependsOn?: string[] | undefined;
          routesVia?: string | undefined;
          parent?: string | undefined;
        }
      | undefined;
    configuration?: unknown;
  }
>;
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
//# sourceMappingURL=schemas.d.ts.map
