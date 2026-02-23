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
 * Categories of managed resources in the Universal State v2 model.
 *
 * Each category represents a different domain of router functionality:
 * - NETWORK: WAN links, LAN networks, VLANs, bridges, routing
 * - VPN: Virtual private networks (WireGuard, OpenVPN, IPsec)
 * - INFRASTRUCTURE: System-level services (certificates, NTP, DDNS)
 * - APPLICATION: User-facing services (port forwarding, game rules)
 * - FEATURE: Marketplace features (Tor, AdGuard, sing-box)
 * - PLUGIN: Community extensions and third-party plugins
 *
 * @constant
 * @see Resource for the main resource interface
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

/** Inferred type for resource categories */
export type ResourceCategory =
  (typeof ResourceCategory)[keyof typeof ResourceCategory];

// =============================================================================
// Resource Layers
// =============================================================================

/**
 * Selectable resource layers for optimized GraphQL fetching.
 *
 * The 8-layer resource model allows clients to fetch only the layers they need,
 * reducing bandwidth and improving performance. Layers are independent and can
 * be queried separately or in combination.
 *
 * @constant
 * @see Resource for the main resource interface
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

/** Inferred type for resource layers */
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
 * Lightweight resource representation for list views and summary displays.
 *
 * Includes only essential metadata for rendering resource lists efficiently.
 * Omits full configuration and heavy telemetry data.
 *
 * @see Resource for the full resource interface
 * @see ResourceCardData for dashboard card data
 */
export interface ResourceListItem {
  /** Globally unique identifier (ULID) */
  uuid: string;
  /** Scoped identifier for readability */
  id: string;
  /** Resource type identifier */
  type: string;
  /** Resource category */
  category: ResourceCategory;
  /** Essential metadata */
  readonly metadata: Pick<
    ResourceMetadata,
    'state' | 'tags' | 'updatedAt' | 'isFavorite'
  >;
  /** Optional runtime state for status display */
  readonly runtime?: Pick<RuntimeState, 'isRunning' | 'health' | 'lastUpdated'> | null;
}

/**
 * Resource data optimized for dashboard card rendering.
 *
 * Includes configuration preview, metadata, and runtime state needed for
 * rich card displays with status indicators, error messages, and connection counts.
 *
 * @see Resource for the full resource interface
 * @see ResourceListItem for lightweight list view data
 */
export interface ResourceCardData {
  /** Globally unique identifier (ULID) */
  uuid: string;
  /** Scoped identifier for readability */
  id: string;
  /** Resource type identifier */
  type: string;
  /** Resource category */
  category: ResourceCategory;
  /** Configuration preview (full or partial) */
  configuration: unknown;
  /** Rich metadata for card display */
  readonly metadata: Pick<
    ResourceMetadata,
    'state' | 'version' | 'tags' | 'description' | 'isFavorite' | 'isPinned'
  >;
  /** Runtime state with connection and error details */
  readonly runtime?: Pick<
    RuntimeState,
    'isRunning' | 'health' | 'errorMessage' | 'activeConnections' | 'uptime'
  > | null;
}

// =============================================================================
// Resource Reference
// =============================================================================

/**
 * Reference to another resource used in relationships and dependencies.
 *
 * Lightweight pointer to a resource that includes enough information to identify it
 * and determine if it's operational. Used in relationship edges and dependency lists.
 *
 * @see Resource for the full resource interface
 * @see ResourceRelationshipEdge for usage in graphs
 */
export interface ResourceReference {
  /** Resource UUID */
  readonly uuid: string;
  /** Resource scoped ID */
  readonly id: string;
  /** Resource type */
  readonly type: string;
  /** Resource category */
  readonly category: ResourceCategory;
  /** Current lifecycle state */
  readonly state: ResourceLifecycleState;
}

// =============================================================================
// Relationship Types
// =============================================================================

/**
 * Types of relationships between resources in the dependency graph.
 *
 * Used to classify edges in the resource relationship graph for dependency analysis,
 * impact calculation, and cascading operations.
 *
 * @constant
 * @see ResourceRelationshipEdge for the edge structure
 * @see Resource.relationships for relationship storage
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

/** Inferred type for relationship types */
export type ResourceRelationshipType =
  (typeof ResourceRelationshipType)[keyof typeof ResourceRelationshipType];

/**
 * Directed edge in the resource relationship graph.
 *
 * Represents a single relationship between two resources. Multiple edges
 * form the complete dependency graph.
 *
 * @see ResourceRelationshipType for the edge classification
 * @see CompositeResource.relationships for full graph
 */
export interface ResourceRelationshipEdge {
  /** Source resource UUID */
  readonly from: string;
  /** Target resource UUID */
  readonly to: string;
  /** Relationship type */
  readonly type: ResourceRelationshipType;
}

// =============================================================================
// Composite Resource
// =============================================================================

/**
 * A complete resource composition with all related sub-resources and relationships.
 *
 * Used for detailed views where both the root resource and all dependent/related
 * resources need to be displayed together with their relationship graph.
 *
 * @template TRoot The root resource type (defaults to generic Resource)
 * @see Resource for individual resources
 * @see ResourceRelationshipEdge for edge structure
 */
export interface CompositeResource<TRoot extends Resource = Resource> {
  /** The root resource */
  readonly root: TRoot;
  /** All child/related resources */
  readonly children: readonly Resource[];
  /** Flattened relationship graph */
  readonly relationships: readonly ResourceRelationshipEdge[];
}
