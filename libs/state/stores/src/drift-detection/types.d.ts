/**
 * Drift Detection Types
 *
 * Type definitions for drift detection between configuration and deployment layers.
 * Part of Universal State v2 - 8-Layer Resource Model.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#8-layer-resource-model
 */
/**
 * Drift detection status
 */
export declare const DriftStatus: {
  /** Configuration matches deployment (green) */
  readonly SYNCED: 'SYNCED';
  /** Configuration differs from deployment (amber) */
  readonly DRIFTED: 'DRIFTED';
  /** Unable to determine drift status (red) */
  readonly ERROR: 'ERROR';
  /** Drift check is in progress */
  readonly CHECKING: 'CHECKING';
  /** Deployment layer not yet available (resource not applied) */
  readonly PENDING: 'PENDING';
};
export type DriftStatus = (typeof DriftStatus)[keyof typeof DriftStatus];
/**
 * A single field that has drifted
 */
export interface DriftedField {
  /** JSON path to the field (e.g., 'address.ip' or 'peers[0].endpoint') */
  path: string;
  /** Value from configuration layer (user's desired state) */
  configValue: unknown;
  /** Value from deployment layer (router's actual state) */
  deployValue: unknown;
  /** Field category for grouping in UI */
  category?: 'network' | 'security' | 'general';
}
/**
 * Result of drift detection
 */
export interface DriftResult {
  /** Whether drift was detected */
  hasDrift: boolean;
  /** Current drift status */
  status: DriftStatus;
  /** Fields that have drifted */
  driftedFields: DriftedField[];
  /** Hash of normalized configuration */
  configurationHash: string;
  /** Hash of normalized deployment */
  deploymentHash: string;
  /** When the drift check was performed */
  lastChecked: Date;
  /** Error message if status is ERROR */
  errorMessage?: string;
  /** Whether the deployment layer is stale (older than threshold) */
  isStale?: boolean;
}
/**
 * Priority levels for reconciliation polling
 */
export declare const ResourcePriority: {
  /** 5 minutes - Critical resources: WAN, VPN, Auth */
  readonly HIGH: number;
  /** 15 minutes - Important resources: LAN, DHCP, Firewall */
  readonly NORMAL: number;
  /** 60 minutes - Background resources: Logging, Scripts */
  readonly LOW: number;
};
export type ResourcePriority = (typeof ResourcePriority)[keyof typeof ResourcePriority];
/**
 * Map of resource categories to their priority
 */
export declare const RESOURCE_PRIORITY_MAP: Record<string, ResourcePriority>;
/**
 * Get priority for a resource type
 */
export declare function getResourcePriority(resourceType: string): ResourcePriority;
/**
 * Fields that are runtime-only and should be EXCLUDED from drift comparison.
 * These are stored in Layer 4 (Runtime) and change frequently without user action.
 */
export declare const RUNTIME_ONLY_FIELDS: readonly [
  'bytesIn',
  'bytesOut',
  'packetsIn',
  'packetsOut',
  'txRate',
  'rxRate',
  'lastHandshake',
  'lastSeen',
  'connectedSince',
  'lastConnected',
  'uptime',
  'currentPeers',
  'activeConnections',
  'cpuLoad',
  'memoryUsage',
  'lastUpdated',
  'lastModified',
  'lastAccessed',
  'health',
  'status',
  'isRunning',
  'errorCount',
];
export type RuntimeOnlyField = (typeof RUNTIME_ONLY_FIELDS)[number];
/**
 * Options for drift detection
 */
export interface DriftDetectionOptions {
  /** Additional fields to exclude from comparison */
  excludeFields?: string[];
  /** Whether to include nested objects in field-level diff */
  deepCompare?: boolean;
  /** Maximum age of deployment layer before marking as stale (ms) */
  staleThreshold?: number;
}
/**
 * Default drift detection options
 */
export declare const DEFAULT_DRIFT_OPTIONS: Required<DriftDetectionOptions>;
/**
 * Actions to resolve drift
 */
export declare const DriftResolutionAction: {
  /** Re-apply configuration to router (overwrite router state) */
  readonly REAPPLY: 'REAPPLY';
  /** Accept router state as new configuration (update local state) */
  readonly ACCEPT: 'ACCEPT';
  /** Dismiss drift notification without action */
  readonly DISMISS: 'DISMISS';
};
export type DriftResolutionAction =
  (typeof DriftResolutionAction)[keyof typeof DriftResolutionAction];
/**
 * Request to resolve drift
 */
export interface DriftResolutionRequest {
  /** Resource UUID */
  resourceUuid: string;
  /** Action to take */
  action: DriftResolutionAction;
  /** Specific fields to resolve (if not all) */
  fields?: string[];
}
//# sourceMappingURL=types.d.ts.map
