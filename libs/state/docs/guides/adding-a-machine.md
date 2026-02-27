# Adding a New XState Machine

Step-by-step guide for creating XState v5 machines following NasNet conventions.

**Source:** Patterns from `libs/state/machines/src/`

## When to Create a Machine

Create a machine for:
- ✅ Multi-step workflows (wizards, config pipelines)
- ✅ Complex state transitions with guards
- ✅ Async operations with loading/error states
- ✅ Orchestrating multiple actions across steps

Do NOT create a machine for:
- ❌ Simple UI toggles (use Zustand stores)
- ❌ Server data (use Apollo Client + GraphQL)
- ❌ Form validation (use React Hook Form)
- ❌ One-off async operations (use useEffect + useState)

## Step-by-Step Checklist

### 1. Create File with Standard Naming

```bash
# Location: libs/state/machines/src/
# Naming: [workflow]Machine.ts

libs/state/machines/src/
├── wizardMachine.ts              # Multi-step wizard
├── configPipelineMachine.ts       # Config apply pipeline
├── vpnConnectionMachine.ts        # VPN connection lifecycle
├── changeSetMachine.ts            # Change set operations
├── resourceLifecycleMachine.ts     # Resource state lifecycle
└── hooks/
    └── useWizard.ts              # React hook for machine
```

**Naming conventions:**
- `[workflow]Machine.ts` - The machine definition
- `use[Workflow].ts` - React hook wrapper

### 2. Define Types

```typescript
// libs/state/machines/src/myWorkflowMachine.ts

/**
 * My Workflow Machine
 * Handles [workflow description]
 */

import { setup } from 'xstate';

// ============================================================================
// Types
// ============================================================================

/**
 * Machine context: data that flows through the workflow
 */
export interface MyWorkflowContext {
  // Step 1 data
  step1Data?: string;

  // Step 2 data
  step2Data?: Record<string, unknown>;

  // Async operation results
  result?: unknown;
  error?: Error;

  // Metadata
  userId: string;
  startedAt: number;
}

/**
 * Machine events: actions that trigger transitions
 */
export type MyWorkflowEvent =
  | { type: 'NEXT' } // Go to next step
  | { type: 'BACK' } // Go to previous step
  | { type: 'SKIP' } // Skip optional step
  | { type: 'SUBMIT'; data: Record<string, unknown> } // Submit with data
  | { type: 'CANCEL' } // Cancel workflow
  | { type: 'RETRY' } // Retry after error
  | { type: 'done.invoke.asyncAction'; output: unknown }; // Async completion

/**
 * Machine configuration
 */
export interface MyWorkflowConfig {
  userId: string;
  initialData?: Partial<MyWorkflowContext>;
  onComplete?: (context: MyWorkflowContext) => void;
  onError?: (error: Error) => void;
}
```

### 3. Create Machine with setup()

```typescript
// ============================================================================
// Machine
// ============================================================================

/**
 * Create MyWorkflow machine
 *
 * States:
 * - step1: First step of workflow
 * - step2: Second step
 * - step3: Review/confirm
 * - submitting: Sending to server
 * - success: Completed successfully
 * - error: Failed with error
 * - cancelled: User cancelled
 */
export function createMyWorkflowMachine(config: MyWorkflowConfig) {
  const { userId, initialData = {}, onComplete, onError } = config;

  return setup({
    types: {
      context: {} as MyWorkflowContext,
      events: {} as MyWorkflowEvent,
    },

    actors: {
      // Define async operations
      submitWorkflow: async (context) => {
        // Call API
        const response = await fetch('/api/workflow', {
          method: 'POST',
          body: JSON.stringify({
            step1Data: context.step1Data,
            step2Data: context.step2Data,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        return response.json();
      },
    },

    guards: {
      // Define transition conditions
      isStep1Valid: (context) => {
        return context.step1Data && context.step1Data.length > 0;
      },

      isStep2Valid: (context) => {
        return context.step2Data && Object.keys(context.step2Data).length > 0;
      },

      canSkipStep: (context) => {
        return context.userId === 'admin'; // Only admins can skip
      },
    },
  }).createMachine({
    id: 'myWorkflow',
    initial: 'step1',

    context: {
      userId,
      startedAt: Date.now(),
      ...initialData,
    },

    states: {
      // ===== STEP 1 =====
      step1: {
        on: {
          NEXT: {
            guard: 'isStep1Valid', // Must pass validation
            target: 'step2',
            actions: (context, event) => {
              // Update context with step 1 data
              if (event.type === 'SUBMIT') {
                return { ...context, step1Data: event.data.input };
              }
            },
          },
          CANCEL: 'cancelled',
        },
      },

      // ===== STEP 2 =====
      step2: {
        on: {
          BACK: 'step1',
          NEXT: {
            guard: 'isStep2Valid',
            target: 'step3',
            actions: (context, event) => {
              if (event.type === 'SUBMIT') {
                return { ...context, step2Data: event.data };
              }
            },
          },
          SKIP: {
            guard: 'canSkipStep',
            target: 'step3',
          },
          CANCEL: 'cancelled',
        },
      },

      // ===== STEP 3 (REVIEW) =====
      step3: {
        on: {
          BACK: 'step2',
          SUBMIT: 'submitting',
          CANCEL: 'cancelled',
        },
      },

      // ===== SUBMITTING =====
      submitting: {
        invoke: {
          src: 'submitWorkflow',
          onDone: {
            target: 'success',
            actions: (context, event) => {
              return { ...context, result: event.output };
            },
          },
          onError: {
            target: 'error',
            actions: (context, event) => {
              return { ...context, error: event.error };
            },
          },
        },
      },

      // ===== SUCCESS =====
      success: {
        type: 'final',
        entry: (context) => {
          onComplete?.(context);
        },
      },

      // ===== ERROR =====
      error: {
        on: {
          RETRY: 'submitting',
          CANCEL: 'cancelled',
        },
      },

      // ===== CANCELLED =====
      cancelled: {
        type: 'final',
      },
    },
  });
}
```

### 4. Create React Hook Wrapper

```typescript
// libs/state/machines/src/hooks/useMyWorkflow.ts

import { useActorRef, useSelector } from '@xstate/react';
import { createMyWorkflowMachine, MyWorkflowConfig } from '../myWorkflowMachine';

/**
 * React hook for MyWorkflow machine
 */
export function useMyWorkflow(config: MyWorkflowConfig) {
  // Create and manage machine
  const actor = useActorRef(() =>
    createMyWorkflowMachine(config).provide({
      // Override actors if needed
    })
  );

  // Extract state and context
  const state = useSelector(actor, (snapshot) => snapshot.value);
  const context = useSelector(actor, (snapshot) => snapshot.context);

  // Helper functions to check state
  const isStep = (step: string) => state === step;
  const canNext = !['submitting', 'success', 'cancelled'].includes(String(state));
  const canBack = !['step1', 'submitting', 'success', 'cancelled'].includes(String(state));
  const isError = state === 'error';
  const isSubmitting = state === 'submitting';
  const isComplete = state === 'success' || state === 'cancelled';

  // Dispatch events
  const send = (event: any) => actor.send(event);
  const next = () => send({ type: 'NEXT' });
  const back = () => send({ type: 'BACK' });
  const skip = () => send({ type: 'SKIP' });
  const submit = (data: Record<string, unknown>) =>
    send({ type: 'SUBMIT', data });
  const cancel = () => send({ type: 'CANCEL' });
  const retry = () => send({ type: 'RETRY' });

  return {
    // State
    state,
    context,

    // Step checks
    isStep,
    isStep1: isStep('step1'),
    isStep2: isStep('step2'),
    isStep3: isStep('step3'),

    // Flags
    canNext,
    canBack,
    isError,
    isSubmitting,
    isComplete,

    // Actions
    send,
    next,
    back,
    skip,
    submit,
    cancel,
    retry,
  };
}

export type UseMyWorkflowReturn = ReturnType<typeof useMyWorkflow>;
```

### 5. Create Tests

```typescript
// libs/state/machines/src/myWorkflowMachine.test.ts

import { createMockActorRef } from '@xstate/react';
import { createMyWorkflowMachine } from './myWorkflowMachine';

describe('myWorkflowMachine', () => {
  it('starts in step1', () => {
    const machine = createMyWorkflowMachine({ userId: 'user-1' });
    const actor = machine.start();

    expect(actor.getSnapshot().value).toBe('step1');
  });

  describe('step transitions', () => {
    it('moves from step1 to step2 with valid data', () => {
      const machine = createMyWorkflowMachine({ userId: 'user-1' });
      const actor = machine.start();

      // Submit step 1 data
      actor.send({
        type: 'SUBMIT',
        data: { input: 'valid data' },
      });

      actor.send({ type: 'NEXT' });

      expect(actor.getSnapshot().value).toBe('step2');
    });

    it('stays in step1 with invalid data', () => {
      const machine = createMyWorkflowMachine({ userId: 'user-1' });
      const actor = machine.start();

      // Try to go next without submitting
      actor.send({ type: 'NEXT' });

      // Should still be in step1
      expect(actor.getSnapshot().value).toBe('step1');
    });

    it('goes back from step2 to step1', () => {
      const machine = createMyWorkflowMachine({ userId: 'user-1' });
      const actor = machine.start();

      actor.send({
        type: 'SUBMIT',
        data: { input: 'data' },
      });
      actor.send({ type: 'NEXT' });
      actor.send({ type: 'BACK' });

      expect(actor.getSnapshot().value).toBe('step1');
    });
  });

  describe('guards', () => {
    it('allows admin to skip step', () => {
      const machine = createMyWorkflowMachine({ userId: 'admin' });
      const actor = machine.start();

      actor.send({ type: 'NEXT' }); // Advance to step2
      actor.send({ type: 'SKIP' });

      // Should skip to step3
      expect(actor.getSnapshot().value).toBe('step3');
    });

    it('prevents non-admin from skipping step', () => {
      const machine = createMyWorkflowMachine({ userId: 'user-1' });
      const actor = machine.start();

      actor.send({ type: 'NEXT' });
      actor.send({ type: 'SKIP' });

      // Should still be in step2
      expect(actor.getSnapshot().value).toBe('step2');
    });
  });

  describe('cancellation', () => {
    it('cancels workflow at any time', () => {
      const machine = createMyWorkflowMachine({ userId: 'user-1' });
      const actor = machine.start();

      actor.send({ type: 'CANCEL' });

      expect(actor.getSnapshot().value).toBe('cancelled');
    });
  });

  describe('callbacks', () => {
    it('calls onComplete when workflow succeeds', async () => {
      const onComplete = jest.fn();
      const machine = createMyWorkflowMachine({
        userId: 'user-1',
        onComplete,
      });
      const actor = machine.start();

      // Complete workflow...
      actor.send({ type: 'SUBMIT', data: { input: 'data' } });
      actor.send({ type: 'NEXT' });
      actor.send({ type: 'NEXT' });
      actor.send({ type: 'SUBMIT' });

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onComplete).toHaveBeenCalled();
    });
  });
});
```

### 6. Export from Barrel Index

```typescript
// libs/state/machines/src/index.ts

export {
  createMyWorkflowMachine,
  type MyWorkflowContext,
  type MyWorkflowEvent,
  type MyWorkflowConfig,
} from './myWorkflowMachine';

export {
  useMyWorkflow,
  type UseMyWorkflowReturn,
} from './hooks/useMyWorkflow';
```

### 7. Create Component Usage Example

```typescript
// Example: Using MyWorkflow machine in a component

import { useMyWorkflow } from '@nasnet/state/machines';

export function MyWorkflowComponent() {
  const {
    state,
    context,
    isStep1,
    isStep2,
    isStep3,
    canNext,
    canBack,
    isSubmitting,
    isError,
    next,
    back,
    submit,
    cancel,
    retry,
  } = useMyWorkflow({
    userId: 'current-user',
    onComplete: (context) => {
      console.log('Workflow completed:', context.result);
    },
    onError: (error) => {
      console.error('Workflow error:', error);
    },
  });

  return (
    <div className="workflow">
      {/* Step 1 */}
      {isStep1 && (
        <div>
          <h2>Step 1: Input</h2>
          <Step1Form onSubmit={submit} />
          <button onClick={next} disabled={!canNext}>
            Next
          </button>
          <button onClick={cancel}>Cancel</button>
        </div>
      )}

      {/* Step 2 */}
      {isStep2 && (
        <div>
          <h2>Step 2: Configuration</h2>
          <Step2Form onSubmit={submit} />
          <button onClick={back} disabled={!canBack}>
            Back
          </button>
          <button onClick={next} disabled={!canNext}>
            Next
          </button>
          <button onClick={cancel}>Cancel</button>
        </div>
      )}

      {/* Step 3 */}
      {isStep3 && (
        <div>
          <h2>Step 3: Review</h2>
          <ReviewSummary context={context} />
          <button onClick={back} disabled={!canBack}>
            Back
          </button>
          <button onClick={() => submit({})} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button onClick={cancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="error">
          <p>{context.error?.message}</p>
          <button onClick={retry}>Retry</button>
          <button onClick={cancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

## Best Practices Checklist

- [ ] Machine file named: `[workflow]Machine.ts`
- [ ] Hook file named: `use[Workflow].ts`
- [ ] TypeScript interfaces for Context and Events
- [ ] Initial state is first step/logical start
- [ ] Guards validate transitions
- [ ] All states have exit transitions (no dead ends)
- [ ] Final states use `type: 'final'`
- [ ] Async operations use `invoke`
- [ ] Error states have retry option
- [ ] Tests cover all paths
- [ ] Exported from `index.ts`
- [ ] React hook wraps machine for easier use
- [ ] JSDoc comments explaining workflow

## Storage & Persistence

To save/restore machine state:

```typescript
import {
  persistMachineState,
  restoreMachineState,
} from '@nasnet/state/machines';

// Save
const state = actor.getSnapshot();
persistMachineState('myWorkflow', 'workflow-123', state);

// Restore
const saved = restoreMachineState('myWorkflow', 'workflow-123');
if (saved) {
  actor.send({ type: 'RESTORE', state: saved });
}
```

## File Structure

```typescript
libs/state/machines/src/
├── myWorkflowMachine.ts            // Machine definition
├── hooks/
│   └── useMyWorkflow.ts            // React hook
└── myWorkflowMachine.test.ts        // Tests
```

## Quick Template

```typescript
import { setup } from 'xstate';

export interface MyMachineContext {
  // State data
}

export type MyMachineEvent = { type: 'NEXT' } | { type: 'BACK' };

export function createMyMachine() {
  return setup({
    types: {
      context: {} as MyMachineContext,
      events: {} as MyMachineEvent,
    },
  }).createMachine({
    id: 'myMachine',
    initial: 'initialState',
    context: {},
    states: {
      initialState: {
        on: { NEXT: 'nextState' },
      },
      nextState: {
        type: 'final',
      },
    },
  });
}
```

## Next Steps

1. Create machine file with template
2. Define context and events
3. Design state machine diagram
4. Implement states and transitions
5. Add guards for conditions
6. Create React hook wrapper
7. Write comprehensive tests
8. Export from index
9. Use in components

See [XState docs](https://stately.ai/docs/xstate) for advanced patterns.
