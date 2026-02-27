# XState Machines Reference

This document catalogues every XState machine in NasNetConnect. Machines are used for workflows
where simple boolean flags or Zustand state become insufficient — specifically where there are
multiple sequential async steps, guards that prevent invalid transitions, and rollback/error
recovery paths.

All machines use **XState v5** (`xstate@5.x`) with the `setup()` API. The `@xstate/react` package
provides `useMachine()` and `useActor()` for React integration.

## Table of Contents

1. [XState v5 Quick Reference](#xstate-v5-quick-reference)
2. [createConfigPipelineMachine](#createconfigpipelinemachine)
3. [createChangeSetMachine](#createchangesetmachine)
4. [createTemplateApplyMachine](#createtemplateapplymachine)
5. [createResourceLifecycleMachine](#createresourcelifecyclemachine)
6. [createWizardMachine](#createwizardmachine)
7. [updateMachine](#updatemachine)
8. [pingMachine](#pingmachine)
9. [createTroubleshootMachine](#createtroubleshootmachine)
10. [createVPNConnectionMachine](#createvpnconnectionmachine)
11. [Pattern: Factory Functions vs. Singleton Machines](#pattern-factory-functions-vs-singleton-machines)

---

## XState v5 Quick Reference

NasNetConnect uses XState v5's `setup()` API throughout. The key differences from v4:

```typescript
import { setup, assign, fromPromise, useMachine } from 'xstate';
import { useMachine } from '@xstate/react';

// V5 pattern: setup() + createMachine()
const machine = setup({
  types: {} as {
    context: MyContext;
    events: MyEvent;
  },
  actors: {
    // Async actors replace v4 services
    myActor: fromPromise<Output, Input>(async ({ input }) => {
      return doSomething(input);
    }),
  },
  guards: {
    myGuard: ({ context, event }) => context.value > 0,
  },
  actions: {
    myAction: assign({ field: ({ event }) => event.value }),
  },
}).createMachine({
  id: 'myMachine',
  initial: 'idle',
  context: {
    /* initial context */
  },
  states: {
    /* states */
  },
});

// React usage
const [state, send] = useMachine(machine);
send({ type: 'MY_EVENT', value: 42 });
```

**Factory functions** (machines that return different instances per configuration) use
`setup().createMachine()` inside a function rather than at the module level.

---

## createConfigPipelineMachine

**File:** `libs/state/machines/src/configPipelineMachine.ts` **Export:**
`createConfigPipelineMachine<TConfig>(config)`, `createSimpleConfigPipelineMachine<TConfig>(config)`

### Purpose

The core safety pipeline for all configuration changes in NasNetConnect. Prevents accidental network
lockouts by enforcing: validation before apply, explicit acknowledgment for high-risk operations,
and automatic rollback if verification fails. This is a **generic machine** parameterized by the
configuration type `TConfig`.

### When It Is Used

- WireGuard peer configuration
- WAN interface changes (PPPoE, DHCP, static)
- VPN server setup
- Any configuration that, if applied incorrectly, could disconnect the user from the router

### State Diagram

```
                    EDIT
   ┌─────────────────────────────────────────────┐
   │                                             │
   ▼                                             │
 idle ──EDIT──► draft ──VALIDATE──► validating
                  │                     │
                CANCEL              ┌───┴───┐
                  │           errors│       │no errors
                  ▼                 ▼       ▼
                idle            invalid  previewing
                               │            │
                             EDIT        CONFIRM
                               │            │
                               ▼        ┌───┴──────────────┐
                             draft  highRisk│            normal│
                                          ▼                  ▼
                                      confirming ──────► applying
                                          │                  │
                                     ACKNOWLEDGED          done│
                                          │             error │
                                          ▼                  ▼
                                       applying          verifying
                                          │                  │
                                         done            ┌───┴───┐
                                          │         pass │       │ fail
                                          ▼              ▼       ▼
                                      verifying       active  rollback
                                                      (final)    │
                                                              done│
                                                                  ▼
                                                             rolled_back
                                                              (final)
```

### States

| State         | Description                                              |
| ------------- | -------------------------------------------------------- |
| `idle`        | Waiting for first edit                                   |
| `draft`       | User is modifying configuration                          |
| `validating`  | Running 7-stage async validation pipeline                |
| `invalid`     | Validation failed; errors shown to user                  |
| `previewing`  | Showing diff of proposed changes                         |
| `confirming`  | High-risk acknowledgment dialog (countdown)              |
| `applying`    | Sending configuration to router via API                  |
| `verifying`   | Polling/checking that router accepted the change         |
| `active`      | Final success state                                      |
| `rollback`    | Executing rollback after verification failure            |
| `rolled_back` | Final state: safe rollback complete                      |
| `error`       | Unrecoverable error; offers RETRY, FORCE_ROLLBACK, RESET |

### Events

| Event            | From States                            | Description                                       |
| ---------------- | -------------------------------------- | ------------------------------------------------- |
| `EDIT`           | idle, draft, invalid, previewing       | Update pending configuration                      |
| `VALIDATE`       | draft                                  | Start the validation pipeline                     |
| `CONFIRM`        | previewing                             | Proceed to apply (or confirming if high-risk)     |
| `ACKNOWLEDGED`   | confirming                             | User acknowledges high-risk warning               |
| `CANCEL`         | draft, invalid, previewing, confirming | Abandon pipeline                                  |
| `RETRY`          | error                                  | Retry from validating                             |
| `FORCE_ROLLBACK` | error                                  | Manually trigger rollback (requires rollbackData) |
| `RESET`          | error                                  | Return to idle                                    |

### Guards

| Guard                 | Condition                           |
| --------------------- | ----------------------------------- |
| `hasValidationErrors` | `output.errors.length > 0`          |
| `noValidationErrors`  | `output.errors.length === 0`        |
| `isHighRisk`          | `context.diff?.isHighRisk === true` |
| `isNotHighRisk`       | `context.diff?.isHighRisk !== true` |
| `hasRollbackData`     | `context.rollbackData !== null`     |

### Context Shape

```typescript
interface ConfigPipelineContext<TConfig> {
  resourceId: string | null;
  originalConfig: TConfig | null;
  pendingConfig: TConfig | null;
  validationErrors: ValidationError[];
  diff: ConfigDiff | null; // isHighRisk flag lives here
  rollbackData: TConfig | null; // Populated after successful apply
  applyStartedAt: number | null; // Timestamp for UI countdown display
  errorMessage: string | null;
}
```

### Configuration (Required Callbacks)

```typescript
interface ConfigPipelineConfig<TConfig> {
  id?: string;
  runValidationPipeline: (
    config: TConfig
  ) => Promise<{ errors: ValidationError[]; diff: ConfigDiff }>;
  applyConfig: (params: {
    resourceId: string;
    config: TConfig;
  }) => Promise<{ rollbackData: TConfig }>;
  verifyApplied: (resourceId: string) => Promise<void>;
  executeRollback: (rollbackData: TConfig) => Promise<void>;
  onSuccess?: () => void;
  onRollback?: () => void;
  onError?: (error: string) => void;
}
```

### Usage Example

```typescript
import { createConfigPipelineMachine } from '@nasnet/state/machines';
import { useMachine } from '@xstate/react';

interface WireGuardConfig {
  privateKey: string;
  listenPort: number;
  peers: Peer[];
}

const wireguardPipelineMachine = createConfigPipelineMachine<WireGuardConfig>({
  runValidationPipeline: async (config) => {
    const result = await validateWireGuardConfig(config);
    return { errors: result.errors, diff: result.diff };
  },
  applyConfig: async ({ resourceId, config }) => {
    const backup = await getWireGuardBackup(resourceId);
    await applyWireGuardConfig(resourceId, config);
    return { rollbackData: backup };
  },
  verifyApplied: async (resourceId) => {
    const status = await checkWireGuardStatus(resourceId);
    if (!status.running) throw new Error('WireGuard failed to start');
  },
  executeRollback: async (rollbackData) => {
    await restoreWireGuardConfig(rollbackData);
  },
  onSuccess: () => toast.success('WireGuard configuration applied'),
  onRollback: () => toast.warning('Configuration rolled back to previous state'),
});

// In a component
const [state, send] = useMachine(wireguardPipelineMachine);

// User edits form field
send({ type: 'EDIT', config: updatedConfig });

// User clicks "Apply"
send({ type: 'VALIDATE' });

// Check state
if (state.matches('previewing')) {
  showDiffPreview(state.context.diff);
}
if (state.matches('invalid')) {
  showErrors(state.context.validationErrors);
}
```

### Helper Utilities

```typescript
isPipelineFinal(state); // → boolean (active | rolled_back)
isPipelineCancellable(state); // → boolean (draft | invalid | previewing | confirming)
isPipelineProcessing(state); // → boolean (validating | applying | verifying | rollback)
getPipelineStateDescription(state); // → string for UI labels
```

---

## createChangeSetMachine

**File:** `libs/state/machines/src/changeSetMachine.ts` **Export:** `createChangeSetMachine(config)`

### Purpose

Orchestrates atomic multi-resource operations. While `createConfigPipelineMachine` handles a single
resource, this machine applies an entire **change set** of items in topologically-sorted dependency
order. If any item fails, it automatically rolls back all previously applied items in reverse order.

### When It Is Used

- LAN network creation wizard (bridge → IP address → DHCP server)
- Bulk interface configuration
- Any operation touching multiple interdependent resources atomically

### State Diagram

```
  idle ──LOAD──► idle (loads change set)
   │
   └──START_VALIDATION──► validating ──fail──► idle (with error)
                               │
                            success
                               │
                               ▼
                            ready ──APPLY──► applying
                              │               │
                            CANCEL          applyingItem (compound)
                              │               │    │
                              ▼           done│  error│
                          cancelled           ▼       ▼
                                       checkingMore  rollingBack
                                         │       │       │
                                    more │  done │   done│
                                    items│       │       ▼
                                         │       ▼   rolledBack (final)
                                         │   completed (final)
                                         ▼
                                    applyingItem (loop)
```

The `applying` state is a compound state with two sub-states: `applyingItem` (executing the current
item's API call) and `checkingMore` (an `always` transition that decides whether to loop to the next
item or transition to `completed`).

### States

| State            | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `idle`           | Ready to receive a change set via LOAD event                           |
| `validating`     | Running async validation on all items                                  |
| `ready`          | Validation passed; awaiting user confirmation                          |
| `applying`       | Compound: applyingItem → checkingMore → loop or done                   |
| `completed`      | Final: all items applied successfully                                  |
| `rollingBack`    | Executing rollback steps in reverse order                              |
| `rolledBack`     | Final: rollback successful                                             |
| `failed`         | Apply or validation failed; offers retry/rollback/reset                |
| `partialFailure` | Final: rollback itself partially failed (manual intervention required) |
| `cancelled`      | Final: user cancelled                                                  |

### Events

| Event              | From States                 | Description                            |
| ------------------ | --------------------------- | -------------------------------------- |
| `LOAD`             | idle                        | Load a change set into machine context |
| `START_VALIDATION` | idle                        | Begin validation                       |
| `APPLY`            | ready                       | Start applying items                   |
| `CANCEL`           | validating, ready, applying | Cancel operation                       |
| `RETRY`            | failed                      | Re-run validation                      |
| `FORCE_ROLLBACK`   | failed, cancelled           | Manually trigger rollback              |
| `RESET`            | ready, failed, cancelled    | Return machine to idle                 |

### Context Shape

```typescript
interface ChangeSetMachineContext {
  changeSet: ChangeSet | null;
  routerId: string | null;
  validationResult: ChangeSetValidationResult | null;
  currentItemIndex: number; // Position in sortedItems array
  sortedItems: ChangeSetItem[]; // Topologically sorted apply order
  appliedItems: ChangeSetItem[]; // Items successfully applied so far
  rollbackPlan: RollbackStep[]; // Built up as items are applied (reverse order)
  error: ChangeSetError | null;
  errorMessage: string | null;
  cancelRequested: boolean; // Set by CANCEL during applying
  applyStartedAt: number | null;
}
```

### Rollback Plan Construction

As each item is applied, a `RollbackStep` is prepended to `context.rollbackPlan`. This means the
rollback plan is always in reverse apply order (last applied = first to roll back):

```typescript
// CREATE → DELETE
// UPDATE → REVERT (uses previousState)
// DELETE → RESTORE (uses previousState)
```

### Usage Example

```typescript
import { createChangeSetMachine } from '@nasnet/state/machines';
import { useActor } from '@xstate/react';

const machine = createChangeSetMachine({
  validateChangeSet: async (changeSet) => {
    const response = await client.query({
      query: VALIDATE_CHANGE_SET,
      variables: { id: changeSet.id },
    });
    return response.data.validation;
  },
  applyItem: async ({ item, routerId }) => {
    const response = await client.mutate({
      mutation: APPLY_RESOURCE,
      variables: {
        routerId,
        itemId: item.id,
        operation: item.operation,
        config: item.configuration,
      },
    });
    return {
      confirmedState: response.data.confirmedState,
      resourceUuid: response.data.resourceUuid,
    };
  },
  rollbackItem: async ({ rollbackStep, routerId }) => {
    await client.mutate({ mutation: ROLLBACK_RESOURCE, variables: { routerId, ...rollbackStep } });
  },
  onProgress: (event) => {
    console.log(`Applying ${event.currentItem?.name} (${event.appliedCount}/${event.totalCount})`);
  },
  onComplete: (changeSet) => {
    toast.success(`Applied ${changeSet.items.length} changes successfully`);
  },
});

const [state, send] = useActor(machine);

// Load and validate
send({ type: 'LOAD', changeSet, routerId });
send({ type: 'START_VALIDATION' });

// After validation passes (state.matches('ready'))
send({ type: 'APPLY' });
```

---

## createTemplateApplyMachine

**File:** `libs/features/firewall/src/machines/template-apply.machine.ts` **Export:**
`createTemplateApplyMachine(config)`

### Purpose

Safety pipeline for applying firewall rule templates. Adds template-specific concerns on top of the
basic config pipeline: variable resolution, conflict detection, impact analysis, high-risk
thresholds, and a 10-second undo (rollback) window after successful apply.

### When It Is Used

- Firewall template browser (`libs/features/firewall/src/components/TemplateApplyFlow.tsx`)
- Alert template application
- Any templated rule set with variable substitution

### State Diagram

```
  idle ──SELECT_TEMPLATE──► configuring ──PREVIEW──► previewing (async)
                               │                          │
                             CANCEL                      done
                               │                          │
                               ▼                          ▼
                              idle                     reviewing
                                                          │
                                                       CONFIRM
                                                    ┌────┴────────────┐
                                               high │                 │ normal
                                               risk │                 │
                                                    ▼                 ▼
                                               confirming ──────► applying (async)
                                                                       │
                                                              ┌────────┴──────────┐
                                                        success│                fail│
                                                               ▼                   ▼
                                                            success              error
                                                           (10s timer)             │
                                                               │              ROLLBACK│RETRY
                                                            ROLLBACK              │
                                                               │                  ▼
                                                               ▼               rollingBack (async)
                                                           rollingBack             │
                                                               │                done│
                                                              done                  ▼
                                                               │                rolledBack
                                                               ▼
                                                           rolledBack
```

### States

| State         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| `idle`        | Waiting for template selection                              |
| `configuring` | User filling in template variable values                    |
| `previewing`  | Async: calling previewTemplate API                          |
| `reviewing`   | User inspecting resolved rules and conflict report          |
| `confirming`  | High-risk acknowledgment for large or conflicting templates |
| `applying`    | Async: calling applyTemplate API                            |
| `success`     | Apply succeeded; 10-second rollback window active           |
| `rollingBack` | Async: calling executeRollback API                          |
| `rolledBack`  | Rollback complete                                           |
| `error`       | Apply or rollback failed                                    |

### High-Risk Thresholds

A template application is classified as high-risk (requiring explicit acknowledgment) when any of
these conditions are true:

- Adding more than 10 new rules (`impactAnalysis.newRulesCount > 10`)
- Affecting more than 3 firewall chains (`impactAnalysis.affectedChains.length > 3`)
- Any conflicts detected (`conflicts.length > 0`)
- Any warnings from impact analysis (`impactAnalysis.warnings.length > 0`)

### Events

| Event              | From States                        | Description                                   |
| ------------------ | ---------------------------------- | --------------------------------------------- |
| `SELECT_TEMPLATE`  | idle                               | Select template and router                    |
| `UPDATE_VARIABLES` | configuring, reviewing             | Update variable values                        |
| `PREVIEW`          | configuring                        | Generate preview with conflict detection      |
| `CONFIRM`          | reviewing                          | Proceed to apply (or confirming if high-risk) |
| `ACKNOWLEDGED`     | confirming                         | Explicitly acknowledge high-risk operation    |
| `ROLLBACK`         | success, error                     | Initiate rollback                             |
| `RETRY`            | error                              | Retry from previewing                         |
| `CANCEL`           | configuring, reviewing, confirming | Abandon flow                                  |
| `RESET`            | success, rolledBack, error         | Return to idle                                |

### Context Shape

```typescript
interface TemplateApplyContext {
  routerId: string | null;
  template: FirewallTemplate | null;
  variables: Record<string, string>;
  validationErrors: Array<{ field: string; message: string }>;
  previewResult: TemplatePreviewResult | null;
  applyResult: FirewallTemplateResult | null;
  applyStartedAt: number | null; // For 10-second rollback countdown UI
  errorMessage: string | null;
}
```

### 10-Second Rollback Window

After `success` is entered, `applyStartedAt` is set to `Date.now()`. The UI reads this to display a
countdown. The user can send `ROLLBACK` at any time while in `success` state (there is no
machine-enforced timeout — the 10 seconds is a UI convention). If the user navigates away or
dismisses without rolling back, they must use `RESET` to clear the machine.

### Usage Example

```typescript
import { createTemplateApplyMachine } from '@nasnet/features/firewall';
import { createActor } from 'xstate';

const machine = createTemplateApplyMachine({
  previewTemplate: async ({ routerId, template, variables }) => {
    return previewTemplateAPI(routerId, template.id, variables);
  },
  applyTemplate: async ({ routerId, template, variables }) => {
    return applyTemplateAPI(routerId, template.id, variables);
  },
  executeRollback: async ({ routerId, rollbackId }) => {
    await rollbackTemplateAPI(routerId, rollbackId);
  },
  onSuccess: () => toast.success('Template applied successfully'),
  onRollback: () => toast.info('Template changes rolled back'),
});

const actor = createActor(machine).start();

actor.send({ type: 'SELECT_TEMPLATE', template, routerId });
// User fills in variables
actor.send({ type: 'UPDATE_VARIABLES', variables: { TRUSTED_NET: '192.168.1.0/24' } });
actor.send({ type: 'PREVIEW' });
// After preview arrives...
actor.send({ type: 'CONFIRM' });
```

### Helper Utilities

```typescript
isTemplateFinal(state); // success | rolledBack
isTemplateCancellable(state); // configuring | reviewing | confirming
isTemplateProcessing(state); // previewing | applying | rollingBack
getTemplateStateDescription(state); // Human-readable label
```

---

## createResourceLifecycleMachine

**File:** `libs/state/machines/src/resourceLifecycleMachine.ts` **Export:**
`createResourceLifecycleMachine<TConfig>(config)`

### Purpose

Models the complete 9-state lifecycle of a Universal State v2 resource from initial creation through
eventual archiving. Handles the validation-apply-verify loop, runtime degradation detection, and
sync from router.

### When It Is Used

- Individual WireGuard peers, OpenVPN tunnels, etc.
- Network bridge interfaces
- VPN server instances
- Any resource in the 8-layer Universal State model

### State Diagram

```
  draft ──VALIDATE──► validating
    ▲                     │
    │              ┌──────┴──────┐
   EDIT            │ fail        │ pass
    │              ▼             ▼
    │           error          valid ──APPLY──► applying
    │                                              │
    │                                     ┌────────┴────────┐
    │                               success│             fail│
    │                                      ▼                 ▼
    │                                   active            error
    │                                     │
    │                      ┌──────────────┼──────────────────┐
    │               DEGRADE│         SYNC │           DEPRECATE│
    │                      ▼              ▼                   ▼
    └──────────────── degraded ─►    syncing ──► active    deprecated
                       │                                      │
                     RECOVER                       ┌──────────┤
                       │                      RESTORE│    ARCHIVE│
                       ▼                           ▼           ▼
                     active                     active      archived (final)
```

### States

| State        | Description                                            |
| ------------ | ------------------------------------------------------ |
| `draft`      | Resource created or edited, not yet validated          |
| `validating` | Async: running 7-stage validation pipeline             |
| `valid`      | Validation passed; ready to apply                      |
| `applying`   | Async: pushing configuration to router                 |
| `active`     | Running on router; receiving real-time runtime updates |
| `degraded`   | Running but health is DEGRADED or CRITICAL             |
| `error`      | Validation or apply failure                            |
| `deprecated` | Marked for eventual removal                            |
| `archived`   | Final state; resource permanently decommissioned       |
| `syncing`    | Async: pulling current configuration from router       |

### Events

| Event            | From States                           | Description                        |
| ---------------- | ------------------------------------- | ---------------------------------- |
| `EDIT`           | draft, valid, active, degraded, error | Update pending configuration       |
| `VALIDATE`       | draft                                 | Start validation (requires `uuid`) |
| `APPLY`          | valid                                 | Push configuration to router       |
| `RUNTIME_UPDATE` | active, degraded                      | Real-time health/metrics update    |
| `DEGRADE`        | active                                | Manual degradation signal          |
| `RECOVER`        | degraded                              | Recovery signal (health restored)  |
| `DEPRECATE`      | active, degraded                      | Mark for removal                   |
| `RESTORE`        | deprecated                            | Reactivate deprecated resource     |
| `ARCHIVE`        | deprecated                            | Permanently archive                |
| `RETRY`          | error                                 | Retry validation (max 3 attempts)  |
| `RESET`          | error                                 | Clear errors and return to draft   |
| `SYNC`           | active                                | Pull current state from router     |

### Context Shape

```typescript
interface ResourceLifecycleContext<TConfig> {
  uuid: string | null;
  routerId: string | null;
  resourceType: string | null;
  configuration: TConfig | null;
  pendingConfiguration: TConfig | null;
  validationResult: ValidationResult | null;
  runtime: RuntimeState | null; // CPU, memory, health from router
  errorMessage: string | null;
  errorCode: string | null;
  rollbackData: TConfig | null;
  lastTransitionAt: number | null;
  retryCount: number;
  maxRetries: number; // Default: 3
  degradationReason: string | null;
}
```

### Runtime Updates

When the router reports a health change via a subscription event, `RUNTIME_UPDATE` is sent. In the
`active` state, this uses guards to decide whether to transition to `degraded`:

```typescript
RUNTIME_UPDATE: [
  {
    target: 'degraded',
    guard: ({ event }) => event.runtime.health === 'DEGRADED' || event.runtime.health === 'CRITICAL',
    actions: ['updateRuntime', 'setDegradation'],
  },
  {
    actions: 'updateRuntime',  // Stay in active, just update metrics
  },
],
```

In the `degraded` state, `RUNTIME_UPDATE` with `health === 'HEALTHY'` automatically transitions back
to `active`.

---

## createWizardMachine

**File:** `libs/state/machines/src/wizardMachine.ts` **Export:**
`createWizardMachine<TData>(config)` (exports V2 which is the recommended version)

### Purpose

Reusable multi-step wizard with per-step async validation, session persistence (for crash recovery),
and data accumulation across steps. Generic over the wizard's data type `TData`.

### When It Is Used

- Service installation wizard (4 steps: feature selection → network → configuration → review)
- VPN client setup wizard
- Router onboarding wizard in `apps/star-setup-web/`

### State Diagram

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ step (active step — user is editing)                              │
  │                                                                   │
  │  NEXT ──► validating ──► (pass, not last) ──► step (next step)   │
  │                     └──► (pass, last step) ──► submitting         │
  │                     └──► (fail) ──► step (same step, with errors) │
  │                                                                   │
  │  BACK (if canGoBack) ──► step (prev step)                        │
  │  CANCEL ──► cancelled (final)                                    │
  └──────────────────────────────────────────────────────────────────┘

  submitting (async: calling onSubmit)
      │
  ┌───┴───┐
  │success│ fail
  ▼       ▼
completed  step (with _form error)
(final)
```

### States

| State        | Description                                       |
| ------------ | ------------------------------------------------- |
| `step`       | User is editing the current step's fields         |
| `validating` | Async: calling validateStep for the current step  |
| `submitting` | Async: calling onSubmit with all accumulated data |
| `completed`  | Final: wizard finished successfully               |
| `cancelled`  | Final: user cancelled                             |

### Events

| Event          | From States | Description                                   |
| -------------- | ----------- | --------------------------------------------- |
| `NEXT`         | step        | Validate and advance (or submit on last step) |
| `BACK`         | step        | Go back (guard: canGoBack)                    |
| `SET_DATA`     | step        | Update field values without advancing         |
| `CLEAR_ERRORS` | step        | Clear validation error messages               |
| `CANCEL`       | step        | Abandon wizard                                |
| `RESTORE`      | step        | Restore previously saved session context      |
| `GOTO`         | step        | Jump to specific step (V1 only)               |

### Context Shape

```typescript
interface WizardContext<TData> {
  currentStep: number; // 1-indexed
  totalSteps: number;
  data: Partial<TData>; // Accumulated across all steps
  errors: Record<string, string>; // Field-level validation errors
  sessionId: string; // UUID for session persistence/recovery
  canSkip: boolean; // Whether forward navigation is allowed without validation
}
```

### Configuration

```typescript
interface WizardConfig<TData> {
  id: string;
  totalSteps: number;
  validateStep: (
    step: number,
    data: Partial<TData>
  ) => Promise<{ valid: boolean; errors?: Record<string, string> }>;
  onSubmit: (data: TData) => Promise<void>;
  initialData?: Partial<TData>;
  persist?: boolean;
}
```

### Usage Example

```typescript
import { createWizardMachine } from '@nasnet/state/machines';
import { useMachine } from '@xstate/react';

interface ServiceInstallData {
  featureId: string;
  instanceName: string;
  vlanId: number;
  bindIp: string;
  config: Record<string, unknown>;
}

const installWizard = createWizardMachine<ServiceInstallData>({
  id: 'service-install-wizard',
  totalSteps: 4,
  validateStep: async (step, data) => {
    const schema = STEP_SCHEMAS[step - 1];
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path.join('.')] = issue.message;
      });
      return { valid: false, errors };
    }
    return { valid: true };
  },
  onSubmit: async (data) => {
    await installService(data);
  },
});

const [state, send] = useMachine(installWizard);

// Display current step
console.log(`Step ${state.context.currentStep} of ${state.context.totalSteps}`);

// User fills step 1 and clicks Next
send({ type: 'NEXT', data: { featureId: 'tor', instanceName: 'my-tor' } });

// Handle validation errors
if (state.context.errors.instanceName) {
  showError(state.context.errors.instanceName);
}
```

### Session Recovery

The `RESTORE` event allows rehydrating wizard state from a persisted draft (e.g., from
`useServiceUIStore.wizardDraft`):

```typescript
const draft = useServiceWizardDraft();
useEffect(() => {
  if (draft) {
    send({
      type: 'RESTORE',
      savedContext: { currentStep: draft.step, data: draft.data, sessionId: draft.sessionId },
    });
  }
}, []);
```

---

## updateMachine

**File:** `libs/features/services/src/machines/update-machine.ts` **Export:** `updateMachine`
(singleton, not a factory)

### Purpose

Manages the lifecycle of a service instance update. Unlike other machines, this is a singleton (not
a factory) because the update states are simple and don't vary by configuration. Progress events
arrive via GraphQL subscription and are fed into the machine with `send()`.

### When It Is Used

- Service update dialog in the Feature Marketplace
- Update-all batch operation

### State Diagram

```
  idle ──START_UPDATE──► updating
                             │
              ┌──────────────┼──────────────────────┐
         COMPLETE│       ROLLED_BACK│           FAILED│
              ▼                 ▼                    ▼
           complete          rolledBack            failed
              │                 │                    │
            RESET             RESET               RESET
              │                 │                    │
              └─────────────────┼────────────────────┘
                                ▼
                              idle
```

The `updating` state also accepts `PROGRESS` events (without transition — just context update) and
`CANCEL` (back to idle with reset).

### States

| State        | Description                                               |
| ------------ | --------------------------------------------------------- |
| `idle`       | Ready for a new update                                    |
| `updating`   | Update in progress; receives PROGRESS subscription events |
| `complete`   | Update succeeded                                          |
| `rolledBack` | Update was automatically rolled back by health check      |
| `failed`     | Update failed with error                                  |

### Events

| Event          | From States                  | Description                                      |
| -------------- | ---------------------------- | ------------------------------------------------ |
| `START_UPDATE` | idle                         | Begin update with instance and version info      |
| `PROGRESS`     | updating                     | Progress event from subscription (no transition) |
| `COMPLETE`     | updating                     | Update finished successfully                     |
| `ROLLED_BACK`  | updating                     | Backend health check triggered rollback          |
| `FAILED`       | updating                     | Update failed with error message                 |
| `CANCEL`       | updating                     | User cancels (returns to idle immediately)       |
| `RESET`        | complete, rolledBack, failed | Return to idle                                   |

### Context Shape

```typescript
interface UpdateContext {
  instanceId: string | null;
  fromVersion: string | null;
  toVersion: string | null;
  stage: UpdateStage; // 'PENDING' | 'DOWNLOADING' | 'INSTALLING' | 'VERIFYING' | 'COMPLETE' | 'FAILED' | 'ROLLED_BACK'
  progress: number; // 0-100
  message: string; // Human-readable status message
  error: string | null;
  rolledBack: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}
```

### Usage Example

```typescript
import { updateMachine } from '@nasnet/features/services';
import { useMachine } from '@xstate/react';

const [state, send] = useMachine(updateMachine);

// Start update
send({ type: 'START_UPDATE', instanceId: 'inst-123', fromVersion: '1.0.0', toVersion: '1.1.0' });

// Bridge subscription events to machine
useEffect(() => {
  if (!progressData) return;
  const e = progressData.serviceUpdateProgress;
  send({ type: 'PROGRESS', stage: e.stage, progress: e.progress, message: e.message });
  if (e.stage === 'COMPLETE') send({ type: 'COMPLETE', toVersion: e.newVersion });
  else if (e.rolledBack) send({ type: 'ROLLED_BACK', error: e.error });
  else if (e.stage === 'FAILED') send({ type: 'FAILED', error: e.error });
}, [progressData, send]);

// Display progress
const { progress, message, stage } = state.context;
```

---

## pingMachine

**File:** `libs/features/diagnostics/src/machines/ping-machine.ts` **Export:** `pingMachine`
(singleton)

### Purpose

Manages the lifecycle of a single ping diagnostic test. Tracks results as they arrive from a backend
subscription, computes statistics in real time, and automatically transitions to `complete` when all
expected packets have been received.

### When It Is Used

- Ping tool in `libs/features/diagnostics/src/components/PingTool/`
- Diagnostics dashboard

### State Diagram

```
  idle ──START──► running
   ▲                │
   │     ┌──────────┼────────────────────────┐
   │   STOP│  RESULT_RECEIVED│           ERROR│
   │     ▼            ▼                       ▼
   │  stopped    (if isComplete) ──► complete  error
   │     │              │
   │   START          START
   │     │              │
   └─────┘              └─────────────────────┘
                              ▲ START from any terminal state
```

In `running`, `RESULT_RECEIVED` triggers a guard (`isComplete`) that checks if
`results.length + 1 >= count`. When true, the machine transitions to `complete`; otherwise it stays
in `running` and accumulates the result.

### States

| State      | Description                                  |
| ---------- | -------------------------------------------- |
| `idle`     | Ready to start a test                        |
| `running`  | Test in progress; accumulating results       |
| `stopped`  | User manually stopped; results preserved     |
| `complete` | All packets sent; final statistics available |
| `error`    | Test failed; error message in context        |

### Events

| Event             | From States | Description                       |
| ----------------- | ----------- | --------------------------------- |
| `START`           | any         | Begin new test (resets all state) |
| `JOB_STARTED`     | running     | Backend job ID received           |
| `RESULT_RECEIVED` | running     | New ping result from subscription |
| `STOP`            | running     | User manually stops test          |
| `ERROR`           | running     | Test failed with error            |

### Context Shape

```typescript
interface PingContext {
  target: string; // Host or IP being pinged
  count: number; // Total packets to send
  jobId: string | null; // Backend job ID for cancellation
  results: PingResult[]; // RTT, sequence number, success per packet
  statistics: PingStatistics; // min/max/avg/stdDev RTT, sent/received/lost/lossPercent
  error: string | null;
}
```

### Statistics Calculation

After each `RESULT_RECEIVED`, the `updateStatistics` action calls
`calculateStatistics(context.results)` to recompute all statistics from the current results array.
This keeps statistics live-updating during the test.

### Usage Example

```typescript
import { pingMachine } from '@nasnet/features/diagnostics';
import { useActorRef, useSelector } from '@xstate/react';

const pingActor = useActorRef(pingMachine);

// Start ping test
pingActor.send({ type: 'START', target: '8.8.8.8', count: 10 });

// Feed results from subscription
useEffect(() => {
  if (subscriptionData?.pingResult) {
    pingActor.send({ type: 'RESULT_RECEIVED', result: subscriptionData.pingResult });
  }
}, [subscriptionData]);

// Subscribe to specific context slices (performance optimization)
const statistics = useSelector(pingActor, (state) => state.context.statistics);
const isRunning = useSelector(pingActor, (state) => state.matches('running'));
```

---

## createTroubleshootMachine

**File:** `libs/features/diagnostics/src/machines/troubleshoot-machine.ts` **Export:**
`createTroubleshootMachine(routerId)`

### Purpose

Guides the user through a 5-step network diagnostic wizard (WAN → Gateway → Internet → DNS → NAT).
For each failing step, it optionally presents a suggested fix, applies it, and verifies whether the
fix resolved the issue. Uses compound states for the diagnostic loop.

### When It Is Used

- Troubleshoot wizard in `libs/features/diagnostics/src/components/TroubleshootWizard/`

### State Diagram

```
  idle ──START──► initializing (async: detect WAN interface + gateway)
                       │
                  done (or fail gracefully)
                       │
                       ▼
              runningDiagnostic (compound)
              ┌────────────────────────────────────────────────────────┐
              │                                                         │
              │  executingStep (async: run current diagnostic)          │
              │       │                                                 │
              │      done                                               │
              │       │                                                 │
              │  stepComplete (always transitions)                      │
              │       │                                                 │
              │  ┌────┼──────────────────────┐                         │
              │  │fail+│fix avail        more │ steps              last │
              │  │     ▼                  ▼                           step
              │  │  awaitingFixDecision nextStep ──► executingStep   ──►│
              │  │     │ APPLY_FIX │ SKIP_FIX   (increment index)     │
              │  │     │           │                                   │
              │  │     ▼           └──► nextStep                      │
              │  │  applyingFix (async)                                │
              │  │     │                                               │
              │  │    done                                             │
              │  │     │                                               │
              │  │  verifyingFix (async: re-run same diagnostic)       │
              │  │     │                                               │
              │  │  ┌──┴──┐                                            │
              │  │ fix │   │ fix didn't                                │
              │  │worked│  │ work                                      │
              │  │  ▼   ▼  │                                           │
              │  │nextStep  awaitingFixDecision (loop)                 │
              │  └─────────────────────────────────────────────────────┘
              │
              ▼
           completed (all 5 steps done)
              │
           RESTART ──► idle
```

A global `CANCEL` event transitions from any state to `idle`.

### Diagnostic Steps (Fixed Sequence)

1. **WAN Interface** (`wan`) — Check physical connection
2. **Gateway** (`gateway`) — Ping default gateway
3. **Internet** (`internet`) — Ping external server (8.8.8.8)
4. **DNS** (`dns`) — Test name resolution
5. **NAT** (`nat`) — Verify masquerade rules

### States

**Top-level:** | State | Description |
|----------------------|-----------------------------------------------------| | `idle` | Waiting to
start | | `initializing` | Detecting WAN interface and gateway | | `runningDiagnostic` | Compound:
executing diagnostic steps | | `completed` | All steps finished |

**Inside `runningDiagnostic`:** | Sub-state | Description |
|----------------------|-----------------------------------------------------| | `executingStep` |
Running current diagnostic step async | | `stepComplete` | `always` transition evaluator | |
`awaitingFixDecision`| Showing suggested fix; waiting for user | | `applyingFix` | Applying the
suggested fix async | | `verifyingFix` | Re-running diagnostic to confirm fix worked | | `nextStep`
| `always` transition: increment index or complete |

### Events

| Event       | From States         | Description                        |
| ----------- | ------------------- | ---------------------------------- |
| `START`     | idle                | Begin diagnostics                  |
| `APPLY_FIX` | awaitingFixDecision | Apply the suggested fix            |
| `SKIP_FIX`  | awaitingFixDecision | Skip fix, continue to next step    |
| `RESTART`   | completed           | Reset all steps and return to idle |
| `CANCEL`    | any (global)        | Abort and return to idle           |

### Context Shape

```typescript
interface TroubleshootContext {
  routerId: string;
  wanInterface: string; // Detected in initializing (default: 'ether1')
  gateway: string | null; // Detected default gateway
  steps: DiagnosticStep[]; // Status and results for each of 5 steps
  currentStepIndex: number; // 0-indexed position in steps array
  overallStatus: 'idle' | 'running' | 'completed';
  appliedFixes: string[]; // Issue codes of fixes that were applied
  startTime: Date | null;
  endTime: Date | null;
  error: string | null;
}

interface DiagnosticStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: DiagnosticResult;
  fix?: DiagnosticFix; // Populated from fix-registry when step fails
}
```

### Actor Configuration (Provided at Runtime)

The machine uses XState's `provide()` at runtime to inject diagnostic implementations:

```typescript
const machine = createTroubleshootMachine(routerId);

const actor = createActor(
  machine.provide({
    actors: {
      detectNetworkConfig: fromPromise(async ({ input }) => {
        const config = await api.detectWanInterface(input.routerId);
        return { wanInterface: config.interface, gateway: config.gateway };
      }),
      executeDiagnosticStep: fromPromise(async ({ input }) => {
        return api.runDiagnosticStep(
          input.step.id,
          input.routerId,
          input.wanInterface,
          input.gateway
        );
      }),
      applyFix: fromPromise(async ({ input }) => {
        return api.applyDiagnosticFix(input.routerId, input.fix);
      }),
    },
  })
).start();
```

---

## createVPNConnectionMachine

**File:** `libs/state/machines/src/vpnConnectionMachine.ts` **Export:**
`createVPNConnectionMachine(services)`, `useVPNConnection(services)`

### Purpose

Manages the VPN connection lifecycle: connection establishment with 30-second timeout, automatic
reconnection with exponential backoff (max 3 attempts), real-time metrics updates, and graceful
disconnection.

### When It Is Used

- VPN status panel
- VPN connection button components

### State Diagram

```
  disconnected ──CONNECT──► connecting (30s timeout)
       ▲                        │               │
       │                   success│         timeout/error│
   clearConnection               ▼                      ▼
       │                     connected             error ──RETRY──► connecting
       │                    │   │   │                │
   DISCONNECT          METRICS│  │   │CONNECTION_LOST  DISMISS──► disconnected
       │                UPDATE  │   │
       │                      DISCONNECT│
       ▼                         │
  disconnecting (async)          ▼
       │                   reconnecting (exponential backoff, max 3)
      done                       │
       │               ┌─────────┴─────────┐
       ▼          success│              fail│
  disconnected           ▼                 │
                     connected    canReconnect? yes ──► reconnecting
                                           │ no
                                           ▼
                                      disconnected
```

The `reconnecting` state also has a 10-second timeout that forces `disconnected` if the reconnection
attempt hangs.

### States

| State           | Description                                       |
| --------------- | ------------------------------------------------- |
| `disconnected`  | Not connected; clears connection context on entry |
| `connecting`    | Establishing connection (30s timeout)             |
| `connected`     | Active connection; receives real-time metrics     |
| `reconnecting`  | Auto-reconnect with exponential backoff           |
| `disconnecting` | Graceful closure (close API call)                 |
| `error`         | Connection failed; offers RETRY or DISMISS        |

### Events

| Event             | From States  | Description                                       |
| ----------------- | ------------ | ------------------------------------------------- |
| `CONNECT`         | disconnected | Initiate connection with serverAddress + provider |
| `DISCONNECT`      | connected    | Graceful disconnect                               |
| `METRICS_UPDATE`  | connected    | Real-time bandwidth/traffic data (no transition)  |
| `CONNECTION_LOST` | connected    | Unexpected drop; triggers reconnect               |
| `RETRY`           | error        | Retry after error                                 |
| `DISMISS`         | error        | Dismiss error and go to disconnected              |

### Context Shape

```typescript
interface VPNConnectionContext {
  connectionId: string | null;
  provider: string | null; // 'wireguard' | 'openvpn' | etc.
  serverAddress: string | null;
  metrics: ConnectionMetrics | null; // Bandwidth, uptime, packets
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number; // Default: 3
}
```

### Exponential Backoff

The `attemptReconnect` actor applies backoff before calling the reconnection API:

```typescript
const delay = BACKOFF_BASE_MS * Math.pow(2, input.attempt || 0);
await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 8000)));
// attempt 0 → 1s, attempt 1 → 2s, attempt 2 → 4s, capped at 8s
```

### React Hook

The `useVPNConnection` hook wraps `useMachine` and provides a clean API:

```typescript
import { useVPNConnection } from '@nasnet/state/machines';

function VPNStatusPanel() {
  const vpn = useVPNConnection({
    establishConnection: async ({ serverAddress, provider }) => {
      const result = await api.connectVPN(serverAddress, provider);
      return { connectionId: result.id };
    },
    attemptReconnect: async ({ serverAddress, provider }) => {
      const result = await api.reconnectVPN(serverAddress, provider);
      return { connectionId: result.id };
    },
    closeConnection: async (connectionId) => {
      await api.disconnectVPN(connectionId);
    },
  });

  return (
    <div>
      <StatusBadge status={vpn.state} />
      {vpn.isConnected && <MetricsDisplay metrics={vpn.metrics} />}
      {vpn.isError && <ErrorPanel error={vpn.error} onRetry={vpn.retry} />}
      <Button onClick={vpn.isConnected ? vpn.disconnect : () => vpn.connect('vpn.example.com', 'wireguard')}>
        {vpn.isConnected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  );
}
```

Return value includes: `state`, `connectionId`, `provider`, `serverAddress`, `metrics`, `error`,
`reconnectAttempts`, `isConnected`, `isConnecting`, `isError`, `connect()`, `disconnect()`,
`retry()`, `dismissError()`, `updateMetrics()`, `reportConnectionLost()`.

---

## Pattern: Factory Functions vs. Singleton Machines

NasNetConnect uses two patterns for defining machines:

### Factory Functions (Most Machines)

Used when the machine needs different async implementations per use case, or when multiple
independent instances must coexist:

```typescript
// Each call produces a distinct machine instance with its own actor
const wireguardMachine = createConfigPipelineMachine<WireGuardConfig>({ ... });
const openvpnMachine = createConfigPipelineMachine<OpenVPNConfig>({ ... });
const troubleshootMachine1 = createTroubleshootMachine('router-id-1');
const troubleshootMachine2 = createTroubleshootMachine('router-id-2');
```

Factory machines: `createConfigPipelineMachine`, `createChangeSetMachine`,
`createTemplateApplyMachine`, `createResourceLifecycleMachine`, `createWizardMachine`,
`createTroubleshootMachine`, `createVPNConnectionMachine`.

### Singleton Machines (Simple Workflows)

Used when the machine is stateless by configuration (all variation comes from events/context) and
only one instance runs at a time per component:

```typescript
// The machine definition is shared; each useMachine() call creates a new actor
import { updateMachine } from '@nasnet/features/services';
import { pingMachine } from '@nasnet/features/diagnostics';

const [updateState, sendUpdate] = useMachine(updateMachine);
const [pingState, sendPing] = useMachine(pingMachine);
```

Singleton machines: `updateMachine`, `pingMachine`.

### Choosing the Right Pattern

Use a **factory** when:

- The machine needs access to specific API functions (e.g., `applyConfig` for a specific resource
  type)
- Multiple isolated instances run simultaneously (e.g., one troubleshooter per router panel)
- The machine has configurable callbacks (`onSuccess`, `onError`)

Use a **singleton** when:

- All variation is driven by events and context (no closure dependencies)
- Only one instance runs at a time within a component tree
- The machine is simple and self-contained

---

## Cross-References

- For Zustand stores that feed events into these machines: `libs/features/docs/state-management.md`
- For the Apply-Confirm-Merge pattern overview: `Docs/architecture/data-architecture.md`
- For safety pipeline pattern ADR: `Docs/architecture/novel-pattern-designs.md`
- For the config pipeline's 7-stage validation pipeline: `Docs/architecture/api-contracts.md`
- For XState v5 official docs: https://stately.ai/docs
