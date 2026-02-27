# History & Undo/Redo Store

This document covers the undo/redo history system that enables users to reverse actions with
keyboard shortcuts.

**Source:**

- `libs/state/stores/src/history/types.ts`
- `libs/state/stores/src/history/history.store.ts`
- `libs/state/stores/src/history/command-utils.ts`
- `libs/state/stores/src/history/useHistoryShortcuts.ts`

## Overview

The history store provides:

- **Unlimited Undo/Redo**: Default max 50 actions (configurable)
- **Async Support**: Actions can be async (API calls, validations)
- **Scoped History**: Page-local and global action scopes with different persistence
- **Change Set Integration**: Entire change sets as single undo entries
- **Keyboard Shortcuts**: Cmd+Z/Ctrl+Z for undo, Cmd+Shift+Z/Ctrl+Y for redo
- **Notifications**: Toast notifications with redo action button
- **Command Pattern**: Factory functions for common operations

## History State and Types

### State Shape

```typescript
export interface HistoryState {
  // Stack of executed actions (oldest to newest)
  past: UndoableAction[];

  // Stack of undone actions (newest to oldest)
  future: UndoableAction[];
}
```

### UndoableAction Interface

```typescript
export interface UndoableAction {
  // Auto-generated unique ID (format: action-{timestamp}-{random})
  id: string;

  // Action type for categorization and icons
  type: 'edit' | 'delete' | 'create' | 'reorder' | 'changeset' | 'custom';

  // Human-readable description for UI and notifications
  // Examples: "Edit interface name", "Delete firewall rule"
  description: string;

  // When the action was executed
  timestamp: Date;

  // Scope determines persistence and lifecycle
  scope: 'page' | 'global';

  // Execute the action (for redo)
  execute: () => void | Promise<void>;

  // Undo the action (restore previous state)
  undo: () => void | Promise<void>;

  // Optional resource context
  resourceId?: string; // UUID of affected resource
  resourceType?: string; // Type for categorization (e.g., 'network.interface')
}
```

### Action Scopes

| Scope    | Persistence  | Lifecycle             | Use Cases                              |
| -------- | ------------ | --------------------- | -------------------------------------- |
| `page`   | None         | Cleared on navigation | Form edits, UI state changes           |
| `global` | localStorage | Survives page refresh | Router config changes, important edits |

### Non-Undoable Actions

Certain action categories should NOT be added to history:

```typescript
export const NON_UNDOABLE_CATEGORIES = [
  'applied-configuration', // Already sent to router
  'confirmed-delete', // User explicitly confirmed
  'security-change', // Password, certificate changes
  'authentication', // Logout, session changes
  'restart-required', // Service restart needed
  'external-integration', // External system actions
];

// Check before adding to history
if (isNonUndoableCategory(actionCategory)) {
  return; // Skip history
}
```

## History Store API

### State Shape in Store

```typescript
export const useHistoryStore = create<HistoryState & HistoryActions>()...
```

### Actions

| Action             | Signature                                 | Purpose                                     |
| ------------------ | ----------------------------------------- | ------------------------------------------- |
| `pushAction`       | `(action: UndoableActionInput) => string` | Add to past, clear future, return action ID |
| `undo`             | `() => Promise<boolean>`                  | Undo last, true if successful               |
| `redo`             | `() => Promise<boolean>`                  | Redo last undone, true if successful        |
| `jumpToIndex`      | `(index: number) => Promise<void>`        | Jump to specific point in past              |
| `clearHistory`     | `() => void`                              | Clear past and future                       |
| `clearPageHistory` | `() => void`                              | Clear only page-scoped actions              |

### Selectors

```typescript
selectCanUndo: (state) => state.past.length > 0;
selectCanRedo: (state) => state.future.length > 0;
selectLastAction: (state) => state.past[length - 1];
selectHistoryLength: (state) => state.past.length;
selectPastActions: (state) => state.past; // For history panel
selectFutureActions: (state) => state.future;
selectCurrentPosition: (state) => state.past.length - 1;
```

### Convenience Functions

```typescript
// Imperative API (outside React components)
await undoLast();
await redoLast();
pushHistoryAction(action);
clearAllHistory();
clearPageScopedHistory(); // Call on navigation

// State access
getHistoryState(); // Get state snapshot
subscribeHistoryState(callback); // Subscribe to changes
```

## Command Pattern Utilities

### Factory Functions

#### createUndoableAction()

Generic factory for creating actions:

```typescript
const action = createUndoableAction({
  type: 'edit',
  description: 'Edit interface name',
  scope: 'page',
  execute: () => setName(newName),
  undo: () => setName(oldName),
  resourceId: 'interface-ether1',
  resourceType: 'network.interface',
});
```

#### executeAction()

Execute action and auto-push to history:

```typescript
// Action executes immediately, then adds to history
const actionId = await executeAction({
  type: 'edit',
  description: 'Change interface IP',
  scope: 'page',
  execute: async () => await api.updateInterface(id, { ip: newIp }),
  undo: async () => await api.updateInterface(id, { ip: oldIp }),
});
```

### Common Pattern Helpers

#### createEditAction()

Single field change with old/new values:

```typescript
const action = createEditAction({
  fieldName: 'name',
  oldValue: 'ether1',
  newValue: 'WAN',
  apply: (value) => updateInterface({ name: value }),
  resourceId: 'interface-ether1',
  resourceType: 'network.interface',
  scope: 'page',
});
```

#### createDeleteAction()

Delete with restore capability:

```typescript
const action = createDeleteAction({
  itemName: 'Bridge interface',
  deletedItem: bridgeData,
  onDelete: async () => await api.deleteBridge(id),
  onRestore: async (item) => await api.createBridge(item),
  resourceId: 'bridge-1',
  resourceType: 'network.bridge',
  scope: 'global', // Global by default
});
```

#### createCreateAction()

Create with delete as undo:

```typescript
const action = createCreateAction({
  itemName: 'WireGuard peer',
  onCreate: async () => {
    const peer = await api.createPeer(config);
    return peer.id;
  },
  onDelete: async (id) => await api.deletePeer(id),
  resourceType: 'vpn.wireguard.peer',
  scope: 'global',
});
```

#### createReorderAction()

List item reordering:

```typescript
const action = createReorderAction({
  listName: 'Firewall rules',
  fromIndex: 2,
  toIndex: 0,
  apply: (from, to) => moveRule(from, to),
  resourceType: 'firewall.rule',
  scope: 'page',
});
```

### Composite and Batch Actions

#### createCompositeAction()

Group multiple changes as single undo unit:

```typescript
const action = createCompositeAction({
  description: 'Create LAN network',
  actions: [
    {
      execute: () => createBridge(),
      undo: () => deleteBridge(),
    },
    {
      execute: () => createDHCP(),
      undo: () => deleteDHCP(),
    },
    {
      execute: () => createFirewall(),
      undo: () => deleteFirewall(),
    },
  ],
  scope: 'global',
});

// Executes in order, undoes in reverse order
```

#### executeBatch()

Execute multiple actions as single history entry:

```typescript
await executeBatch({
  description: 'Bulk delete interfaces',
  actions: interfaces.map((iface) => ({
    execute: () => deleteInterface(iface.id),
    undo: () => restoreInterface(iface),
  })),
  scope: 'global',
});
```

### Change Set Integration

Treat entire change sets as single undo entries:

```typescript
import { useChangeSetStore } from '@nasnet/state/stores';

const action = createChangeSetAction({
  changeSetId: 'cs-123',
  changeSetName: 'Create LAN Network',
  onReapply: async () => {
    // Re-apply the change set (for redo)
    await applyChangeSet(changeSetId);
  },
  onRollback: async () => {
    // Mark as rolled back
    const { markRolledBack } = useChangeSetStore.getState();
    markRolledBack(changeSetId);
  },
});

// Now entire changeset is one undoable unit
await executeAction(action);
```

### React Hook: useFieldEdit()

Hook for tracking field edits in forms:

```typescript
function InterfaceNameInput({ value, onChange }) {
  const recordEdit = useFieldEdit({
    fieldName: 'name',
    resourceId: 'interface-1',
    resourceType: 'network.interface',
    scope: 'page',
  });

  const handleChange = (newValue: string) => {
    // Record before applying
    recordEdit(value, newValue, (v) => onChange(v));
  };

  return (
    <Input value={value} onChange={e => handleChange(e.target.value)} />
  );
}
```

## Keyboard Shortcuts Integration

The `useHistoryShortcuts()` hook registers undo/redo shortcuts:

```typescript
function App() {
  useHistoryShortcuts();  // Call once at app root
  return <RouterProvider router={router} />;
}

// Automatically registers:
// - Cmd+Z / Ctrl+Z → undo
// - Cmd+Shift+Z / Ctrl+Y → redo (Windows)
```

### Shortcut Behavior

```typescript
// Undo notification with redo action
if (success) {
  notification({
    type: 'info',
    title: `Undone: ${lastAction.description}`,
    duration: 10000,
    action: {
      label: 'Redo',
      onClick: async () => await redoLast(),
    },
  });
}

// Redo notification
notification({
  type: 'info',
  title: `Redone: ${actionToRedo.description}`,
  duration: 4000,
});
```

## Persistence Model

### Stored Actions

Only **global-scope** actions are persisted to localStorage:

```typescript
// In partialize middleware
partialize: (state) => ({
  past: state.past
    .filter((a) => a.scope === 'global')
    .map(serializeAction),
  future: state.future
    .filter((a) => a.scope === 'global')
    .map(serializeAction),
}),
```

### Serialization

Functions cannot be persisted, so only metadata is stored:

```typescript
interface SerializedAction {
  id: string;
  type: UndoableAction['type'];
  description: string;
  timestamp: string; // ISO string
  scope: UndoableAction['scope'];
  resourceId?: string;
  resourceType?: string;
  // execute/undo functions are LOST
}
```

### Rehydration Limitations

After page refresh, persisted actions show in history but cannot execute:

```typescript
// On rehydration, provide no-op functions
execute: () => {
  console.warn('[history-store] Cannot re-execute persisted action');
},
undo: () => {
  console.warn('[history-store] Cannot undo persisted action');
},
```

**Implication**: Full undo/redo requires keeping execute/undo functions in memory. Use global scope
only for display purposes or re-register actions on mount.

## State Flow Diagram

```
         ┌─────────────────────────┐
         │   Push New Action       │
         └────────────┬────────────┘
                      │
                      ▼
              ┌──────────────────┐
              │ past ← action    │
              │ future.clear()   │
              └────────────┬─────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌──────────────┐     ┌──────────────┐
        │   Undo()     │     │   Redo()     │
        │ past.pop()   │     │ future.pop() │
        │ future.push()│     │ past.push()  │
        └──────┬───────┘     └──────┬───────┘
               │                    │
               └──────┬─────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │ Execute action.undo()  │
          │ or action.execute()    │
          └────────────┬───────────┘
                       │
                ┌──────┴──────┐
           async         sync │
              │                │
              ▼                ▼
         (awaited)       (immediate)
```

## Interaction with Change Sets

The change set store (NAS-4.14) produces UndoableActions for the history system:

```
Change Set (NAS-4.14)
       │
       ├─ Item 1: CREATE bridge
       ├─ Item 2: CREATE DHCP
       └─ Item 3: CREATE firewall
              │
              ▼
    [Apply-Confirm-Merge]
    (Docs/architecture/data-architecture.md)
              │
              ▼
    createChangeSetAction()  ← Creates single undo entry
              │
              ▼
    useHistoryStore.pushAction()
              │
              ▼
    User can now Ctrl+Z to undo entire changeset
```

## Limitations and Edge Cases

1. **Persisted Actions Cannot Undo**: After page refresh, execute/undo are no-ops

   - **Solution**: Design persistence around config snapshots, not action replay

2. **Async Errors**: If undo/redo throws, action isn't moved to other stack

   - **Solution**: Retry UI, manual intervention, error logging

3. **Memory Overhead**: 50 actions × complex state can exceed memory on slow devices

   - **Solution**: Adjust MAX_ACTIONS constant for resource-constrained environments

4. **Change Set Rollbacks**: If change set fails, history still contains successful items
   - **Solution**: Use composite action to ensure all-or-nothing with change sets

## Best Practices

1. **Use Scopes Correctly**: Global only for important user changes (config edits), page for temp UI
   state
2. **Avoid Circular Dependencies**: Action A undoes to state B, but action B redoes to state A →
   infinite loop
3. **Keep Descriptions Clear**: Used in notifications and history panel
4. **Use Resource IDs**: Help correlate actions to affected resources
5. **Test with Async**: API calls may fail; test both success and error paths
6. **Consider Granularity**: Batch small changes (e.g., form fields) as single action
7. **Disable on Destructive Routes**: Some pages (delete confirmation) shouldn't have undo
8. **Test Persistence**: Verify global actions survive page refresh (even if execution fails)

## Related Documentation

- **Change Set Store**: `change-set.md` - Integration with multi-resource operations
- **Command Palette**: `command-shortcut.md` - Keyboard shortcut binding
- **Core State Architecture**: `overview.md` - Zustand patterns
- **Apply-Confirm-Merge Flow**:
  `../../architecture/data-architecture.md#state-flow-apply--confirm--merge`
