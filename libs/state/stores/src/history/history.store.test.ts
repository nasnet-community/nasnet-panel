/**
 * History Store Tests
 *
 * Unit tests for the undo/redo history store.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  useHistoryStore,
  MAX_ACTIONS,
  selectCanUndo,
  selectCanRedo,
  selectLastAction,
  selectHistoryLength,
  undoLast,
  redoLast,
  pushHistoryAction,
  clearAllHistory,
  clearPageScopedHistory,
} from './history.store';

import type { UndoableActionInput } from './types';

// Helper to create a test action
function createTestAction(
  overrides: Partial<UndoableActionInput> = {}
): UndoableActionInput {
  const executeFn = vi.fn();
  const undoFn = vi.fn();

  return {
    type: 'edit',
    description: 'Test action',
    scope: 'page',
    execute: executeFn,
    undo: undoFn,
    ...overrides,
  };
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useHistoryStore.setState({ past: [], future: [] });
  });

  describe('pushAction', () => {
    it('adds action to past array', () => {
      const action = createTestAction({ description: 'First action' });
      const { pushAction } = useHistoryStore.getState();

      const id = pushAction(action);

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.past[0].id).toBe(id);
      expect(state.past[0].description).toBe('First action');
    });

    it('clears future on new action', async () => {
      const { pushAction, undo } = useHistoryStore.getState();

      // Add action and undo
      pushAction(createTestAction({ description: 'Action 1' }));
      await undo();

      // Future should have the undone action
      expect(useHistoryStore.getState().future).toHaveLength(1);

      // Push new action
      pushAction(createTestAction({ description: 'Action 2' }));

      // Future should be cleared
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });

    it('generates unique IDs', () => {
      const { pushAction } = useHistoryStore.getState();

      const id1 = pushAction(createTestAction());
      const id2 = pushAction(createTestAction());

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^action-\d+-[a-z0-9]+$/);
    });

    it('sets timestamp automatically', () => {
      const before = new Date();
      const { pushAction } = useHistoryStore.getState();

      pushAction(createTestAction());
      const after = new Date();

      const state = useHistoryStore.getState();
      const timestamp = state.past[0].timestamp;

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('trims to MAX_ACTIONS limit', () => {
      const { pushAction } = useHistoryStore.getState();

      // Add more than MAX_ACTIONS
      for (let i = 0; i < MAX_ACTIONS + 10; i++) {
        pushAction(createTestAction({ description: `Action ${i}` }));
      }

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(MAX_ACTIONS);
      // Should have the most recent actions
      expect(state.past[0].description).toBe('Action 10');
    });
  });

  describe('undo', () => {
    it('moves action from past to future', async () => {
      const { pushAction, undo } = useHistoryStore.getState();

      pushAction(createTestAction({ description: 'Action 1' }));

      await undo();

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(1);
      expect(state.future[0].description).toBe('Action 1');
    });

    it('calls undo function on action', async () => {
      const undoFn = vi.fn();
      const { pushAction, undo } = useHistoryStore.getState();

      pushAction(createTestAction({ undo: undoFn }));

      await undo();

      expect(undoFn).toHaveBeenCalledOnce();
    });

    it('returns false when nothing to undo', async () => {
      const result = await useHistoryStore.getState().undo();

      expect(result).toBe(false);
    });

    it('returns true on successful undo', async () => {
      const { pushAction, undo } = useHistoryStore.getState();

      pushAction(createTestAction());

      const result = await undo();

      expect(result).toBe(true);
    });
  });

  describe('redo', () => {
    it('moves action from future to past', async () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      pushAction(createTestAction({ description: 'Action 1' }));
      await undo();
      await redo();

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(0);
      expect(state.past[0].description).toBe('Action 1');
    });

    it('calls execute function on action', async () => {
      const executeFn = vi.fn();
      const { pushAction, undo, redo } = useHistoryStore.getState();

      pushAction(createTestAction({ execute: executeFn }));
      await undo();
      await redo();

      // execute is called on redo
      expect(executeFn).toHaveBeenCalledOnce();
    });

    it('returns false when nothing to redo', async () => {
      const result = await useHistoryStore.getState().redo();

      expect(result).toBe(false);
    });

    it('returns true on successful redo', async () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      pushAction(createTestAction());
      await undo();

      const result = await redo();

      expect(result).toBe(true);
    });
  });

  describe('jumpToIndex', () => {
    it('undoes multiple actions to reach target', async () => {
      const { pushAction, jumpToIndex } = useHistoryStore.getState();

      pushAction(createTestAction({ description: 'Action 1' }));
      pushAction(createTestAction({ description: 'Action 2' }));
      pushAction(createTestAction({ description: 'Action 3' }));

      await jumpToIndex(0); // Jump to after first action

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(2);
      expect(state.past[0].description).toBe('Action 1');
    });

    it('redoes multiple actions to reach target', async () => {
      const { pushAction, undo, jumpToIndex } = useHistoryStore.getState();

      pushAction(createTestAction({ description: 'Action 1' }));
      pushAction(createTestAction({ description: 'Action 2' }));
      pushAction(createTestAction({ description: 'Action 3' }));

      // Undo all
      await undo();
      await undo();
      await undo();

      await jumpToIndex(1); // Jump to after second action

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(2);
      expect(state.future).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('clears both past and future', () => {
      const { pushAction, undo, clearHistory } = useHistoryStore.getState();

      pushAction(createTestAction());
      pushAction(createTestAction());
      undo();

      clearHistory();

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);
    });
  });

  describe('clearPageHistory', () => {
    it('clears only page-scoped actions', () => {
      const { pushAction, clearPageHistory } = useHistoryStore.getState();

      pushAction(createTestAction({ scope: 'page', description: 'Page 1' }));
      pushAction(createTestAction({ scope: 'global', description: 'Global 1' }));
      pushAction(createTestAction({ scope: 'page', description: 'Page 2' }));

      clearPageHistory();

      const state = useHistoryStore.getState();
      expect(state.past).toHaveLength(1);
      expect(state.past[0].description).toBe('Global 1');
      expect(state.past[0].scope).toBe('global');
    });
  });

  describe('selectors', () => {
    it('selectCanUndo returns true when past has actions', () => {
      const { pushAction } = useHistoryStore.getState();

      expect(selectCanUndo(useHistoryStore.getState())).toBe(false);

      pushAction(createTestAction());

      expect(selectCanUndo(useHistoryStore.getState())).toBe(true);
    });

    it('selectCanRedo returns true when future has actions', async () => {
      const { pushAction, undo } = useHistoryStore.getState();

      expect(selectCanRedo(useHistoryStore.getState())).toBe(false);

      pushAction(createTestAction());
      await undo();

      expect(selectCanRedo(useHistoryStore.getState())).toBe(true);
    });

    it('selectLastAction returns most recent action', () => {
      const { pushAction } = useHistoryStore.getState();

      expect(selectLastAction(useHistoryStore.getState())).toBeUndefined();

      pushAction(createTestAction({ description: 'First' }));
      pushAction(createTestAction({ description: 'Second' }));

      expect(selectLastAction(useHistoryStore.getState())?.description).toBe(
        'Second'
      );
    });

    it('selectHistoryLength returns past length', () => {
      const { pushAction } = useHistoryStore.getState();

      expect(selectHistoryLength(useHistoryStore.getState())).toBe(0);

      pushAction(createTestAction());
      pushAction(createTestAction());

      expect(selectHistoryLength(useHistoryStore.getState())).toBe(2);
    });
  });

  describe('convenience functions', () => {
    it('undoLast calls undo', async () => {
      const { pushAction } = useHistoryStore.getState();
      pushAction(createTestAction());

      const result = await undoLast();

      expect(result).toBe(true);
      expect(useHistoryStore.getState().past).toHaveLength(0);
    });

    it('redoLast calls redo', async () => {
      const { pushAction, undo } = useHistoryStore.getState();
      pushAction(createTestAction());
      await undo();

      const result = await redoLast();

      expect(result).toBe(true);
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('pushHistoryAction adds action', () => {
      const id = pushHistoryAction(createTestAction({ description: 'Test' }));

      expect(id).toMatch(/^action-/);
      expect(useHistoryStore.getState().past).toHaveLength(1);
    });

    it('clearAllHistory clears store', () => {
      pushHistoryAction(createTestAction());
      pushHistoryAction(createTestAction());

      clearAllHistory();

      expect(useHistoryStore.getState().past).toHaveLength(0);
    });

    it('clearPageScopedHistory clears page actions', () => {
      pushHistoryAction(createTestAction({ scope: 'page' }));
      pushHistoryAction(createTestAction({ scope: 'global' }));

      clearPageScopedHistory();

      expect(useHistoryStore.getState().past).toHaveLength(1);
    });
  });
});
