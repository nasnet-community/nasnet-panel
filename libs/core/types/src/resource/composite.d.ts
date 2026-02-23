/**
 * Composite Resource Pattern Utilities
 *
 * Utilities for working with composite resources that aggregate
 * multiple sub-resources. Common patterns:
 * - WireGuard Server + Clients
 * - LAN Network + DHCP Server + Leases
 * - Bridge + Member Interfaces
 * - Feature + Sub-resources
 *
 * @see ADR-012: Universal State v2
 * @module @nasnet/core/types/resource
 */
import type { Resource, ResourceCategory, ResourceReference, CompositeResource } from './resource';
import type { ResourceLifecycleState } from './lifecycle';
import type { RuntimeState } from './layers';
/**
 * Status aggregation for composite resources.
 *
 * Provides aggregated health and state metrics for a composite resource
 * and its sub-resources.
 *
 * @example
 * const status = aggregateCompositeStatus(subResources);
 * if (status.overallHealth === 'CRITICAL') {
 *   // Handle critical health state
 * }
 */
export interface CompositeResourceStatus {
    /** Total number of sub-resources */
    readonly totalCount: number;
    /** Number of active sub-resources */
    readonly activeCount: number;
    /** Number of sub-resources with errors */
    readonly errorCount: number;
    /** Number of degraded sub-resources */
    readonly degradedCount: number;
    /** Number of pending sub-resources */
    readonly pendingCount: number;
    /** Overall health based on sub-resources */
    readonly overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
    /** Whether all sub-resources are running */
    readonly allRunning: boolean;
    /** Whether any sub-resource has drift */
    readonly hasDrift: boolean;
    /** Whether the composite is fully synced */
    readonly isFullySynced: boolean;
}
/**
 * Composite resource tree node for visualization.
 *
 * Represents a node in a hierarchical resource tree, used for
 * displaying composite resources in a tree structure.
 *
 * @example
 * const tree = buildResourceTree(composite);
 * const flattened = flattenResourceTree(tree);
 */
export interface CompositeResourceNode {
    /** Resource UUID */
    readonly uuid: string;
    /** Resource ID */
    readonly id: string;
    /** Resource type */
    readonly type: string;
    /** Lifecycle state */
    readonly state: ResourceLifecycleState;
    /** Runtime status */
    readonly isRunning: boolean;
    /** Health status */
    readonly health: RuntimeState['health'];
    /** Child nodes */
    readonly children: readonly CompositeResourceNode[];
    /** Depth in tree */
    readonly depth: number;
}
/**
 * Dependency resolution order for applying resources.
 *
 * Provides topologically sorted resource UUIDs in correct application order,
 * with identified root resources and circular dependencies.
 *
 * @example
 * const order = resolveDependencyOrder(resources);
 * // Apply in order: roots -> ordered (skip circular)
 */
export interface DependencyOrder {
    /** Resources that should be applied first (no dependencies) */
    readonly roots: readonly string[];
    /** Resources in dependency order (parents before children) */
    readonly ordered: readonly string[];
    /** Resources with circular dependencies (cannot be ordered) */
    readonly circular: readonly string[];
}
/**
 * Build a composite resource from a root and sub-resources.
 *
 * Constructs a composite resource by aggregating a root resource with
 * its sub-resources and establishing relationships between them.
 *
 * @param root - The root resource
 * @param subResources - Array of child resources
 * @returns Composite resource with established relationships
 *
 * @example
 * const server = await getWireGuardServer();
 * const clients = await getWireGuardClients(server.uuid);
 * const composite = buildCompositeResource(server, clients);
 */
export declare function buildCompositeResource<TRoot extends Resource>(root: TRoot, subResources: Resource[]): CompositeResource<TRoot>;
/**
 * Extract reference from a resource.
 *
 * Creates a lightweight reference object from a resource, useful for
 * storing relationships or creating dependency graphs.
 *
 * @param resource - The resource to extract from
 * @returns Reference with UUID, ID, type, category, and state
 *
 * @example
 * const ref = resourceToReference(resource);
 * dependencies.push(ref);
 */
export declare function resourceToReference(resource: Resource): ResourceReference;
/**
 * Calculate aggregated status from sub-resources.
 *
 * Computes aggregate health, state counts, and sync status
 * for a collection of sub-resources.
 *
 * @param subResources - Array of resources to aggregate
 * @returns Aggregated status with health, counts, and sync information
 *
 * @example
 * const status = aggregateCompositeStatus(children);
 * console.log(`Health: ${status.overallHealth}, Active: ${status.activeCount}`);
 */
export declare function aggregateCompositeStatus(subResources: Resource[]): CompositeResourceStatus;
/**
 * Calculate health percentage (0-100).
 *
 * Converts aggregated status into a percentage based on
 * active resources vs total resources.
 *
 * @param status - Aggregated composite resource status
 * @returns Health percentage (0-100)
 *
 * @example
 * const percentage = calculateHealthPercentage(status);
 * console.log(`Health: ${percentage}%`);
 */
export declare function calculateHealthPercentage(status: CompositeResourceStatus): number;
/**
 * Build a tree structure from composite resource.
 *
 * Constructs a hierarchical tree representation from a composite resource,
 * with configurable maximum depth for large hierarchies.
 *
 * @param composite - Composite resource to convert to tree
 * @param maxDepth - Maximum tree depth (default: 10)
 * @returns Root node of the tree structure
 *
 * @example
 * const tree = buildResourceTree(composite);
 * renderTree(tree);
 */
export declare function buildResourceTree(composite: CompositeResource, maxDepth?: number): CompositeResourceNode;
/**
 * Flatten a resource tree to an array.
 *
 * Converts a hierarchical tree structure into a flat array
 * with depth-first ordering.
 *
 * @param tree - Tree node to flatten
 * @returns Flat array of all nodes in the tree
 *
 * @example
 * const tree = buildResourceTree(composite);
 * const flat = flattenResourceTree(tree);
 * flat.forEach(node => console.log(node.id));
 */
export declare function flattenResourceTree(tree: CompositeResourceNode): CompositeResourceNode[];
/**
 * Find a node in the tree by UUID.
 *
 * Recursively searches a tree for a node matching the given UUID.
 *
 * @param tree - Tree node to search from
 * @param uuid - UUID to search for
 * @returns Matching node or undefined if not found
 *
 * @example
 * const node = findNodeInTree(tree, targetUuid);
 * if (node) renderDetails(node);
 */
export declare function findNodeInTree(tree: CompositeResourceNode, uuid: string): CompositeResourceNode | undefined;
/**
 * Resolve dependency order for applying resources.
 *
 * Uses topological sort with cycle detection to determine
 * the correct order for applying resources. Identifies root resources
 * (no dependencies) and circular dependencies.
 *
 * @param resources - Resources to sort
 * @returns Dependency order with roots, sorted resources, and cycles
 *
 * @example
 * const order = resolveDependencyOrder(resources);
 * // Apply in order: order.roots first, then order.ordered
 * // Skip or handle order.circular separately
 */
export declare function resolveDependencyOrder(resources: Resource[]): DependencyOrder;
/**
 * Check if a resource can be safely deleted.
 *
 * Determines whether a resource can be deleted without breaking
 * dependencies. Returns blocking resources if deletion is unsafe.
 *
 * @param resource - Resource to check for deletion safety
 * @param allResources - All resources to check dependencies against
 * @returns Object with canDelete flag and blocking resources
 *
 * @example
 * const safety = canSafelyDelete(resource, allResources);
 * if (!safety.canDelete) {
 *   console.log('Blocked by:', safety.blockedBy);
 * }
 */
export declare function canSafelyDelete(resource: Resource, allResources: Resource[]): {
    readonly canDelete: boolean;
    readonly blockedBy: readonly ResourceReference[];
};
/**
 * Group resources by type.
 *
 * Partitions resources into groups by their type field.
 *
 * @param resources - Resources to group
 * @returns Map from resource type to array of resources
 *
 * @example
 * const groups = groupResourcesByType(resources);
 * groups.forEach((resourceGroup, type) => {
 *   console.log(`Type: ${type}, Count: ${resourceGroup.length}`);
 * });
 */
export declare function groupResourcesByType(resources: Resource[]): Map<string, Resource[]>;
/**
 * Group resources by category.
 *
 * Partitions resources into groups by their category field.
 *
 * @param resources - Resources to group
 * @returns Map from resource category to array of resources
 *
 * @example
 * const groups = groupResourcesByCategory(resources);
 * const vpnResources = groups.get('VPN') || [];
 */
export declare function groupResourcesByCategory(resources: Resource[]): Map<ResourceCategory, Resource[]>;
/**
 * Filter resources by lifecycle state.
 *
 * Returns only resources matching one of the specified lifecycle states.
 *
 * @param resources - Resources to filter
 * @param states - States to include in results
 * @returns Filtered array of resources
 *
 * @example
 * const active = filterResourcesByState(resources, ['ACTIVE', 'DEGRADED']);
 */
export declare function filterResourcesByState(resources: Resource[], states: ResourceLifecycleState[]): Resource[];
/**
 * Filter resources by health status.
 *
 * Returns only resources with runtime health matching specified values.
 *
 * @param resources - Resources to filter
 * @param health - Health statuses to include
 * @returns Filtered array of resources with matching health
 *
 * @example
 * const unhealthy = filterResourcesByHealth(resources, ['DEGRADED', 'CRITICAL']);
 */
export declare function filterResourcesByHealth(resources: Resource[], health: RuntimeState['health'][]): Resource[];
/**
 * Find all resources that depend on a given resource.
 *
 * Returns all resources that list the given resource as a dependency.
 *
 * @param resource - Resource to find dependents for
 * @param allResources - All resources to search
 * @returns Array of resources that depend on the given resource
 *
 * @example
 * const dependents = findDependents(dhcpServer, allResources);
 * console.log(`${dependents.length} resources depend on this server`);
 */
export declare function findDependents(resource: Resource, allResources: Resource[]): Resource[];
/**
 * Find all resources that a given resource depends on.
 *
 * Returns all resources listed as dependencies of the given resource.
 *
 * @param resource - Resource to find dependencies for
 * @param allResources - All resources to search
 * @returns Array of resources that the given resource depends on
 *
 * @example
 * const dependencies = findDependencies(service, allResources);
 * console.log(`This service depends on ${dependencies.length} resources`);
 */
export declare function findDependencies(resource: Resource, allResources: Resource[]): Resource[];
/**
 * Check if a resource has sub-resources.
 *
 * Type guard that verifies a resource has child resources.
 *
 * @param resource - Resource to check
 * @returns True if resource has children
 *
 * @example
 * if (hasSubResources(resource)) {
 *   renderChildrenUI(resource.relationships.children);
 * }
 */
export declare function hasSubResources(resource: Resource): boolean;
/**
 * Check if a resource is a root (no parent).
 *
 * Type guard that verifies a resource is a root in the hierarchy.
 *
 * @param resource - Resource to check
 * @returns True if resource has no parent
 *
 * @example
 * const roots = resources.filter(isRootResource);
 */
export declare function isRootResource(resource: Resource): boolean;
/**
 * Check if a resource is a leaf (no children).
 *
 * Type guard that verifies a resource is a leaf with no sub-resources.
 *
 * @param resource - Resource to check
 * @returns True if resource has no children
 *
 * @example
 * const leaves = resources.filter(isLeafResource);
 */
export declare function isLeafResource(resource: Resource): boolean;
//# sourceMappingURL=composite.d.ts.map