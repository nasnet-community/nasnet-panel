/**
 * Command Pattern Utilities Tests
 *
 * Unit tests for the command pattern helpers.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createUndoableAction,
  executeAction,
  createEditAction,
  createDeleteAction,
  createCreateAction,
  createReorderAction,
  createCompositeAction,
  executeBatch,
} from './command-utils';
import { useHistoryStore } from './history.store';

describe('command-utils', () => {
  beforeEach(() => {
    // Reset the store before each test
    useHistoryStore.setState({ past: [], future: [] });
  });

  describe('createUndoableAction', () => {
    it('creates action with required fields', () => {
      const execute = vi.fn();
      const undo = vi.fn();

      const action = createUndoableAction({
        type: 'edit',
        description: 'Edit field',
        scope: 'page',
        execute,
        undo,
      });

      expect(action.type).toBe('edit');
      expect(action.description).toBe('Edit field');
      expect(action.scope).toBe('page');
      expect(action.execute).toBe(execute);
      expect(action.undo).toBe(undo);
    });

    it('includes optional resource fields', () => {
      const action = createUndoableAction({
        type: 'edit',
        description: 'Edit',
        scope: 'page',
        execute: vi.fn(),
        undo: vi.fn(),
        resourceId: 'res-123',
        resourceType: 'network.interface',
      });

      expect(action.resourceId).toBe('res-123');
      expect(action.resourceType).toBe('network.interface');
    });
  });

  describe('executeAction', () => {
    it('executes action and pushes to history', async () => {
      const execute = vi.fn();
      const undo = vi.fn();

      await executeAction({
        type: 'edit',
        description: 'Test action',
        scope: 'page',
        execute,
        undo,
      });

      expect(execute).toHaveBeenCalledOnce();
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('returns action ID', async () => {
      const id = await executeAction({
        type: 'edit',
        description: 'Test',
        scope: 'page',
        execute: vi.fn(),
        undo: vi.fn(),
      });

      expect(id).toMatch(/^action-/);
    });
  });

  describe('createEditAction', () => {
    it('creates edit action with old/new values', async () => {
      let value = 'old';
      const apply = vi.fn((v: string) => {
        value = v;
      });

      const action = createEditAction({
        fieldName: 'name',
        oldValue: 'old',
        newValue: 'new',
        apply,
      });

      expect(action.type).toBe('edit');
      expect(action.description).toBe('Edit name');
      expect(action.scope).toBe('page');

      // Execute should apply new value
      await action.execute();
      expect(apply).toHaveBeenCalledWith('new');

      // Undo should apply old value
      await action.undo();
      expect(apply).toHaveBeenCalledWith('old');
    });
  });

  describe('createDeleteAction', () => {
    it('creates delete action with restore capability', async () => {
      const deletedItem = { id: '123', name: 'Test' };
      const onDelete = vi.fn();
      const onRestore = vi.fn();

      const action = createDeleteAction({
        itemName: 'Test Item',
        deletedItem,
        onDelete,
        onRestore,
      });

      expect(action.type).toBe('delete');
      expect(action.description).toBe('Delete Test Item');
      expect(action.scope).toBe('global');

      await action.execute();
      expect(onDelete).toHaveBeenCalledOnce();

      await action.undo();
      expect(onRestore).toHaveBeenCalledWith(deletedItem);
    });
  });

  describe('createCreateAction', () => {
    it('creates action with delete as undo', async () => {
      let createdId: string | null = null;
      const onCreate = vi.fn(() => {
        createdId = 'new-123';
        return createdId;
      });
      const onDelete = vi.fn();

      const action = createCreateAction({
        itemName: 'New Item',
        onCreate,
        onDelete,
      });

      expect(action.type).toBe('create');
      expect(action.description).toBe('Create New Item');

      await action.execute();
      expect(onCreate).toHaveBeenCalledOnce();

      await action.undo();
      expect(onDelete).toHaveBeenCalledWith('new-123');
    });
  });

  describe('createReorderAction', () => {
    it('creates reorder action with reverse as undo', async () => {
      const apply = vi.fn();

      const action = createReorderAction({
        listName: 'Items',
        fromIndex: 2,
        toIndex: 0,
        apply,
      });

      expect(action.type).toBe('reorder');
      expect(action.description).toBe('Reorder Items');

      await action.execute();
      expect(apply).toHaveBeenCalledWith(2, 0);

      await action.undo();
      expect(apply).toHaveBeenCalledWith(0, 2); // Reversed
    });
  });

  describe('createCompositeAction', () => {
    it('executes all actions in order', async () => {
      const order: number[] = [];

      const action = createCompositeAction({
        description: 'Batch operation',
        actions: [
          {
            execute: () => {
              order.push(1);
            },
            undo: vi.fn(),
          },
          {
            execute: () => {
              order.push(2);
            },
            undo: vi.fn(),
          },
          {
            execute: () => {
              order.push(3);
            },
            undo: vi.fn(),
          },
        ],
      });

      await action.execute();
      expect(order).toEqual([1, 2, 3]);
    });

    it('undoes all actions in reverse order', async () => {
      const order: number[] = [];

      const action = createCompositeAction({
        description: 'Batch operation',
        actions: [
          {
            execute: vi.fn(),
            undo: () => {
              order.push(1);
            },
          },
          {
            execute: vi.fn(),
            undo: () => {
              order.push(2);
            },
          },
          {
            execute: vi.fn(),
            undo: () => {
              order.push(3);
            },
          },
        ],
      });

      await action.undo();
      expect(order).toEqual([3, 2, 1]); // Reverse order
    });
  });

  describe('executeBatch', () => {
    it('executes all actions and creates single history entry', async () => {
      const execute1 = vi.fn();
      const execute2 = vi.fn();

      await executeBatch({
        description: 'Bulk operation',
        actions: [
          { execute: execute1, undo: vi.fn() },
          { execute: execute2, undo: vi.fn() },
        ],
      });

      expect(execute1).toHaveBeenCalledOnce();
      expect(execute2).toHaveBeenCalledOnce();
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });
  });
});
