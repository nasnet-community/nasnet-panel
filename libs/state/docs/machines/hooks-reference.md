---
sidebar_position: 7
title: Machine Hooks Reference
---

# Machine Hooks Reference

Complete API reference for XState machine hooks in NasNet.

**Source:** `libs/state/machines/src/hooks/`

All hooks provide TypeScript-first React integration with XState machines, handling persistence,
async operations, and lifecycle management automatically.

## useWizard

Multi-step form wizard for sequential workflows (setup, pairing, configuration).

**Source:** `libs/state/machines/src/hooks/useWizard.ts`

### Basic Variant

```typescript
function useWizard<TData extends Record<string, unknown>>(
  config: WizardConfig<TData>,
  options?: UseWizardOptions
): UseWizardReturn<TData>;
```

### Parameters

| Parameter             | Type                                        | Default  | Description                                |
| --------------------- | ------------------------------------------- | -------- | ------------------------------------------ |
| `config`              | `WizardConfig<TData>`                       | Required | Wizard configuration (see below)           |
| `config.id`           | `string`                                    | Required | Unique machine ID for persistence          |
| `config.totalSteps`   | `number`                                    | Required | Total number of steps (1-indexed)          |
| `config.validateStep` | `(step, data) => Promise<{valid, errors?}>` | Required | Validation function for each step          |
| `config.onSubmit`     | `(data: TData) => Promise<void>`            | Required | Handler when wizard completes              |
| `config.initialData`  | `Partial<TData>`                            | `{}`     | Initial form data                          |
| `options.autoPersist` | `boolean`                                   | `true`   | Auto-save state to localStorage            |
| `options.autoRestore` | `boolean`                                   | `false`  | Auto-restore on mount (vs. showing prompt) |
| `options.onRestore`   | `() => void`                                | —        | Callback when session restored             |
| `options.onComplete`  | `() => void`                                | —        | Callback when wizard completes             |
| `options.onCancel`    | `() => void`                                | —        | Callback when wizard cancelled             |

### Return Values

```typescript
interface UseWizardReturn<TData> {
  // State
  currentStep: number; // 1-indexed current step
  totalSteps: number; // Total steps
  data: Partial<TData>; // Collected form data
  errors: Record<string, string>; // Validation errors by field
  sessionId: string; // Session ID for tracking
  progress: number; // 0-100 progress percentage

  // Status Flags
  isValidating: boolean; // Currently validating step
  isSubmitting: boolean; // Currently submitting form
  isCompleted: boolean; // Wizard completed successfully
  isCancelled: boolean; // Wizard was cancelled
  isFirstStep: boolean; // On first step
  isLastStep: boolean; // On last step
  canRestore: boolean; // Session can be resumed
  savedSessionAge: string | null; // "2 hours ago" or null

  // Actions
  next: (data?: Partial<TData>) => void; // Advance to next step
  back: () => void; // Go to previous step
  goToStep: (step: number) => void; // Jump to specific step
  setData: (data: Partial<TData>) => void; // Update without advancing
  clearErrors: () => void; // Clear validation errors
  cancel: () => void; // Cancel wizard
  restore: () => void; // Resume saved session
  discardSession: () => void; // Discard saved session
  canAccessStep: (step: number) => boolean; // Check if step accessible
}
```

### Example

```typescript
interface VPNSetupData {
  provider: 'wireguard' | 'openvpn';
  serverAddress: string;
  credentials: { username: string; password: string };
}

function VPNWizard() {
  const wizard = useWizard<VPNSetupData>(
    {
      id: 'vpn-setup',
      totalSteps: 3,
      validateStep: async (step, data) => {
        if (step === 1 && !data.provider) {
          return { valid: false, errors: { provider: 'Required' } };
        }
        return { valid: true };
      },
      onSubmit: async (data) => {
        await api.createVPN(data);
      },
    },
    {
      autoPersist: true,
      onComplete: () => toast.success('VPN created!'),
    }
  );

  if (wizard.canRestore) {
    return (
      <ResumePrompt
        age={wizard.savedSessionAge}
        onResume={wizard.restore}
        onDiscard={wizard.discardSession}
      />
    );
  }

  return (
    <form>
      <StepIndicator current={wizard.currentStep} total={wizard.totalSteps} />
      <StepContent step={wizard.currentStep} errors={wizard.errors} />
      <button onClick={() => wizard.next(formData)} disabled={wizard.isValidating}>
        Next
      </button>
      <button onClick={wizard.back} disabled={wizard.isFirstStep}>
        Back
      </button>
    </form>
  );
}
```

### Session Recovery Variant

Built-in session recovery with `useWizardSession`:

```typescript
function useWizardSession(machineId: string): {
  hasSavedSession: boolean;
  sessionAge: string | null;
  discardSession: () => void;
};
```

Use in navigation to show "Resume Setup" button:

```typescript
function AppNavigation() {
  const session = useWizardSession('vpn-setup');

  if (session.hasSavedSession) {
    return (
      <button onClick={() => navigate('/vpn-setup')}>
        Resume Setup ({session.sessionAge})
      </button>
    );
  }

  return null;
}
```

---

## useConfigPipeline

Configuration change pipeline with validation, preview, and rollback (edit → validate → preview →
confirm → apply → verify).

**Source:** `libs/state/machines/src/hooks/useConfigPipeline.ts`

### Basic Variant

```typescript
function useConfigPipeline<TConfig = unknown>(
  pipelineConfig: ConfigPipelineConfig<TConfig>,
  options: UseConfigPipelineOptions
): UseConfigPipelineReturn<TConfig>;
```

### Parameters

| Parameter                              | Type                                                | Default  | Description                    |
| -------------------------------------- | --------------------------------------------------- | -------- | ------------------------------ |
| `pipelineConfig.runValidationPipeline` | `(config) => Promise<{errors, diff}>`               | Required | Validation function            |
| `pipelineConfig.applyConfig`           | `({resourceId, config}) => Promise<{rollbackData}>` | Required | Apply changes to router        |
| `pipelineConfig.verifyApplied`         | `(resourceId) => Promise<void>`                     | Required | Verify changes took effect     |
| `pipelineConfig.executeRollback`       | `(rollbackData) => Promise<void>`                   | Required | Rollback on error              |
| `options.resourceId`                   | `string`                                            | Required | Resource being configured      |
| `options.originalConfig`               | `unknown`                                           | —        | Original config (for diff)     |
| `options.onSuccess`                    | `() => void`                                        | —        | Callback on successful apply   |
| `options.onRollback`                   | `() => void`                                        | —        | Callback after rollback        |
| `options.onError`                      | `(error) => void`                                   | —        | Callback on error              |
| `options.onValidationError`            | `(errors) => void`                                  | —        | Callback on validation failure |
| `options.onPreview`                    | `(diff) => void`                                    | —        | Callback when entering preview |

### Return Values

```typescript
interface UseConfigPipelineReturn<TConfig> {
  // State
  state: ConfigPipelineState; // Current pipeline state
  stateDescription: string; // Human-readable description
  resourceId: string | null; // Resource being configured
  pendingConfig: TConfig | null; // Changes pending
  validationErrors: ValidationError[]; // Validation failures
  diff: ConfigDiff | null; // Change preview diff
  errorMessage: string | null; // Error details

  // Status Flags
  isFinal: boolean; // Pipeline completed (any end state)
  isCancellable: boolean; // Can cancel current operation
  isProcessing: boolean; // Async operation in progress
  isValidating: boolean; // Validating changes
  isApplying: boolean; // Applying to router
  isVerifying: boolean; // Verifying changes took effect
  isRollingBack: boolean; // Rolling back changes
  isError: boolean; // In error state
  isHighRisk: boolean; // Requires manual acknowledgment
  isSuccess: boolean; // Changes applied successfully
  isRolledBack: boolean; // Changes were rolled back

  // Actions
  edit: (config: TConfig) => void; // Start editing config
  validate: () => void; // Trigger validation
  confirm: () => void; // Confirm after preview
  acknowledge: () => void; // Acknowledge high-risk operation
  cancel: () => void; // Cancel pipeline
  retry: () => void; // Retry from error
  forceRollback: () => void; // Force rollback
  reset: () => void; // Reset to idle
  editAndValidate: (config: TConfig) => void; // Edit + validate in one call
}
```

### Example

```typescript
interface WireGuardConfig {
  interface: string;
  privateKey: string;
  address: string;
  port: number;
}

function WireGuardEditor({ resourceId }: Props) {
  const pipeline = useConfigPipeline<WireGuardConfig>(
    {
      runValidationPipeline: async (config) => {
        const { errors } = await api.validateWG(config);
        const { diff } = await api.computeDiff(resourceId, config);
        return { errors, diff };
      },
      applyConfig: async ({ config }) => {
        const backup = await api.backupWG(resourceId);
        await api.applyWG(resourceId, config);
        return { rollbackData: backup };
      },
      verifyApplied: async () => {
        const status = await api.getWGStatus(resourceId);
        if (!status.running) throw new Error('Failed to start');
      },
      executeRollback: async (backup) => {
        await api.restoreWG(resourceId, backup);
      },
    },
    {
      resourceId,
      onSuccess: () => toast.success('Applied!'),
      onRollback: () => toast.warning('Rolled back'),
    }
  );

  if (pipeline.state === 'previewing') {
    return (
      <ConfigPreview
        diff={pipeline.diff}
        isHighRisk={pipeline.isHighRisk}
        onConfirm={pipeline.confirm}
        onCancel={pipeline.cancel}
      />
    );
  }

  if (pipeline.state === 'error') {
    return (
      <ErrorDialog
        error={pipeline.errorMessage}
        onRetry={pipeline.retry}
        onRollback={pipeline.forceRollback}
      />
    );
  }

  return (
    <ConfigForm
      config={pipeline.pendingConfig}
      errors={pipeline.validationErrors}
      onSave={(config) => pipeline.editAndValidate(config)}
      isLoading={pipeline.isProcessing}
    />
  );
}
```

### Quick Variant

Auto-skip preview for non-high-risk changes:

```typescript
function useQuickConfigPipeline<TConfig = unknown>(
  pipelineConfig: ConfigPipelineConfig<TConfig>,
  options: UseConfigPipelineOptions
): UseConfigPipelineReturn<TConfig> & {
  quickApply: (config: TConfig) => void;
};
```

**Difference:** Automatically transitions from preview → applying for non-high-risk changes.

```typescript
const pipeline = useQuickConfigPipeline(config, options);

// This will auto-advance through preview if not high-risk
pipeline.quickApply(formData);
```

---

## useResourceLifecycle

Resource lifecycle management (draft → validating → applying → active/failed/degraded).

**Source:** `libs/state/machines/src/hooks/useResourceLifecycle.ts`

### Basic Variant

```typescript
function useResourceLifecycle<TConfig = unknown>(
  options: UseResourceLifecycleOptions<TConfig>
): UseResourceLifecycleResult<TConfig>;
```

### Parameters

| Parameter                  | Type                                  | Default               | Description             |
| -------------------------- | ------------------------------------- | --------------------- | ----------------------- |
| `options.id`               | `string`                              | `'resourceLifecycle'` | Machine ID              |
| `options.initialResource`  | `Resource<TConfig>`                   | Required              | Starting resource state |
| `options.validateResource` | `(uuid) => Promise<ValidationResult>` | Required              | Validation function     |
| `options.applyResource`    | `(uuid, force?) => Promise<void>`     | Required              | Apply to router         |
| `options.syncResource`     | `(uuid) => Promise<RuntimeState>`     | Required              | Sync from router        |

### Return Values

```typescript
interface UseResourceLifecycleResult<TConfig> {
  // State
  state: ResourceLifecycleStateValue; // Current state
  context: ResourceLifecycleContext<TConfig>; // Full context
  displayInfo: ReturnType<typeof getResourceStateDisplayInfo>;

  // Predicates
  isPending: boolean; // Async operation in progress
  isActive: boolean; // Running on router
  isEditable: boolean; // Can be edited
  isAppliable: boolean; // Can be applied
  hasError: boolean; // In error state
  isDegraded: boolean; // Degraded (running but issues)

  // Validation
  validationErrors: ValidationError[]; // Errors from validation
  validationWarnings: ValidationError[]; // Warnings from validation
  isValid: boolean; // Can be applied

  // Actions
  edit: (configuration: TConfig) => void;
  validate: () => void;
  apply: (force?: boolean) => void;
  updateRuntime: (runtime: RuntimeState) => void;
  degrade: (reason: string) => void;
  recover: () => void;
  deprecate: () => void;
  restore: () => void;
  archive: () => void;
  retry: () => void;
  reset: () => void;
  sync: () => void;
}
```

### Example

```typescript
interface WireGuardConfig {
  address: string;
  port: number;
  privateKey: string;
}

function WireGuardResource({ uuid, resource }: Props) {
  const lifecycle = useResourceLifecycle<WireGuardConfig>({
    initialResource: resource,
    validateResource: async (uuid) => {
      const result = await api.validateWG(uuid);
      return result;
    },
    applyResource: async (uuid) => {
      await api.applyWG(uuid);
    },
    syncResource: async (uuid) => {
      const runtime = await api.getWGRuntime(uuid);
      return runtime;
    },
  });

  return (
    <div>
      <StatusBadge
        status={lifecycle.displayInfo.color}
        label={lifecycle.displayInfo.label}
        showSpinner={lifecycle.displayInfo.showSpinner}
      />

      {lifecycle.validationErrors.length > 0 && (
        <ErrorList errors={lifecycle.validationErrors} />
      )}

      <ConfigForm
        config={lifecycle.context.configuration}
        onSubmit={(config) => {
          lifecycle.edit(config);
          lifecycle.validate();
        }}
        disabled={lifecycle.isPending}
      />

      {lifecycle.isAppliable && (
        <button onClick={() => lifecycle.apply()} disabled={lifecycle.isPending}>
          Apply to Router
        </button>
      )}
    </div>
  );
}
```

### Apollo Integration Variant

Wires up GraphQL mutations and subscriptions automatically:

```typescript
function useResourceLifecycleWithApollo<TConfig = unknown>(
  uuid: string,
  options?: {
    onStateChange?: (state: string, context) => void;
    onError?: (error: string, code?: string) => void;
  }
): UseResourceLifecycleResult<TConfig>;
```

**Note:** Currently a placeholder. In full implementation, would use:

- `useValidateResource` mutation
- `useApplyResource` mutation
- `useSyncResource` mutation
- `useResourceRuntimeSubscription`

---

## Comparison Tables

### Wizard vs. Config Pipeline

| Feature              | useWizard                   | useConfigPipeline                          |
| -------------------- | --------------------------- | ------------------------------------------ |
| **Purpose**          | Multi-step form workflows   | Single-resource config changes             |
| **Flow**             | Step → Validate → Next Step | Edit → Validate → Preview → Apply → Verify |
| **Data Collection**  | Across all steps            | Single configuration                       |
| **User Interaction** | Forward/backward navigation | Preview before apply                       |
| **Rollback**         | Start over from step 1      | Auto-rollback on apply failure             |
| **Persistence**      | Session save/restore        | No persistence (state-only)                |
| **High-Risk Ops**    | Validation errors block     | Manual acknowledgment required             |
| **Example**          | VPN setup, device pairing   | WireGuard config, DHCP settings            |

### Config Pipeline vs. Resource Lifecycle

| Feature              | useConfigPipeline           | useResourceLifecycle                  |
| -------------------- | --------------------------- | ------------------------------------- |
| **Purpose**          | Atomic config change        | Resource state management             |
| **Scope**            | Single resource at a time   | Multiple resources, tracking          |
| **Lifecycle States** | Edit/Validate/Preview/Apply | Draft/Active/Degraded/Archived        |
| **Validation**       | Per-change validation       | Continuous validation                 |
| **Sync**             | N/A                         | Sync from router                      |
| **Persistence**      | No                          | Yes (resource state)                  |
| **Degrade/Recover**  | No                          | Yes                                   |
| **Best For**         | Forms, config editors       | Dashboard monitoring, status tracking |

### Wizard Persistence Features

| Feature                 | Basic Wizard              | With autoRestore                    |
| ----------------------- | ------------------------- | ----------------------------------- |
| **Save**                | Automatic to localStorage | Automatic to localStorage           |
| **Restore Prompt**      | Yes (user chooses)        | No (auto-restore)                   |
| **Session Age Display** | Yes                       | Yes                                 |
| **Discard Session**     | Yes                       | Yes                                 |
| **Use Case**            | Interruptible workflows   | Critical wizards (setup, migration) |

---

## State Diagrams

### useWizard Flow

```
┌─────────┐
│  STEP   │
└────┬────┘
     │ NEXT (validate)
     ▼
┌──────────────┐
│  VALIDATING  │
└────┬─────────┘
     │
  valid? invalid?
     │     │
     ▼     ▼
   NEXT   STEP (errors)
     │
  last? not last?
     │     │
     ▼     ▼
SUBMIT   STEP (next)
     │
     ▼
┌──────────────┐
│  COMPLETED   │
└──────────────┘

CANCEL → CANCELLED (any time)
RESTORE → STEP (saved state)
```

### useConfigPipeline Flow

```
┌──────────┐
│  EDIT    │
└────┬─────┘
     │ VALIDATE
     ▼
┌──────────────┐     valid?
│  VALIDATING  │────────┬─────────┐
└──────────────┘        │         │
                     valid    invalid
                        │         │
                        ▼         ▼
                   PREVIEW    INVALID
                        │         │
            highRisk? errors?    |
                   │    │        |
                   ▼    ▼        |
              CONFIRM PENDING    |
                   │             |
                   ▼             |
               APPLY ─────────────┘
                   │
                   ▼
              VERIFY
                   │
            ┌──────┴──────┐
            │             │
         success        error
            │             │
            ▼             ▼
         ACTIVE    ROLLBACK → ROLLED_BACK
```

### useResourceLifecycle Flow

```
┌──────────────┐
│   DRAFT      │ ← initialResource
└──────┬───────┘
       │ EDIT
       ▼
┌──────────────┐
│  EDITING     │
└──────┬───────┘
       │ VALIDATE
       ▼
┌──────────────┐
│ VALIDATING   │
└──────┬───────┘
       │
    valid?
       │
    ┌──┴─────────────────────────┐
    │                            │
    ▼                            ▼
 APPLY                      DEGRADED
    │                            │
    ▼                            ▼
APPLYING                      (issues)
    │
    ▼
  ACTIVE (running on router)
    │ (can EDIT, VALIDATE, DEGRADE, etc.)

DEGRADED → RECOVER → ACTIVE
DEPRECATED ← DEPRECATE
DEPRECATED → RESTORE → DRAFT
ARCHIVED ← ARCHIVE
```

---

## Common Patterns

### Pattern: Step-by-step with preview

```typescript
const wizard = useWizard(config);

// Step 1: Collect data
wizard.setData({ provider: 'wireguard' });

// Step 2: Advance when ready
const handleNext = () => {
  wizard.next(stepData);
};

// Step 3: Show progress
<StepIndicator current={wizard.currentStep} total={wizard.totalSteps} />
```

### Pattern: Safe config changes

```typescript
const pipeline = useConfigPipeline(config);

// Edit and see preview before applying
const handleSave = () => {
  pipeline.editAndValidate(formData);
};

// User reviews diff
if (pipeline.state === 'previewing') {
  // Show diff, then confirm
  pipeline.confirm();
}

// Auto-rollback on error
if (pipeline.state === 'error') {
  // Pipeline already rolling back
  pipeline.retry();
}
```

### Pattern: Monitor resource health

```typescript
const lifecycle = useResourceLifecycle({ initialResource });

// Subscriptions update runtime
useEffect(() => {
  const unsubscribe = subscribe(uuid, (runtime) => {
    lifecycle.updateRuntime(runtime);
  });
  return unsubscribe;
}, [uuid]);

// React to state changes
if (lifecycle.isDegraded) {
  notifyUser('Resource degraded: ' + lifecycle.context.degradationReason);
}
```

---

## Error Handling

All hooks provide error messages:

```typescript
// Wizard
if (wizard.errors.provider) {
  <ErrorField message={wizard.errors.provider} />
}

// Config Pipeline
if (pipeline.state === 'error') {
  <ErrorAlert message={pipeline.errorMessage} />
}

// Resource Lifecycle
if (lifecycle.hasError) {
  <ErrorBoundary errors={lifecycle.validationErrors} />
}
```

---

## Performance Tips

1. **Memoize callbacks** - `useCallback` for action handlers
2. **Use selectors** - Don't destructure whole return object
3. **Lazy validation** - Validate only on blur/submit
4. **Debounce edits** - Batch rapid `setData` calls
5. **Limit subscribers** - Use `useMachine` once per component
6. **Stop unused machines** - Call `stop()` in cleanup

---

## Related Documentation

- **Testing:** See `../guides/testing.md` for complete test patterns
- **Debugging:** See `../guides/debugging.md` for troubleshooting
- **Persistence:** See `persistence.md` for session recovery
- **Machines:** See individual machine docs (wizard.md, config-pipeline.md, etc.)
