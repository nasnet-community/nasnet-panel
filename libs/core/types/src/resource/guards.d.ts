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
export declare function isVPNResource(resource: Resource): boolean;
/**
 * Check if resource is a Network resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is NETWORK
 *
 * @example
 * const networks = resources.filter(isNetworkResource);
 */
export declare function isNetworkResource(resource: Resource): boolean;
/**
 * Check if resource is an Infrastructure resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is INFRASTRUCTURE
 *
 * @example
 * const infrastructure = resources.filter(isInfrastructureResource);
 */
export declare function isInfrastructureResource(resource: Resource): boolean;
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
export declare function isApplicationResource(resource: Resource): boolean;
/**
 * Check if resource is a Feature (marketplace) resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is FEATURE
 *
 * @example
 * const marketplaceFeatures = resources.filter(isFeatureResource);
 */
export declare function isFeatureResource(resource: Resource): boolean;
/**
 * Check if resource is a Plugin resource.
 *
 * @param resource - Resource to check
 * @returns True if resource category is PLUGIN
 *
 * @example
 * const plugins = resources.filter(isPluginResource);
 */
export declare function isPluginResource(resource: Resource): boolean;
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
export declare function isResourceCategory(resource: Resource, category: ResourceCategory): boolean;
/**
 * Check if resource is a WireGuard client.
 *
 * @param resource - Resource to check
 * @returns True if resource type is vpn.wireguard.client
 *
 * @example
 * const clients = resources.filter(isWireGuardClient);
 */
export declare function isWireGuardClient(resource: Resource): boolean;
/**
 * Check if resource is a WireGuard server.
 *
 * @param resource - Resource to check
 * @returns True if resource type is vpn.wireguard.server
 *
 * @example
 * const servers = resources.filter(isWireGuardServer);
 */
export declare function isWireGuardServer(resource: Resource): boolean;
/**
 * Check if resource is a LAN network.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.lan
 *
 * @example
 * const lanNetworks = resources.filter(isLANNetwork);
 */
export declare function isLANNetwork(resource: Resource): boolean;
/**
 * Check if resource is a WAN link.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.wan
 *
 * @example
 * const wanLinks = resources.filter(isWANLink);
 */
export declare function isWANLink(resource: Resource): boolean;
/**
 * Check if resource is a firewall rule.
 *
 * @param resource - Resource to check
 * @returns True if resource type is security.firewall.rule
 *
 * @example
 * const rules = resources.filter(isFirewallRule);
 */
export declare function isFirewallRule(resource: Resource): boolean;
/**
 * Check if resource is a DHCP server.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.dhcp.server
 *
 * @example
 * const dhcpServers = resources.filter(isDHCPServer);
 */
export declare function isDHCPServer(resource: Resource): boolean;
/**
 * Check if resource is a bridge.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.bridge
 *
 * @example
 * const bridges = resources.filter(isBridge);
 */
export declare function isBridge(resource: Resource): boolean;
/**
 * Check if resource is a route.
 *
 * @param resource - Resource to check
 * @returns True if resource type is network.route
 *
 * @example
 * const routes = resources.filter(isRoute);
 */
export declare function isRoute(resource: Resource): boolean;
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
export declare function hasResourceTypePrefix(resource: Resource, prefix: string): boolean;
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
export declare function hasValidation(resource: Resource): resource is Resource & {
  validation: ValidationResult;
};
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
export declare function hasDeployment(resource: Resource): resource is Resource & {
  deployment: DeploymentState;
};
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
export declare function hasRuntime(resource: Resource): resource is Resource & {
  runtime: RuntimeState;
};
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
export declare function hasTelemetry(resource: Resource): resource is Resource & {
  telemetry: TelemetryData;
};
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
export declare function hasRelationships(resource: Resource): resource is Resource & {
  relationships: ResourceRelationships;
};
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
export declare function hasPlatform(resource: Resource): resource is Resource & {
  platform: PlatformInfo;
};
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
export declare function isCompositeResource(value: unknown): value is CompositeResource;
/**
 * Check if resource is in draft state.
 *
 * @param resource - Resource to check
 * @returns True if resource is DRAFT
 *
 * @example
 * const drafts = resources.filter(isDraft);
 */
export declare function isDraft(resource: Resource): boolean;
/**
 * Check if resource is validating.
 *
 * @param resource - Resource to check
 * @returns True if resource is VALIDATING
 *
 * @example
 * const validating = resources.filter(isValidating);
 */
export declare function isValidating(resource: Resource): boolean;
/**
 * Check if resource is valid.
 *
 * @param resource - Resource to check
 * @returns True if resource is VALID
 *
 * @example
 * if (isValid(resource)) allowApply();
 */
export declare function isValid(resource: Resource): boolean;
/**
 * Check if resource is applying.
 *
 * @param resource - Resource to check
 * @returns True if resource is APPLYING
 *
 * @example
 * if (isApplying(resource)) showProgressSpinner();
 */
export declare function isApplying(resource: Resource): boolean;
/**
 * Check if resource is active.
 *
 * @param resource - Resource to check
 * @returns True if resource is ACTIVE
 *
 * @example
 * const active = resources.filter(isActive);
 */
export declare function isActive(resource: Resource): boolean;
/**
 * Check if resource is degraded.
 *
 * @param resource - Resource to check
 * @returns True if resource is DEGRADED
 *
 * @example
 * const degraded = resources.filter(isDegraded);
 */
export declare function isDegraded(resource: Resource): boolean;
/**
 * Check if resource is in error state.
 *
 * @param resource - Resource to check
 * @returns True if resource is ERROR
 *
 * @example
 * const errors = resources.filter(isError);
 */
export declare function isError(resource: Resource): boolean;
/**
 * Check if resource is deprecated.
 *
 * @param resource - Resource to check
 * @returns True if resource is DEPRECATED
 *
 * @example
 * const deprecated = resources.filter(isDeprecated);
 */
export declare function isDeprecated(resource: Resource): boolean;
/**
 * Check if resource is archived.
 *
 * @param resource - Resource to check
 * @returns True if resource is ARCHIVED
 *
 * @example
 * const archived = resources.filter(isArchived);
 */
export declare function isArchived(resource: Resource): boolean;
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
export declare function isInState(resource: Resource, state: ResourceLifecycleState): boolean;
/**
 * Check if resource runtime is healthy.
 *
 * @param resource - Resource to check
 * @returns True if resource runtime health is HEALTHY
 *
 * @example
 * const healthy = resources.filter(isHealthy);
 */
export declare function isHealthy(resource: Resource): boolean;
/**
 * Check if resource runtime is running.
 *
 * @param resource - Resource to check
 * @returns True if resource runtime is running
 *
 * @example
 * if (isRunning(resource)) console.log('Active');
 */
export declare function isRunning(resource: Resource): boolean;
/**
 * Check if resource has drift.
 *
 * @param resource - Resource to check
 * @returns True if resource deployment has drift
 *
 * @example
 * if (hasDrift(resource)) showDriftWarning();
 */
export declare function hasDrift(resource: Resource): boolean;
/**
 * Check if resource is in sync with deployment.
 *
 * @param resource - Resource to check
 * @returns True if resource deployment is in sync
 *
 * @example
 * if (isInSync(resource)) console.log('No drift detected');
 */
export declare function isInSync(resource: Resource): boolean;
/**
 * Check if resource can be applied.
 *
 * @param resource - Resource to check
 * @returns True if validation permits applying the resource
 *
 * @example
 * if (canApply(resource)) enableApplyButton();
 */
export declare function canApply(resource: Resource): boolean;
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
export declare function hasValidationErrors(resource: Resource): boolean;
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
export declare function hasValidationWarnings(resource: Resource): boolean;
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
export declare function hasConflicts(resource: Resource): boolean;
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
export declare function isResource(value: unknown): value is Resource;
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
export declare function isResourceMetadata(value: unknown): value is ResourceMetadata;
//# sourceMappingURL=guards.d.ts.map
