/**
 * Universal State v2 Type Guards
 *
 * Type guard functions for runtime type checking of resources.
 * Reference: ADR-012 - Universal State v2
 *
 * @module @nasnet/core/types/resource
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
 * Check if resource is a VPN resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is VPN
 *
 * @example
 * if (isVPNResource(resource)) {
 *   applyVPNSpecificLogic(resource);
 * }
 */
export function isVPNResource(resource: Resource): boolean {
  return resource.category === 'VPN';
}

/**
 * Check if resource is a Network resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is NETWORK
 *
 * @example
 * const networks = resources.filter(isNetworkResource);
 */
export function isNetworkResource(resource: Resource): boolean {
  return resource.category === 'NETWORK';
}

/**
 * Check if resource is an Infrastructure resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is INFRASTRUCTURE
 *
 * @example
 * const infrastructure = resources.filter(isInfrastructureResource);
 */
export function isInfrastructureResource(resource: Resource): boolean {
  return resource.category === 'INFRASTRUCTURE';
}

/**
 * Check if resource is an Application resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is APPLICATION
 *
 * @example
 * if (isApplicationResource(resource)) {
 *   showAppSpecificUI(resource);
 * }
 */
export function isApplicationResource(resource: Resource): boolean {
  return resource.category === 'APPLICATION';
}

/**
 * Check if resource is a Feature (marketplace) resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is FEATURE
 *
 * @example
 * const marketplaceFeatures = resources.filter(isFeatureResource);
 */
export function isFeatureResource(resource: Resource): boolean {
  return resource.category === 'FEATURE';
}

/**
 * Check if resource is a Plugin resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is PLUGIN
 *
 * @example
 * const plugins = resources.filter(isPluginResource);
 */
export function isPluginResource(resource: Resource): boolean {
  return resource.category === 'PLUGIN';
}

/**
 * Check if resource belongs to a specific category.
 *
 * @param resource - Resource to check
 * @param category - Category to match against
 * @returns True if resource category matches
 *
 * @example
 * if (isResourceCategory(resource, 'VPN')) {
 *   // Handle VPN category
 * }
 */
export function isResourceCategory(resource: Resource, category: ResourceCategory): boolean {
  return resource.category === category;
}

// =============================================================================
// Resource Type Guards
// =============================================================================

/**
 * Check if resource is a WireGuard client.
 *
 * @param resource - Resource to check
 * @returns True if resource type is vpn.wireguard.client
 *
 * @example
 * const clients = resources.filter(isWireGuardClient);
 */
export function isWireGuardClient(resource: Resource): boolean {
  return resource.type === 'vpn.wireguard.client';
}

/**
 * Check if resource is a WireGuard server.
 *
 * @param resource - Resource to check
 * @returns True if resource type is vpn.wireguard.server
 *
 * @example
 * const servers = resources.filter(isWireGuardServer);
 */
export function isWireGuardServer(resource: Resource): boolean {
  return resource.type === 'vpn.wireguard.server';
}

/**
 * Check if resource is a LAN network.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.lan
 *
 * @example
 * const lanNetworks = resources.filter(isLANNetwork);
 */
export function isLANNetwork(resource: Resource): boolean {
  return resource.type === 'network.lan';
}

/**
 * Check if resource is a WAN link.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.wan
 *
 * @example
 * const wanLinks = resources.filter(isWANLink);
 */
export function isWANLink(resource: Resource): boolean {
  return resource.type === 'network.wan';
}

/**
 * Check if resource is a firewall rule.
 *
 * @param resource - Resource to check
 * @returns True if resource type is security.firewall.rule
 *
 * @example
 * const rules = resources.filter(isFirewallRule);
 */
export function isFirewallRule(resource: Resource): boolean {
  return resource.type === 'security.firewall.rule';
}

/**
 * Check if resource is a DHCP server.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.dhcp.server
 *
 * @example
 * const dhcpServers = resources.filter(isDHCPServer);
 */
export function isDHCPServer(resource: Resource): boolean {
  return resource.type === 'network.dhcp.server';
}

/**
 * Check if resource is a bridge.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.bridge
 *
 * @example
 * const bridges = resources.filter(isBridge);
 */
export function isBridge(resource: Resource): boolean {
  return resource.type === 'network.bridge';
}

/**
 * Check if resource is a route.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.route
 *
 * @example
 * const routes = resources.filter(isRoute);
 */
export function isRoute(resource: Resource): boolean {
  return resource.type === 'network.route';
}

/**
 * Check if resource type starts with a prefix.
 *
 * Generic type guard for matching resource types by prefix pattern.
 *
 * @param resource - Resource to check
 * @param prefix - Type prefix to match
 * @returns True if resource type starts with prefix
 *
 * @example
 * const vpnResources = resources.filter(r => hasResourceTypePrefix(r, 'vpn.'));
 */
export function hasResourceTypePrefix(resource: Resource, prefix: string): boolean {
  return resource.type.startsWith(prefix);
}

// =============================================================================
// Layer Presence Guards
// =============================================================================

/**
 * Check if resource has validation data.
 *
 * Type predicate that narrows the resource type to include validation layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has validation data
 *
 * @example
 * if (hasValidation(resource)) {
 *   // resource.validation is now guaranteed to exist
 *   console.log(resource.validation.canApply);
 * }
 */
export function hasValidation(
  resource: Resource
): resource is Resource & { validation: ValidationResult } {
  return resource.validation != null;
}

/**
 * Check if resource has deployment data.
 *
 * Type predicate that narrows the resource type to include deployment layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has deployment data
 *
 * @example
 * if (hasDeployment(resource)) {
 *   // resource.deployment is now guaranteed to exist
 *   console.log(resource.deployment.isInSync);
 * }
 */
export function hasDeployment(
  resource: Resource
): resource is Resource & { deployment: DeploymentState } {
  return resource.deployment != null;
}

/**
 * Check if resource has runtime data.
 *
 * Type predicate that narrows the resource type to include runtime layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has runtime data
 *
 * @example
 * if (hasRuntime(resource)) {
 *   // resource.runtime is now guaranteed to exist
 *   console.log(resource.runtime.isRunning);
 * }
 */
export function hasRuntime(resource: Resource): resource is Resource & { runtime: RuntimeState } {
  return resource.runtime != null;
}

/**
 * Check if resource has telemetry data.
 *
 * Type predicate that narrows the resource type to include telemetry layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has telemetry data
 *
 * @example
 * if (hasTelemetry(resource)) {
 *   // resource.telemetry is now guaranteed to exist
 *   showTelemetryChart(resource.telemetry);
 * }
 */
export function hasTelemetry(
  resource: Resource
): resource is Resource & { telemetry: TelemetryData } {
  return resource.telemetry != null;
}

/**
 * Check if resource has relationships data.
 *
 * Type predicate that narrows the resource type to include relationships layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has relationships data
 *
 * @example
 * if (hasRelationships(resource)) {
 *   // resource.relationships is now guaranteed to exist
 *   const deps = resource.relationships.dependsOn || [];
 * }
 */
export function hasRelationships(
  resource: Resource
): resource is Resource & { relationships: ResourceRelationships } {
  return resource.relationships != null;
}

/**
 * Check if resource has platform data.
 *
 * Type predicate that narrows the resource type to include platform layer.
 *
 * @param resource - Resource to check
 * @returns True if resource has platform data
 *
 * @example
 * if (hasPlatform(resource)) {
 *   // resource.platform is now guaranteed to exist
 *   console.log(resource.platform.current);
 * }
 */
export function hasPlatform(resource: Resource): resource is Resource & { platform: PlatformInfo } {
  return resource.platform != null;
}

// =============================================================================
// Composite Resource Guards
// =============================================================================

/**
 * Check if value is a composite resource.
 *
 * Type predicate that narrows unknown value to CompositeResource type.
 *
 * @param value - Value to check
 * @returns True if value is a valid composite resource
 *
 * @example
 * const data = JSON.parse(jsonString);
 * if (isCompositeResource(data)) {
 *   processComposite(data.root, data.children);
 * }
 */
export function isCompositeResource(value: unknown): value is CompositeResource {
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
 * Check if resource is in draft state.
 *
 * @param resource - Resource to check
 * @returns True if resource is DRAFT
 *
 * @example
 * const drafts = resources.filter(isDraft);
 */
export function isDraft(resource: Resource): boolean {
  return resource.metadata.state === 'DRAFT';
}

/**
 * Check if resource is validating.
 *
 * @param resource - Resource to check
 * @returns True if resource is VALIDATING
 *
 * @example
 * const validating = resources.filter(isValidating);
 */
export function isValidating(resource: Resource): boolean {
  return resource.metadata.state === 'VALIDATING';
}

/**
 * Check if resource is valid.
 *
 * @param resource - Resource to check
 * @returns True if resource is VALID
 *
 * @example
 * if (isValid(resource)) allowApply();
 */
export function isValid(resource: Resource): boolean {
  return resource.metadata.state === 'VALID';
}

/**
 * Check if resource is applying.
 *
 * @param resource - Resource to check
 * @returns True if resource is APPLYING
 *
 * @example
 * if (isApplying(resource)) showProgressSpinner();
 */
export function isApplying(resource: Resource): boolean {
  return resource.metadata.state === 'APPLYING';
}

/**
 * Check if resource is active.
 *
 * @param resource - Resource to check
 * @returns True if resource is ACTIVE
 *
 * @example
 * const active = resources.filter(isActive);
 */
export function isActive(resource: Resource): boolean {
  return resource.metadata.state === 'ACTIVE';
}

/**
 * Check if resource is degraded.
 *
 * @param resource - Resource to check
 * @returns True if resource is DEGRADED
 *
 * @example
 * const degraded = resources.filter(isDegraded);
 */
export function isDegraded(resource: Resource): boolean {
  return resource.metadata.state === 'DEGRADED';
}

/**
 * Check if resource is in error state.
 *
 * @param resource - Resource to check
 * @returns True if resource is ERROR
 *
 * @example
 * const errors = resources.filter(isError);
 */
export function isError(resource: Resource): boolean {
  return resource.metadata.state === 'ERROR';
}

/**
 * Check if resource is deprecated.
 *
 * @param resource - Resource to check
 * @returns True if resource is DEPRECATED
 *
 * @example
 * const deprecated = resources.filter(isDeprecated);
 */
export function isDeprecated(resource: Resource): boolean {
  return resource.metadata.state === 'DEPRECATED';
}

/**
 * Check if resource is archived.
 *
 * @param resource - Resource to check
 * @returns True if resource is ARCHIVED
 *
 * @example
 * const archived = resources.filter(isArchived);
 */
export function isArchived(resource: Resource): boolean {
  return resource.metadata.state === 'ARCHIVED';
}

/**
 * Check if resource is in a specific state.
 *
 * Generic state check for matching a particular lifecycle state.
 *
 * @param resource - Resource to check
 * @param state - Lifecycle state to match
 * @returns True if resource matches the state
 *
 * @example
 * if (isInState(resource, 'ACTIVE')) {
 *   console.log('Ready to use');
 * }
 */
export function isInState(resource: Resource, state: ResourceLifecycleState): boolean {
  return resource.metadata.state === state;
}

// =============================================================================
// Health Guards
// =============================================================================

/**
 * Check if resource runtime is healthy.
 *
 * @param resource - Resource to check
 * @returns True if resource runtime health is HEALTHY
 *
 * @example
 * const healthy = resources.filter(isHealthy);
 */
export function isHealthy(resource: Resource): boolean {
  return resource.runtime?.health === 'HEALTHY';
}

/**
 * Check if resource runtime is running.
 *
 * @param resource - Resource to check
 * @returns True if resource runtime is running
 *
 * @example
 * if (isRunning(resource)) console.log('Active');
 */
export function isRunning(resource: Resource): boolean {
  return resource.runtime?.isRunning === true;
}

/**
 * Check if resource has drift.
 *
 * @param resource - Resource to check
 * @returns True if resource deployment has drift
 *
 * @example
 * if (hasDrift(resource)) showDriftWarning();
 */
export function hasDrift(resource: Resource): boolean {
  return resource.deployment?.drift != null;
}

/**
 * Check if resource is in sync with deployment.
 *
 * @param resource - Resource to check
 * @returns True if resource deployment is in sync
 *
 * @example
 * if (isInSync(resource)) console.log('No drift detected');
 */
export function isInSync(resource: Resource): boolean {
  return resource.deployment?.isInSync === true;
}

// =============================================================================
// Validation Guards
// =============================================================================

/**
 * Check if resource can be applied.
 *
 * @param resource - Resource to check
 * @returns True if validation permits applying the resource
 *
 * @example
 * if (canApply(resource)) enableApplyButton();
 */
export function canApply(resource: Resource): boolean {
  return resource.validation?.canApply === true;
}

/**
 * Check if resource has validation errors.
 *
 * @param resource - Resource to check
 * @returns True if validation has errors
 *
 * @example
 * if (hasValidationErrors(resource)) {
 *   showErrorMessage(resource.validation?.errors);
 * }
 */
export function hasValidationErrors(resource: Resource): boolean {
  return (resource.validation?.errors?.length ?? 0) > 0;
}

/**
 * Check if resource has validation warnings.
 *
 * @param resource - Resource to check
 * @returns True if validation has warnings
 *
 * @example
 * if (hasValidationWarnings(resource)) {
 *   showWarningBanner(resource.validation?.warnings);
 * }
 */
export function hasValidationWarnings(resource: Resource): boolean {
  return (resource.validation?.warnings?.length ?? 0) > 0;
}

/**
 * Check if resource has conflicts.
 *
 * @param resource - Resource to check
 * @returns True if validation has conflicts
 *
 * @example
 * if (hasConflicts(resource)) {
 *   showConflictResolutionDialog(resource.validation?.conflicts);
 * }
 */
export function hasConflicts(resource: Resource): boolean {
  return (resource.validation?.conflicts?.length ?? 0) > 0;
}

// =============================================================================
// Generic Object Guards
// =============================================================================

/**
 * Check if value is a valid Resource object.
 *
 * Type predicate that narrows unknown value to Resource type.
 *
 * @param value - Value to check
 * @returns True if value has required Resource properties
 *
 * @example
 * const data = JSON.parse(jsonString);
 * if (isResource(data)) {
 *   processResource(data);
 * }
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
 * Check if value is a ResourceMetadata object.
 *
 * Type predicate that narrows unknown value to ResourceMetadata type.
 *
 * @param value - Value to check
 * @returns True if value has required ResourceMetadata properties
 *
 * @example
 * if (isResourceMetadata(meta)) {
 *   console.log(meta.createdAt);
 * }
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
