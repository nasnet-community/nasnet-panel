---
sidebar_position: 11
title: State Machines Guide
---

# State Machines Guide

This guide documents the XState machines used in NasNetConnect for managing complex, multi-step workflows.

## XState Overview

NasNetConnect uses **XState** for modeling stateful, asynchronous workflows that:

- **Cannot be easily expressed as simple React state** — Complex flows with guards, timeouts, and side effects
- **Require guaranteed state transitions** — Formal state machine semantics prevent invalid states
- **Need explicit state modeling** — Business logic is self-documenting through machine definition

**Key Benefits:**
- Prevent impossible states (invalid state transitions are rejected)
- Automatic timeout/cleanup management
- Built-in support for parallel states and hierarchical machines
- Time-travel debugging with visualizer
- Testable and mockable (pure functions with deterministic output)

**Version:** XState v4.x

---

## Machine Architecture

All machines in NasNetConnect follow a consistent factory pattern:

```typescript
// Factory function accepts dependency-injected services
export function createMachine<TContext, TEvent>(
  config: MachineConfig<TContext, TEvent>
) {
  return setup({
    types: { context: {} as TContext, events: {} as TEvent },
    actors: { /* async actors for side effects */ },
    guards: { /* state transition guards */ },
  }).createMachine({
    // State machine definition
  });
}
```

**Why this pattern?**
1. **Dependency injection** — Services (API calls, validators) passed at creation time
2. **Testability** — Mock services easily, test state transitions without network calls
3. **Reusability** — Same machine logic used across multiple components with different services

### Example: Dependency Injection

```typescript
import { useMachine } from '@xstate/react';
import { createConfigPipelineMachine } from '@nasnet/state/machines';

function ConfigForm({ routerId }: { routerId: string }) {
  const [state, send] = useMachine(
    createConfigPipelineMachine({
      id: 'firewall-config',
      // Inject services (API calls, validators)
      runValidationPipeline: async (config) => {
        // Call validation API
        return await validateConfig(routerId, config);
      },
      applyConfig: async ({ config }) => {
        // Call apply API
        return await applyRouterConfig(routerId, config);
      },
      verifyApplied: async () => {
        // Poll router to verify changes
        return await verifyRouterConfig(routerId);
      },
      executeRollback: async (rollbackData) => {
        // Call rollback API
        return await rollbackRouterConfig(routerId, rollbackData);
      },
    })
  );

  return /* UI */;
}
```

---

## changeSetMachine

**Atomic Multi-Resource Operations**

Orchestrates applying multiple interdependent changes in the correct order with automatic rollback.

### States

```
idle
  ↓
validating  ← START_VALIDATION
  ↓
ready  ← validation passed
  ├→ APPLY → applying
  │          ├→ applyingItem (apply current item)
  │          └→ checkingMore (more items?)
  │              ├→ applyingItem (next item)
  │              └→ completed ✓
  │
  └→ CANCEL → cancelled
      ↓
  rolledBack (items rolled back)

applying → failed → (optional: rollback)
       ↓
   rollingBack
       ├→ rolledBack ✓
       └→ partialFailure ⚠ (manual intervention)
```

### Context

```typescript
interface ChangeSetMachineContext {
  changeSet: ChangeSet | null;           // Multi-resource operation
  routerId: string | null;               // Target router
  validationResult: ValidationResult | null;
  currentItemIndex: number;              // Progress tracking
  sortedItems: ChangeSetItem[];          // Topologically sorted
  appliedItems: ChangeSetItem[];         // Already applied
  rollbackPlan: RollbackStep[];          // Items to roll back
  error: ChangeSetError | null;
  errorMessage: string | null;
  cancelRequested: boolean;
  applyStartedAt: number | null;
  onProgress?: (event: ProgressEvent) => void;
}
```

### Events

```typescript
type ChangeSetMachineEvent =
  | { type: 'LOAD'; changeSet: ChangeSet; routerId: string }
  | { type: 'START_VALIDATION' }
  | { type: 'APPLY' }
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'FORCE_ROLLBACK' };
```

### Safety Features

1. **Cannot skip validation** — All items validated before apply
2. **Dependency-ordered apply** — Topological sort ensures dependencies applied first
3. **Automatic rollback** — Applied items rolled back in reverse order on failure
4. **Cancellation points** — Can cancel only at safe checkpoints (after validation, between items)
5. **Progress tracking** — Real-time progress via `onProgress` callback

### Helper Functions

```typescript
import { isChangeSetProcessing, isChangeSetFinal } from '@nasnet/state/machines';

// Check if operation in progress
if (isChangeSetProcessing(state.value)) {
  // Show progress UI
}

// Check if operation finished
if (isChangeSetFinal(state.value)) {
  // Close dialog, refresh data
}
```

### Usage Example

```typescript
import { useMachine } from '@xstate/react';
import { createChangeSetMachine } from '@nasnet/state/machines';

function ChangeSetApplyDialog({ changeSet, routerId }: Props) {
  const [state, send] = useMachine(
    createChangeSetMachine({
      id: 'changeset-apply',
      onValidate: async (items) => {
        return await validateChangeSet(routerId, items);
      },
      onApply: async (item) => {
        return await applyChangeSetItem(routerId, item);
      },
      onRollback: async (item) => {
        return await rollbackChangeSetItem(routerId, item);
      },
    })
  );

  useEffect(() => {
    // Load change set
    send({ type: 'LOAD', changeSet, routerId });
    // Start validation
    send({ type: 'START_VALIDATION' });
  }, [changeSet, routerId]);

  if (state.matches('validating')) {
    return <LoadingSpinner>Validating changes...</LoadingSpinner>;
  }

  if (state.matches('invalid')) {
    return <ErrorAlert errors={state.context.validationErrors} />;
  }

  if (state.matches('applying')) {
    return (
      <ProgressBar
        current={state.context.currentItemIndex}
        total={state.context.sortedItems.length}
      />
    );
  }

  if (state.matches('completed')) {
    return <SuccessAlert message="All changes applied successfully" />;
  }

  return null;
}
```

---

## configPipelineMachine

**Safety-First Configuration (Apply-Confirm-Merge Pattern)**

Implements a safety flow preventing accidental network lockouts through explicit state modeling.

### States

```
idle
  ↓
draft (EDIT)
  ↓
validating (VALIDATE)
  ├→ invalid (errors found)
  │   └→ draft (FIX_ERRORS)
  │
  └→ previewing (no errors)
      ├→ confirming (high-risk? ACKNOWLEDGED required)
      │   └→ applying
      │       ├→ verifying
      │       │   ├→ active ✓
      │       │   └→ rollback → rolled_back
      │       └→ error
      │
      └→ applying (low-risk)
```

### Context

```typescript
interface ConfigPipelineContext<TConfig> {
  resourceId: string | null;
  originalConfig: TConfig | null;
  pendingConfig: TConfig | null;
  validationErrors: ValidationError[];
  diff: ConfigDiff | null;
  rollbackData: TConfig | null;
  applyStartedAt: number | null;
  errorMessage: string | null;
}
```

### Events

```typescript
type ConfigPipelineEvent<TConfig> =
  | { type: 'EDIT'; config: TConfig }
  | { type: 'VALIDATE' }
  | { type: 'CONFIRM' }
  | { type: 'ACKNOWLEDGED' }  // High-risk ops require explicit ack
  | { type: 'CANCEL' }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'FORCE_ROLLBACK' };
```

### Configuration

```typescript
interface ConfigPipelineConfig<TConfig> {
  id?: string;
  runValidationPipeline: (config: TConfig) => Promise<ValidationPipelineResult>;
  applyConfig: (params: { resourceId: string; config: TConfig }) => Promise<ApplyResult>;
  verifyApplied: (resourceId: string) => Promise<void>;
  executeRollback: (rollbackData: TConfig) => Promise<void>;
}
```

### Guards

```typescript
// High-risk operations require explicit acknowledgment
guard: ({ context, event }) => {
  return context.diff?.isHighRisk === false;
}

// Can only confirm after validation passes
guard: ({ context }) => {
  return context.validationErrors.length === 0;
}

// Can only apply after confirmed
guard: ({ context }) => {
  return context.rollbackData !== null;
}
```

### Safety Flow

```
1. Draft    — User edits configuration
                ↓
2. Validate — 7-stage validation pipeline (schema, semantic, network, etc.)
                ↓
3. Preview  — Show diff of changes (added, removed, modified)
                ↓
4. Confirm  — For high-risk ops: require explicit ACKNOWLEDGED event
                ↓
5. Apply    — Send configuration to router
                ↓
6. Verify   — Confirm router accepted changes
                ↓
7. Success/Rollback — Operation complete or auto-rollback on failure
```

### Helper Functions

```typescript
import {
  isPipelineFinal,
  isPipelineCancellable,
  isPipelineProcessing,
  getPipelineStateDescription,
} from '@nasnet/state/machines';

const description = getPipelineStateDescription(state.value);
// Returns: "Validating configuration", "Waiting for confirmation", etc.

if (isPipelineProcessing(state.value)) {
  // Show spinner
}

if (isPipelineCancellable(state.value)) {
  // Show cancel button
}
```

### Usage Example

```typescript
import { useConfigPipeline } from '@nasnet/state/machines';

function FirewallRuleForm({ routerId, ruleId }: Props) {
  const pipeline = useConfigPipeline({
    id: 'firewall-form',
    runValidationPipeline: async (rule) => {
      const result = await validateFirewallRule(routerId, rule);
      return { errors: result.errors, diff: result.diff };
    },
    applyConfig: async ({ config }) => {
      const rollbackData = await applyRule(routerId, config);
      return { rollbackData };
    },
    verifyApplied: async () => {
      await verifyRuleApplied(routerId, ruleId);
    },
    executeRollback: async (rollbackData) => {
      await applyRule(routerId, rollbackData);
    },
  });

  return (
    <>
      {pipeline.state.matches('draft') && (
        <RuleEditor
          rule={pipeline.pendingConfig}
          onChange={(rule) => pipeline.send({ type: 'EDIT', config: rule })}
          onValidate={() => pipeline.send({ type: 'VALIDATE' })}
        />
      )}

      {pipeline.state.matches('previewing') && (
        <PreviewDialog
          diff={pipeline.diff}
          isHighRisk={pipeline.diff?.isHighRisk}
          onConfirm={() => {
            if (pipeline.diff?.isHighRisk) {
              // High-risk: require explicit ack
              pipeline.send({ type: 'ACKNOWLEDGED' });
            } else {
              pipeline.send({ type: 'CONFIRM' });
            }
          }}
          onCancel={() => pipeline.send({ type: 'CANCEL' })}
        />
      )}

      {pipeline.state.matches('applying') && (
        <ProgressDialog message="Applying configuration..." />
      )}

      {pipeline.state.matches('error') && (
        <ErrorDialog
          error={pipeline.errorMessage}
          onRetry={() => pipeline.send({ type: 'RETRY' })}
          onReset={() => pipeline.send({ type: 'RESET' })}
        />
      )}
    </>
  );
}
```

---

## resourceLifecycleMachine

**Resource Lifecycle Management (9-State Lifecycle)**

Models the complete lifecycle of a router resource (interface, service, tunnel, etc.).

### States

```
draft       — Resource being configured, not yet applied
  ↓
validating  — Validation in progress
  ├→ invalid (revert to draft)
  └→ valid
      ↓
  applying   — Applying to router
      ├→ active ✓ (running successfully)
      │   ├→ degraded (health check fails)
      │   │   └→ active (recovered)
      │   ├→ error (unexpected failure)
      │   │   └→ active (recovered)
      │   └→ deprecated (newer version available)
      │       └→ syncing (updating)
      │           └→ active
      │
      └→ archived (no longer needed)
```

### Context

```typescript
interface ResourceLifecycleContext<TResource> {
  resource: TResource | null;
  state: ResourceState;
  validationErrors: ValidationError[];
  healthStatus: 'healthy' | 'degraded' | 'error' | null;
  lastHealthCheck: number | null;
  availableVersion?: string;
  error: Error | null;
  metrics?: ResourceMetrics;
}
```

### Health Monitoring

```typescript
// Health check runs periodically when active
onHealthCheck: async (resourceId: string) => {
  const health = await getResourceHealth(resourceId);
  return {
    status: health.status,  // 'healthy' | 'degraded' | 'error'
    metrics: health.metrics,
  };
}
```

### Degradation Detection

- Network latency > 500ms → degraded
- Packet loss > 5% → degraded
- Memory usage > 90% → degraded
- Explicit error response → error

### Helper Functions

```typescript
import {
  isResourcePending,
  isResourceActive,
  isResourceEditable,
  isResourceAppliable,
  getResourceStateDisplayInfo,
} from '@nasnet/state/machines';

if (isResourceEditable(state.value)) {
  // Show edit form
}

if (isResourceActive(state.value)) {
  // Show health status
}

if (isResourcePending(state.value)) {
  // Show spinner
}

const { label, color, icon } = getResourceStateDisplayInfo(state.value);
```

---

## vpnConnectionMachine

**VPN Connection Flow with Auto-Reconnect**

Manages VPN connection lifecycle with exponential backoff reconnection.

### States

```
disconnected
  ├→ CONNECT
  └→ connecting (timeout: 30s)
      ├→ connected ✓
      │   ├→ DISCONNECT → disconnected
      │   ├→ CONNECTION_LOST
      │   │   └→ reconnecting (backoff: 1s, 2s, 4s, 8s...)
      │   │       ├→ connected ✓
      │   │       └→ CONNECTION_LOST (max retries?)
      │   │           └→ error
      │   └→ METRICS_UPDATE (real-time speed/latency)
      │
      └→ error (timeout or connection failed)
          └→ RETRY or DISCONNECT
```

### Context

```typescript
interface VPNConnectionContext {
  connectionId: string | null;
  provider: string | null;           // 'wireguard' | 'openvpn' | etc.
  serverAddress: string | null;
  metrics: ConnectionMetrics | null;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;      // Default: 5
}
```

### Metrics

```typescript
interface ConnectionMetrics {
  uploadSpeed: number;               // bytes/sec
  downloadSpeed: number;             // bytes/sec
  bytesUploaded: number;
  bytesDownloaded: number;
  latencyMs: number;
  uptimeSeconds: number;
  serverLocation?: string;
}
```

### Exponential Backoff

```typescript
// Reconnection attempts with exponential backoff
const BACKOFF_MS = [
  1000,   // Attempt 1: 1 second
  2000,   // Attempt 2: 2 seconds
  4000,   // Attempt 3: 4 seconds
  8000,   // Attempt 4: 8 seconds
  16000,  // Attempt 5: 16 seconds
];

// After max attempts, enter error state
if (reconnectAttempts >= maxReconnectAttempts) {
  // → error state
}
```

### Hook: useVPNConnection

```typescript
import { useVPNConnection } from '@nasnet/state/machines';

function VPNStatusWidget() {
  const vpn = useVPNConnection({
    onConnect: async (serverAddress, provider) => {
      return await connectVPN(serverAddress, provider);
    },
    onDisconnect: async (connectionId) => {
      return await disconnectVPN(connectionId);
    },
    onMetricsUpdate: async (connectionId) => {
      return await getVPNMetrics(connectionId);
    },
  });

  return (
    <>
      {vpn.state.matches('disconnected') && (
        <Button onClick={() => vpn.send({ type: 'CONNECT', ... })}>
          Connect to VPN
        </Button>
      )}

      {vpn.state.matches('connecting') && (
        <LoadingSpinner>Connecting to {vpn.serverAddress}...</LoadingSpinner>
      )}

      {vpn.state.matches('connected') && (
        <>
          <StatusBadge status="online" />
          <SpeedIndicator
            upload={vpn.metrics?.uploadSpeed}
            download={vpn.metrics?.downloadSpeed}
          />
          <Button onClick={() => vpn.send({ type: 'DISCONNECT' })}>
            Disconnect
          </Button>
        </>
      )}

      {vpn.state.matches('error') && (
        <>
          <ErrorAlert message={vpn.error} />
          <Button onClick={() => vpn.send({ type: 'RETRY' })}>
            Retry
          </Button>
        </>
      )}
    </>
  );
}
```

---

## wizardMachine

**Multi-Step Wizard Pattern**

Generic wizard machine supporting step navigation, validation, and session persistence.

### States

```
step (editing step)
  ├→ NEXT
  │   └→ validating
  │       ├→ step (validation passed)
  │       └→ step (validation failed, show errors)
  │
  ├→ BACK
  │   └→ step (previous)
  │
  ├→ GOTO
  │   └→ step (jump to step if canSkip)
  │
  └→ SUBMIT (on last step)
      └→ submitting
          ├→ completed ✓
          └→ error (can RETRY)

OR at any time:
  └→ CANCEL → cancelled
```

### Context

```typescript
interface WizardContext<TData> {
  currentStep: number;                // 1-indexed
  totalSteps: number;
  data: Partial<TData>;              // Collected across steps
  errors: Record<string, string>;    // Field errors
  sessionId: string;                 // For persistence
  canSkip?: boolean;                 // Skip to any step?
}
```

### Events

```typescript
type WizardEvent<TData> =
  | { type: 'NEXT'; data?: Partial<TData> }
  | { type: 'BACK' }
  | { type: 'GOTO'; step: number }
  | { type: 'VALIDATE' }
  | { type: 'SUBMIT' }
  | { type: 'CANCEL' }
  | { type: 'RESTORE'; savedContext: WizardContext<TData> }
  | { type: 'SET_DATA'; data: Partial<TData> }
  | { type: 'CLEAR_ERRORS' };
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
  persist?: boolean;  // Default: true
}
```

### Step Validation

```typescript
// Each step validates independently
async validateStep(step, data) {
  switch (step) {
    case 1:  // Connection details
      if (!data.serverAddress) return { valid: false, errors: { ... } };
      if (!isValidIPv4(data.serverAddress)) return { valid: false, ... };
      return { valid: true };

    case 2:  // Credentials
      if (!data.username) return { valid: false, ... };
      if (!data.password) return { valid: false, ... };
      return { valid: true };

    case 3:  // Advanced options
      // Server-side validation (e.g., check protocol compatibility)
      return await validateAdvancedOptions(data);

    case 4:  // Confirm
      return { valid: true };  // No validation needed

    default:
      return { valid: true };
  }
}
```

### Session Persistence

```typescript
// Wizard state auto-saved to localStorage
// On browser close/refresh, user can resume

// Option 1: Auto-restore (prompt user)
const wizard = useWizard({
  persist: true,
  onRestore: () => console.log('Session restored'),
  onDiscard: () => console.log('Session discarded'),
});

// Option 2: Manual restore
const savedState = localStorage.getItem('wizard-state');
if (savedState) {
  wizard.send({
    type: 'RESTORE',
    savedContext: JSON.parse(savedState),
  });
}
```

### Hook: useWizard

```typescript
import { useWizard } from '@nasnet/state/machines';

interface VPNWizardData {
  serverAddress: string;
  port: number;
  protocol: 'wireguard' | 'openvpn';
  username: string;
  password: string;
}

function VPNSetupWizard() {
  const wizard = useWizard<VPNWizardData>({
    id: 'vpn-setup',
    totalSteps: 4,
    validateStep: async (step, data) => {
      // Per-step validation
      const validation = await validateVPNWizardStep(step, data);
      return validation;
    },
    onSubmit: async (data) => {
      // Create VPN connection
      await createVPNConnection(data);
    },
    persist: true,
  });

  const isLastStep = wizard.currentStep === wizard.totalSteps;

  return (
    <>
      <ProgressBar
        current={wizard.currentStep}
        total={wizard.totalSteps}
      />

      {wizard.currentStep === 1 && (
        <ServerAddressStep
          value={wizard.data.serverAddress}
          error={wizard.errors.serverAddress}
          onChange={(value) => wizard.send({
            type: 'SET_DATA',
            data: { serverAddress: value },
          })}
        />
      )}

      {wizard.currentStep === 2 && (
        <ProtocolStep
          value={wizard.data.protocol}
          onChange={(value) => wizard.send({
            type: 'SET_DATA',
            data: { protocol: value },
          })}
        />
      )}

      {wizard.currentStep === 3 && (
        <CredentialsStep
          username={wizard.data.username}
          password={wizard.data.password}
          onChange={(username, password) => wizard.send({
            type: 'SET_DATA',
            data: { username, password },
          })}
        />
      )}

      {wizard.currentStep === 4 && (
        <ConfirmStep data={wizard.data} />
      )}

      <div className="wizard-buttons">
        <Button
          disabled={wizard.currentStep === 1}
          onClick={() => wizard.send({ type: 'BACK' })}
        >
          Back
        </Button>

        <Button
          onClick={() => {
            if (isLastStep) {
              wizard.send({ type: 'SUBMIT' });
            } else {
              wizard.send({ type: 'NEXT' });
            }
          }}
          loading={wizard.state.matches('submitting')}
        >
          {isLastStep ? 'Create' : 'Next'}
        </Button>

        <Button
          variant="ghost"
          onClick={() => wizard.send({ type: 'CANCEL' })}
        >
          Cancel
        </Button>
      </div>

      {wizard.state.matches('completed') && (
        <SuccessDialog message="VPN connection created!" />
      )}

      {wizard.state.matches('error') && (
        <ErrorDialog
          error={wizard.error}
          onRetry={() => wizard.send({ type: 'SUBMIT' })}
        />
      )}
    </>
  );
}
```

---

## Machine Hooks

All machines provide React hooks for convenient integration:

### useChangeSet

```typescript
const changeSet = useChangeSet(config);
// Properties:
// - state: ChangeSetState
// - context: ChangeSetMachineContext
// - send: (event) => void
// - matches: (state) => boolean
```

### useConfigPipeline

```typescript
const pipeline = useConfigPipeline(config);
// Properties:
// - state: ConfigPipelineState
// - stateDescription: string
// - resourceId, pendingConfig, diff, errorMessage: context properties
// - isFinal, isProcessing, isCancellable: booleans
// - send: (event) => void
```

### useResourceLifecycle

```typescript
const resource = useResourceLifecycle(config);
// Properties:
// - state: ResourceState
// - resource, validationErrors, healthStatus: context
// - send: (event) => void
```

### useVPNConnection

```typescript
const vpn = useVPNConnection(config);
// Properties:
// - state: VPNConnectionState
// - connectionId, provider, metrics, error: context
// - send: (event) => void
```

### useWizard

```typescript
const wizard = useWizard<TData>(config);
// Properties:
// - currentStep, totalSteps, data, errors, sessionId: context
// - state: WizardState
// - isFirstStep, isLastStep: computed
// - send: (event) => void
```

---

## Persistence

The persistence module provides utilities for saving and restoring machine state:

```typescript
// libs/state/machines/src/persistence.ts
import {
  saveMachineState,
  restoreMachineState,
  clearMachineState,
} from '@nasnet/state/machines';

// Save on state change
const subscription = actor.subscribe((state) => {
  if (!state.matches('idle')) {
    saveMachineState('wizard-vpn', {
      state: state.value,
      context: state.context,
      timestamp: Date.now(),
      machineId: 'vpn-wizard',
    });
  }
});

// Restore on mount
const saved = restoreMachineState('wizard-vpn', {
  maxAge: 86400000,  // 24 hours
  promptBeforeRestore: true,
});

if (saved) {
  send({ type: 'RESTORE', savedContext: saved.context });
}

// Clear when complete
send({ type: 'RESET' });
clearMachineState('wizard-vpn');
```

---

## Integration with Validation Pipeline

Machines integrate with the 7-stage validation pipeline:

```
Stage 1: Schema Validation      (Zod, format checks)
Stage 2: Semantic Validation    (Business rules)
Stage 3: Network Validation     (Router connectivity)
Stage 4: Conflict Detection     (Service conflicts)
Stage 5: Performance Checks     (Resource constraints)
Stage 6: Security Checks        (Access control, firewall)
Stage 7: Compatibility Check    (RouterOS version, hardware)
```

Machine calls:

```typescript
const validationResult = await runValidationPipeline(config);
// Returns:
// {
//   errors: ValidationError[],
//   diff: ConfigDiff,
//   isHighRisk: boolean,
// }
```

---

## State Diagram: Config Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIG PIPELINE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

         EDIT
         ↓
    ┌─────────────┐
    │   DRAFT     │  ← User editing config
    └─────┬───────┘
          │ VALIDATE
          ↓
    ┌─────────────┐
    │  VALIDATING │  ← 7-stage validation pipeline
    └──┬──────┬──┘
       │      │
   Invalid  Valid
       │      │
       ↓      ↓
    ┌─────────────────┐
    │    INVALID      │  ← Show errors, go back to DRAFT
    └──────┬──────────┘
           │ FIX → EDIT
           └─→ DRAFT

       Valid
       ↓
    ┌──────────────┐
    │  PREVIEWING  │  ← Show diff of changes
    └──┬───────────┘
       │ CONFIRM (or ACKNOWLEDGED if high-risk)
       ↓
    ┌──────────────┐
    │  CONFIRMING  │  ← For high-risk: require explicit ACKNOWLEDGED
    └──┬───────────┘
       │ → APPLYING
       ↓
    ┌──────────────┐
    │   APPLYING   │  ← Send to router
    └──┬───────────┘
       │ → VERIFYING
       ↓
    ┌──────────────┐
    │  VERIFYING   │  ← Confirm router accepted
    └──┬───────────┘
       │ Success
       ├─→ ACTIVE ✓
       │
       │ Failure
       ├─→ ROLLBACK → ROLLED_BACK
       │
       └─→ ERROR (with auto-retry)
           ↓ RETRY
           → APPLYING
```

---

## Testing State Machines

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createTestingUtils } from '@xstate/test';
import { createConfigPipelineMachine } from '@nasnet/state/machines';

describe('configPipelineMachine', () => {
  it('should validate before applying', async () => {
    const machine = createConfigPipelineMachine({
      runValidationPipeline: vi.fn().mockResolvedValue({
        errors: [],
        diff: { added: [], removed: [], modified: [] },
      }),
      applyConfig: vi.fn().mockResolvedValue({ rollbackData: {} }),
      verifyApplied: vi.fn(),
      executeRollback: vi.fn(),
    });

    const state = machine.initialState;
    expect(state.matches('idle')).toBe(true);

    const nextState = state.transitions.find(t => t.event.type === 'EDIT');
    expect(nextState?.target.matches('draft')).toBe(true);
  });

  it('should auto-rollback on verification failure', async () => {
    const mockRollback = vi.fn();
    const machine = createConfigPipelineMachine({
      runValidationPipeline: vi.fn().mockResolvedValue({
        errors: [],
        diff: {},
      }),
      applyConfig: vi.fn().mockResolvedValue({ rollbackData: {} }),
      verifyApplied: vi.fn().mockRejectedValue(new Error('Verify failed')),
      executeRollback: mockRollback,
    });

    // ... run through state transitions
    // ... assert mockRollback was called
  });
});
```

---

## Summary Table

| Machine | Purpose | States | Main Events |
|---------|---------|--------|-------------|
| **changeSetMachine** | Atomic multi-resource ops | idle, validating, ready, applying, completed, failed | LOAD, START_VALIDATION, APPLY, CANCEL, RETRY |
| **configPipelineMachine** | Safety-first config | draft, validating, previewing, confirming, applying, active, error | EDIT, VALIDATE, CONFIRM, ACKNOWLEDGED, APPLY |
| **resourceLifecycleMachine** | Resource lifecycle | draft, validating, applying, active, degraded, error, archived | APPLY, HEALTH_UPDATE, UPGRADE |
| **vpnConnectionMachine** | VPN connections | disconnected, connecting, connected, reconnecting, error | CONNECT, DISCONNECT, CONNECTION_LOST, METRICS_UPDATE |
| **wizardMachine** | Multi-step wizards | step, validating, submitting, completed, cancelled | NEXT, BACK, GOTO, SUBMIT, VALIDATE, CANCEL |

---

## Further Reading

- [XState Documentation](https://xstate.js.org/)
- [XState React Integration](https://xstate.js.org/docs/packages/xstate-react/)
- `Docs/architecture/novel-pattern-designs.md` — Safety Pipeline, Apply-Confirm-Merge
- `Docs/architecture/implementation-patterns/universal-state-architecture.md` — Detailed patterns
