/**
 * Universal State v2 Type Guards
 *
 * Type guard functions for runtime type checking of resources.
 * Reference: ADR-012 - Universal State v2
 */

import type { Resource, ResourceCategory, CompositeResource } from './resource';
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
// Resource Category Guards
// =============================================================================

/**
 * Check if resource is a VPN resource
 */
export function isVPNResource(resource: Resource): boolean {
  return resource.category === 'VPN';
}

/**
 * Check if resource is a Network resource
 */
export function isNetworkResource(resource: Resource): boolean {
  return resource.category === 'NETWORK';
}

/**
 * Check if resource is an Infrastructure resource
 */
export function isInfrastructureResource(resource: Resource): boolean {
  return resource.category === 'INFRASTRUCTURE';
}

/**
 * Check if resource is an Application resource
 */
export function isApplicationResource(resource: Resource): boolean {
  return resource.category === 'APPLICATION';
}

/**
 * Check if resource is a Feature (marketplace) resource
 */
export function isFeatureResource(resource: Resource): boolean {
  return resource.category === 'FEATURE';
}

/**
 * Check if resource is a Plugin resource
 */
export function isPluginResource(resource: Resource): boolean {
  return resource.category === 'PLUGIN';
}

/**
 * Check if resource belongs to a specific category
 */
export function isResourceCategory(
  resource: Resource,
  category: ResourceCategory
): boolean {
  return resource.category === category;
}

// =============================================================================
// Resource Type Guards
// =============================================================================

/**
 * Check if resource is a WireGuard client
 */
export function isWireGuardClient(resource: Resource): boolean {
  return resource.type === 'vpn.wireguard.client';
}

/**
 * Check if resource is a WireGuard server
 */
export function isWireGuardServer(resource: Resource): boolean {
  return resource.type === 'vpn.wireguard.server';
}

/**
 * Check if resource is a LAN network
 */
export function isLANNetwork(resource: Resource): boolean {
  return resource.type === 'network.lan';
}

/**
 * Check if resource is a WAN link
 */
export function isWANLink(resource: Resource): boolean {
  return resource.type === 'network.wan';
}

/**
 * Check if resource is a firewall rule
 */
export function isFirewallRule(resource: Resource): boolean {
  return resource.type === 'security.firewall.rule';
}

/**
 * Check if resource is a DHCP server
 */
export function isDHCPServer(resource: Resource): boolean {
  return resource.type === 'network.dhcp.server';
}

/**
 * Check if resource is a bridge
 */
export function isBridge(resource: Resource): boolean {
  return resource.type === 'network.bridge';
}

/**
 * Check if resource is a route
 */
export function isRoute(resource: Resource): boolean {
  return resource.type === 'network.route';
}

/**
 * Check if resource type starts with a prefix
 */
export function hasResourceTypePrefix(
  resource: Resource,
  prefix: string
): boolean {
  return resource.type.startsWith(prefix);
}

// =============================================================================
// Layer Presence Guards
// =============================================================================

/**
 * Check if resource has validation data
 */
export function hasValidation(
  resource: Resource
): resource is Resource & { validation: ValidationResult } {
  return resource.validation != null;
}

/**
 * Check if resource has deployment data
 */
export function hasDeployment(
  resource: Resource
): resource is Resource & { deployment: DeploymentState } {
  return resource.deployment != null;
}

/**
 * Check if resource has runtime data
 */
export function hasRuntime(
  resource: Resource
): resource is Resource & { runtime: RuntimeState } {
  return resource.runtime != null;
}

/**
 * Check if resource has telemetry data
 */
export function hasTelemetry(
  resource: Resource
): resource is Resource & { telemetry: TelemetryData } {
  return resource.telemetry != null;
}

/**
 * Check if resource has relationships data
 */
export function hasRelationships(
  resource: Resource
): resource is Resource & { relationships: ResourceRelationships } {
  return resource.relationships != null;
}

/**
 * Check if resource has platform data
 */
export function hasPlatform(
  resource: Resource
): resource is Resource & { platform: PlatformInfo } {
  return resource.platform != null;
}

// =============================================================================
// Composite Resource Guards
// =============================================================================

/**
 * Check if value is a composite resource
 */
export function isCompositeResource(
  value: unknown
): value is CompositeResource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'root' in value &&
    'children' in value &&
    'relationships' in value
  );
}

// =============================================================================
// State Guards
// =============================================================================

/**
 * Check if resource is in draft state
 */
export function isDraft(resource: Resource): boolean {
  return resource.metadata.state === 'DRAFT';
}

/**
 * Check if resource is validating
 */
export function isValidating(resource: Resource): boolean {
  return resource.metadata.state === 'VALIDATING';
}

/**
 * Check if resource is valid
 */
export function isValid(resource: Resource): boolean {
  return resource.metadata.state === 'VALID';
}

/**
 * Check if resource is applying
 */
export function isApplying(resource: Resource): boolean {
  return resource.metadata.state === 'APPLYING';
}

/**
 * Check if resource is active
 */
export function isActive(resource: Resource): boolean {
  return resource.metadata.state === 'ACTIVE';
}

/**
 * Check if resource is degraded
 */
export function isDegraded(resource: Resource): boolean {
  return resource.metadata.state === 'DEGRADED';
}

/**
 * Check if resource is in error state
 */
export function isError(resource: Resource): boolean {
  return resource.metadata.state === 'ERROR';
}

/**
 * Check if resource is deprecated
 */
export function isDeprecated(resource: Resource): boolean {
  return resource.metadata.state === 'DEPRECATED';
}

/**
 * Check if resource is archived
 */
export function isArchived(resource: Resource): boolean {
  return resource.metadata.state === 'ARCHIVED';
}

/**
 * Check if resource is in a specific state
 */
export function isInState(
  resource: Resource,
  state: ResourceLifecycleState
): boolean {
  return resource.metadata.state === state;
}

// =============================================================================
// Health Guards
// =============================================================================

/**
 * Check if resource runtime is healthy
 */
export function isHealthy(resource: Resource): boolean {
  return resource.runtime?.health === 'HEALTHY';
}

/**
 * Check if resource runtime is running
 */
export function isRunning(resource: Resource): boolean {
  return resource.runtime?.isRunning === true;
}

/**
 * Check if resource has drift
 */
export function hasDrift(resource: Resource): boolean {
  return resource.deployment?.drift != null;
}

/**
 * Check if resource is in sync with deployment
 */
export function isInSync(resource: Resource): boolean {
  return resource.deployment?.isInSync === true;
}

// =============================================================================
// Validation Guards
// =============================================================================

/**
 * Check if resource can be applied
 */
export function canApply(resource: Resource): boolean {
  return resource.validation?.canApply === true;
}

/**
 * Check if resource has validation errors
 */
export function hasValidationErrors(resource: Resource): boolean {
  return (resource.validation?.errors?.length ?? 0) > 0;
}

/**
 * Check if resource has validation warnings
 */
export function hasValidationWarnings(resource: Resource): boolean {
  return (resource.validation?.warnings?.length ?? 0) > 0;
}

/**
 * Check if resource has conflicts
 */
export function hasConflicts(resource: Resource): boolean {
  return (resource.validation?.conflicts?.length ?? 0) > 0;
}

// =============================================================================
// Generic Object Guards
// =============================================================================

/**
 * Check if value is a valid Resource object
 */
export function isResource(value: unknown): value is Resource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'uuid' in value &&
    'id' in value &&
    'type' in value &&
    'category' in value &&
    'configuration' in value &&
    'metadata' in value
  );
}

/**
 * Check if value is a ResourceMetadata object
 */
export function isResourceMetadata(value: unknown): value is ResourceMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'createdAt' in value &&
    'createdBy' in value &&
    'state' in value &&
    'version' in value
  );
}
