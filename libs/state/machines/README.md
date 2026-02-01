# @nasnet/state/machines

XState state machines for complex multi-step workflows in NasNetConnect.

## Overview

This library provides reusable XState v5 machines for:

- **Wizard Flows** - Multi-step wizards with validation and session persistence
- **Config Pipeline** - Safety-first configuration changes with rollback
- **VPN Connection** - Connection lifecycle with reconnection handling

## Installation

The library is part of the NasNet monorepo and doesn't require separate installation.

```typescript
import {
  createWizardMachine,
  useWizard,
  createConfigPipelineMachine,
  useConfigPipeline,
} from '@nasnet/state/machines';
```

## State Management Decision Tree

```
Is it data from the router (server)?
├─ Yes → Use Apollo Client (GraphQL)
└─ No → Is it a complex multi-step workflow?
    ├─ Yes → Use XState (this library)
    └─ No → Use Zustand
```

## Wizard Machine

Multi-step wizard flows with validation, navigation, and session persistence.

### Usage

```tsx
import { useWizard } from '@nasnet/state/machines';

interface VPNSetupData {
  provider: string;
  serverAddress: string;
  credentials: { username: string; password: string };
}

function VPNSetupWizard() {
  const wizard = useWizard<VPNSetupData>({
    id: 'vpn-setup',
    totalSteps: 3,
    validateStep: async (step, data) => {
      if (step === 1 && !data.provider) {
        return { valid: false, errors: { provider: 'Select a provider' } };
      }
      return { valid: true };
    },
    onSubmit: async (data) => {
      await createVPNConnection(data);
    },
  });

  // Session recovery prompt
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
    <WizardContainer>
      <StepIndicator
        current={wizard.currentStep}
        total={wizard.totalSteps}
        progress={wizard.progress}
      />

      {wizard.currentStep === 1 && (
        <ProviderStep
          data={wizard.data}
          errors={wizard.errors}
          onChange={(data) => wizard.setData(data)}
        />
      )}

      {wizard.currentStep === 2 && (
        <ServerStep
          data={wizard.data}
          errors={wizard.errors}
        />
      )}

      {wizard.currentStep === 3 && (
        <CredentialsStep
          data={wizard.data}
          errors={wizard.errors}
        />
      )}

      <WizardActions
        onBack={wizard.back}
        onNext={() => wizard.next(stepData)}
        onCancel={wizard.cancel}
        disableBack={wizard.isFirstStep}
        disableNext={wizard.isValidating}
        loading={wizard.isValidating || wizard.isSubmitting}
      />
    </WizardContainer>
  );
}
```

### Features

- **Step Navigation** - `next()`, `back()`, `goToStep()`
- **Validation** - Async validation with error display
- **Session Persistence** - Automatic save/restore to localStorage
- **Progress Tracking** - `progress`, `currentStep`, `totalSteps`

## Config Pipeline Machine

Safety-first configuration changes with validation, preview, and rollback.

### Pipeline Flow

```
idle → draft → validating → previewing → confirming → applying → verifying → active
                    ↓                         ↓               ↓
                 invalid                   rollback → rolled_back
                    ↓                         ↓
                  error ←────────────────────┘
```

### Usage

```tsx
import { useConfigPipeline } from '@nasnet/state/machines';

function WireGuardEditor({ resourceId, config }) {
  const pipeline = useConfigPipeline<WireGuardConfig>(
    {
      runValidationPipeline: async (config) => {
        const errors = await api.validateWireGuard(config);
        const diff = await api.computeDiff(resourceId, config);
        return { errors, diff };
      },
      applyConfig: async ({ resourceId, config }) => {
        const backup = await api.getBackup(resourceId);
        await api.applyWireGuard(resourceId, config);
        return { rollbackData: backup };
      },
      verifyApplied: async (resourceId) => {
        const status = await api.getWireGuardStatus(resourceId);
        if (!status.running) throw new Error('Failed to start');
      },
      executeRollback: async (rollbackData) => {
        await api.restoreWireGuard(rollbackData);
      },
    },
    {
      resourceId,
      onSuccess: () => toast.success('Configuration applied!'),
      onRollback: () => toast.warning('Changes rolled back'),
    }
  );

  // Handle different states
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

  if (pipeline.state === 'confirming') {
    return (
      <HighRiskConfirmation
        riskExplanation={pipeline.diff?.riskExplanation}
        onAcknowledge={pipeline.acknowledge}
        onCancel={pipeline.cancel}
      />
    );
  }

  return (
    <ConfigForm
      config={config}
      errors={pipeline.validationErrors}
      onSave={() => pipeline.editAndValidate(formData)}
      isLoading={pipeline.isProcessing}
    />
  );
}
```

### Safety Features

- **Cannot Skip Validation** - Guards prevent skipping steps
- **High-Risk Acknowledgment** - Extra confirmation for dangerous operations
- **Automatic Rollback** - On verification failure
- **Manual Rollback** - Always available from error state

## VPN Connection Machine

VPN lifecycle management with connection, metrics, and reconnection.

### Usage

```tsx
import { useVPNConnection } from '@nasnet/state/machines';

function VPNStatus() {
  const vpn = useVPNConnection({
    establishConnection: async ({ serverAddress, provider }) => {
      const result = await api.connectVPN(serverAddress, provider);
      return { connectionId: result.id };
    },
    attemptReconnect: async ({ serverAddress, provider }) => {
      return api.reconnectVPN(serverAddress, provider);
    },
    closeConnection: async (connectionId) => {
      await api.disconnectVPN(connectionId);
    },
  });

  return (
    <Card>
      <StatusBadge status={vpn.state} />

      {vpn.isConnected && (
        <MetricsDisplay
          uploadSpeed={vpn.metrics?.uploadSpeed}
          downloadSpeed={vpn.metrics?.downloadSpeed}
          latency={vpn.metrics?.latencyMs}
        />
      )}

      {vpn.isError && (
        <ErrorMessage error={vpn.error} onRetry={vpn.retry} />
      )}

      <Button
        onClick={() =>
          vpn.isConnected
            ? vpn.disconnect()
            : vpn.connect('vpn.example.com', 'wireguard')
        }
        loading={vpn.isConnecting}
      >
        {vpn.isConnected ? 'Disconnect' : 'Connect'}
      </Button>
    </Card>
  );
}
```

### Features

- **Connection Timeout** - 30 seconds
- **Automatic Reconnection** - Exponential backoff, max 3 attempts
- **Real-time Metrics** - Upload/download speed, latency
- **Graceful Disconnection**

## State Persistence

All machines support session persistence via localStorage.

### Functions

```typescript
// Persist state
persistMachineState('wizard-id', state.value, state.context);

// Restore state
const saved = restoreMachineState<WizardContext>('wizard-id');

// Check for saved session
if (hasSavedSession('wizard-id')) {
  // Show resume prompt
}

// Clear saved state
clearMachineState('wizard-id');

// Get session age
const age = getSessionAge('wizard-id'); // ms

// Format for display
formatSessionAge(age); // "2 hours ago"

// Cleanup stale sessions (24 hours default)
cleanupStaleSessions();
```

## XState Inspector

The Stately Dev Tools are available in development mode for visual debugging.

1. Start the dev server: `npm run dev:frontend`
2. Open the app in browser
3. The inspector opens automatically in a new tab/window

Features:
- Visual state machine diagram
- Transition history timeline
- Send test events for debugging
- Context inspection

## Testing

```bash
# Run tests
npx nx test @nasnet/state/machines

# Watch mode
npx nx test @nasnet/state/machines --watch

# Coverage
npx nx test @nasnet/state/machines --coverage
```

## API Reference

### Wizard Machine

| Export | Description |
|--------|-------------|
| `createWizardMachine<TData>()` | Create wizard machine factory |
| `useWizard<TData>()` | React hook for wizard |
| `useWizardSession()` | Check for saved session |

### Config Pipeline Machine

| Export | Description |
|--------|-------------|
| `createConfigPipelineMachine<TConfig>()` | Create pipeline machine |
| `useConfigPipeline<TConfig>()` | React hook for pipeline |
| `useQuickConfigPipeline<TConfig>()` | Auto-advance version |

### VPN Connection Machine

| Export | Description |
|--------|-------------|
| `createVPNConnectionMachine()` | Create VPN machine |
| `useVPNConnection()` | React hook for VPN |

### Persistence

| Export | Description |
|--------|-------------|
| `persistMachineState()` | Save state to localStorage |
| `restoreMachineState()` | Restore from localStorage |
| `clearMachineState()` | Clear saved state |
| `hasSavedSession()` | Check for saved session |
| `getSessionAge()` | Get session age in ms |
| `cleanupStaleSessions()` | Remove old sessions |

## Architecture Compliance

- **ADR-002**: XState for complex workflows
- **ADR-012**: Universal State v2 resource lifecycle

## Related

- [NAS-4.6 Story](../../Docs/sprint-artifacts/Epic4-State-Frontend/NAS-4-6-implement-complex-flows-xstate.md)
- [@nasnet/state/stores](../stores) - Zustand UI state
- [XState v5 Docs](https://stately.ai/docs/xstate-v5)
