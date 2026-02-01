/**
 * Command Pattern Utilities for Undo/Redo
 *
 * Provides factory functions and helpers for creating undoable actions:
 * - createUndoableAction: Generic action factory
 * - executeAction: Wrapper that auto-pushes to history
 * - Helpers for common patterns (edit, delete, reorder)
 * - Support for composite actions (multiple changes as one)
 * - Change Set integration
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import type {
  UndoableAction,
  UndoableActionInput,
  HistoryActionType,
  ActionScope,
} from './types';
import { useHistoryStore, pushHistoryAction } from './history.store';

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an undoable action with the required structure
 *
 * @example
 * ```tsx
 * const action = createUndoableAction({
 *   type: 'edit',
 *   description: 'Edit interface name',
 *   scope: 'page',
 *   execute: () => setName(newName),
 *   undo: () => setName(oldName),
 * });
 * ```
 */
export function createUndoableAction(
  params: UndoableActionInput
): UndoableActionInput {
  return {
    type: params.type,
    description: params.description,
    scope: params.scope,
    execute: params.execute,
    undo: params.undo,
    resourceId: params.resourceId,
    resourceType: params.resourceType,
  };
}

/**
 * Execute an action and automatically push it to history
 *
 * @param action - The action to execute and record
 * @returns The generated action ID
 *
 * @example
 * ```tsx
 * const actionId = await executeAction({
 *   type: 'edit',
 *   description: 'Change interface IP',
 *   scope: 'page',
 *   execute: async () => await api.updateInterface(id, { ip: newIp }),
 *   undo: async () => await api.updateInterface(id, { ip: oldIp }),
 * });
 * ```
 */
export async function executeAction(
  action: UndoableActionInput
): Promise<string> {
  // Execute the action first
  await action.execute();

  // Push to history
  return pushHistoryAction(action);
}

// =============================================================================
// Common Pattern Helpers
// =============================================================================

/**
 * Create an edit action for a single field change
 *
 * @example
 * ```tsx
 * const action = createEditAction({
 *   fieldName: 'name',
 *   oldValue: 'ether1',
 *   newValue: 'WAN',
 *   apply: (value) => updateInterface({ name: value }),
 *   resourceId: 'interface-ether1',
 *   resourceType: 'network.interface',
 *   scope: 'page',
 * });
 * ```
 */
export function createEditAction<T>(params: {
  fieldName: string;
  oldValue: T;
  newValue: T;
  apply: (value: T) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput {
  const {
    fieldName,
    oldValue,
    newValue,
    apply,
    resourceId,
    resourceType,
    scope = 'page',
  } = params;

  return createUndoableAction({
    type: 'edit',
    description: `Edit ${fieldName}`,
    scope,
    execute: () => apply(newValue),
    undo: () => apply(oldValue),
    resourceId,
    resourceType,
  });
}

/**
 * Create a delete action with restore capability
 *
 * @example
 * ```tsx
 * const action = createDeleteAction({
 *   itemName: 'Bridge interface',
 *   deletedItem: bridgeData,
 *   onDelete: async () => await api.deleteBridge(id),
 *   onRestore: async (item) => await api.createBridge(item),
 *   resourceId: 'bridge-1',
 *   resourceType: 'network.bridge',
 * });
 * ```
 */
export function createDeleteAction<T>(params: {
  itemName: string;
  deletedItem: T;
  onDelete: () => void | Promise<void>;
  onRestore: (item: T) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput {
  const {
    itemName,
    deletedItem,
    onDelete,
    onRestore,
    resourceId,
    resourceType,
    scope = 'global',
  } = params;

  return createUndoableAction({
    type: 'delete',
    description: `Delete ${itemName}`,
    scope,
    execute: onDelete,
    undo: () => onRestore(deletedItem),
    resourceId,
    resourceType,
  });
}

/**
 * Create a create action with delete as undo
 *
 * @example
 * ```tsx
 * const action = createCreateAction({
 *   itemName: 'WireGuard peer',
 *   onCreate: async () => {
 *     const peer = await api.createPeer(config);
 *     return peer.id;
 *   },
 *   onDelete: async (id) => await api.deletePeer(id),
 *   resourceType: 'vpn.wireguard.peer',
 * });
 * ```
 */
export function createCreateAction<TId = string>(params: {
  itemName: string;
  onCreate: () => TId | Promise<TId>;
  onDelete: (id: TId) => void | Promise<void>;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput {
  const { itemName, onCreate, onDelete, resourceType, scope = 'global' } = params;

  let createdId: TId | null = null;

  return createUndoableAction({
    type: 'create',
    description: `Create ${itemName}`,
    scope,
    execute: async () => {
      createdId = await onCreate();
    },
    undo: async () => {
      if (createdId !== null) {
        await onDelete(createdId);
      }
    },
    resourceType,
  });
}

/**
 * Create a reorder action for list item movements
 *
 * @example
 * ```tsx
 * const action = createReorderAction({
 *   listName: 'Firewall rules',
 *   fromIndex: 2,
 *   toIndex: 0,
 *   apply: (from, to) => moveRule(from, to),
 *   resourceType: 'firewall.rule',
 * });
 * ```
 */
export function createReorderAction(params: {
  listName: string;
  fromIndex: number;
  toIndex: number;
  apply: (fromIndex: number, toIndex: number) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput {
  const {
    listName,
    fromIndex,
    toIndex,
    apply,
    resourceId,
    resourceType,
    scope = 'page',
  } = params;

  return createUndoableAction({
    type: 'reorder',
    description: `Reorder ${listName}`,
    scope,
    execute: () => apply(fromIndex, toIndex),
    undo: () => apply(toIndex, fromIndex), // Reverse the movement
    resourceId,
    resourceType,
  });
}

// =============================================================================
// Composite Actions
// =============================================================================

/**
 * Create a composite action that groups multiple changes as one undoable unit
 *
 * @example
 * ```tsx
 * const action = createCompositeAction({
 *   description: 'Create LAN network',
 *   actions: [
 *     { execute: () => createBridge(), undo: () => deleteBridge() },
 *     { execute: () => createDHCP(), undo: () => deleteDHCP() },
 *     { execute: () => createFirewall(), undo: () => deleteFirewall() },
 *   ],
 *   scope: 'global',
 * });
 * ```
 */
export function createCompositeAction(params: {
  description: string;
  actions: Array<{
    execute: () => void | Promise<void>;
    undo: () => void | Promise<void>;
  }>;
  scope?: ActionScope;
  resourceId?: string;
  resourceType?: string;
}): UndoableActionInput {
  const {
    description,
    actions,
    scope = 'global',
    resourceId,
    resourceType,
  } = params;

  return createUndoableAction({
    type: 'custom',
    description,
    scope,
    execute: async () => {
      // Execute all actions in order
      for (const action of actions) {
        await action.execute();
      }
    },
    undo: async () => {
      // Undo in reverse order
      for (let i = actions.length - 1; i >= 0; i--) {
        await actions[i].undo();
      }
    },
    resourceId,
    resourceType,
  });
}

// =============================================================================
// Change Set Integration
// =============================================================================

/**
 * Create an undoable action for a Change Set
 *
 * This integrates with the Change Set store (NAS-4.14) to treat
 * entire change sets as single undoable units.
 *
 * @example
 * ```tsx
 * import { useChangeSetStore } from '@nasnet/state/stores';
 *
 * const { markRolledBack, getChangeSet } = useChangeSetStore.getState();
 *
 * const action = createChangeSetAction({
 *   changeSetId: 'cs-123',
 *   changeSetName: 'Create LAN Network',
 *   onReapply: async () => {
 *     // Re-apply the change set (for redo)
 *     await applyChangeSet(changeSetId);
 *   },
 *   onRollback: async () => {
 *     // Mark as rolled back
 *     markRolledBack(changeSetId);
 *     // Optionally restore previous states from items
 *   },
 * });
 * ```
 */
export function createChangeSetAction(params: {
  changeSetId: string;
  changeSetName: string;
  onReapply: () => void | Promise<void>;
  onRollback: () => void | Promise<void>;
}): UndoableActionInput {
  const { changeSetId, changeSetName, onReapply, onRollback } = params;

  return createUndoableAction({
    type: 'changeset',
    description: changeSetName,
    scope: 'global',
    execute: onReapply,
    undo: onRollback,
    resourceId: changeSetId,
    resourceType: 'ChangeSet',
  });
}

// =============================================================================
// Batch Operations
// =============================================================================

/**
 * Execute multiple actions as a single batch
 * Only one undo entry is created for all actions
 *
 * @example
 * ```tsx
 * await executeBatch({
 *   description: 'Bulk delete interfaces',
 *   actions: interfaces.map(iface => ({
 *     execute: () => deleteInterface(iface.id),
 *     undo: () => restoreInterface(iface),
 *   })),
 * });
 * ```
 */
export async function executeBatch(params: {
  description: string;
  actions: Array<{
    execute: () => void | Promise<void>;
    undo: () => void | Promise<void>;
  }>;
  scope?: ActionScope;
  resourceType?: string;
}): Promise<string> {
  const compositeAction = createCompositeAction(params);
  return executeAction(compositeAction);
}

// =============================================================================
// Hooks for React Components
// =============================================================================

/**
 * Hook to get undo/redo capabilities for a specific field
 *
 * @example
 * ```tsx
 * function InterfaceNameInput({ value, onChange }) {
 *   const recordEdit = useFieldEdit({
 *     fieldName: 'name',
 *     resourceId: 'interface-1',
 *   });
 *
 *   const handleChange = (newValue: string) => {
 *     recordEdit(value, newValue, (v) => onChange(v));
 *   };
 *
 *   return <Input value={value} onChange={e => handleChange(e.target.value)} />;
 * }
 * ```
 */
export function useFieldEdit(params: {
  fieldName: string;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}) {
  const { pushAction } = useHistoryStore();
  const { fieldName, resourceId, resourceType, scope = 'page' } = params;

  return <T,>(
    oldValue: T,
    newValue: T,
    apply: (value: T) => void | Promise<void>
  ): string => {
    // Apply immediately
    apply(newValue);

    // Record in history
    return pushAction({
      type: 'edit',
      description: `Edit ${fieldName}`,
      scope,
      execute: () => apply(newValue),
      undo: () => apply(oldValue),
      resourceId,
      resourceType,
    });
  };
}
