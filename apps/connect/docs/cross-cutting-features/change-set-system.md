# Change Set System

The change set system provides atomic multi-resource operations for router configuration. Instead of
applying one resource at a time, you batch multiple changes together, validate them, apply in
dependency order, and automatically roll back if anything fails.

**Key files:**

- `libs/state/machines/src/changeSetMachine.ts` — XState machine (orchestration)
- `libs/state/stores/src/change-set/change-set.store.ts` — Zustand store (data management)
- `libs/api-client/queries/src/change-set/` — GraphQL hooks

**Cross-references:**

- See `../state-management/xstate-machines.md` for XState patterns
- See `../data-fetching/graphql-hooks.md` for query patterns

---

## Overview

A **change set** is a named collection of resource operations (CREATE, UPDATE, DELETE) that apply
together atomically. If step 4 of 6 fails, steps 1-3 are rolled back in reverse order. The UI shows
real-time progress during apply.

This is used whenever configuration involves multiple interdependent resources — e.g., creating a
LAN bridge requires a bridge interface, a VLAN, address assignments, and firewall rules in a
specific order.

---

## State Machine (XState)

The `createChangeSetMachine` factory (from `changeSetMachine.ts`) returns an XState v5 machine with
10 states:

```
idle
  │  LOAD → loadChangeSet action
  │  START_VALIDATION
  ▼
validating  ──── CANCEL ──→ cancelled
  │ success (no errors)
  ▼
ready ──── APPLY (guard: canApply) ──→ applying
  │
  ├── applying.applyingItem  [invoke: applyCurrentItem]
  │     │ onDone → checkingMore
  │     │ onError → rollingBack
  │
  └── applying.checkingMore
        ├── [guard: isCancelled] → cancelled
        ├── [guard: hasMoreItems] → applyingItem (nextItem action)
        └── [guard: noMoreItems] → completed (final)

rollingBack  [invoke: executeRollback]
  ├── [some steps failed] → partialFailure (final)
  └── [all rolled back]   → rolledBack (final)

failed
  ├── RETRY → validating
  ├── FORCE_ROLLBACK (guard: hasAppliedItems) → rollingBack
  └── RESET → idle

partialFailure (final) — manual intervention required
cancelled (final)
  ├── FORCE_ROLLBACK → rollingBack
  └── RESET → idle
```

### Machine Context

```typescript
interface ChangeSetMachineContext {
  changeSet: ChangeSet | null;
  routerId: string | null;
  validationResult: ChangeSetValidationResult | null;
  currentItemIndex: number;
  sortedItems: ChangeSetItem[]; // Topologically sorted
  appliedItems: ChangeSetItem[]; // Successfully applied so far
  rollbackPlan: RollbackStep[]; // Grows during apply (prepended, so reverse order)
  error: ChangeSetError | null;
  cancelRequested: boolean;
  applyStartedAt: number | null;
}
```

### Machine Events

| Event              | From States                 | Description                                |
| ------------------ | --------------------------- | ------------------------------------------ |
| `LOAD`             | idle                        | Load a change set and router ID            |
| `START_VALIDATION` | idle                        | Begin validation                           |
| `APPLY`            | ready                       | Begin applying (requires `canApply` guard) |
| `CANCEL`           | validating, ready, applying | Cancel (stops at next safe point)          |
| `RETRY`            | failed                      | Re-run validation                          |
| `FORCE_ROLLBACK`   | failed, cancelled           | Force rollback of already-applied items    |
| `RESET`            | ready, failed, cancelled    | Clear state and return to idle             |

### Usage

```typescript
import { createChangeSetMachine } from '@nasnet/state/machines';
import { useActor } from 'xstate';

const machine = createChangeSetMachine({
  validateChangeSet: async (changeSet) => {
    const result = await client.mutate({ mutation: VALIDATE_CHANGE_SET, variables: { changeSet } });
    return result.data.validation;
  },
  applyItem: async ({ item, routerId }) => {
    const result = await client.mutate({
      mutation: APPLY_RESOURCE,
      variables: { routerId, resourceType: item.resourceType, config: item.configuration },
    });
    return { confirmedState: result.data.confirmedState, resourceUuid: result.data.resourceUuid };
  },
  rollbackItem: async ({ rollbackStep, routerId }) => {
    await client.mutate({ mutation: ROLLBACK_RESOURCE, variables: { routerId, ...rollbackStep } });
  },
  onComplete: (cs) => toast.success(`Applied ${cs.items.length} changes`),
  onFailed: (err) => toast.error(err.message),
});

const [state, send] = useActor(machine);

// Start flow
send({ type: 'LOAD', changeSet, routerId });
send({ type: 'START_VALIDATION' });

// After machine reaches 'ready'
send({ type: 'APPLY' });
```

---

## Zustand Store

The `useChangeSetStore` (from `change-set.store.ts`) manages data: creating, updating, and querying
change sets. The machine handles orchestration; the store handles persistence.

### Store Structure

```typescript
interface ChangeSetState {
  changeSets: Record<string, ChangeSet>; // All active change sets by ID
  activeChangeSetId: string | null; // Currently focused change set
  applyingChangeSetIds: string[]; // Optimistic UI tracking
  lastError: string | null;
}
```

### Persistence

Only `DRAFT` and `READY` change sets survive page refresh (persisted to `localStorage` under key
`nasnet-change-sets`). Completed, failed, rolled-back, and cancelled change sets are excluded from
persistence.

### Key Actions

```typescript
const store = useChangeSetStore();

// Create a new change set
const id = store.createChangeSet({
  name: 'Create LAN Network',
  routerId: 'router-123',
  source: 'lan-wizard',
});

// Add items (only works when status is DRAFT)
store.addItem(id, {
  name: 'Bridge Interface',
  resourceType: 'network.bridge',
  operation: 'CREATE',
  configuration: { name: 'bridge-lan', vlan: 100 },
  dependencies: [],
});

// Recalculate apply order (called automatically after addItem)
store.recalculateApplyOrder(id);

// Lifecycle transitions
store.markApplying(id); // DRAFT → APPLYING
store.markCompleted(id); // APPLYING → COMPLETED
store.markFailed(id, 'timeout', 'item-xyz'); // APPLYING → FAILED
store.markRolledBack(id); // FAILED → ROLLED_BACK
```

### Selectors

```typescript
// Select active change set
const activeCs = useChangeSetStore(selectActiveChangeSet);

// Select all change sets for a router
const routerCs = useChangeSetStore(createSelectChangeSetsForRouter('router-123'));

// Select draft change sets for a router
const drafts = useChangeSetStore(createSelectDraftChangeSets('router-123'));

// Check if any change set is applying
const isApplying = useChangeSetStore(selectIsAnyApplying);
```

---

## Dependency Ordering (Topological Sort)

Items in a change set may depend on each other. For example, a firewall rule can't be created before
the address list it references.

The `sortItemsByDependency` function inside `changeSetMachine.ts` uses `buildDependencyGraph` and
`topologicalSort` from `@nasnet/core/utils`:

```typescript
function sortItemsByDependency(items: ChangeSetItem[]): ChangeSetItem[] {
  const nodes = buildDependencyGraph(items);
  const result = topologicalSort(nodes);

  if (!result.success) {
    // Cycle detected — validation should have caught this
    return items; // fall back to original order
  }

  const itemMap = new Map(items.map((item) => [item.id, item]));
  return result.sortedIds.map((id) => itemMap.get(id)!).filter(Boolean);
}
```

If a cycle is detected during validation, `validationResult.errors` will contain a cycle error and
`canApply` will be false.

---

## Rollback Plan

The rollback plan is built as items are applied. Each newly applied item is **prepended** to the
rollback plan (index 0), so the plan is always in reverse apply order:

| Apply Order | Item                 | Rollback Operation |
| ----------- | -------------------- | ------------------ |
| 1           | Create bridge        | DELETE bridge      |
| 2           | Create VLAN          | DELETE VLAN        |
| 3 (failed)  | Create firewall rule | (never applied)    |

Rollback executes in stored order: DELETE VLAN first, then DELETE bridge.

Rollback operations by original operation:

- `CREATE` → `DELETE`
- `UPDATE` → `REVERT` (restore `previousState`)
- `DELETE` → `RESTORE` (restore `previousState`)

---

## Change Set Statuses

```typescript
const ChangeSetStatus = {
  DRAFT: 'DRAFT', // Editable, not yet validated
  READY: 'READY', // Validated, awaiting user confirmation
  APPLYING: 'APPLYING', // Apply in progress (read-only)
  COMPLETED: 'COMPLETED', // All items applied successfully
  FAILED: 'FAILED', // Apply failed (may have partially applied)
  ROLLING_BACK: 'ROLLING_BACK',
  ROLLED_BACK: 'ROLLED_BACK',
  CANCELLED: 'CANCELLED',
};
```

Only `DRAFT` change sets can have items added, updated, or removed.

---

## Progress Events

The machine emits `ChangeSetProgressEvent` via the `onProgress` callback during apply:

```typescript
interface ChangeSetProgressEvent {
  changeSetId: string;
  status: 'validating' | 'applying' | 'completed' | 'rolling_back' | 'failed';
  currentItem: { id: string; name: string; index: number } | null;
  appliedCount: number;
  totalCount: number;
  progressPercent: number;
  error: string | null;
}
```

Use this to drive a progress bar UI. The `progressPercent` is `(appliedCount / totalCount) * 100`.

---

## Helper Functions

From `changeSetMachine.ts`:

```typescript
// Check if in an active processing state
isChangeSetProcessing(state); // true during validating, rollingBack, or applying

// Check if in a terminal state
isChangeSetFinal(state); // true for completed, rolledBack, failed, partialFailure, cancelled

// Check if cancellation is available
isChangeSetCancellable(state); // true for validating, ready, applying

// Human-readable description
getChangeSetMachineStateDescription(state); // e.g., 'Applying changes...'
```

---

## Error Handling

When an item fails:

```typescript
interface ChangeSetError {
  message: string;
  failedItemId: string;
  partiallyAppliedItemIds: string[]; // Items that were applied before failure
  failedRollbackItemIds: string[]; // Items that failed to roll back
  requiresManualIntervention: boolean; // true if rollback also failed
}
```

If `requiresManualIntervention` is true, the machine reaches `partialFailure` (a final state). The
UI must show the user exactly which resources need manual cleanup, with the `failedRollbackItemIds`
list.
