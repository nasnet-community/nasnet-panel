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

import type {
  Resource,
  ResourceCategory,
  ResourceReference,
  ResourceRelationshipEdge,
  ResourceRelationshipType,
  CompositeResource,
} from './resource';
import type { ResourceLifecycleState } from './lifecycle';
import type { RuntimeState } from './layers';

// ============================================================================
// Composite Resource Types
// ============================================================================

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

// ============================================================================
// Composite Resource Builders
// ============================================================================

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
export function buildCompositeResource<TRoot extends Resource>(
  root: TRoot,
  subResources: Resource[]
): CompositeResource<TRoot> {
  const relationships: ResourceRelationshipEdge[] = [];

  // Build relationships from sub-resource data
  for (const sub of subResources) {
    if (sub.relationships?.parent?.uuid === root.uuid) {
      relationships.push({
        from: root.uuid,
        to: sub.uuid,
        type: 'PARENT_CHILD',
      });
    }
    if (sub.relationships?.dependsOn) {
      for (const dep of sub.relationships.dependsOn) {
        relationships.push({
          from: sub.uuid,
          to: dep.uuid,
          type: 'DEPENDS_ON',
        });
      }
    }
    if (sub.relationships?.routesVia) {
      // @ts-expect-error - Pre-existing type error, tracked separately
      for (const via of sub.relationships.routesVia) {
        relationships.push({
          from: sub.uuid,
          to: via.uuid,
          type: 'ROUTES_VIA',
        });
      }
    }
  }

  return {
    root,
    children: subResources,
    relationships,
  };
}

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
export function resourceToReference(resource: Resource): ResourceReference {
  return {
    uuid: resource.uuid,
    id: resource.id,
    type: resource.type,
    category: resource.category,
    state: resource.metadata?.state ?? 'DRAFT',
  };
}

// ============================================================================
// Status Aggregation
// ============================================================================

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
export function aggregateCompositeStatus(subResources: Resource[]): CompositeResourceStatus {
  if (subResources.length === 0) {
    return {
      totalCount: 0,
      activeCount: 0,
      errorCount: 0,
      degradedCount: 0,
      pendingCount: 0,
      overallHealth: 'UNKNOWN',
      allRunning: true,
      hasDrift: false,
      isFullySynced: true,
    };
  }

  let activeCount = 0;
  let errorCount = 0;
  let degradedCount = 0;
  let pendingCount = 0;
  let allRunning = true;
  let hasDrift = false;
  let isFullySynced = true;

  for (const resource of subResources) {
    const state = resource.metadata?.state;
    const runtime = resource.runtime;
    const deployment = resource.deployment;

    // Count by state
    switch (state) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'ERROR':
        errorCount++;
        break;
      case 'DEGRADED':
        degradedCount++;
        break;
      case 'VALIDATING':
      case 'APPLYING':
        pendingCount++;
        break;
    }

    // Check runtime
    if (runtime) {
      if (!runtime.isRunning) {
        allRunning = false;
      }
      if (runtime.health === 'DEGRADED') {
        degradedCount++;
      } else if (runtime.health === 'CRITICAL') {
        errorCount++;
      }
    }

    // Check deployment
    if (deployment) {
      if (deployment.drift) {
        hasDrift = true;
      }
      if (!deployment.isInSync) {
        isFullySynced = false;
      }
    }
  }

  // Determine overall health
  let overallHealth: CompositeResourceStatus['overallHealth'];
  if (errorCount > 0) {
    overallHealth = 'CRITICAL';
  } else if (degradedCount > 0 || hasDrift) {
    overallHealth = 'DEGRADED';
  } else if (activeCount === subResources.length) {
    overallHealth = 'HEALTHY';
  } else {
    overallHealth = 'UNKNOWN';
  }

  return {
    totalCount: subResources.length,
    activeCount,
    errorCount,
    degradedCount,
    pendingCount,
    overallHealth,
    allRunning,
    hasDrift,
    isFullySynced,
  };
}

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
export function calculateHealthPercentage(status: CompositeResourceStatus): number {
  if (status.totalCount === 0) return 100;
  return Math.round((status.activeCount / status.totalCount) * 100);
}

// ============================================================================
// Tree Operations
// ============================================================================

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
export function buildResourceTree(
  composite: CompositeResource,
  maxDepth = 10
): CompositeResourceNode {
  const { root, children, relationships } = composite;

  // Build parent -> children map
  const childMap = new Map<string, Resource[]>();
  for (const child of children) {
    const parentUuid = child.relationships?.parent?.uuid;
    if (parentUuid) {
      if (!childMap.has(parentUuid)) {
        childMap.set(parentUuid, []);
      }
      childMap.get(parentUuid)!.push(child);
    }
  }

  // Recursive tree builder
  function buildNode(resource: Resource, depth: number): CompositeResourceNode {
    const resourceChildren = childMap.get(resource.uuid) ?? [];
    return {
      uuid: resource.uuid,
      id: resource.id,
      type: resource.type,
      state: resource.metadata?.state ?? 'DRAFT',
      isRunning: resource.runtime?.isRunning ?? false,
      health: resource.runtime?.health ?? 'UNKNOWN',
      children: depth < maxDepth ? resourceChildren.map((c) => buildNode(c, depth + 1)) : [],
      depth,
    };
  }

  return buildNode(root, 0);
}

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
export function flattenResourceTree(tree: CompositeResourceNode): CompositeResourceNode[] {
  const result: CompositeResourceNode[] = [tree];

  for (const child of tree.children) {
    result.push(...flattenResourceTree(child));
  }

  return result;
}

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
export function findNodeInTree(
  tree: CompositeResourceNode,
  uuid: string
): CompositeResourceNode | undefined {
  if (tree.uuid === uuid) return tree;

  for (const child of tree.children) {
    const found = findNodeInTree(child, uuid);
    if (found) return found;
  }

  return undefined;
}

// ============================================================================
// Dependency Resolution
// ============================================================================

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
export function resolveDependencyOrder(resources: Resource[]): DependencyOrder {
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const resource of resources) {
    graph.set(resource.uuid, new Set());
    inDegree.set(resource.uuid, 0);
  }

  // Build dependency graph
  for (const resource of resources) {
    const deps = resource.relationships?.dependsOn ?? [];
    for (const dep of deps) {
      if (graph.has(dep.uuid)) {
        graph.get(dep.uuid)!.add(resource.uuid);
        inDegree.set(resource.uuid, (inDegree.get(resource.uuid) ?? 0) + 1);
      }
    }
  }

  // Find roots (no dependencies)
  const roots: string[] = [];
  const queue: string[] = [];

  for (const [uuid, degree] of inDegree) {
    if (degree === 0) {
      roots.push(uuid);
      queue.push(uuid);
    }
  }

  // Topological sort
  const ordered: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    ordered.push(current);

    const dependents = graph.get(current) ?? new Set();
    for (const dependent of dependents) {
      const newDegree = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // Find circular dependencies (remaining with non-zero in-degree)
  const circular: string[] = [];
  for (const [uuid, degree] of inDegree) {
    if (degree > 0) {
      circular.push(uuid);
    }
  }

  return { roots, ordered, circular };
}

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
export function canSafelyDelete(
  resource: Resource,
  allResources: Resource[]
): { readonly canDelete: boolean; readonly blockedBy: readonly ResourceReference[] } {
  const blockedBy: ResourceReference[] = [];

  for (const other of allResources) {
    if (other.uuid === resource.uuid) continue;

    const deps = other.relationships?.dependsOn ?? [];
    const routes = other.relationships?.routesVia ?? [];

    // @ts-expect-error - Pre-existing type error, tracked separately
    const allRefs = [...deps, ...routes];
    const dependsOnThis = allRefs.some((ref) => ref.uuid === resource.uuid);

    if (dependsOnThis) {
      blockedBy.push(resourceToReference(other));
    }
  }

  return {
    canDelete: blockedBy.length === 0,
    blockedBy: Object.freeze(blockedBy) as readonly ResourceReference[],
  };
}

// ============================================================================
// Filtering and Grouping
// ============================================================================

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
export function groupResourcesByType(resources: Resource[]): Map<string, Resource[]> {
  const groups = new Map<string, Resource[]>();

  for (const resource of resources) {
    if (!groups.has(resource.type)) {
      groups.set(resource.type, []);
    }
    groups.get(resource.type)!.push(resource);
  }

  return groups;
}

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
export function groupResourcesByCategory(resources: Resource[]): Map<ResourceCategory, Resource[]> {
  const groups = new Map<ResourceCategory, Resource[]>();

  for (const resource of resources) {
    if (!groups.has(resource.category)) {
      groups.set(resource.category, []);
    }
    groups.get(resource.category)!.push(resource);
  }

  return groups;
}

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
export function filterResourcesByState(
  resources: Resource[],
  states: ResourceLifecycleState[]
): Resource[] {
  return resources.filter((r) => {
    const state = r.metadata?.state;
    return state && states.includes(state);
  });
}

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
export function filterResourcesByHealth(
  resources: Resource[],
  health: RuntimeState['health'][]
): Resource[] {
  return resources.filter((r) => {
    const h = r.runtime?.health;
    return h && health.includes(h);
  });
}

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
export function findDependents(resource: Resource, allResources: Resource[]): Resource[] {
  return allResources.filter((r) => {
    const deps = r.relationships?.dependsOn ?? [];
    return deps.some((dep) => dep.uuid === resource.uuid);
  });
}

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
export function findDependencies(resource: Resource, allResources: Resource[]): Resource[] {
  const depUuids = (resource.relationships?.dependsOn ?? []).map((d) => d.uuid);
  return allResources.filter((r) => depUuids.includes(r.uuid));
}

// ============================================================================
// Type Guards for Composite Resources
// ============================================================================

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
export function hasSubResources(resource: Resource): boolean {
  const children = resource.relationships?.children ?? [];
  return children.length > 0;
}

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
export function isRootResource(resource: Resource): boolean {
  return resource.relationships?.parent === undefined || resource.relationships?.parent === null;
}

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
export function isLeafResource(resource: Resource): boolean {
  const children = resource.relationships?.children ?? [];
  return children.length === 0;
}
