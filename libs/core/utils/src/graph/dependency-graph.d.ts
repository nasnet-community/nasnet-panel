/**
 * Dependency Graph Utilities for Change Sets
 *
 * Provides topological sorting and cycle detection for dependency-ordered
 * operations in atomic multi-resource change sets.
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
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
export declare function topologicalSort(nodes: ReadonlyArray<DependencyNode>): TopologicalSortResult;
/**
 * Reverse the order of sorted IDs (for rollback)
 *
 * @param sortedIds - IDs in apply order
 * @returns IDs in reverse order (for rollback)
 */
export declare function reverseOrder(sortedIds: string[]): string[];
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
export declare function detectCycles(nodes: ReadonlyArray<DependencyNode>): CycleDetectionResult;
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
export declare function analyzeDependencies(nodes: ReadonlyArray<DependencyNode>): DependencyAnalysis;
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
export declare function getParallelApplicableNodes(nodes: ReadonlyArray<DependencyNode>, appliedIds: Set<string>): string[];
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
export declare function validateDependencyGraph(nodes: ReadonlyArray<DependencyNode>): DependencyValidationResult;
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
export declare function buildDependencyGraph<T extends {
    id: string;
    dependencies: readonly string[];
}>(items: T[]): DependencyNode[];
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
export declare function computeApplyOrder(nodes: ReadonlyArray<DependencyNode>): Map<string, number>;
//# sourceMappingURL=dependency-graph.d.ts.map