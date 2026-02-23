/**
 * Graph Utilities
 *
 * Algorithms and utilities for dependency graph operations, including
 * topological sorting, cycle detection, and dependency analysis.
 *
 * @module @nasnet/core/utils/graph
 */

export type {
  DependencyNode,
  TopologicalSortResult,
  CycleDetectionResult,
  DependencyAnalysis,
  DependencyValidationResult,
} from './dependency-graph';

export {
  topologicalSort,
  reverseOrder,
  detectCycles,
  analyzeDependencies,
  getParallelApplicableNodes,
  validateDependencyGraph,
  buildDependencyGraph,
  computeApplyOrder,
} from './dependency-graph';
