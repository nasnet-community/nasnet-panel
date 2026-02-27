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

import { useMemo, useCallback } from 'react';

import type {
  UseDependencyGraphConfig,
  UseDependencyGraphReturn,
  EnhancedNode,
  EnhancedEdge,
  DependencyLayer,
} from './dependency-graph.types';

/**
 * Compute the layer (depth) of each node using topological sort.
 * Nodes with no dependencies are in layer 0.
 * Each subsequent layer contains nodes that depend only on previous layers.
 */
function computeNodeLayers(
  nodes: Array<{ instanceId: string }>,
  edges: Array<{ fromInstanceId: string; toInstanceId: string }>
): Map<string, number> {
  const layers = new Map<string, number>();
  const visited = new Set<string>();
  const temp = new Set<string>();

  // Build adjacency list (node -> dependencies)
  const dependencies = new Map<string, string[]>();
  for (const edge of edges) {
    if (!dependencies.has(edge.fromInstanceId)) {
      dependencies.set(edge.fromInstanceId, []);
    }
    dependencies.get(edge.fromInstanceId)!.push(edge.toInstanceId);
  }

  // DFS to compute layer for each node
  function visit(nodeId: string): number {
    if (layers.has(nodeId)) {
      return layers.get(nodeId)!;
    }

    if (temp.has(nodeId)) {
      // Cycle detected - assign layer 0
      return 0;
    }

    temp.add(nodeId);

    const deps = dependencies.get(nodeId) || [];
    if (deps.length === 0) {
      // No dependencies - root node, layer 0
      layers.set(nodeId, 0);
      temp.delete(nodeId);
      visited.add(nodeId);
      return 0;
    }

    // Layer is 1 + max layer of dependencies
    const depLayers = deps.map(visit);
    const layer = Math.max(...depLayers) + 1;

    layers.set(nodeId, layer);
    temp.delete(nodeId);
    visited.add(nodeId);

    return layer;
  }

  // Visit all nodes
  for (const node of nodes) {
    if (!visited.has(node.instanceId)) {
      visit(node.instanceId);
    }
  }

  return layers;
}

/**
 * Count dependencies and dependents for each node
 */
function computeNodeCounts(
  nodeIds: string[],
  edges: Array<{ fromInstanceId: string; toInstanceId: string }>
): {
  dependencies: Map<string, number>;
  dependents: Map<string, number>;
} {
  const dependencies = new Map<string, number>();
  const dependents = new Map<string, number>();

  // Initialize all nodes to 0
  for (const nodeId of nodeIds) {
    dependencies.set(nodeId, 0);
    dependents.set(nodeId, 0);
  }

  // Count edges
  for (const edge of edges) {
    dependencies.set(edge.fromInstanceId, (dependencies.get(edge.fromInstanceId) || 0) + 1);
    dependents.set(edge.toInstanceId, (dependents.get(edge.toInstanceId) || 0) + 1);
  }

  return { dependencies, dependents };
}

/**
 * Group nodes by layer for tree-list rendering
 */
function groupNodesByLayer(nodes: EnhancedNode[]): DependencyLayer[] {
  const layerMap = new Map<number, EnhancedNode[]>();

  for (const node of nodes) {
    if (!layerMap.has(node.layer)) {
      layerMap.set(node.layer, []);
    }
    layerMap.get(node.layer)!.push(node);
  }

  const layers: DependencyLayer[] = [];
  const sortedLayerNumbers = Array.from(layerMap.keys()).sort((a, b) => a - b);

  for (const layerNumber of sortedLayerNumbers) {
    const nodesInLayer = layerMap.get(layerNumber)!;
    layers.push({
      layerNumber,
      nodes: nodesInLayer,
      count: nodesInLayer.length,
    });
  }

  return layers;
}

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
export function useDependencyGraph(config: UseDependencyGraphConfig): UseDependencyGraphReturn {
  const { graph, selectedNodeId, onNodeSelect, onViewportChange } = config;

  // Compute enhanced nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!graph || !graph.nodes || !graph.edges) {
      return { nodes: [], edges: [] };
    }

    // Compute layers
    const layerMap = computeNodeLayers(graph.nodes, graph.edges);

    // Compute counts
    const nodeIds = graph.nodes.map((n) => n.instanceId);
    const { dependencies, dependents } = computeNodeCounts(nodeIds, graph.edges);

    // Enhance nodes
    const enhancedNodes: EnhancedNode[] = graph.nodes.map((node) => ({
      ...node,
      layer: layerMap.get(node.instanceId) ?? 0,
      dependenciesCount: dependencies.get(node.instanceId) ?? 0,
      dependentsCount: dependents.get(node.instanceId) ?? 0,
    }));

    // Enhance edges with IDs
    const enhancedEdges: EnhancedEdge[] = graph.edges.map((edge, index) => ({
      ...edge,
      id: `edge-${edge.fromInstanceId}-${edge.toInstanceId}-${index}`,
    }));

    return { nodes: enhancedNodes, edges: enhancedEdges };
  }, [graph]);

  // Group nodes into layers for mobile rendering
  const layers = useMemo(() => groupNodesByLayer(nodes), [nodes]);

  // Compute statistics
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const maxDepth = Math.max(...nodes.map((n) => n.layer), 0);

  // Find selected node
  const selectedNode = useMemo(
    () => nodes.find((n) => n.instanceId === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Node selection handler
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId);
    },
    [onNodeSelect]
  );

  // Check if graph is empty
  const isEmpty = nodeCount === 0;

  // Find root and leaf nodes
  const rootNodes = useMemo(() => nodes.filter((n) => n.dependenciesCount === 0), [nodes]);
  const leafNodes = useMemo(() => nodes.filter((n) => n.dependentsCount === 0), [nodes]);

  return {
    nodes,
    edges,
    layers,
    nodeCount,
    edgeCount,
    maxDepth,
    selectedNode,
    handleNodeSelect,
    isEmpty,
    rootNodes,
    leafNodes,
  };
}
