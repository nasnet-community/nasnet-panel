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
 * Status aggregation for composite resources
 */
export interface CompositeResourceStatus {
  /** Total number of sub-resources */
  totalCount: number;
  /** Number of active sub-resources */
  activeCount: number;
  /** Number of sub-resources with errors */
  errorCount: number;
  /** Number of degraded sub-resources */
  degradedCount: number;
  /** Number of pending sub-resources */
  pendingCount: number;
  /** Overall health based on sub-resources */
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  /** Whether all sub-resources are running */
  allRunning: boolean;
  /** Whether any sub-resource has drift */
  hasDrift: boolean;
  /** Whether the composite is fully synced */
  isFullySynced: boolean;
}

/**
 * Composite resource tree node for visualization
 */
export interface CompositeResourceNode {
  /** Resource UUID */
  uuid: string;
  /** Resource ID */
  id: string;
  /** Resource type */
  type: string;
  /** Lifecycle state */
  state: ResourceLifecycleState;
  /** Runtime status */
  isRunning: boolean;
  /** Health status */
  health: RuntimeState['health'];
  /** Child nodes */
  children: CompositeResourceNode[];
  /** Depth in tree */
  depth: number;
}

/**
 * Dependency resolution order for applying resources
 */
export interface DependencyOrder {
  /** Resources that should be applied first (no dependencies) */
  roots: string[];
  /** Resources in dependency order (parents before children) */
  ordered: string[];
  /** Resources with circular dependencies (cannot be ordered) */
  circular: string[];
}

// ============================================================================
// Composite Resource Builders
// ============================================================================

/**
 * Build a composite resource from a root and sub-resources
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
 * Extract reference from a resource
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
 * Calculate aggregated status from sub-resources
 */
export function aggregateCompositeStatus(
  subResources: Resource[]
): CompositeResourceStatus {
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
 * Calculate health percentage (0-100)
 */
export function calculateHealthPercentage(status: CompositeResourceStatus): number {
  if (status.totalCount === 0) return 100;
  return Math.round((status.activeCount / status.totalCount) * 100);
}

// ============================================================================
// Tree Operations
// ============================================================================

/**
 * Build a tree structure from composite resource
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
      children:
        depth < maxDepth
          ? resourceChildren.map((c) => buildNode(c, depth + 1))
          : [],
      depth,
    };
  }

  return buildNode(root, 0);
}

/**
 * Flatten a resource tree to an array
 */
export function flattenResourceTree(
  tree: CompositeResourceNode
): CompositeResourceNode[] {
  const result: CompositeResourceNode[] = [tree];

  for (const child of tree.children) {
    result.push(...flattenResourceTree(child));
  }

  return result;
}

/**
 * Find a node in the tree by UUID
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
 * Resolve dependency order for applying resources
 * Uses topological sort with cycle detection
 */
export function resolveDependencyOrder(
  resources: Resource[]
): DependencyOrder {
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
 * Check if a resource can be safely deleted
 * (no other resources depend on it)
 */
export function canSafelyDelete(
  resource: Resource,
  allResources: Resource[]
): { canDelete: boolean; blockedBy: ResourceReference[] } {
  const blockedBy: ResourceReference[] = [];

  for (const other of allResources) {
    if (other.uuid === resource.uuid) continue;

    const deps = other.relationships?.dependsOn ?? [];
    const routes = other.relationships?.routesVia ?? [];

    const allRefs = [...deps, ...routes];
    const dependsOnThis = allRefs.some((ref) => ref.uuid === resource.uuid);

    if (dependsOnThis) {
      blockedBy.push(resourceToReference(other));
    }
  }

  return {
    canDelete: blockedBy.length === 0,
    blockedBy,
  };
}

// ============================================================================
// Filtering and Grouping
// ============================================================================

/**
 * Group resources by type
 */
export function groupResourcesByType(
  resources: Resource[]
): Map<string, Resource[]> {
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
 * Group resources by category
 */
export function groupResourcesByCategory(
  resources: Resource[]
): Map<ResourceCategory, Resource[]> {
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
 * Filter resources by lifecycle state
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
 * Filter resources by health status
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
 * Find all resources that depend on a given resource
 */
export function findDependents(
  resource: Resource,
  allResources: Resource[]
): Resource[] {
  return allResources.filter((r) => {
    const deps = r.relationships?.dependsOn ?? [];
    return deps.some((dep) => dep.uuid === resource.uuid);
  });
}

/**
 * Find all resources that a given resource depends on
 */
export function findDependencies(
  resource: Resource,
  allResources: Resource[]
): Resource[] {
  const depUuids = (resource.relationships?.dependsOn ?? []).map((d) => d.uuid);
  return allResources.filter((r) => depUuids.includes(r.uuid));
}

// ============================================================================
// Type Guards for Composite Resources
// ============================================================================

/**
 * Check if a resource has sub-resources
 */
export function hasSubResources(resource: Resource): boolean {
  const children = resource.relationships?.children ?? [];
  return children.length > 0;
}

/**
 * Check if a resource is a root (no parent)
 */
export function isRootResource(resource: Resource): boolean {
  return resource.relationships?.parent === undefined ||
    resource.relationships?.parent === null;
}

/**
 * Check if a resource is a leaf (no children)
 */
export function isLeafResource(resource: Resource): boolean {
  const children = resource.relationships?.children ?? [];
  return children.length === 0;
}

export default {
  buildCompositeResource,
  resourceToReference,
  aggregateCompositeStatus,
  calculateHealthPercentage,
  buildResourceTree,
  flattenResourceTree,
  findNodeInTree,
  resolveDependencyOrder,
  canSafelyDelete,
  groupResourcesByType,
  groupResourcesByCategory,
  filterResourcesByState,
  filterResourcesByHealth,
  findDependents,
  findDependencies,
  hasSubResources,
  isRootResource,
  isLeafResource,
};
