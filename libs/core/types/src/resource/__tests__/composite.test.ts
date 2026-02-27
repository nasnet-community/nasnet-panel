/**
 * Composite Resource Tests
 *
 * Tests for composite resource utilities and patterns.
 */

import { describe, it, expect } from 'vitest';
import type { Resource, ResourceCategory } from '../resource';
import {
  buildCompositeResource,
  resourceToReference,
  aggregateCompositeStatus,
  calculateHealthPercentage,
  resolveDependencyOrder,
  canSafelyDelete,
  groupResourcesByType,
  groupResourcesByCategory,
  findDependents,
  findDependencies,
  hasSubResources,
  isRootResource,
  isLeafResource,
} from '../composite';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockResource(overrides: Partial<Resource> = {}): Resource {
  const randomId = Math.random().toString(36).substring(2, 9);
  return {
    uuid: `test-uuid-${randomId}`,
    id: 'test-resource',
    type: 'test-type',
    category: 'NETWORK' as ResourceCategory,
    configuration: {},
    metadata: {
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'test-user',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'test-user',
      state: 'DRAFT',
      version: 1,
      tags: [],
      isFavorite: false,
      isPinned: false,
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Composite Resource Utilities', () => {
  describe('buildCompositeResource', () => {
    it('should build composite with root and children', () => {
      const root = createMockResource({ uuid: 'root' });
      const child1 = createMockResource({
        uuid: 'child-1',
        relationships: {
          dependsOn: [],
          dependents: [],
          routedBy: [],
          children: [],
          parent: { uuid: 'root', id: 'root', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
        },
      });
      const child2 = createMockResource({
        uuid: 'child-2',
        relationships: {
          dependsOn: [],
          dependents: [],
          routedBy: [],
          children: [],
          parent: { uuid: 'root', id: 'root', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
        },
      });

      const composite = buildCompositeResource(root, [child1, child2]);

      expect(composite.root.uuid).toBe('root');
      expect(composite.children).toHaveLength(2);
      expect(composite.relationships).toHaveLength(2);
    });

    it('should build relationships from dependsOn', () => {
      const root = createMockResource({ uuid: 'root' });
      const child = createMockResource({
        uuid: 'child',
        relationships: {
          dependsOn: [
            { uuid: 'dep-1', id: 'dep', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
          ],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });

      const composite = buildCompositeResource(root, [child]);

      expect(composite.relationships.some((r) => r.type === 'DEPENDS_ON')).toBe(true);
    });
  });

  describe('resourceToReference', () => {
    it('should extract reference from resource', () => {
      const resource = createMockResource({
        uuid: 'test-uuid',
        id: 'my-resource',
        type: 'wireguard-client',
        category: 'VPN' as ResourceCategory,
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'test',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'test',
          state: 'ACTIVE',
          version: 1,
          tags: [],
          isFavorite: false,
          isPinned: false,
        },
      });

      const ref = resourceToReference(resource);

      expect(ref.uuid).toBe('test-uuid');
      expect(ref.id).toBe('my-resource');
      expect(ref.type).toBe('wireguard-client');
      expect(ref.category).toBe('VPN');
      expect(ref.state).toBe('ACTIVE');
    });
  });

  describe('aggregateCompositeStatus', () => {
    it('should return unknown status for empty list', () => {
      const status = aggregateCompositeStatus([]);

      expect(status.totalCount).toBe(0);
      expect(status.overallHealth).toBe('UNKNOWN');
      expect(status.allRunning).toBe(true);
    });

    it('should count active resources', () => {
      const resources = [
        createMockResource({
          metadata: {
            state: 'ACTIVE',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
        createMockResource({
          metadata: {
            state: 'ACTIVE',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
        createMockResource({
          metadata: {
            state: 'ERROR',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
      ];

      const status = aggregateCompositeStatus(resources);

      expect(status.totalCount).toBe(3);
      expect(status.activeCount).toBe(2);
      expect(status.errorCount).toBe(1);
    });

    it('should report CRITICAL if any resource has errors', () => {
      const resources = [
        createMockResource({
          metadata: {
            state: 'ACTIVE',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
        createMockResource({
          metadata: {
            state: 'ERROR',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
      ];

      const status = aggregateCompositeStatus(resources);

      expect(status.overallHealth).toBe('CRITICAL');
    });

    it('should report HEALTHY if all resources are active', () => {
      const resources = [
        createMockResource({
          metadata: {
            state: 'ACTIVE',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
        createMockResource({
          metadata: {
            state: 'ACTIVE',
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
            version: 1,
            tags: [],
            isFavorite: false,
            isPinned: false,
          },
        }),
      ];

      const status = aggregateCompositeStatus(resources);

      expect(status.overallHealth).toBe('HEALTHY');
    });

    it('should detect drift', () => {
      const resources = [
        createMockResource({
          deployment: {
            routerResourceId: '123',
            appliedAt: '2024-01-01T00:00:00Z',
            appliedBy: 'test',
            isInSync: false,
            drift: {
              detectedAt: '2024-01-02T00:00:00Z',
              driftedFields: [],
              suggestedAction: 'REAPPLY' as const,
            },
          },
        }),
      ];

      const status = aggregateCompositeStatus(resources);

      expect(status.hasDrift).toBe(true);
      expect(status.isFullySynced).toBe(false);
    });
  });

  describe('calculateHealthPercentage', () => {
    it('should return 100 for empty list', () => {
      const status = aggregateCompositeStatus([]);
      expect(calculateHealthPercentage(status)).toBe(100);
    });

    it('should calculate correct percentage', () => {
      const status = {
        totalCount: 4,
        activeCount: 3,
        errorCount: 1,
        degradedCount: 0,
        pendingCount: 0,
        overallHealth: 'DEGRADED' as const,
        allRunning: true,
        hasDrift: false,
        isFullySynced: true,
      };

      expect(calculateHealthPercentage(status)).toBe(75);
    });
  });

  describe('resolveDependencyOrder', () => {
    it('should order resources by dependencies', () => {
      const a = createMockResource({ uuid: 'a', id: 'a' });
      const b = createMockResource({
        uuid: 'b',
        id: 'b',
        relationships: {
          dependsOn: [{ uuid: 'a', id: 'a', type: 'test', category: 'NETWORK', state: 'ACTIVE' }],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });
      const c = createMockResource({
        uuid: 'c',
        id: 'c',
        relationships: {
          dependsOn: [{ uuid: 'b', id: 'b', type: 'test', category: 'NETWORK', state: 'ACTIVE' }],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });

      const order = resolveDependencyOrder([a, b, c]);

      expect(order.roots).toContain('a');
      expect(order.ordered.indexOf('a')).toBeLessThan(order.ordered.indexOf('b'));
      expect(order.ordered.indexOf('b')).toBeLessThan(order.ordered.indexOf('c'));
      expect(order.circular).toHaveLength(0);
    });

    it('should identify roots with no dependencies', () => {
      const a = createMockResource({ uuid: 'a' });
      const b = createMockResource({ uuid: 'b' });
      const c = createMockResource({
        uuid: 'c',
        relationships: {
          dependsOn: [{ uuid: 'a', id: 'a', type: 'test', category: 'NETWORK', state: 'ACTIVE' }],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });

      const order = resolveDependencyOrder([a, b, c]);

      expect(order.roots).toContain('a');
      expect(order.roots).toContain('b');
      expect(order.roots).not.toContain('c');
    });
  });

  describe('canSafelyDelete', () => {
    it('should allow deletion when no dependents', () => {
      const resource = createMockResource({ uuid: 'target' });
      const other = createMockResource({ uuid: 'other' });

      const result = canSafelyDelete(resource, [resource, other]);

      expect(result.canDelete).toBe(true);
      expect(result.blockedBy).toHaveLength(0);
    });

    it('should block deletion when resource has dependents', () => {
      const target = createMockResource({ uuid: 'target' });
      const dependent = createMockResource({
        uuid: 'dependent',
        relationships: {
          dependsOn: [
            { uuid: 'target', id: 'target', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
          ],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });

      const result = canSafelyDelete(target, [target, dependent]);

      expect(result.canDelete).toBe(false);
      expect(result.blockedBy).toHaveLength(1);
      expect(result.blockedBy[0].uuid).toBe('dependent');
    });
  });

  describe('groupResourcesByType', () => {
    it('should group resources by type', () => {
      const resources = [
        createMockResource({ uuid: '1', type: 'wireguard-client' }),
        createMockResource({ uuid: '2', type: 'wireguard-client' }),
        createMockResource({ uuid: '3', type: 'lan-network' }),
      ];

      const groups = groupResourcesByType(resources);

      expect(groups.get('wireguard-client')).toHaveLength(2);
      expect(groups.get('lan-network')).toHaveLength(1);
    });
  });

  describe('groupResourcesByCategory', () => {
    it('should group resources by category', () => {
      const resources = [
        createMockResource({ uuid: '1', category: 'VPN' as ResourceCategory }),
        createMockResource({ uuid: '2', category: 'VPN' as ResourceCategory }),
        createMockResource({ uuid: '3', category: 'NETWORK' as ResourceCategory }),
      ];

      const groups = groupResourcesByCategory(resources);

      expect(groups.get('VPN' as ResourceCategory)).toHaveLength(2);
      expect(groups.get('NETWORK' as ResourceCategory)).toHaveLength(1);
    });
  });

  describe('findDependents', () => {
    it('should find resources that depend on target', () => {
      const target = createMockResource({ uuid: 'target' });
      const dependent1 = createMockResource({
        uuid: 'dep1',
        relationships: {
          dependsOn: [
            { uuid: 'target', id: 'target', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
          ],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });
      const dependent2 = createMockResource({
        uuid: 'dep2',
        relationships: {
          dependsOn: [
            { uuid: 'target', id: 'target', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
          ],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });
      const unrelated = createMockResource({ uuid: 'unrelated' });

      const dependents = findDependents(target, [target, dependent1, dependent2, unrelated]);

      expect(dependents).toHaveLength(2);
      expect(dependents.map((d) => d.uuid)).toContain('dep1');
      expect(dependents.map((d) => d.uuid)).toContain('dep2');
    });
  });

  describe('findDependencies', () => {
    it('should find resources that target depends on', () => {
      const dep1 = createMockResource({ uuid: 'dep1' });
      const dep2 = createMockResource({ uuid: 'dep2' });
      const target = createMockResource({
        uuid: 'target',
        relationships: {
          dependsOn: [
            { uuid: 'dep1', id: 'dep1', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
            { uuid: 'dep2', id: 'dep2', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
          ],
          dependents: [],
          routedBy: [],
          children: [],
        },
      });
      const unrelated = createMockResource({ uuid: 'unrelated' });

      const dependencies = findDependencies(target, [dep1, dep2, target, unrelated]);

      expect(dependencies).toHaveLength(2);
      expect(dependencies.map((d) => d.uuid)).toContain('dep1');
      expect(dependencies.map((d) => d.uuid)).toContain('dep2');
    });
  });

  describe('Tree Predicates', () => {
    describe('hasSubResources', () => {
      it('should return true when resource has children', () => {
        const resource = createMockResource({
          relationships: {
            dependsOn: [],
            dependents: [],
            routedBy: [],
            children: [
              { uuid: 'child', id: 'child', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
            ],
          },
        });

        expect(hasSubResources(resource)).toBe(true);
      });

      it('should return false when resource has no children', () => {
        const resource = createMockResource();
        expect(hasSubResources(resource)).toBe(false);
      });
    });

    describe('isRootResource', () => {
      it('should return true when resource has no parent', () => {
        const resource = createMockResource();
        expect(isRootResource(resource)).toBe(true);
      });

      it('should return false when resource has parent', () => {
        const resource = createMockResource({
          relationships: {
            dependsOn: [],
            dependents: [],
            routedBy: [],
            children: [],
            parent: {
              uuid: 'parent',
              id: 'parent',
              type: 'test',
              category: 'NETWORK',
              state: 'ACTIVE',
            },
          },
        });

        expect(isRootResource(resource)).toBe(false);
      });
    });

    describe('isLeafResource', () => {
      it('should return true when resource has no children', () => {
        const resource = createMockResource();
        expect(isLeafResource(resource)).toBe(true);
      });

      it('should return false when resource has children', () => {
        const resource = createMockResource({
          relationships: {
            dependsOn: [],
            dependents: [],
            routedBy: [],
            children: [
              { uuid: 'child', id: 'child', type: 'test', category: 'NETWORK', state: 'ACTIVE' },
            ],
          },
        });

        expect(isLeafResource(resource)).toBe(false);
      });
    });
  });
});
