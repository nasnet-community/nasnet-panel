/**
 * Universal State v2 Resource Types
 *
 * Core type definitions for the 8-layer resource model.
 * Reference: ADR-012 - Universal State v2
 * Reference: Docs/architecture/data-architecture.md
 */

import type {
  ValidationResult,
  DeploymentState,
  RuntimeState,
  TelemetryData,
  ResourceMetadata,
  ResourceRelationships,
  PlatformInfo,
} from './layers';
import type { ResourceLifecycleState } from './lifecycle';

// =============================================================================
// Resource Categories
// =============================================================================

/**
 * Categories of managed resources
 */
export const ResourceCategory = {
  /** Network topology: WAN Links, LAN Networks, VLANs */
  NETWORK: 'NETWORK',
  /** VPN connectivity: WireGuard, OpenVPN, IPsec */
  VPN: 'VPN',
  /** System infrastructure: Certificates, NTP, DDNS */
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  /** Application-level: Port Forwarding, Game Rules */
  APPLICATION: 'APPLICATION',
  /** Marketplace features: Tor, AdGuard, sing-box */
  FEATURE: 'FEATURE',
  /** Community extensions: Third-party plugins */
  PLUGIN: 'PLUGIN',
} as const;

export type ResourceCategory =
  (typeof ResourceCategory)[keyof typeof ResourceCategory];

// =============================================================================
// Resource Layers
// =============================================================================

/**
 * Selectable resource layers for optimized fetching
 */
export const ResourceLayer = {
  CONFIGURATION: 'CONFIGURATION',
  VALIDATION: 'VALIDATION',
  DEPLOYMENT: 'DEPLOYMENT',
  RUNTIME: 'RUNTIME',
  TELEMETRY: 'TELEMETRY',
  METADATA: 'METADATA',
  RELATIONSHIPS: 'RELATIONSHIPS',
  PLATFORM: 'PLATFORM',
} as const;

export type ResourceLayer = (typeof ResourceLayer)[keyof typeof ResourceLayer];

// =============================================================================
// Base Resource Interface
// =============================================================================

/**
 * Universal State v2 Resource Interface
 *
 * Every managed resource implements this interface with 8 layers:
 * 1. configuration - User's desired config (mutable by user)
 * 2. validation - Pre-flight check results (computed by backend)
 * 3. deployment - What's on router (after Apply-Confirm)
 * 4. runtime - Live operational state (polled/streamed)
 * 5. telemetry - Time-series metrics (historical)
 * 6. metadata - Lifecycle info, tags, ownership
 * 7. relationships - Dependencies (embedded + explicit)
 * 8. platform - Capabilities and field mappings
 */
export interface Resource<TConfig = unknown> {
  /** Globally unique identifier (ULID) */
  uuid: string;

  /** Scoped identifier for readability (e.g., 'vpn.wg.client:usa-vpn:a1b2') */
  id: string;

  /** Resource type identifier (e.g., 'vpn.wireguard.client') */
  type: string;

  /** Resource category */
  category: ResourceCategory;

  // =========================================================================
  // 8-LAYER MODEL
  // =========================================================================

  /**
   * Layer 1: CONFIGURATION - User's desired config
   * Mutable by user. Validated by Zod on client, GraphQL on server.
   */
  configuration: TConfig;

  /**
   * Layer 2: VALIDATION - Pre-flight check results
   * Computed by backend. Updated on every configuration change.
   */
  validation?: ValidationResult | null;

  /**
   * Layer 3: DEPLOYMENT - What's actually on router
   * Written after Apply-Confirm. Includes router-generated fields.
   */
  deployment?: DeploymentState | null;

  /**
   * Layer 4: RUNTIME - Live operational state
   * Polled/streamed from router. Read-only.
   */
  runtime?: RuntimeState | null;

  /**
   * Layer 5: TELEMETRY - Time-series metrics
   * Historical data collected over time. Read-only.
   */
  telemetry?: TelemetryData | null;

  /**
   * Layer 6: METADATA - Resource lifecycle info
   * System-managed. Includes tags, version, ownership.
   */
  metadata: ResourceMetadata;

  /**
   * Layer 7: RELATIONSHIPS - Dependencies
   * Embedded in config (user-defined) + explicit table (system-discovered).
   */
  relationships?: ResourceRelationships | null;

  /**
   * Layer 8: PLATFORM - Capabilities and field mappings
   * From platform adapter. Router-specific behavior.
   */
  platform?: PlatformInfo | null;
}

// =============================================================================
// Resource Type Utilities
// =============================================================================

/**
 * Type for a resource with minimal layers (for list views)
 */
export interface ResourceListItem {
  uuid: string;
  id: string;
  type: string;
  category: ResourceCategory;
  metadata: Pick<
    ResourceMetadata,
    'state' | 'tags' | 'updatedAt' | 'isFavorite'
  >;
  runtime?: Pick<RuntimeState, 'isRunning' | 'health' | 'lastUpdated'> | null;
}

/**
 * Type for a resource card in dashboards
 */
export interface ResourceCardData {
  uuid: string;
  id: string;
  type: string;
  category: ResourceCategory;
  configuration: unknown;
  metadata: Pick<
    ResourceMetadata,
    'state' | 'version' | 'tags' | 'description' | 'isFavorite' | 'isPinned'
  >;
  runtime?: Pick<
    RuntimeState,
    'isRunning' | 'health' | 'errorMessage' | 'activeConnections' | 'uptime'
  > | null;
}

// =============================================================================
// Resource Reference
// =============================================================================

/**
 * Reference to another resource
 */
export interface ResourceReference {
  /** Resource UUID */
  uuid: string;
  /** Resource scoped ID */
  id: string;
  /** Resource type */
  type: string;
  /** Resource category */
  category: ResourceCategory;
  /** Current lifecycle state */
  state: ResourceLifecycleState;
}

// =============================================================================
// Relationship Types
// =============================================================================

/**
 * Types of relationships between resources
 */
export const ResourceRelationshipType = {
  /** Child depends on parent */
  DEPENDS_ON: 'DEPENDS_ON',
  /** Traffic routes via this resource */
  ROUTES_VIA: 'ROUTES_VIA',
  /** Parent-child hierarchy */
  PARENT_CHILD: 'PARENT_CHILD',
  /** Resources are in the same group */
  GROUP: 'GROUP',
  /** Custom relationship */
  CUSTOM: 'CUSTOM',
} as const;

export type ResourceRelationshipType =
  (typeof ResourceRelationshipType)[keyof typeof ResourceRelationshipType];

/**
 * Edge in the resource relationship graph
 */
export interface ResourceRelationshipEdge {
  /** Source resource UUID */
  from: string;
  /** Target resource UUID */
  to: string;
  /** Relationship type */
  type: ResourceRelationshipType;
}

// =============================================================================
// Composite Resource
// =============================================================================

/**
 * A composite resource with all related sub-resources
 */
export interface CompositeResource<TRoot extends Resource = Resource> {
  /** The root resource */
  root: TRoot;
  /** All child/related resources */
  children: Resource[];
  /** Flattened relationship graph */
  relationships: ResourceRelationshipEdge[];
}
