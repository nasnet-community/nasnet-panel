/**
 * Drift Detection Types
 *
 * Type definitions for drift detection between configuration and deployment layers.
 * Part of Universal State v2 - 8-Layer Resource Model.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#8-layer-resource-model
 */

// =============================================================================
// Drift Status
// =============================================================================

/**
 * Drift detection status
 */
export const DriftStatus = {
  /** Configuration matches deployment (green) */
  SYNCED: 'SYNCED',
  /** Configuration differs from deployment (amber) */
  DRIFTED: 'DRIFTED',
  /** Unable to determine drift status (red) */
  ERROR: 'ERROR',
  /** Drift check is in progress */
  CHECKING: 'CHECKING',
  /** Deployment layer not yet available (resource not applied) */
  PENDING: 'PENDING',
} as const;

export type DriftStatus = (typeof DriftStatus)[keyof typeof DriftStatus];

// =============================================================================
// Drift Result
// =============================================================================

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

// =============================================================================
// Resource Priority
// =============================================================================

/**
 * Priority levels for reconciliation polling
 */
export const ResourcePriority = {
  /** 5 minutes - Critical resources: WAN, VPN, Auth */
  HIGH: 5 * 60 * 1000,
  /** 15 minutes - Important resources: LAN, DHCP, Firewall */
  NORMAL: 15 * 60 * 1000,
  /** 60 minutes - Background resources: Logging, Scripts */
  LOW: 60 * 60 * 1000,
} as const;

export type ResourcePriority =
  (typeof ResourcePriority)[keyof typeof ResourcePriority];

/**
 * Map of resource categories to their priority
 */
export const RESOURCE_PRIORITY_MAP: Record<string, ResourcePriority> = {
  // HIGH priority (5 minutes) - Critical connectivity
  wan: ResourcePriority.HIGH,
  vpn: ResourcePriority.HIGH,
  'vpn.wireguard': ResourcePriority.HIGH,
  'vpn.openvpn': ResourcePriority.HIGH,
  auth: ResourcePriority.HIGH,
  authentication: ResourcePriority.HIGH,

  // NORMAL priority (15 minutes) - Core infrastructure
  lan: ResourcePriority.NORMAL,
  dhcp: ResourcePriority.NORMAL,
  firewall: ResourcePriority.NORMAL,
  nat: ResourcePriority.NORMAL,
  routing: ResourcePriority.NORMAL,
  interface: ResourcePriority.NORMAL,
  wireless: ResourcePriority.NORMAL,

  // LOW priority (60 minutes) - Background services
  logging: ResourcePriority.LOW,
  scripts: ResourcePriority.LOW,
  scheduler: ResourcePriority.LOW,
  backup: ResourcePriority.LOW,
  snmp: ResourcePriority.LOW,
};

/**
 * Get priority for a resource type
 */
export function getResourcePriority(resourceType: string): ResourcePriority {
  // Check exact match first
  if (resourceType in RESOURCE_PRIORITY_MAP) {
    return RESOURCE_PRIORITY_MAP[resourceType];
  }

  // Check prefix match (e.g., 'vpn.wireguard.client' matches 'vpn.wireguard')
  const parts = resourceType.split('.');
  for (let i = parts.length; i > 0; i--) {
    const prefix = parts.slice(0, i).join('.');
    if (prefix in RESOURCE_PRIORITY_MAP) {
      return RESOURCE_PRIORITY_MAP[prefix];
    }
  }

  // Default to NORMAL priority
  return ResourcePriority.NORMAL;
}

// =============================================================================
// Runtime-Only Fields
// =============================================================================

/**
 * Fields that are runtime-only and should be EXCLUDED from drift comparison.
 * These are stored in Layer 4 (Runtime) and change frequently without user action.
 */
export const RUNTIME_ONLY_FIELDS = [
  // Traffic counters
  'bytesIn',
  'bytesOut',
  'packetsIn',
  'packetsOut',
  'txRate',
  'rxRate',

  // Connection state
  'lastHandshake',
  'lastSeen',
  'connectedSince',
  'lastConnected',

  // Operational metrics
  'uptime',
  'currentPeers',
  'activeConnections',
  'cpuLoad',
  'memoryUsage',

  // Timestamps that auto-update
  'lastUpdated',
  'lastModified',
  'lastAccessed',

  // Health/status fields that fluctuate
  'health',
  'status',
  'isRunning',
  'errorCount',
] as const;

export type RuntimeOnlyField = (typeof RUNTIME_ONLY_FIELDS)[number];

// =============================================================================
// Drift Detection Options
// =============================================================================

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
export const DEFAULT_DRIFT_OPTIONS: Required<DriftDetectionOptions> = {
  excludeFields: [],
  deepCompare: true,
  staleThreshold: 30 * 60 * 1000, // 30 minutes
};

// =============================================================================
// Drift Resolution
// =============================================================================

/**
 * Actions to resolve drift
 */
export const DriftResolutionAction = {
  /** Re-apply configuration to router (overwrite router state) */
  REAPPLY: 'REAPPLY',
  /** Accept router state as new configuration (update local state) */
  ACCEPT: 'ACCEPT',
  /** Dismiss drift notification without action */
  DISMISS: 'DISMISS',
} as const;

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
