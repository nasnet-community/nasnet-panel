/**
 * Dependency Graph Utilities for Change Sets
 *
 * Provides topological sorting and cycle detection for dependency-ordered
 * operations in atomic multi-resource change sets.
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

// =============================================================================
// Types
// =============================================================================

/**
 * A node in the dependency graph
 */
export interface DependencyNode {
  /**
   * Unique identifier for this node
   */
  id: string;

  /**
   * IDs of nodes this node depends on
   */
  dependencies: readonly string[];
}

/**
 * Result of a topological sort operation
 */
export interface TopologicalSortResult {
  /**
   * Whether the sort was successful
   */
  success: boolean;

  /**
   * Sorted node IDs in dependency order (dependencies first)
   */
  sortedIds: string[];

  /**
   * Cycle detected (if success is false)
   * Array of node IDs forming the cycle
   */
  cycle: string[] | null;

  /**
   * Error message if sort failed
   */
  error: string | null;
}

/**
 * Result of cycle detection
 */
export interface CycleDetectionResult {
  /**
   * Whether a cycle was found
   */
  hasCycle: boolean;

  /**
   * All cycles found (each cycle is an array of node IDs)
   */
  cycles: string[][];
}

/**
 * Dependency graph analysis result
 */
export interface DependencyAnalysis {
  /**
   * IDs of root nodes (no dependencies)
   */
  roots: string[];

  /**
   * IDs of leaf nodes (no dependents)
   */
  leaves: string[];

  /**
   * Maximum depth of the dependency tree
   */
  maxDepth: number;

  /**
   * Node IDs at each level (for parallel processing)
   */
  levels: string[][];

  /**
   * Missing dependencies (referenced but not in graph)
   */
  missingDependencies: Array<{
    nodeId: string;
    missingDepId: string;
  }>;
}

// =============================================================================
// Core Algorithms
// =============================================================================

/**
 * Perform topological sort using Kahn's algorithm
 *
 * Returns nodes sorted in dependency order (dependencies come first).
 * Detects cycles and reports them clearly.
 *
 * @param nodes - Array of nodes with their dependencies
 * @returns Sorted result with cycle information if applicable
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'bridge', dependencies: [] },
 *   { id: 'dhcp', dependencies: ['bridge'] },
 *   { id: 'firewall', dependencies: ['bridge'] },
 * ];
 *
 * const result = topologicalSort(nodes);
 * // result.sortedIds = ['bridge', 'dhcp', 'firewall'] or ['bridge', 'firewall', 'dhcp']
 * ```
 */
export function topologicalSort(nodes: ReadonlyArray<DependencyNode>): TopologicalSortResult {
  if (nodes.length === 0) {
    return {
      success: true,
      sortedIds: [],
      cycle: null,
      error: null,
    };
  }

  // Build adjacency list and in-degree count
  const nodeMap = new Map<string, DependencyNode>(
    nodes.map((n) => [n.id, n])
  );
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize all nodes
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  }

  // Build graph
  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (nodeMap.has(dep)) {
        // dep -> node (node depends on dep)
        const edges = adjacencyList.get(dep) || [];
        edges.push(node.id);
        adjacencyList.set(dep, edges);
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
      // Skip missing dependencies - they'll be handled separately
    }
  }

  // Start with nodes that have no dependencies
  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const sortedIds: string[] = [];

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedIds.push(current);

    const dependents = adjacencyList.get(current) || [];
    for (const dependent of dependents) {
      const newDegree = (inDegree.get(dependent) || 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // Check for cycles
  if (sortedIds.length !== nodes.length) {
    // Find the cycle using DFS
    const cycle = findCycle(nodes);
    return {
      success: false,
      sortedIds: [],
      cycle,
      error: cycle
        ? `Circular dependency detected: ${cycle.join(' -> ')} -> ${cycle[0]}`
        : 'Circular dependency detected',
    };
  }

  return {
    success: true,
    sortedIds,
    cycle: null,
    error: null,
  };
}

/**
 * Find a cycle in the dependency graph using DFS
 *
 * Uses depth-first search with recursion stack to detect circular dependencies.
 * Returns the cycle path as an array of node IDs, or null if no cycle exists.
 *
 * @param nodes - Array of nodes to search for cycles
 * @returns Array of node IDs forming a cycle, or null if no cycle found
 *
 * @internal Used internally by topologicalSort and detectCycles
 */
function findCycle(nodes: ReadonlyArray<DependencyNode>): string[] | null {
  const nodeMap = new Map<string, DependencyNode>(
    nodes.map((n) => [n.id, n])
  );
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(nodeId: string): string | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return null;

    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) continue;

      if (!visited.has(dep)) {
        parent.set(dep, nodeId);
        const cycleStart = dfs(dep);
        if (cycleStart) return cycleStart;
      } else if (recursionStack.has(dep)) {
        // Found cycle - build the path
        parent.set(dep, nodeId);
        return dep;
      }
    }

    recursionStack.delete(nodeId);
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycleStart = dfs(node.id);
      if (cycleStart) {
        // Reconstruct cycle path
        const cycle: string[] = [cycleStart];
        let current = parent.get(cycleStart);
        while (current && current !== cycleStart) {
          cycle.push(current);
          current = parent.get(current);
        }
        return cycle.reverse();
      }
    }
  }

  return null;
}

/**
 * Reverse the order of sorted IDs (for rollback)
 *
 * @param sortedIds - IDs in apply order
 * @returns IDs in reverse order (for rollback)
 */
export function reverseOrder(sortedIds: string[]): string[] {
  return [...sortedIds].reverse();
}

/**
 * Detect all cycles in the dependency graph
 *
 * Uses depth-first search to find all circular dependencies in the graph.
 * Returns a result indicating whether cycles exist and all cycles found.
 *
 * @param nodes - Array of nodes with dependencies
 * @returns Detection result with hasCycle flag and all cycles found
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'a', dependencies: ['b'] },
 *   { id: 'b', dependencies: ['a'] },
 * ];
 *
 * const result = detectCycles(nodes);
 * // result.hasCycle = true
 * // result.cycles = [['a', 'b']]
 * ```
 */
export function detectCycles(nodes: ReadonlyArray<DependencyNode>): CycleDetectionResult {
  const nodeMap = new Map<string, DependencyNode>(
    nodes.map((n) => [n.id, n])
  );
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack: string[] = [];
  const inStack = new Set<string>();

  function dfs(nodeId: string): void {
    visited.add(nodeId);
    recursionStack.push(nodeId);
    inStack.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) {
      recursionStack.pop();
      inStack.delete(nodeId);
      return;
    }

    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) continue;

      if (!visited.has(dep)) {
        dfs(dep);
      } else if (inStack.has(dep)) {
        // Found a cycle
        const cycleStart = recursionStack.indexOf(dep);
        const cycle = recursionStack.slice(cycleStart);
        cycles.push([...cycle]);
      }
    }

    recursionStack.pop();
    inStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return {
    hasCycle: cycles.length > 0,
    cycles,
  };
}

/**
 * Analyze the dependency graph structure
 *
 * Computes graph properties including root nodes (no dependencies),
 * leaf nodes (no dependents), maximum depth, processing levels for
 * parallel execution, and any missing dependencies.
 *
 * @param nodes - Array of nodes with dependencies
 * @returns Analysis object with graph structure information
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'bridge', dependencies: [] },
 *   { id: 'dhcp', dependencies: ['bridge'] },
 *   { id: 'firewall', dependencies: ['bridge'] },
 * ];
 *
 * const analysis = analyzeDependencies(nodes);
 * // analysis.roots = ['bridge']
 * // analysis.leaves = ['dhcp', 'firewall']
 * // analysis.maxDepth = 1
 * // analysis.levels = [['bridge'], ['dhcp', 'firewall']]
 * ```
 */
export function analyzeDependencies(nodes: ReadonlyArray<DependencyNode>): DependencyAnalysis {
  const nodeSet = new Set(nodes.map((n) => n.id));
  const dependents = new Map<string, Set<string>>();

  // Initialize dependents map
  for (const node of nodes) {
    dependents.set(node.id, new Set());
  }

  // Build dependents (reverse of dependencies)
  const missingDependencies: Array<{ nodeId: string; missingDepId: string }> = [];
  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (nodeSet.has(dep)) {
        dependents.get(dep)?.add(node.id);
      } else {
        missingDependencies.push({ nodeId: node.id, missingDepId: dep });
      }
    }
  }

  // Find roots (no dependencies within the graph)
  const roots = nodes
    .filter((n) =>
      n.dependencies.length === 0 ||
      n.dependencies.every((d) => !nodeSet.has(d))
    )
    .map((n) => n.id);

  // Find leaves (no dependents)
  const leaves = nodes
    .filter((n) => (dependents.get(n.id)?.size || 0) === 0)
    .map((n) => n.id);

  // Calculate levels using BFS
  const levels: string[][] = [];
  const nodeLevel = new Map<string, number>();
  const queue: string[] = [...roots];

  for (const root of roots) {
    nodeLevel.set(root, 0);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = nodeLevel.get(current) || 0;

    // Ensure level array exists
    while (levels.length <= currentLevel) {
      levels.push([]);
    }
    levels[currentLevel].push(current);

    // Process dependents
    for (const dependent of dependents.get(current) || []) {
      const depNode = nodes.find((n) => n.id === dependent);
      if (!depNode) continue;

      // All dependencies resolved?
      const allDepsResolved = depNode.dependencies
        .filter((d) => nodeSet.has(d))
        .every((d) => nodeLevel.has(d));

      if (allDepsResolved && !nodeLevel.has(dependent)) {
        // Calculate level as max of all dependency levels + 1
        const depLevels = depNode.dependencies
          .filter((d) => nodeSet.has(d))
          .map((d) => nodeLevel.get(d) || 0);
        const level = Math.max(...depLevels, 0) + 1;
        nodeLevel.set(dependent, level);
        queue.push(dependent);
      }
    }
  }

  const maxDepth = levels.length > 0 ? levels.length - 1 : 0;

  return {
    roots,
    leaves,
    maxDepth,
    levels,
    missingDependencies,
  };
}

/**
 * Get nodes that can be applied in parallel at the current state
 *
 * Identifies all nodes whose dependencies have been satisfied,
 * making them safe to apply concurrently.
 *
 * @param nodes - All nodes in the dependency graph
 * @param appliedIds - Set of already applied node IDs
 * @returns Node IDs that can be applied next (all dependencies satisfied)
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'a', dependencies: [] },
 *   { id: 'b', dependencies: ['a'] },
 *   { id: 'c', dependencies: ['a'] },
 * ];
 *
 * const applicableNow = getParallelApplicableNodes(nodes, new Set(['a']));
 * // applicableNow = ['b', 'c']
 * ```
 */
export function getParallelApplicableNodes(
  nodes: ReadonlyArray<DependencyNode>,
  appliedIds: Set<string>
): string[] {
  return nodes
    .filter((node) => {
      // Not already applied
      if (appliedIds.has(node.id)) return false;

      // All dependencies applied
      return node.dependencies.every((dep) => appliedIds.has(dep));
    })
    .map((n) => n.id);
}

/**
 * Result of validating a dependency graph
 *
 * Indicates whether the graph is valid and lists any errors or warnings found.
 */
export interface DependencyValidationResult {
  /** Whether the graph is valid (no errors) */
  valid: boolean;

  /** List of validation errors (circular dependencies, duplicates, etc.) */
  errors: string[];

  /** List of validation warnings (missing dependencies, etc.) */
  warnings: string[];
}

/**
 * Validate that a dependency graph is valid for application
 *
 * Checks for duplicate node IDs, self-references, circular dependencies,
 * and missing dependencies. Returns errors for critical issues and
 * warnings for non-critical problems.
 *
 * @param nodes - Array of nodes with dependencies
 * @returns Validation result with any issues found
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'a', dependencies: [] },
 *   { id: 'b', dependencies: ['a'] },
 * ];
 *
 * const result = validateDependencyGraph(nodes);
 * // result.valid = true
 * // result.errors = []
 * // result.warnings = []
 * ```
 */
export function validateDependencyGraph(
  nodes: ReadonlyArray<DependencyNode>
): DependencyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty graph
  if (nodes.length === 0) {
    return { valid: true, errors, warnings };
  }

  // Check for duplicate IDs
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    ids.add(node.id);
  }

  // Check for self-references
  for (const node of nodes) {
    if (node.dependencies.includes(node.id)) {
      errors.push(`Self-reference detected: ${node.id} depends on itself`);
    }
  }

  // Check for cycles
  const cycleResult = detectCycles(nodes);
  if (cycleResult.hasCycle) {
    for (const cycle of cycleResult.cycles) {
      errors.push(
        `Circular dependency detected: ${cycle.join(' -> ')} -> ${cycle[0]}`
      );
    }
  }

  // Check for missing dependencies
  const analysis = analyzeDependencies(nodes);
  for (const missing of analysis.missingDependencies) {
    warnings.push(
      `Node '${missing.nodeId}' depends on '${missing.missingDepId}' which is not in the change set`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Build a dependency graph from change set items
 *
 * Converts items with id and dependencies properties into DependencyNode objects.
 * This is useful for preparing data from different sources for graph analysis.
 *
 * @param items - Items with id and dependencies array
 * @returns Array of dependency nodes
 *
 * @example
 * ```ts
 * const items = [
 *   { id: 'bridge', dependencies: [] },
 *   { id: 'dhcp', dependencies: ['bridge'] },
 * ];
 *
 * const graph = buildDependencyGraph(items);
 * ```
 */
export function buildDependencyGraph<T extends { id: string; dependencies: readonly string[] }>(
  items: T[]
): DependencyNode[] {
  return items.map((item) => ({
    id: item.id,
    dependencies: [...item.dependencies],
  }));
}

/**
 * Compute apply order for each item based on topological sort
 *
 * Returns a map of node ID to its position in the execution order.
 * Used for determining which operations should execute first.
 *
 * @param nodes - Nodes to compute order for
 * @returns Map of node ID to apply order (0-indexed), empty if cycles detected
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: 'bridge', dependencies: [] },
 *   { id: 'dhcp', dependencies: ['bridge'] },
 * ];
 *
 * const orderMap = computeApplyOrder(nodes);
 * // orderMap.get('bridge') = 0
 * // orderMap.get('dhcp') = 1
 * ```
 */
export function computeApplyOrder(nodes: ReadonlyArray<DependencyNode>): Map<string, number> {
  const result = topologicalSort(nodes);
  const orderMap = new Map<string, number>();

  if (result.success) {
    result.sortedIds.forEach((id, index) => {
      orderMap.set(id, index);
    });
  }

  return orderMap;
}
