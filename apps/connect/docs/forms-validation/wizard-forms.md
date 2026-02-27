# Wizard Forms

Multi-step forms in NasNetConnect use `useWizardPersistence` to manage step navigation, data
collection, and state persistence across page reloads.

File: `libs/core/forms/src/useWizardPersistence.ts`

## Design Goals

- Each wizard step is an independent React Hook Form instance
- Data is accumulated across steps and submitted as one payload at the end
- State survives page refresh via `sessionStorage` with a configurable TTL
- Navigation is enforced: users can only go to completed steps or the next available step
- Progress is calculable at any point

## useWizardPersistence

### Signature

```typescript
function useWizardPersistence<TStepData extends Record<string, FieldValues>>(
  options: UseWizardPersistenceOptions<TStepData>
): UseWizardPersistenceReturn<TStepData>;
```

### Options

| Option        | Type               | Default           | Description                           |
| ------------- | ------------------ | ----------------- | ------------------------------------- |
| `storageKey`  | `string`           | required          | Unique key for this wizard in storage |
| `stepIds`     | `string[]`         | required          | Ordered list of step identifiers      |
| `initialStep` | `string \| number` | `stepIds[0]`      | Starting step                         |
| `storage`     | `Storage`          | `sessionStorage`  | Storage backend                       |
| `ttlMs`       | `number`           | `86400000` (24 h) | How long before saved state expires   |
| `onRestore`   | `(state) => void`  | —                 | Called when saved state is restored   |
| `onExpire`    | `() => void`       | —                 | Called when saved state expires       |

### Full Example

```typescript
import { useWizardPersistence, useZodForm } from '@nasnet/core/forms';

// Type the data shape for each step
type WPNSetupData = {
  basic: { name: string; description: string };
  network: { address: string; listenPort: number };
  peers: { peers: PeerConfig[] };
  review: Record<string, never>;
};

function WireGuardSetupWizard() {
  const wizard = useWizardPersistence<WPNSetupData>({
    storageKey: 'wireguard-setup-wizard',
    stepIds: ['basic', 'network', 'peers', 'review'],
    ttlMs: 60 * 60 * 1000,  // 1 hour
    onRestore: (state) => {
      console.log('Restored from step:', state.currentStep);
    },
  });

  return (
    <div>
      {wizard.wasRestored && (
        <Alert>Your previous progress has been restored.</Alert>
      )}

      {/* Progress indicator */}
      <ProgressBar value={wizard.progress} max={100} />
      <span>{wizard.currentStepIndex + 1} / {wizard.stepIds.length}</span>

      {/* Step rendering */}
      {wizard.currentStep === 'basic' && (
        <BasicStep
          defaultValues={wizard.getStepData('basic')}
          onComplete={(data) => {
            wizard.setStepData('basic', data);
            wizard.completeStep('basic');
            wizard.nextStep();
          }}
        />
      )}

      {wizard.currentStep === 'network' && (
        <NetworkStep
          defaultValues={wizard.getStepData('network')}
          onComplete={(data) => {
            wizard.setStepData('network', data);
            wizard.completeStep('network');
            wizard.nextStep();
          }}
          onBack={wizard.prevStep}
        />
      )}

      {wizard.currentStep === 'review' && (
        <ReviewStep
          allData={wizard.getAllStepData()}
          onSubmit={async () => {
            await createWireGuardTunnel(wizard.getAllStepData());
            wizard.clearPersistence();
          }}
          onBack={wizard.prevStep}
        />
      )}

      {/* Step navigation (breadcrumbs) */}
      <StepList>
        {wizard.stepIds.map((id) => (
          <StepItem
            key={id}
            label={id}
            completed={wizard.isStepCompleted(id)}
            active={wizard.currentStep === id}
            disabled={!wizard.canGoToStep(id)}
            onClick={() => wizard.goToStep(id)}
          />
        ))}
      </StepList>
    </div>
  );
}
```

## Returned Values and Methods

### Navigation State

| Property           | Type       | Description                             |
| ------------------ | ---------- | --------------------------------------- |
| `currentStep`      | `string`   | Current step ID                         |
| `currentStepIndex` | `number`   | 0-based index                           |
| `completedSteps`   | `string[]` | IDs of completed steps                  |
| `progress`         | `number`   | 0–100 based on completed / total        |
| `isFirstStep`      | `boolean`  | On the first step                       |
| `isLastStep`       | `boolean`  | On the last step                        |
| `wasRestored`      | `boolean`  | `true` if state was loaded from storage |

### Data Methods

| Method                      | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `getStepData(stepId)`       | Get saved data for a step (typed)               |
| `setStepData(stepId, data)` | Save data for a step (typed)                    |
| `getAllStepData()`          | Returns `Partial<TStepData>` with all step data |
| `setMetadata(meta)`         | Store arbitrary wizard metadata                 |

### Navigation Methods

| Method                      | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `goToStep(stepId \| index)` | Navigate to a specific step (enforces `canGoToStep`) |
| `nextStep()`                | Advance to the next step                             |
| `prevStep()`                | Go back to the previous step                         |
| `completeStep(stepId)`      | Mark a step as completed                             |
| `isStepCompleted(stepId)`   | Check if a step is completed                         |
| `canGoToStep(stepId)`       | Returns `true` if navigation is allowed              |

### Lifecycle Methods

| Method               | Description                                   |
| -------------------- | --------------------------------------------- |
| `reset()`            | Reset to initial state and persist            |
| `clearPersistence()` | Delete saved state and reset to initial state |

## Navigation Rules

`canGoToStep` enforces these rules:

1. Always allowed: completed steps
2. Always allowed: the current step
3. Allowed: the next step, if the current step is completed
4. Not allowed: steps beyond the next step (prevents skipping)

## Individual Step Forms

Each step should have its own `useZodForm` instance. Pass saved data as default values:

```typescript
function NetworkStep({ defaultValues, onComplete, onBack }) {
  const form = useZodForm({
    schema: networkStepSchema,
    defaultValues: defaultValues ?? { address: '', listenPort: 51820 },
  });

  const onSubmit = form.handleSubmit((data) => {
    onComplete(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register('address')} />
      <input type="number" {...form.register('listenPort')} />
      <div>
        <Button type="button" onClick={onBack}>Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
```

## TTL and Expiry

State older than `ttlMs` is automatically discarded when the wizard mounts. The `onExpire` callback
fires in this case so you can show a notification:

```typescript
const wizard = useWizardPersistence({
  storageKey: 'setup-wizard',
  stepIds: ['step1', 'step2', 'step3'],
  ttlMs: 30 * 60 * 1000, // 30 minutes
  onExpire: () => {
    toast.info('Your wizard session expired. Starting fresh.');
  },
});
```

## Combining With useFormPersistence

`useWizardPersistence` handles wizard-level state (current step, completed steps, step data). For
within-step persistence (user mid-step when they refresh), you can additionally use
`useFormPersistence` on individual step forms:

```typescript
function BasicStep({ defaultValues, onComplete }) {
  const form = useZodForm({ schema, defaultValues });

  // Also persist the in-progress form state within this step
  const persistence = useFormPersistence({
    form,
    storageKey: 'wireguard-wizard-basic-draft',
  });

  const onSubmit = form.handleSubmit((data) => {
    persistence.clearPersistence();
    onComplete(data);
  });
}
```
