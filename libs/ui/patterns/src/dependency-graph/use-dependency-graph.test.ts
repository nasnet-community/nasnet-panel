/**
 * useDependencyGraph Hook Tests
 *
 * Tests for the headless dependency graph logic hook.
 * Validates topological sort, cycle detection, and layer computation.
 *
 * @see NAS-8.19: Feature Dependencies
 * @see ADR-018: Headless + Platform Presenters Pattern
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useDependencyGraph } from './use-dependency-graph';

import type {
  UseDependencyGraphConfig,
  DependencyGraphNode,
  DependencyGraphEdge,
} from './dependency-graph.types';

describe('useDependencyGraph Hook', () => {
  describe('Empty Graph Handling', () => {
    it('should handle empty graph', () => {
      const config: UseDependencyGraphConfig = {
        graph: { nodes: [], edges: [] },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.layers).toEqual([]);
      expect(result.current.nodeCount).toBe(0);
      expect(result.current.edgeCount).toBe(0);
      expect(result.current.maxDepth).toBe(0);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.rootNodes).toEqual([]);
      expect(result.current.leafNodes).toEqual([]);
    });

    it('should handle undefined graph', () => {
      const config: UseDependencyGraphConfig = {
        graph: undefined,
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });

    it('should handle null nodes/edges', () => {
      const config: UseDependencyGraphConfig = {
        graph: { nodes: null as any, edges: null as any },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
    });
  });

  describe('Single Node Graph', () => {
    it('should handle single independent node', () => {
      const nodes: DependencyGraphNode[] = [
        {
          instanceId: 'inst_tor_1',
          instanceName: 'Tor Gateway',
          featureId: 'tor',
          status: 'RUNNING',
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges: [] },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].layer).toBe(0);
      expect(result.current.nodes[0].dependenciesCount).toBe(0);
      expect(result.current.nodes[0].dependentsCount).toBe(0);
      expect(result.current.maxDepth).toBe(0);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.rootNodes).toHaveLength(1);
      expect(result.current.leafNodes).toHaveLength(1);
    });
  });

  describe('Linear Dependency Chain', () => {
    it('should compute correct layers for A→B→C chain', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'C',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      // Find nodes by ID
      const nodeA = result.current.nodes.find((n) => n.instanceId === 'A');
      const nodeB = result.current.nodes.find((n) => n.instanceId === 'B');
      const nodeC = result.current.nodes.find((n) => n.instanceId === 'C');

      // Verify layers (A is root with no dependencies, so layer 0)
      expect(nodeA?.layer).toBe(0);
      expect(nodeB?.layer).toBe(1);
      expect(nodeC?.layer).toBe(2);

      // Verify dependency counts
      expect(nodeA?.dependenciesCount).toBe(0);
      expect(nodeA?.dependentsCount).toBe(1);
      expect(nodeB?.dependenciesCount).toBe(1);
      expect(nodeB?.dependentsCount).toBe(1);
      expect(nodeC?.dependenciesCount).toBe(1);
      expect(nodeC?.dependentsCount).toBe(0);

      // Verify max depth
      expect(result.current.maxDepth).toBe(2);

      // Verify layers
      expect(result.current.layers).toHaveLength(3);
      expect(result.current.layers[0].layerNumber).toBe(0);
      expect(result.current.layers[0].nodes).toHaveLength(1);
      expect(result.current.layers[1].layerNumber).toBe(1);
      expect(result.current.layers[2].layerNumber).toBe(2);
    });
  });

  describe('Diamond Dependency Graph', () => {
    it('should compute correct layers for diamond shape (A→B, A→C, B→D, C→D)', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
        { instanceId: 'D', instanceName: 'Service D', featureId: 'mtproxy', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'C',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'D',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'D',
          toInstanceId: 'C',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      const nodeA = result.current.nodes.find((n) => n.instanceId === 'A');
      const nodeB = result.current.nodes.find((n) => n.instanceId === 'B');
      const nodeC = result.current.nodes.find((n) => n.instanceId === 'C');
      const nodeD = result.current.nodes.find((n) => n.instanceId === 'D');

      // A is root (layer 0), B and C depend on A (layer 1), D depends on both B and C (layer 2)
      expect(nodeA?.layer).toBe(0);
      expect(nodeB?.layer).toBe(1);
      expect(nodeC?.layer).toBe(1);
      expect(nodeD?.layer).toBe(2);

      // Verify counts
      expect(nodeA?.dependenciesCount).toBe(0);
      expect(nodeA?.dependentsCount).toBe(2);
      expect(nodeD?.dependenciesCount).toBe(2);
      expect(nodeD?.dependentsCount).toBe(0);

      expect(result.current.maxDepth).toBe(2);
    });
  });

  describe('Parallel Independent Chains', () => {
    it('should handle multiple independent chains', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
        { instanceId: 'D', instanceName: 'Service D', featureId: 'mtproxy', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'D',
          toInstanceId: 'C',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      const nodeA = result.current.nodes.find((n) => n.instanceId === 'A');
      const nodeB = result.current.nodes.find((n) => n.instanceId === 'B');
      const nodeC = result.current.nodes.find((n) => n.instanceId === 'C');
      const nodeD = result.current.nodes.find((n) => n.instanceId === 'D');

      // Two independent chains: A→B and C→D
      expect(nodeA?.layer).toBe(0);
      expect(nodeB?.layer).toBe(1);
      expect(nodeC?.layer).toBe(0);
      expect(nodeD?.layer).toBe(1);

      // Root nodes (no dependencies)
      expect(result.current.rootNodes).toHaveLength(2);
      expect(result.current.rootNodes.map((n) => n.instanceId).sort()).toEqual(['A', 'C']);

      // Leaf nodes (no dependents)
      expect(result.current.leafNodes).toHaveLength(2);
      expect(result.current.leafNodes.map((n) => n.instanceId).sort()).toEqual(['B', 'D']);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should handle circular dependency A→B→A gracefully', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'A',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      // Hook should not crash and should assign layer 0 to cyclic nodes
      expect(result.current.nodes).toHaveLength(2);
      const nodeA = result.current.nodes.find((n) => n.instanceId === 'A');
      const nodeB = result.current.nodes.find((n) => n.instanceId === 'B');

      // Cycles are detected and assigned layer 0
      expect(nodeA?.layer).toBe(0);
      expect(nodeB?.layer).toBe(0);
    });

    it('should handle complex cycle A→B→C→A', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'A',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'B',
          toInstanceId: 'C',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'C',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      // Should not crash
      expect(result.current.nodes).toHaveLength(3);
    });
  });

  describe('Node Selection', () => {
    it('should track selected node correctly', () => {
      const nodes: DependencyGraphNode[] = [
        {
          instanceId: 'inst_tor_1',
          instanceName: 'Tor Gateway',
          featureId: 'tor',
          status: 'RUNNING',
        },
        {
          instanceId: 'inst_xray_1',
          instanceName: 'Xray Proxy',
          featureId: 'xray',
          status: 'RUNNING',
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges: [] },
        selectedNodeId: 'inst_tor_1',
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.selectedNode).toBeDefined();
      expect(result.current.selectedNode?.instanceId).toBe('inst_tor_1');
      expect(result.current.selectedNode?.instanceName).toBe('Tor Gateway');
    });

    it('should return null when selected node not found', () => {
      const nodes: DependencyGraphNode[] = [
        {
          instanceId: 'inst_tor_1',
          instanceName: 'Tor Gateway',
          featureId: 'tor',
          status: 'RUNNING',
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges: [] },
        selectedNodeId: 'nonexistent_id',
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.selectedNode).toBeNull();
    });

    it('should call onNodeSelect when handleNodeSelect is invoked', () => {
      const onNodeSelect = vi.fn();

      const nodes: DependencyGraphNode[] = [
        {
          instanceId: 'inst_tor_1',
          instanceName: 'Tor Gateway',
          featureId: 'tor',
          status: 'RUNNING',
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges: [] },
        selectedNodeId: undefined,
        onNodeSelect,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      result.current.handleNodeSelect('inst_tor_1');

      expect(onNodeSelect).toHaveBeenCalledWith('inst_tor_1');
      expect(onNodeSelect).toHaveBeenCalledTimes(1);
    });

    it('should not crash if onNodeSelect is not provided', () => {
      const nodes: DependencyGraphNode[] = [
        {
          instanceId: 'inst_tor_1',
          instanceName: 'Tor Gateway',
          featureId: 'tor',
          status: 'RUNNING',
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges: [] },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(() => {
        result.current.handleNodeSelect('inst_tor_1');
      }).not.toThrow();
    });
  });

  describe('Enhanced Edges', () => {
    it('should generate unique IDs for edges', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0].id).toBeDefined();
      expect(result.current.edges[0].id).toContain('edge-');
    });

    it('should preserve edge properties', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'OPTIONAL',
          autoStart: false,
          healthTimeoutSeconds: 60,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      const edge = result.current.edges[0];
      expect(edge.fromInstanceId).toBe('B');
      expect(edge.toInstanceId).toBe('A');
      expect(edge.dependencyType).toBe('OPTIONAL');
      expect(edge.autoStart).toBe(false);
      expect(edge.healthTimeoutSeconds).toBe(60);
    });
  });

  describe('Layer Grouping', () => {
    it('should group nodes correctly by layer', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
        { instanceId: 'D', instanceName: 'Service D', featureId: 'mtproxy', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'C',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'D',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      // Layer 0: A
      // Layer 1: B, C
      // Layer 2: D
      expect(result.current.layers).toHaveLength(3);

      expect(result.current.layers[0].layerNumber).toBe(0);
      expect(result.current.layers[0].count).toBe(1);
      expect(result.current.layers[0].nodes[0].instanceId).toBe('A');

      expect(result.current.layers[1].layerNumber).toBe(1);
      expect(result.current.layers[1].count).toBe(2);
      expect(result.current.layers[1].nodes.map((n) => n.instanceId).sort()).toEqual(['B', 'C']);

      expect(result.current.layers[2].layerNumber).toBe(2);
      expect(result.current.layers[2].count).toBe(1);
      expect(result.current.layers[2].nodes[0].instanceId).toBe('D');
    });
  });

  describe('Statistics', () => {
    it('should compute nodeCount and edgeCount correctly', () => {
      const nodes: DependencyGraphNode[] = [
        { instanceId: 'A', instanceName: 'Service A', featureId: 'tor', status: 'RUNNING' },
        { instanceId: 'B', instanceName: 'Service B', featureId: 'xray', status: 'RUNNING' },
        { instanceId: 'C', instanceName: 'Service C', featureId: 'singbox', status: 'RUNNING' },
      ];

      const edges: DependencyGraphEdge[] = [
        {
          fromInstanceId: 'B',
          toInstanceId: 'A',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
        {
          fromInstanceId: 'C',
          toInstanceId: 'B',
          dependencyType: 'REQUIRES',
          autoStart: true,
          healthTimeoutSeconds: 30,
        },
      ];

      const config: UseDependencyGraphConfig = {
        graph: { nodes, edges },
        selectedNodeId: undefined,
      };

      const { result } = renderHook(() => useDependencyGraph(config));

      expect(result.current.nodeCount).toBe(3);
      expect(result.current.edgeCount).toBe(2);
      expect(result.current.maxDepth).toBe(2);
      expect(result.current.isEmpty).toBe(false);
    });
  });
});
