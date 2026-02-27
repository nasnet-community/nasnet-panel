# Change Set Store

This document covers the change set store that manages atomic multi-resource operations and their execution flow.

**Source:**
- `libs/state/stores/src/change-set/change-set.store.ts`

## Overview

The change set store provides:

- **Multi-Resource Operations**: Atomic changes to multiple resources
- **Dependency Tracking**: Topological ordering ensures correct apply sequence
- **Status Management**: DRAFT → READY → APPLYING → COMPLETED/FAILED/ROLLED_BACK
- **Validation**: Pre-apply validation and dependency cycle detection
- **Rollback Planning**: Automatic reverse operations for failed applies
- **Session Persistence**: Survives page refresh (draft change sets only)

## Change Set Types

### ChangeSet Interface

```typescript
interface ChangeSet {
  // Unique identifier
  id: string;

  // Display name (e.g., "Create LAN Network")
  name: string;

  // Optional description
  description?: string;

  // Router this change set applies to
  routerId: string;

  // Items in this change set
  items: ChangeSetItem[];

  // Current status
  status: ChangeSetStatus;

  // Validation results before apply
  validation: {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  } | null;

  // For failed applies, instructions to recover
  rollbackPlan: string[];

  // Error info if apply failed
  error: {
    message: string;
    failedItemId: string;
    partiallyAppliedItemIds: string[];
    failedRollbackItemIds: string[];
    requiresManualIntervention: boolean;
  } | null;

  // Timestamps
  createdAt: Date;
  applyStartedAt: Date | null;
  completedAt: Date | null;

  // Source (e.g., 'lan-wizard', 'manual-edit')
  source?: string;

  // Version for optimistic concurrency
  version: number;
}
```

### ChangeSetStatus Enum

```typescript
export enum ChangeSetStatus {
  DRAFT = 'DRAFT',               // Initial state, editable
  READY = 'READY',               // Validated, ready to apply
  APPLYING = 'APPLYING',         // Currently applying items
  COMPLETED = 'COMPLETED',       // All items applied successfully
  FAILED = 'FAILED',             // Apply failed, partial rollback
  ROLLING_BACK = 'ROLLING_BACK', // Undoing partial apply
  ROLLED_BACK = 'ROLLED_BACK',   // All changes undone
  CANCELLED = 'CANCELLED',       // User cancelled before apply
}
```

### ChangeSetItem Interface

```typescript
interface ChangeSetItem {
  // Unique ID within change set
  id: string;

  // Resource type (e.g., 'network.bridge', 'vpn.wireguard')
  resourceType: string;

  // Resource category (e.g., 'network', 'vpn')
  resourceCategory: string;

  // UUID of resource (if updating existing)
  resourceUuid?: string;

  // Display name
  name: string;

  // Optional description
  description?: string;

  // Operation type
  operation: 'CREATE' | 'UPDATE' | 'DELETE';

  // New configuration (for CREATE/UPDATE)
  configuration: unknown;

  // Previous configuration (for UPDATE/DELETE, used in rollback)
  previousState?: unknown;

  // IDs of items this depends on (must apply first)
  dependencies: string[];

  // Current status
  status: ChangeSetItemStatus;

  // Error message if apply failed
  error: string | null;

  // Timestamps
  applyStartedAt: Date | null;
  applyCompletedAt: Date | null;

  // State confirmed from router after successful apply
  confirmedState: unknown | null;

  // Order in which to apply (computed from dependencies)
  applyOrder: number;
}
```

### ChangeSetItemStatus Enum

```typescript
export type ChangeSetItemStatus =
  | 'PENDING'       // Waiting to apply
  | 'APPLYING'      // Currently applying
  | 'APPLIED'       // Successfully applied
  | 'FAILED'        // Apply failed
  | 'ROLLED_BACK';  // Undone during rollback
```

## Store State and Actions

### State Shape

```typescript
export interface ChangeSetState {
  // Map of change set ID → change set (JSON serializable for persistence)
  changeSets: Record<string, ChangeSet>;

  // Currently selected change set (for UI focus)
  activeChangeSetId: string | null;

  // IDs of change sets currently applying
  applyingChangeSetIds: string[];

  // Last error message for display
  lastError: string | null;
}
```

### Lifecycle Actions

| Action | Purpose |
|--------|---------|
| `createChangeSet({name, description, routerId, source})` | Create draft change set, return ID |
| `getChangeSet(id)` | Get by ID or null |
| `getChangeSetsForRouter(routerId)` | Get all for a router |
| `deleteChangeSet(id)` | Delete (fails if applying) |
| `setActiveChangeSet(id \| null)` | Set UI focus |

### Item Management Actions

| Action | Purpose |
|--------|---------|
| `addItem(changeSetId, item)` | Add item, recalculate apply order |
| `updateItem(changeSetId, itemId, updates)` | Update fields, recalculate if deps change |
| `removeItem(changeSetId, itemId)` | Remove item and its dependent references |
| `setItemDependencies(changeSetId, itemId, deps)` | Update dependencies, recalculate order |

### Status Update Actions

| Action | Purpose |
|--------|---------|
| `updateStatus(id, status)` | Update change set status |
| `updateItemStatus(id, itemId, status, error?)` | Update item status + timestamps |
| `markApplying(id)` | Set to APPLYING, record start time |
| `markCompleted(id)` | Set to COMPLETED, record end time |
| `markFailed(id, error, failedItemId)` | Mark failed, store error info |
| `markRolledBack(id)` | Mark as ROLLED_BACK, update applied items |

### Utility Actions

| Action | Purpose |
|--------|---------|
| `recalculateApplyOrder(id)` | Recompute order from dependencies |
| `getChangeSetSummary(id)` | Get summary for list views |
| `getAllSummaries(routerId)` | Get summaries for all change sets |
| `clearCompleted(routerId?)` | Remove completed/failed/rolled back |
| `clearError()` | Clear lastError |
| `reset()` | Clear all state (testing) |

## Dependency Management

### Dependency Graph and Topological Ordering

Changes are applied in dependency order to ensure prerequisites are met:

```typescript
// Example: Create LAN network requires bridge before DHCP
const items = [
  {
    id: 'item-1',
    name: 'Bridge Interface',
    operation: 'CREATE',
    dependencies: [],           // No dependencies, apply first
    applyOrder: 0,
  },
  {
    id: 'item-2',
    name: 'DHCP Configuration',
    operation: 'CREATE',
    dependencies: ['item-1'],   // Depends on bridge
    applyOrder: 1,
  },
  {
    id: 'item-3',
    name: 'Firewall Rules',
    operation: 'CREATE',
    dependencies: ['item-1'],   // Also depends on bridge
    applyOrder: 1,              // Can apply in parallel with item-2
  },
];
```

### buildDependencyGraph()

Converts dependency list to graph structure:

```typescript
const nodes = buildDependencyGraph([
  { id: 'item-1', dependencies: [] },
  { id: 'item-2', dependencies: ['item-1'] },
  { id: 'item-3', dependencies: ['item-1'] },
]);

// Returns graph with parent/child relationships
// Detects cycles (error if found)
```

### computeApplyOrder()

Topological sort to determine apply sequence:

```typescript
const orderMap = computeApplyOrder(nodes);
// Returns Map<itemId, applyOrder>

// orderMap.get('item-1') → 0 (apply first)
// orderMap.get('item-2') → 1 (apply after item-1)
// orderMap.get('item-3') → 1 (apply after item-1, parallel with item-2)
```

Automatic recalculation on:
- Item added
- Dependencies updated
- Item removed
- Item moved

## Create Change Set Workflow

### 1. Create Draft

```typescript
const { createChangeSet, addItem } = useChangeSetStore();

const csId = createChangeSet({
  name: 'Create LAN Network',
  description: 'Set up new LAN with bridge, DHCP, and firewall',
  routerId: 'router-123',
  source: 'lan-wizard',
});
```

### 2. Add Items

```typescript
// Add bridge first (no dependencies)
const itemId1 = addItem(csId, {
  resourceType: 'network.bridge',
  resourceCategory: 'network',
  name: 'LAN Bridge',
  operation: 'CREATE',
  configuration: { name: 'bridge-lan', ports: ['ether2', 'ether3'] },
  dependencies: [],
});

// Add DHCP (depends on bridge)
const itemId2 = addItem(csId, {
  resourceType: 'dhcp.server',
  resourceCategory: 'network',
  name: 'DHCP Configuration',
  operation: 'CREATE',
  configuration: { ... },
  dependencies: [itemId1],
});

// Add firewall (also depends on bridge)
const itemId3 = addItem(csId, {
  resourceType: 'firewall.rules',
  resourceCategory: 'firewall',
  name: 'Firewall Rules',
  operation: 'CREATE',
  configuration: { ... },
  dependencies: [itemId1],
});
```

### 3. Edit Before Apply

```typescript
const { updateItem, setItemDependencies } = useChangeSetStore();

// Edit DHCP configuration
updateItem(csId, itemId2, {
  configuration: { ...newConfig },
  description: 'Updated DHCP range',
});

// Add new dependency
setItemDependencies(csId, itemId3, [itemId1, itemId2]);
// Now firewall applies after DHCP
```

### 4. Validate and Mark Ready

```typescript
// Validation happens before apply (not in store)
// Application code:
const validation = await validateChangeSet(changeSet);

if (validation.isValid) {
  updateStatus(csId, ChangeSetStatus.READY);
} else {
  // Show validation errors to user
  console.error(validation.errors);
}
```

### 5. Apply (via state machine, not store)

The `changeSetMachine` (XState) orchestrates apply flow:

```
DRAFT → READY → APPLYING → COMPLETED/FAILED → ROLLED_BACK
```

During APPLYING:
1. `markApplying(csId)` sets status and start time
2. Apply each item in `applyOrder` sequence
3. `updateItemStatus(csId, itemId, 'APPLIED')` on success
4. `updateItemStatus(csId, itemId, 'FAILED', error)` on failure
5. On first failure: `markFailed(csId, error, failedItemId)`
6. Rollback partial changes: `markRolledBack(csId)`

See `changeSetMachine` documentation for full flow.

## Persistence Model

### Storage

Only draft and ready change sets are persisted to localStorage:

```typescript
partialize: (state) => ({
  changeSets: Object.fromEntries(
    Object.entries(state.changeSets).filter(
      ([, cs]) => cs.status === CS.DRAFT || cs.status === CS.READY
    )
  ),
  activeChangeSetId: state.activeChangeSetId,
}),
```

**Rationale**: Applied/failed change sets are historical; draft/ready are work-in-progress.

### Rehydration

On app load, draft change sets are restored:

```typescript
// Draft change set from last session is available
const draftCS = getChangeSet(previousCsId);
if (draftCS) {
  // User can continue editing or apply
}
```

## Summary for Display

Get concise info for lists without full change set:

```typescript
interface ChangeSetSummary {
  id: string;
  name: string;
  status: ChangeSetStatus;
  operationCounts: { create: number; update: number; delete: number };
  totalItems: number;
  createdAt: Date;
  hasErrors: boolean;
  hasWarnings: boolean;
}

const summary = getChangeSetSummary(csId);
// Use in list views, progress displays
```

Example display:

```
┌─ Create LAN Network ────────────┐
│ Status: READY                   │
│ 3 items: 2 CREATE, 0 UPDATE, 0 DELETE
│ Created: 2024-01-15 10:30 AM    │
│ Warnings: ⚠️ 2                   │
└─────────────────────────────────┘
```

## Operation Counts

```typescript
function getOperationCounts(
  items: ChangeSetItem[]
): { create: number; update: number; delete: number }
```

Useful for summary displays and validation rules.

## Usage Example

```tsx
function ChangeSetEditor({ changeSetId }) {
  const {
    getChangeSet,
    addItem,
    updateItem,
    removeItem,
    recalculateApplyOrder,
  } = useChangeSetStore();

  const changeSet = getChangeSet(changeSetId);
  if (!changeSet) return null;

  const handleAddItem = async (itemData) => {
    const itemId = addItem(changeSetId, itemData);
    // Order auto-recalculated
  };

  const handleUpdateDependencies = (itemId, newDeps) => {
    setItemDependencies(changeSetId, itemId, newDeps);
    // Order auto-recalculated
  };

  return (
    <div>
      <h2>{changeSet.name}</h2>
      <p>Status: {changeSet.status}</p>

      <ItemsList items={changeSet.items} />

      <DependencyGraph items={changeSet.items} />

      {changeSet.validation?.errors && (
        <ErrorBanner errors={changeSet.validation.errors} />
      )}
    </div>
  );
}
```

## Integration with XState Machine

The change set store is the **data layer**; `changeSetMachine` (XState) is the **orchestration layer**:

```
┌──────────────────────┐
│ Change Set Store     │ ← Manages data, status, items
│ (Zustand)            │
└──────────┬───────────┘
           │ mutates
           ▼
┌──────────────────────┐
│ Change Set Machine   │ ← Orchestrates apply flow
│ (XState)             │   Transitions states
└──────────┬───────────┘
           │ calls
           ▼
┌──────────────────────┐
│ GraphQL API          │ ← Applies changes to router
│ (Apollo Client)      │
└──────────────────────┘
```

See `changeSetMachine` documentation (Agent 4) for complete orchestration details.

## Conflict Detection

Before applying, check for conflicts:

```typescript
// Application code
function validateChangeSet(changeSet: ChangeSet) {
  const errors: string[] = [];

  // Cycle detection
  const hasCycle = detectDependencyCycle(changeSet.items);
  if (hasCycle) {
    errors.push('Circular dependencies detected');
  }

  // Resource conflicts
  const conflicts = findResourceConflicts(changeSet.items);
  if (conflicts.length > 0) {
    errors.push(`Resource conflicts: ${conflicts.join(', ')}`);
  }

  // Validation errors from backend
  const validation = await validateWithBackend(changeSet);
  if (!validation.isValid) {
    errors.push(...validation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: validation.warnings,
  };
}
```

## Best Practices

1. **Always Set Dependencies**: Don't rely on apply order; explicit dependencies make intent clear
2. **Batch Related Changes**: Group logically related operations in one change set
3. **Test Before Apply**: Validate with backend before marking READY
4. **Display Dependency Graph**: Show users the execution order
5. **Handle Partial Failures**: Plan rollback for each item
6. **Use Meaningful Names**: Help users understand what each change set does
7. **Clear Completed**: Don't accumulate old change sets; archive or delete
8. **Atomic Operations**: Don't break large operations into multiple change sets if they should be all-or-nothing
9. **Document Rollback Plan**: Include steps to recover if apply fails

## Related Documentation

- **Change Set Machine**: (Agent 4 documentation) - XState orchestration of apply flow
- **Undo/Redo Integration**: `history-undo-redo.md` - Change sets as history entries
- **Drift Detection**: `drift-detection.md` - Monitor after apply
- **Apply-Confirm-Merge**: `../../architecture/data-architecture.md#state-flow-apply--confirm--merge`
- **Data Architecture**: `../../architecture/data-architecture.md` - 8-layer model context
