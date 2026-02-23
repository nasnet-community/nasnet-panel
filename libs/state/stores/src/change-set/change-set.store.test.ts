/**
 * Tests for Change Set Store
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  useChangeSetStore,
  selectActiveChangeSet,
  createSelectChangeSetsForRouter,
  createSelectDraftChangeSets,
  selectApplyingChangeSets,
  selectIsAnyApplying,
  getChangeSetState,
} from './change-set.store';

describe('useChangeSetStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChangeSetStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const state = useChangeSetStore.getState();
      expect(Object.keys(state.changeSets)).toHaveLength(0);
      expect(state.activeChangeSetId).toBe(null);
      expect(state.applyingChangeSetIds).toHaveLength(0);
      expect(state.lastError).toBe(null);
    });
  });

  describe('createChangeSet Action', () => {
    it('should create a new change set with DRAFT status', () => {
      const { createChangeSet, getChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({
          name: 'Test Change Set',
          routerId: 'router-1',
        });
      });

      const cs = getChangeSet(id!);
      expect(cs).not.toBeNull();
      expect(cs?.name).toBe('Test Change Set');
      expect(cs?.routerId).toBe('router-1');
      expect(cs?.status).toBe('DRAFT');
      expect(cs?.items).toHaveLength(0);
      expect(cs?.version).toBe(1);
    });

    it('should create change set with description and source', () => {
      const { createChangeSet, getChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({
          name: 'LAN Setup',
          description: 'Create bridge, DHCP, and firewall',
          routerId: 'router-1',
          source: 'lan-wizard',
        });
      });

      const cs = getChangeSet(id!);
      expect(cs?.description).toBe('Create bridge, DHCP, and firewall');
      expect(cs?.source).toBe('lan-wizard');
    });

    it('should set created change set as active', () => {
      const { createChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({
          name: 'Test',
          routerId: 'router-1',
        });
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(id!);
    });

    it('should generate unique IDs', () => {
      const { createChangeSet } = useChangeSetStore.getState();

      const ids: string[] = [];
      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.push(createChangeSet({ name: `Test ${i}`, routerId: 'router-1' }));
        }
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('getChangeSet Action', () => {
    it('should return null for non-existent ID', () => {
      const { getChangeSet } = useChangeSetStore.getState();
      expect(getChangeSet('non-existent')).toBe(null);
    });
  });

  describe('getChangeSetsForRouter Action', () => {
    it('should return change sets filtered by router', () => {
      const { createChangeSet, getChangeSetsForRouter } = useChangeSetStore.getState();

      act(() => {
        createChangeSet({ name: 'CS1', routerId: 'router-1' });
        createChangeSet({ name: 'CS2', routerId: 'router-1' });
        createChangeSet({ name: 'CS3', routerId: 'router-2' });
      });

      expect(getChangeSetsForRouter('router-1')).toHaveLength(2);
      expect(getChangeSetsForRouter('router-2')).toHaveLength(1);
      expect(getChangeSetsForRouter('router-3')).toHaveLength(0);
    });
  });

  describe('deleteChangeSet Action', () => {
    it('should delete a change set', () => {
      const { createChangeSet, deleteChangeSet, getChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
      });

      expect(getChangeSet(id!)).not.toBeNull();

      let result!: boolean;
      act(() => {
        result = deleteChangeSet(id!);
      });

      expect(result!).toBe(true);
      expect(getChangeSet(id!)).toBe(null);
    });

    it('should not delete a change set that is applying', () => {
      const { createChangeSet, markApplying, deleteChangeSet, getChangeSet } =
        useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
        markApplying(id);
      });

      let result!: boolean;
      act(() => {
        result = deleteChangeSet(id!);
      });

      expect(result!).toBe(false);
      expect(getChangeSet(id!)).not.toBeNull();
      expect(useChangeSetStore.getState().lastError).toBe(
        'Cannot delete change set while applying'
      );
    });

    it('should clear activeChangeSetId when deleting active change set', () => {
      const { createChangeSet, deleteChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(id!);

      act(() => {
        deleteChangeSet(id!);
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(null);
    });
  });

  describe('setActiveChangeSet Action', () => {
    it('should set the active change set', () => {
      const { createChangeSet, setActiveChangeSet } = useChangeSetStore.getState();

      let id1!: string, id2!: string;
      act(() => {
        id1 = createChangeSet({ name: 'CS1', routerId: 'router-1' });
        id2 = createChangeSet({ name: 'CS2', routerId: 'router-1' });
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(id2!);

      act(() => {
        setActiveChangeSet(id1!);
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(id1!);
    });

    it('should clear active change set when set to null', () => {
      const { createChangeSet, setActiveChangeSet } = useChangeSetStore.getState();

      act(() => {
        createChangeSet({ name: 'Test', routerId: 'router-1' });
      });

      expect(useChangeSetStore.getState().activeChangeSetId).not.toBe(null);

      act(() => {
        setActiveChangeSet(null);
      });

      expect(useChangeSetStore.getState().activeChangeSetId).toBe(null);
    });
  });

  describe('Item Management', () => {
    let changeSetId: string = '';

    beforeEach(() => {
      const { createChangeSet } = useChangeSetStore.getState();
      act(() => {
        changeSetId = createChangeSet({ name: 'Test', routerId: 'router-1' });
      });
    });

    describe('addItem Action', () => {
      it('should add an item to a change set', () => {
        const { addItem, getChangeSet } = useChangeSetStore.getState();

        let itemId!: string;
        act(() => {
          itemId = addItem(changeSetId, {
            name: 'Bridge Interface',
            resourceType: 'network.bridge',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: { name: 'bridge-lan' },
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
        });

        const cs = getChangeSet(changeSetId);
        expect(cs?.items).toHaveLength(1);
        expect(cs?.items[0].id).toBe(itemId!);
        expect(cs?.items[0].name).toBe('Bridge Interface');
        expect(cs?.items[0].status).toBe('PENDING');
      });

      it('should not add item to non-DRAFT change set', () => {
        const { addItem, getChangeSet, updateStatus } = useChangeSetStore.getState();

        act(() => {
          updateStatus(changeSetId, 'READY');
        });

        act(() => {
          addItem(changeSetId, {
            name: 'Test',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: {},
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
        });

        const cs = getChangeSet(changeSetId);
        expect(cs?.items).toHaveLength(0);
      });

      it('should increment version when adding item', () => {
        const { addItem, getChangeSet } = useChangeSetStore.getState();

        const initialVersion = getChangeSet(changeSetId)?.version;

        act(() => {
          addItem(changeSetId, {
            name: 'Test',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: {},
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
        });

        expect(getChangeSet(changeSetId)?.version).toBe(initialVersion! + 1);
      });
    });

    describe('updateItem Action', () => {
      let itemId: string = '';

      beforeEach(() => {
        const { addItem } = useChangeSetStore.getState();
        act(() => {
          itemId = addItem(changeSetId, {
            name: 'Original Name',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: { key: 'value' },
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
        });
      });

      it('should update item properties', () => {
        const { updateItem, getChangeSet } = useChangeSetStore.getState();

        act(() => {
          updateItem(changeSetId, itemId, {
            name: 'Updated Name',
            configuration: { key: 'new-value' },
          });
        });

        const item = getChangeSet(changeSetId)?.items[0];
        expect(item?.name).toBe('Updated Name');
        expect(item?.configuration).toEqual({ key: 'new-value' });
      });
    });

    describe('removeItem Action', () => {
      it('should remove an item from a change set', () => {
        const { addItem, removeItem, getChangeSet } = useChangeSetStore.getState();

        let itemId!: string;
        act(() => {
          itemId = addItem(changeSetId, {
            name: 'Test',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: {},
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
        });

        expect(getChangeSet(changeSetId)?.items).toHaveLength(1);

        act(() => {
          removeItem(changeSetId, itemId);
        });

        expect(getChangeSet(changeSetId)?.items).toHaveLength(0);
      });

      it('should remove dependencies referencing the removed item', () => {
        const { addItem, removeItem, getChangeSet } = useChangeSetStore.getState();

        let item1Id = '', item2Id = '';
        act(() => {
          item1Id = addItem(changeSetId, {
            name: 'Item 1',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: {},
            resourceUuid: null,
            previousState: null,
            dependencies: [],
          });
          item2Id = addItem(changeSetId, {
            name: 'Item 2',
            resourceType: 'test',
            resourceCategory: 'NETWORK',
            operation: 'CREATE',
            configuration: {},
            resourceUuid: null,
            previousState: null,
            dependencies: [item1Id],
          });
        });

        // Verify item2 depends on item1
        let cs = getChangeSet(changeSetId);
        const item2Before = cs?.items.find((i) => i.id === item2Id);
        expect(item2Before?.dependencies).toContain(item1Id);

        // Remove item1
        act(() => {
          removeItem(changeSetId, item1Id);
        });

        // Verify dependency is removed
        cs = getChangeSet(changeSetId);
        const item2After = cs?.items.find((i) => i.id === item2Id);
        expect(item2After?.dependencies).not.toContain(item1Id);
      });
    });
  });

  describe('Status Updates', () => {
    let changeSetId: string = '';

    beforeEach(() => {
      const { createChangeSet, addItem } = useChangeSetStore.getState();
      act(() => {
        changeSetId = createChangeSet({ name: 'Test', routerId: 'router-1' });
        addItem(changeSetId, {
          name: 'Item 1',
          resourceType: 'test',
          resourceCategory: 'NETWORK',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [],
        });
      });
    });

    it('should update change set status', () => {
      const { updateStatus, getChangeSet } = useChangeSetStore.getState();

      act(() => {
        updateStatus(changeSetId, 'READY');
      });

      expect(getChangeSet(changeSetId)?.status).toBe('READY');
    });

    it('should update item status', () => {
      const { updateItemStatus, getChangeSet } = useChangeSetStore.getState();

      const itemId = getChangeSet(changeSetId)?.items[0].id ?? '';

      act(() => {
        updateItemStatus(changeSetId, itemId, 'APPLYING');
      });

      const item = getChangeSet(changeSetId)?.items[0];
      expect(item?.status).toBe('APPLYING');
      expect(item?.applyStartedAt).not.toBeNull();
    });

    it('should mark change set as applying', () => {
      const { markApplying, getChangeSet } = useChangeSetStore.getState();

      act(() => {
        markApplying(changeSetId);
      });

      const state = useChangeSetStore.getState();
      expect(getChangeSet(changeSetId)?.status).toBe('APPLYING');
      expect(getChangeSet(changeSetId)?.applyStartedAt).not.toBeNull();
      expect(state.applyingChangeSetIds).toContain(changeSetId);
    });

    it('should mark change set as completed', () => {
      const { markApplying, markCompleted, getChangeSet } = useChangeSetStore.getState();

      act(() => {
        markApplying(changeSetId);
      });

      act(() => {
        markCompleted(changeSetId);
      });

      const state = useChangeSetStore.getState();
      expect(getChangeSet(changeSetId)?.status).toBe('COMPLETED');
      expect(getChangeSet(changeSetId)?.completedAt).not.toBeNull();
      expect(state.applyingChangeSetIds).not.toContain(changeSetId);
    });

    it('should mark change set as failed with error', () => {
      const { markApplying, markFailed, getChangeSet, updateItemStatus } =
        useChangeSetStore.getState();

      const itemId = getChangeSet(changeSetId)?.items[0].id ?? '';

      act(() => {
        markApplying(changeSetId);
        updateItemStatus(changeSetId, itemId, 'APPLYING');
      });

      act(() => {
        markFailed(changeSetId, 'Network error', itemId);
      });

      const state = useChangeSetStore.getState();
      const cs = getChangeSet(changeSetId);
      expect(cs?.status).toBe('FAILED');
      expect(cs?.error?.message).toBe('Network error');
      expect(cs?.error?.failedItemId).toBe(itemId);
      expect(state.applyingChangeSetIds).not.toContain(changeSetId);
      expect(state.lastError).toBe('Network error');
    });

    it('should mark change set as rolled back', () => {
      const { markApplying, markRolledBack, getChangeSet, updateItemStatus } =
        useChangeSetStore.getState();

      const itemId = getChangeSet(changeSetId)?.items[0].id ?? '';

      act(() => {
        markApplying(changeSetId);
        updateItemStatus(changeSetId, itemId, 'APPLIED');
      });

      act(() => {
        markRolledBack(changeSetId);
      });

      const cs = getChangeSet(changeSetId);
      expect(cs?.status).toBe('ROLLED_BACK');
      expect(cs?.items[0].status).toBe('ROLLED_BACK');
    });
  });

  describe('getChangeSetSummary Action', () => {
    it('should return summary with operation counts', () => {
      const { createChangeSet, addItem, getChangeSetSummary } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
        addItem(id, {
          name: 'Create 1',
          resourceType: 'test',
          resourceCategory: 'NETWORK',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [],
        });
        addItem(id, {
          name: 'Create 2',
          resourceType: 'test',
          resourceCategory: 'NETWORK',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [],
        });
        addItem(id, {
          name: 'Update 1',
          resourceType: 'test',
          resourceCategory: 'NETWORK',
          operation: 'UPDATE',
          resourceUuid: 'uuid-1',
          configuration: {},
          previousState: null,
          dependencies: [],
        });
        addItem(id, {
          name: 'Delete 1',
          resourceType: 'test',
          resourceCategory: 'NETWORK',
          operation: 'DELETE',
          resourceUuid: 'uuid-2',
          configuration: {},
          previousState: null,
          dependencies: [],
        });
      });

      const summary = getChangeSetSummary(id!);
      expect(summary?.operationCounts).toEqual({
        create: 2,
        update: 1,
        delete: 1,
      });
      expect(summary?.totalItems).toBe(4);
    });

    it('should return null for non-existent ID', () => {
      const { getChangeSetSummary } = useChangeSetStore.getState();
      expect(getChangeSetSummary('non-existent')).toBe(null);
    });
  });

  describe('clearCompleted Action', () => {
    it('should clear all completed change sets', () => {
      const { createChangeSet, updateStatus, clearCompleted, getChangeSetsForRouter } =
        useChangeSetStore.getState();

      act(() => {
        const id1 = createChangeSet({ name: 'CS1', routerId: 'router-1' });
        const id2 = createChangeSet({ name: 'CS2', routerId: 'router-1' });
        createChangeSet({ name: 'CS3', routerId: 'router-1' }); // Keep in DRAFT
        updateStatus(id1, 'COMPLETED');
        updateStatus(id2, 'FAILED');
      });

      expect(getChangeSetsForRouter('router-1')).toHaveLength(3);

      act(() => {
        clearCompleted();
      });

      expect(getChangeSetsForRouter('router-1')).toHaveLength(1);
    });

    it('should filter by router when specified', () => {
      const { createChangeSet, updateStatus, clearCompleted, getChangeSetsForRouter } =
        useChangeSetStore.getState();

      act(() => {
        const id1 = createChangeSet({ name: 'CS1', routerId: 'router-1' });
        const id2 = createChangeSet({ name: 'CS2', routerId: 'router-2' });
        updateStatus(id1, 'COMPLETED');
        updateStatus(id2, 'COMPLETED');
      });

      act(() => {
        clearCompleted('router-1');
      });

      expect(getChangeSetsForRouter('router-1')).toHaveLength(0);
      expect(getChangeSetsForRouter('router-2')).toHaveLength(1);
    });
  });

  describe('Selectors', () => {
    it('selectActiveChangeSet should return the active change set', () => {
      const { createChangeSet } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
      });

      const activeCs = selectActiveChangeSet(useChangeSetStore.getState());
      expect(activeCs?.id).toBe(id!);
    });

    it('createSelectChangeSetsForRouter should return change sets for router', () => {
      const { createChangeSet } = useChangeSetStore.getState();

      act(() => {
        createChangeSet({ name: 'CS1', routerId: 'router-1' });
        createChangeSet({ name: 'CS2', routerId: 'router-1' });
        createChangeSet({ name: 'CS3', routerId: 'router-2' });
      });

      const selector = createSelectChangeSetsForRouter('router-1');
      const changeSets = selector(useChangeSetStore.getState());
      expect(changeSets).toHaveLength(2);
    });

    it('createSelectDraftChangeSets should return only DRAFT change sets', () => {
      const { createChangeSet, updateStatus } = useChangeSetStore.getState();

      let id1!: string;
      act(() => {
        id1 = createChangeSet({ name: 'CS1', routerId: 'router-1' });
        createChangeSet({ name: 'CS2', routerId: 'router-1' });
        updateStatus(id1, 'READY');
      });

      const selector = createSelectDraftChangeSets('router-1');
      const changeSets = selector(useChangeSetStore.getState());
      expect(changeSets).toHaveLength(1);
      expect(changeSets[0].status).toBe('DRAFT');
    });

    it('selectApplyingChangeSets should return currently applying change sets', () => {
      const { createChangeSet, markApplying } = useChangeSetStore.getState();

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
        markApplying(id);
      });

      const applying = selectApplyingChangeSets(useChangeSetStore.getState());
      expect(applying).toHaveLength(1);
      expect(applying[0].id).toBe(id!);
    });

    it('selectIsAnyApplying should return true when applying', () => {
      const { createChangeSet, markApplying } = useChangeSetStore.getState();

      expect(selectIsAnyApplying(useChangeSetStore.getState())).toBe(false);

      let id!: string;
      act(() => {
        id = createChangeSet({ name: 'Test', routerId: 'router-1' });
        markApplying(id);
      });

      expect(selectIsAnyApplying(useChangeSetStore.getState())).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('getChangeSetState should return current state', () => {
      const state = getChangeSetState();
      expect(state.changeSets).toBeDefined();
      expect(typeof state.createChangeSet).toBe('function');
    });
  });

  describe('Apply Order Calculation', () => {
    it('should calculate correct apply order based on dependencies', () => {
      const { createChangeSet, addItem, getChangeSet } = useChangeSetStore.getState();

      let id = '';
      let bridgeId = '', dhcpId = '', firewallId = '';

      act(() => {
        id = createChangeSet({ name: 'LAN Setup', routerId: 'router-1' });

        // Add in reverse order to verify topological sort
        firewallId = addItem(id, {
          name: 'Firewall Rule',
          resourceType: 'firewall.rule',
          resourceCategory: 'APPLICATION',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [], // Will depend on bridge
        });

        dhcpId = addItem(id, {
          name: 'DHCP Server',
          resourceType: 'dhcp.server',
          resourceCategory: 'INFRASTRUCTURE',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [], // Will depend on bridge
        });

        bridgeId = addItem(id, {
          name: 'Bridge Interface',
          resourceType: 'network.bridge',
          resourceCategory: 'NETWORK',
          operation: 'CREATE',
          configuration: {},
          resourceUuid: null,
          previousState: null,
          dependencies: [],
        });
      });

      // Set dependencies: DHCP and Firewall depend on Bridge
      act(() => {
        useChangeSetStore.getState().setItemDependencies(id, dhcpId, [bridgeId]);
        useChangeSetStore.getState().setItemDependencies(id, firewallId, [bridgeId]);
      });

      const cs = getChangeSet(id);
      const bridge = cs?.items.find((i) => i.id === bridgeId);
      const dhcp = cs?.items.find((i) => i.id === dhcpId);
      const firewall = cs?.items.find((i) => i.id === firewallId);

      // Bridge should be applied first (lower order)
      expect(bridge?.applyOrder).toBeLessThan(dhcp?.applyOrder ?? 0);
      expect(bridge?.applyOrder).toBeLessThan(firewall?.applyOrder ?? 0);
    });
  });
});
