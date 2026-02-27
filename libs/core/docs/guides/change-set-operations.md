# Change Set Operations: Atomic Multi-Resource Transactions

**Reference:** ADR-012, FR-STM-013 | `libs/core/types/src/resource/change-set.ts` |
`libs/core/utils/src/graph/dependency-graph.ts`

## Table of Contents

- [Problem Statement](#problem-statement)
- [Change Set Lifecycle](#change-set-lifecycle)
- [Change Set Structure](#change-set-structure)
- [Dependency Graph](#dependency-graph)
- [Parallel Execution](#parallel-execution)
- [Rollback Mechanism](#rollback-mechanism)
- [Cycle Detection](#cycle-detection)
- [Conflict Detection](#conflict-detection)
- [Practical Examples](#practical-examples)

---

## Problem Statement

Creating a LAN network requires multiple coordinated operations:

1. Create bridge interface
2. Add physical ports to bridge
3. Create DHCP server on bridge
4. Create firewall rules for the bridge
5. Set up routing policies

If step 2 fails, we're left with a bridge that doesn't work. If step 4 fails after step 3, we have a
DHCP server without firewall protection.

**Problem:** These operations depend on each other. We need:

- **All or nothing** - Either all succeed or all rollback
- **Correct order** - Dependencies run first
- **Parallel where possible** - Steps 2, 3, 4 can run in parallel (all depend on 1)
- **Automatic rollback** - If step 4 fails, undo steps 1-3 in reverse order
- **Failure tracking** - Know exactly what failed and what was rolled back

**Solution:** Change sets provide atomic transactions for multi-resource operations.

---

## Change Set Lifecycle

Change sets progress through well-defined states.

```
┌──────────────────────────────────────────────────────────┐
│ State: DRAFT                                             │
│ ├─ User adds items to change set                         │
│ ├─ Can add, remove, edit items freely                    │
│ └─ Transitions to: VALIDATING                            │
└──────────────┬───────────────────────────────────────────┘
               │ user.validate()
               ▼
┌──────────────────────────────────────────────────────────┐
│ State: VALIDATING                                        │
│ ├─ Running full validation pipeline on all items         │
│ ├─ Checking dependencies, conflicts, platform support   │
│ └─ Transitions to: READY or DRAFT (if errors)           │
└──────────────┬───────────────────────────────────────────┘
               │ validation passed
               ▼
┌──────────────────────────────────────────────────────────┐
│ State: READY                                             │
│ ├─ Validation passed, safe to apply                      │
│ ├─ Depends shown, ready for execution                    │
│ └─ Transitions to: APPLYING or DRAFT (if cancelled)      │
└──────────────┬───────────────────────────────────────────┘
               │ user.apply()
               ▼
┌──────────────────────────────────────────────────────────┐
│ State: APPLYING                                          │
│ ├─ Applying items in dependency order                    │
│ ├─ Posting progress events for UI updates                │
│ └─ Transitions to: COMPLETED, FAILED, or ROLLING_BACK    │
└──────────────┬───────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼ (success)     ▼ (error)
    COMPLETED      ROLLING_BACK (auto)
       │               │
       └───────┬───────┘
               ▼
         ┌──────────────────────────────────────────────────┐
         │ Final State (No More Changes)                    │
         ├─ COMPLETED - all items applied                   │
         ├─ FAILED - apply failed, not rolled back          │
         ├─ ROLLED_BACK - apply failed, successfully rolled │
         ├─ PARTIAL_FAILURE - rollback itself failed        │
         │  (requires manual intervention)                  │
         └─ CANCELLED - user cancelled before apply         │
         └──────────────────────────────────────────────────┘
```

### Status Helpers

```typescript
import {
  isChangeSetPending,
  isChangeSetProcessing,
  isChangeSetFinal,
  isChangeSetCancellable,
} from '@nasnet/core/types';

function handleChangeSet(changeSet: ChangeSet) {
  if (isChangeSetPending(changeSet.status)) {
    // DRAFT, VALIDATING, READY - can still edit
    console.log('Change set is pending, can edit items');
  }

  if (isChangeSetProcessing(changeSet.status)) {
    // VALIDATING, APPLYING, ROLLING_BACK - in progress
    showProgressSpinner();
  }

  if (isChangeSetFinal(changeSet.status)) {
    // COMPLETED, FAILED, ROLLED_BACK, PARTIAL_FAILURE, CANCELLED
    // No more changes possible
    disableEditButtons();
  }

  if (isChangeSetCancellable(changeSet.status)) {
    // DRAFT, VALIDATING, READY, APPLYING - can cancel
    showCancelButton();
  }
}
```

---

## Change Set Structure

A change set bundles multiple resource operations.

```typescript
import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeOperation,
  ChangeSetItemStatus,
} from '@nasnet/core/types';

// Complete change set structure
const changeSet: ChangeSet = {
  // Identity
  id: 'cs-2024-02-27-001', // ULID
  name: 'Create LAN Network',
  description: 'Setup LAN with DHCP and firewall',
  routerId: 'router-01',
  createdBy: 'admin@example.com',
  source: 'lan-setup-wizard', // Where it came from
  version: 1, // For optimistic locking

  // Status and progress
  status: 'READY' as ChangeSetStatus,
  createdAt: new Date('2024-02-27T10:00:00Z'),
  applyStartedAt: null,
  completedAt: null,

  // Items (individual resource operations)
  items: [
    {
      id: 'bridge-1',
      resourceUuid: null, // CREATE operation - no UUID yet
      resourceType: 'network.bridge',
      resourceCategory: 'NETWORK',
      name: 'Create LAN Bridge',
      description: 'Main bridge for LAN',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        name: 'br-lan',
        mtu: 1500,
        enabled: true,
      },
      previousState: null, // CREATE - no previous state
      dependencies: [], // Root node - no dependencies
      status: 'PENDING' as ChangeSetItemStatus,
      error: null,
      applyStartedAt: null,
      applyCompletedAt: null,
      confirmedState: null,
      applyOrder: 0, // Applied first
    },
    {
      id: 'dhcp-1',
      resourceUuid: null,
      resourceType: 'dhcp.server',
      resourceCategory: 'NETWORK',
      name: 'Create DHCP Server',
      operation: 'CREATE' as ChangeOperation,
      configuration: {
        interface: 'br-lan',
        addressPool: '192.168.1.100-200',
        gateway: '192.168.1.1',
        dns1: '8.8.8.8',
      },
      previousState: null,
      dependencies: ['bridge-1'], // Depends on bridge
      status: 'PENDING' as ChangeSetItemStatus,
      error: null,
      applyStartedAt: null,
      applyCompletedAt: null,
      confirmedState: null,
      applyOrder: 1, // Applied second
    },
  ],

  // Validation (populated after validation phase)
  validation: {
    canApply: true,
    errors: [],
    warnings: [],
    conflicts: [],
    missingDependencies: [],
    circularDependencies: null,
  },

  // Rollback plan (populated during/after apply)
  rollbackPlan: [
    {
      itemId: 'dhcp-1',
      operation: 'DELETE', // Undo: delete created DHCP
      restoreState: null,
      resourceUuid: '.id=*1A',
      success: false,
      error: null,
      rollbackOrder: 0,
    },
    {
      itemId: 'bridge-1',
      operation: 'DELETE',
      restoreState: null,
      resourceUuid: '.id=*19',
      success: false,
      error: null,
      rollbackOrder: 1, // Rollback in reverse order
    },
  ],

  // Error (if failed)
  error: null,
};
```

### Change Operations

```typescript
import { ChangeOperation, getOperationColor, getOperationLabel } from '@nasnet/core/types';

// Three basic operations
type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE';

// Usage helpers
function renderOperation(op: ChangeOperation) {
  const color = getOperationColor(op);    // green | amber | red
  const label = getOperationLabel(op);    // 'Create' | 'Update' | 'Delete'

  return <span className={`text-${color}-500`}>{label}</span>;
}

// Examples
const operations = {
  CREATE: {
    color: 'green',
    label: 'Create',
    previousState: null,
    confirmedState: null,
  },
  UPDATE: {
    color: 'amber',
    label: 'Update',
    previousState: { /* old config */ },
    confirmedState: null,
  },
  DELETE: {
    color: 'red',
    label: 'Delete',
    previousState: { /* config to delete */ },
    confirmedState: null,
  },
};
```

---

## Dependency Graph

Dependency graphs determine operation order using topological sorting.

```typescript
import {
  topologicalSort,
  detectCycles,
  analyzeDependencies,
  buildDependencyGraph,
} from '@nasnet/core/utils';
import type { DependencyNode } from '@nasnet/core/utils';

// Define nodes with dependencies
const nodes: DependencyNode[] = [
  { id: 'bridge', dependencies: [] }, // No deps - root
  { id: 'dhcp', dependencies: ['bridge'] }, // Depends on bridge
  { id: 'firewall', dependencies: ['bridge'] }, // Also depends on bridge
];

// Sort topologically
const result = topologicalSort(nodes);
if (result.success) {
  console.log('Apply order:', result.sortedIds);
  // ['bridge', 'dhcp', 'firewall'] or ['bridge', 'firewall', 'dhcp']
} else {
  console.error('Circular dependency:', result.cycle);
  // ['a', 'b', 'a'] means a→b→a cycle
}

// Analyze graph structure
const analysis = analyzeDependencies(nodes);
console.log('Root nodes:', analysis.roots); // ['bridge']
console.log('Leaf nodes:', analysis.leaves); // ['dhcp', 'firewall']
console.log('Max depth:', analysis.maxDepth); // 1 level
console.log('Levels:', analysis.levels); // [['bridge'], ['dhcp', 'firewall']]

// Check for problems
const cycleCheck = detectCycles(nodes);
if (cycleCheck.hasCycle) {
  console.error('Cycles found:', cycleCheck.cycles);
}
```

### Dependency Analysis Types

```typescript
import type { DependencyAnalysis } from '@nasnet/core/utils';

interface DependencyAnalysis {
  roots: string[]; // No dependencies - apply first
  leaves: string[]; // No dependents - apply last
  maxDepth: number; // Longest dependency chain
  levels: string[][]; // Nodes grouped by application level
  missingDependencies: Array<{
    nodeId: string;
    missingDepId: string;
  }>;
}

// Example with complex graph:
// bridge
//   ├─ dhcp
//   └─ firewall
//       └─ nat (depends on firewall)

const complex = analyzeDependencies([
  { id: 'bridge', dependencies: [] },
  { id: 'dhcp', dependencies: ['bridge'] },
  { id: 'firewall', dependencies: ['bridge'] },
  { id: 'nat', dependencies: ['firewall'] },
]);

console.log(complex.roots); // ['bridge']
console.log(complex.leaves); // ['dhcp', 'nat']
console.log(complex.maxDepth); // 2
console.log(complex.levels); // [['bridge'], ['dhcp', 'firewall'], ['nat']]
```

---

## Parallel Execution

Identify nodes that can execute in parallel.

```typescript
import { getParallelApplicableNodes } from '@nasnet/core/utils';

const changeSet = [
  { id: 'bridge', dependencies: [] },
  { id: 'dhcp', dependencies: ['bridge'] },
  { id: 'firewall', dependencies: ['bridge'] },
  { id: 'nat', dependencies: ['firewall'] },
];

// Start with empty applied set
let applied = new Set<string>();

// Iteration 1: What can we apply first?
let applicableNow = getParallelApplicableNodes(changeSet, applied);
console.log('Wave 1:', applicableNow); // ['bridge']
// Execute these in parallel

// Iteration 2: After bridge is applied
applied.add('bridge');
applicableNow = getParallelApplicableNodes(changeSet, applied);
console.log('Wave 2:', applicableNow); // ['dhcp', 'firewall'] - both ready!
// Execute dhcp and firewall in parallel

// Iteration 3: After dhcp and firewall applied
applied.add('dhcp');
applied.add('firewall');
applicableNow = getParallelApplicableNodes(changeSet, applied);
console.log('Wave 3:', applicableNow); // ['nat']
// Execute nat

// Iteration 4: All done
applied.add('nat');
applicableNow = getParallelApplicableNodes(changeSet, applied);
console.log('Wave 4:', applicableNow); // [] - nothing left
```

**Parallel executor pattern:**

```typescript
async function applyChangeSetParallel(changeSet: ChangeSet) {
  const graph = buildDependencyGraph(changeSet.items);
  const applied = new Set<string>();

  while (applied.size < changeSet.items.length) {
    // Find nodes ready to apply
    const wave = getParallelApplicableNodes(graph, applied);

    if (wave.length === 0) {
      // Check for circular dependencies
      throw new Error('Circular dependency or missing dependencies');
    }

    // Apply all in parallel
    const promises = wave.map((itemId) => applyItem(changeSet.items.find((i) => i.id === itemId)!));

    const results = await Promise.allSettled(promises);

    // Check for failures
    let anyFailed = false;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        applied.add(wave[index]);
      } else {
        anyFailed = true;
        console.error(`Item ${wave[index]} failed:`, result.reason);
      }
    });

    if (anyFailed) {
      // Trigger rollback
      await rollback(changeSet, applied);
      throw new Error('Parallel apply failed');
    }
  }
}
```

---

## Rollback Mechanism

Automatic undo when something fails.

```typescript
import type { RollbackStep, RollbackOperation } from '@nasnet/core/types';

// Rollback plan: how to undo applied changes
const rollbackPlan: RollbackStep[] = [
  {
    itemId: 'nat-rule-1',
    operation: 'DELETE' as RollbackOperation, // Delete created resource
    resourceUuid: '.id=*1C',
    restoreState: null,
    success: false,
    error: null,
    rollbackOrder: 0, // First to rollback (reverse of apply order)
  },
  {
    itemId: 'firewall-rule-1',
    operation: 'DELETE',
    resourceUuid: '.id=*1B',
    restoreState: null,
    success: false,
    error: null,
    rollbackOrder: 1,
  },
  {
    itemId: 'bridge-port-1',
    operation: 'DELETE',
    resourceUuid: '.id=*1A',
    restoreState: null,
    success: false,
    error: null,
    rollbackOrder: 2,
  },
  {
    itemId: 'bridge-1',
    operation: 'DELETE',
    resourceUuid: '.id=*19',
    restoreState: null,
    success: false,
    error: null,
    rollbackOrder: 3, // Last to rollback
  },
];

// Rollback types
type RollbackOperation = 'DELETE' | 'RESTORE' | 'REVERT';

// DELETE: Remove created resource
// RESTORE: Restore deleted resource from previousState
// REVERT: Revert updated resource to previousState

async function executeRollback(rollbackPlan: RollbackStep[]) {
  // Sort by rollbackOrder (reverse of apply order)
  const sorted = rollbackPlan.sort((a, b) => b.rollbackOrder - a.rollbackOrder);

  for (const step of sorted) {
    try {
      switch (step.operation) {
        case 'DELETE':
          await deleteResource(step.resourceUuid!);
          break;

        case 'RESTORE':
          await createResource(step.restoreState!);
          break;

        case 'REVERT':
          await updateResource(step.resourceUuid!, step.restoreState!);
          break;
      }

      step.success = true;
    } catch (error) {
      step.error = (error as Error).message;
      // Continue rolling back others
    }
  }

  // Check if any rollbacks failed
  const allSucceeded = rollbackPlan.every((s) => s.success);
  if (!allSucceeded) {
    return 'PARTIAL_FAILURE'; // Requires manual intervention
  }

  return 'ROLLED_BACK';
}
```

---

## Cycle Detection

Detect and report circular dependencies.

```typescript
import { detectCycles, validateDependencyGraph } from '@nasnet/core/utils';

// Circular dependency example
const circular = [
  { id: 'a', dependencies: ['b'] },
  { id: 'b', dependencies: ['c'] },
  { id: 'c', dependencies: ['a'] }, // c→a creates cycle: a→b→c→a
];

const result = detectCycles(circular);
console.log(result.hasCycle); // true
console.log(result.cycles); // [['a', 'b', 'c']]

// Full validation
const validation = validateDependencyGraph(circular);
console.log(validation.valid); // false
console.log(validation.errors); // ['Circular dependency: a → b → c → a']

// Handle in UI
function handleChangeSetValidation(changeSet: ChangeSet) {
  if (changeSet.validation?.circularDependencies?.length) {
    const cycles = changeSet.validation.circularDependencies;
    showError(`Circular dependencies detected: ${cycles.map((c) => c.join('→')).join(', ')}`);
  }

  if (changeSet.validation?.missingDependencies?.length) {
    showWarning(
      `Missing dependencies: ${changeSet.validation.missingDependencies
        .map((m) => `${m.itemId} requires ${m.missingResourceType}`)
        .join(', ')}`
    );
  }
}
```

---

## Conflict Detection

Detect and handle conflicts between items or with existing resources.

```typescript
import type { ChangeSetConflict } from '@nasnet/core/types';

// Conflicts detected during validation
const conflicts: ChangeSetConflict[] = [
  {
    itemId1: 'dhcp-server-1',
    itemId2OrResourceUuid: 'existing-dhcp-001',
    isExternalConflict: true, // Conflict with existing resource
    description: 'Another DHCP server already exists on br-lan',
    resolution: 'Delete the existing DHCP server first',
  },
  {
    itemId1: 'port-forward-1',
    itemId2OrResourceUuid: 'port-forward-2',
    isExternalConflict: false, // Conflict within change set
    description: 'Both rules use the same port 8080',
    resolution: 'Change one of the port numbers',
  },
];

// Handle in UI
function showConflictDialog(conflict: ChangeSetConflict) {
  if (conflict.isExternalConflict) {
    showModal(`Conflict with existing resource: ${conflict.description}`, [
      { label: 'View Existing', action: () => viewResource(conflict.itemId2OrResourceUuid) },
      { label: 'Delete Existing', action: () => deleteAndContinue() },
      { label: 'Cancel', action: () => cancelChangeSet() },
    ]);
  } else {
    showModal(`Conflict between items: ${conflict.description}`, [
      { label: 'Edit Items', action: () => editConflictingItems() },
      { label: 'Cancel', action: () => cancelChangeSet() },
    ]);
  }
}
```

---

## Practical Examples

### Example 1: LAN Setup with Dependencies

```typescript
import { ChangeSet, ChangeSetStatus, ChangeOperation } from '@nasnet/core/types';

function createLANSetupChangeSet(): ChangeSet {
  return {
    id: 'cs-lan-setup',
    name: 'Create LAN Network',
    description: 'Setup LAN bridge with DHCP and firewall',
    routerId: 'router-01',
    status: 'DRAFT' as ChangeSetStatus,
    version: 1,
    createdAt: new Date(),
    applyStartedAt: null,
    completedAt: null,
    createdBy: 'admin@example.com',
    source: 'lan-wizard',

    items: [
      // Step 1: Create bridge (no dependencies)
      {
        id: 'item-1',
        resourceUuid: null,
        resourceType: 'network.bridge',
        resourceCategory: 'NETWORK',
        name: 'Create Bridge',
        operation: 'CREATE' as ChangeOperation,
        configuration: { name: 'br-lan', mtu: 1500 },
        previousState: null,
        dependencies: [],
        status: 'PENDING',
        error: null,
        applyStartedAt: null,
        applyCompletedAt: null,
        confirmedState: null,
        applyOrder: 0,
      },

      // Step 2: Add ports to bridge
      {
        id: 'item-2',
        resourceUuid: null,
        resourceType: 'network.bridge-port',
        resourceCategory: 'NETWORK',
        name: 'Add ether1 to bridge',
        operation: 'CREATE' as ChangeOperation,
        configuration: { interface: 'ether1', bridge: 'br-lan' },
        previousState: null,
        dependencies: ['item-1'], // Depends on bridge existing
        status: 'PENDING',
        error: null,
        applyStartedAt: null,
        applyCompletedAt: null,
        confirmedState: null,
        applyOrder: 1,
      },

      // Step 3: Create DHCP server (also depends on bridge)
      {
        id: 'item-3',
        resourceUuid: null,
        resourceType: 'dhcp.server',
        resourceCategory: 'NETWORK',
        name: 'Create DHCP Server',
        operation: 'CREATE' as ChangeOperation,
        configuration: {
          interface: 'br-lan',
          addressPool: '192.168.1.100-200',
          gateway: '192.168.1.1',
        },
        previousState: null,
        dependencies: ['item-1'], // Depends on bridge
        status: 'PENDING',
        error: null,
        applyStartedAt: null,
        applyCompletedAt: null,
        confirmedState: null,
        applyOrder: 1, // Can run parallel with item-2
      },

      // Step 4: Firewall rule
      {
        id: 'item-4',
        resourceUuid: null,
        resourceType: 'firewall.filter',
        resourceCategory: 'FIREWALL',
        name: 'Allow LAN traffic',
        operation: 'CREATE' as ChangeOperation,
        configuration: {
          'in-interface': 'br-lan',
          action: 'accept',
        },
        previousState: null,
        dependencies: ['item-1'],
        status: 'PENDING',
        error: null,
        applyStartedAt: null,
        applyCompletedAt: null,
        confirmedState: null,
        applyOrder: 1, // Can run parallel
      },
    ],

    validation: null,
    rollbackPlan: [],
    error: null,
  };
}

// Usage
const changeSet = createLANSetupChangeSet();
// Apply order: item-1 (bridge), then items 2-4 in parallel
```

### Example 2: Update with Conflict Detection

```typescript
import { topologicalSort } from '@nasnet/core/utils';

async function handleChangeSetValidation(changeSet: ChangeSet) {
  // Step 1: Check for circular dependencies
  const graph = changeSet.items.map((item) => ({
    id: item.id,
    dependencies: item.dependencies,
  }));

  const sortResult = topologicalSort(graph);
  if (!sortResult.success) {
    showError(`Circular dependency: ${sortResult.cycle?.join(' → ')}`);
    return;
  }

  // Step 2: Update apply order on items
  sortResult.sortedIds.forEach((id, index) => {
    const item = changeSet.items.find((i) => i.id === id);
    if (item) {
      item.applyOrder = index;
    }
  });

  // Step 3: Show validation results
  if (changeSet.validation?.conflicts?.length) {
    showConflictWarning(changeSet.validation.conflicts);
  }

  if (changeSet.validation?.errors?.length) {
    showErrorsList(changeSet.validation.errors);
  }

  // Step 4: Show preview of parallel execution
  const { levels } = analyzeDependencies(graph);
  showApplyPlan(levels);
}
```

### Example 3: Monitor Progress

```typescript
import { ChangeSetProgressEvent } from '@nasnet/core/types';

function setupProgressListener(changeSetId: string) {
  // Subscribe to progress events
  const unsubscribe = onChangeSetProgress((event: ChangeSetProgressEvent) => {
    if (event.changeSetId !== changeSetId) return;

    // Update UI
    const progress = event.progressPercent;
    updateProgressBar(progress);

    // Show current item
    if (event.currentItem) {
      showCurrentItem(
        `${event.currentItem.operation} ${event.currentItem.name}`
      );
    }

    // Show ETA
    if (event.estimatedRemainingMs) {
      const eta = new Date(Date.now() + event.estimatedRemainingMs);
      showETA(eta);
    }

    // Handle completion
    if (event.status === 'COMPLETED') {
      showSuccess('All changes applied');
      unsubscribe();
    }

    if (event.status === 'FAILED') {
      showError(`Failed at ${event.currentItem?.name}`);
      if (event.error) {
        console.error(event.error.message);
      }
      unsubscribe();
    }
  });

  return unsubscribe;
}

// Example UI
function ChangeSetProgressMonitor({ changeSetId }: { changeSetId: string }) {
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<string>('');
  const [eta, setEta] = useState<Date | null>(null);

  useEffect(() => {
    return setupProgressListener(changeSetId);
  }, [changeSetId]);

  return (
    <div className="progress-monitor">
      <progress value={progress} max={100} />
      <p>{progress}% complete</p>
      {current && <p>Processing: {current}</p>}
      {eta && <p>ETA: {eta.toLocaleTimeString()}</p>}
    </div>
  );
}
```

---

## See Also

- **universal-state-v2.md** - Resource model that change sets operate on
- **validation-pipeline.md** - Validation before change set apply
- **forms.md** - Using change sets in forms
