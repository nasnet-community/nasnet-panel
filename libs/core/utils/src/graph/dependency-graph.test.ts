/**
 * Tests for Dependency Graph Utilities
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { describe, it, expect } from 'vitest';
import {
  topologicalSort,
  reverseOrder,
  detectCycles,
  analyzeDependencies,
  getParallelApplicableNodes,
  validateDependencyGraph,
  computeApplyOrder,
  type DependencyNode,
} from './dependency-graph';

describe('topologicalSort', () => {
  it('should sort empty array', () => {
    const result = topologicalSort([]);
    expect(result.success).toBe(true);
    expect(result.sortedIds).toEqual([]);
    expect(result.cycle).toBeNull();
  });

  it('should sort single node', () => {
    const nodes: DependencyNode[] = [{ id: 'a', dependencies: [] }];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(true);
    expect(result.sortedIds).toEqual(['a']);
  });

  it('should sort linear dependencies', () => {
    const nodes: DependencyNode[] = [
      { id: 'c', dependencies: ['b'] },
      { id: 'b', dependencies: ['a'] },
      { id: 'a', dependencies: [] },
    ];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(true);
    expect(result.sortedIds).toEqual(['a', 'b', 'c']);
  });

  it('should sort diamond dependencies', () => {
    // a -> b, a -> c, b -> d, c -> d
    const nodes: DependencyNode[] = [
      { id: 'd', dependencies: ['b', 'c'] },
      { id: 'c', dependencies: ['a'] },
      { id: 'b', dependencies: ['a'] },
      { id: 'a', dependencies: [] },
    ];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(true);
    expect(result.sortedIds[0]).toBe('a');
    expect(result.sortedIds[3]).toBe('d');
    // b and c can be in any order between a and d
    expect(result.sortedIds.slice(1, 3).sort()).toEqual(['b', 'c']);
  });

  it('should detect simple cycle', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: ['b'] },
      { id: 'b', dependencies: ['a'] },
    ];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(false);
    expect(result.cycle).not.toBeNull();
    expect(result.error).toContain('Circular dependency');
  });

  it('should detect cycle in larger graph', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['b'] },
      { id: 'd', dependencies: ['c'] },
      { id: 'e', dependencies: ['d', 'b'] }, // e depends on d and b
      { id: 'f', dependencies: ['e'] },
      // Add a cycle: d also depends on f
      { id: 'g', dependencies: ['f'] },
    ];
    // Create cycle by making d depend on g
    const nodesWithCycle = [
      ...nodes.slice(0, 3),
      { id: 'd', dependencies: ['c', 'g'] }, // cycle: d -> g -> f -> e -> d
      ...nodes.slice(4),
    ];
    const result = topologicalSort(nodesWithCycle);
    expect(result.success).toBe(false);
  });

  it('should handle missing dependencies (ignore them)', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: ['missing'] },
      { id: 'b', dependencies: ['a'] },
    ];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(true);
    expect(result.sortedIds).toEqual(['a', 'b']);
  });

  it('should handle real-world LAN network scenario', () => {
    const nodes: DependencyNode[] = [
      { id: 'bridge', dependencies: [] },
      { id: 'dhcp-server', dependencies: ['bridge'] },
      { id: 'firewall-lan', dependencies: ['bridge'] },
      { id: 'dns-forwarder', dependencies: ['dhcp-server'] },
      { id: 'route-local', dependencies: ['bridge'] },
    ];
    const result = topologicalSort(nodes);
    expect(result.success).toBe(true);
    expect(result.sortedIds[0]).toBe('bridge');
    // dhcp-server must come before dns-forwarder
    expect(result.sortedIds.indexOf('dhcp-server')).toBeLessThan(
      result.sortedIds.indexOf('dns-forwarder')
    );
  });
});

describe('reverseOrder', () => {
  it('should reverse order', () => {
    expect(reverseOrder(['a', 'b', 'c'])).toEqual(['c', 'b', 'a']);
  });

  it('should not mutate original array', () => {
    const original = ['a', 'b', 'c'];
    reverseOrder(original);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});

describe('detectCycles', () => {
  it('should detect no cycles in valid graph', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['b'] },
    ];
    const result = detectCycles(nodes);
    expect(result.hasCycle).toBe(false);
    expect(result.cycles).toEqual([]);
  });

  it('should detect single cycle', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: ['c'] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['b'] },
    ];
    const result = detectCycles(nodes);
    expect(result.hasCycle).toBe(true);
    expect(result.cycles.length).toBeGreaterThan(0);
  });

  it('should detect self-reference cycle', () => {
    const nodes: DependencyNode[] = [{ id: 'a', dependencies: ['a'] }];
    const result = detectCycles(nodes);
    expect(result.hasCycle).toBe(true);
  });
});

describe('analyzeDependencies', () => {
  it('should identify roots and leaves', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['b'] },
    ];
    const analysis = analyzeDependencies(nodes);
    expect(analysis.roots).toEqual(['a']);
    expect(analysis.leaves).toEqual(['c']);
  });

  it('should calculate levels correctly', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['a'] },
      { id: 'd', dependencies: ['b', 'c'] },
    ];
    const analysis = analyzeDependencies(nodes);
    expect(analysis.levels[0]).toEqual(['a']);
    expect(analysis.levels[1].sort()).toEqual(['b', 'c']);
    expect(analysis.levels[2]).toEqual(['d']);
    expect(analysis.maxDepth).toBe(2);
  });

  it('should detect missing dependencies', () => {
    const nodes: DependencyNode[] = [{ id: 'a', dependencies: ['missing'] }];
    const analysis = analyzeDependencies(nodes);
    expect(analysis.missingDependencies).toEqual([{ nodeId: 'a', missingDepId: 'missing' }]);
  });

  it('should handle multiple roots', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: [] },
      { id: 'c', dependencies: ['a', 'b'] },
    ];
    const analysis = analyzeDependencies(nodes);
    expect(analysis.roots.sort()).toEqual(['a', 'b']);
  });
});

describe('getParallelApplicableNodes', () => {
  it('should return roots when nothing applied', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: [] },
    ];
    const applicable = getParallelApplicableNodes(nodes, new Set());
    expect(applicable.sort()).toEqual(['a', 'c']);
  });

  it('should return dependents when dependencies applied', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['a'] },
    ];
    const applicable = getParallelApplicableNodes(nodes, new Set(['a']));
    expect(applicable.sort()).toEqual(['b', 'c']);
  });

  it('should not return nodes with unmet dependencies', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'b', dependencies: ['a'] },
      { id: 'c', dependencies: ['a', 'b'] },
    ];
    const applicable = getParallelApplicableNodes(nodes, new Set(['a']));
    expect(applicable).toEqual(['b']);
    expect(applicable).not.toContain('c');
  });
});

describe('validateDependencyGraph', () => {
  it('should validate empty graph', () => {
    const result = validateDependencyGraph([]);
    expect(result.valid).toBe(true);
  });

  it('should detect duplicate IDs', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: [] },
      { id: 'a', dependencies: [] },
    ];
    const result = validateDependencyGraph(nodes);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('should detect self-references', () => {
    const nodes: DependencyNode[] = [{ id: 'a', dependencies: ['a'] }];
    const result = validateDependencyGraph(nodes);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Self-reference'))).toBe(true);
  });

  it('should warn about missing dependencies', () => {
    const nodes: DependencyNode[] = [{ id: 'a', dependencies: ['missing'] }];
    const result = validateDependencyGraph(nodes);
    expect(result.valid).toBe(true); // Warnings don't invalidate
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('computeApplyOrder', () => {
  it('should compute order map', () => {
    const nodes: DependencyNode[] = [
      { id: 'c', dependencies: ['b'] },
      { id: 'b', dependencies: ['a'] },
      { id: 'a', dependencies: [] },
    ];
    const orderMap = computeApplyOrder(nodes);
    expect(orderMap.get('a')).toBe(0);
    expect(orderMap.get('b')).toBe(1);
    expect(orderMap.get('c')).toBe(2);
  });

  it('should return empty map for cyclic graph', () => {
    const nodes: DependencyNode[] = [
      { id: 'a', dependencies: ['b'] },
      { id: 'b', dependencies: ['a'] },
    ];
    const orderMap = computeApplyOrder(nodes);
    expect(orderMap.size).toBe(0);
  });
});
