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
import type { UndoableActionInput, ActionScope } from './types';
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
export declare function createUndoableAction(params: UndoableActionInput): UndoableActionInput;
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
export declare function executeAction(action: UndoableActionInput): Promise<string>;
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
export declare function createEditAction<T>(params: {
  fieldName: string;
  oldValue: T;
  newValue: T;
  apply: (value: T) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput;
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
export declare function createDeleteAction<T>(params: {
  itemName: string;
  deletedItem: T;
  onDelete: () => void | Promise<void>;
  onRestore: (item: T) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput;
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
export declare function createCreateAction<TId = string>(params: {
  itemName: string;
  onCreate: () => TId | Promise<TId>;
  onDelete: (id: TId) => void | Promise<void>;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput;
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
export declare function createReorderAction(params: {
  listName: string;
  fromIndex: number;
  toIndex: number;
  apply: (fromIndex: number, toIndex: number) => void | Promise<void>;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): UndoableActionInput;
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
export declare function createCompositeAction(params: {
  description: string;
  actions: Array<{
    execute: () => void | Promise<void>;
    undo: () => void | Promise<void>;
  }>;
  scope?: ActionScope;
  resourceId?: string;
  resourceType?: string;
}): UndoableActionInput;
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
export declare function createChangeSetAction(params: {
  changeSetId: string;
  changeSetName: string;
  onReapply: () => void | Promise<void>;
  onRollback: () => void | Promise<void>;
}): UndoableActionInput;
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
export declare function executeBatch(params: {
  description: string;
  actions: Array<{
    execute: () => void | Promise<void>;
    undo: () => void | Promise<void>;
  }>;
  scope?: ActionScope;
  resourceType?: string;
}): Promise<string>;
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
export declare function useFieldEdit(params: {
  fieldName: string;
  resourceId?: string;
  resourceType?: string;
  scope?: ActionScope;
}): <T>(oldValue: T, newValue: T, apply: (value: T) => void | Promise<void>) => string;
//# sourceMappingURL=command-utils.d.ts.map
