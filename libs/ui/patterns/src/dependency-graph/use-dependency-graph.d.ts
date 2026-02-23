/**
 * useDependencyGraph Hook
 *
 * Headless hook for dependency graph logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/dependency-graph
 */
import type { UseDependencyGraphConfig, UseDependencyGraphReturn } from './dependency-graph.types';
/**
 * Headless hook for dependency graph component.
 *
 * Encapsulates all logic for:
 * - Node layer computation (topological sort)
 * - Dependency/dependent counting
 * - Node selection handling
 * - Graph statistics (node count, edge count, depth)
 * - Layered structure for mobile rendering
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useDependencyGraph({
 *   graph: { nodes: [...], edges: [...] },
 *   selectedNodeId: 'inst_123',
 *   onNodeSelect: (id) => console.log('Selected:', id),
 * });
 *
 * // state.nodes (with layer info)
 * // state.layers (grouped by depth for mobile)
 * // state.nodeCount, state.edgeCount
 * ```
 */
export declare function useDependencyGraph(config: UseDependencyGraphConfig): UseDependencyGraphReturn;
//# sourceMappingURL=use-dependency-graph.d.ts.map