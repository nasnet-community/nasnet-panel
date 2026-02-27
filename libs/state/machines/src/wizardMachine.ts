/**
 * Generic Wizard Machine Pattern
 *
 * Provides a reusable state machine for multi-step wizard flows.
 * Supports navigation, validation, persistence, and session recovery.
 *
 * States:
 * - step: Active step (editing)
 * - validating: Running step validation
 * - submitting: Submitting final wizard data
 * - completed: Wizard finished successfully
 * - cancelled: Wizard cancelled by user
 *
 * Features:
 * - Step navigation with guards
 * - Async step validation
 * - Session persistence for recovery
 * - TypeScript generics for type-safe data
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { setup, assign, fromPromise } from 'xstate';

import type { WizardContext, WizardEvent, WizardConfig } from './types';

// ===== Type Definitions =====

/**
 * Validation result from step validation
 */
interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

/**
 * Actor input for validation
 */
interface ValidationInput<TData> {
  step: number;
  data: Partial<TData>;
  validateStep: WizardConfig<TData>['validateStep'];
}

/**
 * Actor input for submission
 */
interface SubmitInput<TData> {
  data: TData;
  onSubmit: WizardConfig<TData>['onSubmit'];
}

// ===== Factory Function =====

/**
 * Create a wizard machine with the specified configuration
 *
 * @template TData - Type of wizard data collected across steps
 * @param config - Wizard configuration
 * @returns XState machine for the wizard
 *
 * @example
 * ```ts
 * interface VPNWizardData {
 *   serverAddress: string;
 *   port: number;
 *   protocol: 'wireguard' | 'openvpn';
 *   credentials: { username: string; password: string };
 * }
 *
 * const vpnWizardMachine = createWizardMachine<VPNWizardData>({
 *   id: 'vpn-wizard',
 *   totalSteps: 4,
 *   validateStep: async (step, data) => {
 *     // Validate based on step
 *     if (step === 1 && !data.serverAddress) {
 *       return { valid: false, errors: { serverAddress: 'Server address is required' } };
 *     }
 *     return { valid: true };
 *   },
 *   onSubmit: async (data) => {
 *     await apiClient.createVPN(data);
 *   },
 * });
 * ```
 */
function createWizardMachineV1<TData extends Record<string, unknown>>(config: WizardConfig<TData>) {
  const { id, totalSteps, validateStep, onSubmit, initialData = {}, persist = true } = config;

  return setup({
    types: {} as {
      context: WizardContext<TData>;
      events: WizardEvent<TData>;
    },
    actors: {
      validateStep: fromPromise<ValidationResult, ValidationInput<TData>>(async ({ input }) => {
        return input.validateStep(input.step, input.data);
      }),
      submitWizard: fromPromise<void, SubmitInput<TData>>(async ({ input }) => {
        await input.onSubmit(input.data as TData);
      }),
    },
    guards: {
      canGoBack: ({ context }) => context.currentStep > 1,
      canGoForward: ({ context }) => context.currentStep < context.totalSteps,
      isLastStep: ({ context }) => context.currentStep === context.totalSteps,
      isNotLastStep: ({ context }) => context.currentStep < context.totalSteps,
      canGoToStep: ({ context, event }) => {
        if (event.type !== 'GOTO') return false;
        const targetStep = event.step;
        // Can only go to steps <= current step (already validated)
        // or if canSkip is enabled
        return (
          targetStep >= 1 &&
          targetStep <= context.totalSteps &&
          (targetStep <= context.currentStep || context.canSkip === true)
        );
      },
    },
    actions: {
      incrementStep: assign({
        currentStep: ({ context }) => context.currentStep + 1,
        errors: () => ({}), // Clear errors on step change
      }),
      decrementStep: assign({
        currentStep: ({ context }) => context.currentStep - 1,
        errors: () => ({}), // Clear errors on step change
      }),
      goToStep: assign({
        currentStep: ({ event }) => {
          if (event.type === 'GOTO') {
            return event.step;
          }
          return 1;
        },
        errors: () => ({}), // Clear errors on step change
      }),
      mergeData: assign({
        data: ({ context, event }) => {
          if (event.type === 'NEXT' && event.data) {
            return { ...context.data, ...event.data };
          }
          if (event.type === 'SET_DATA' && event.data) {
            return { ...context.data, ...event.data };
          }
          return context.data;
        },
      }),
      setValidationErrors: assign({
        errors: ({ event }) => {
          // Access the output from the invoked actor
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'errors' in event.output
          ) {
            return (event.output.errors as Record<string, string>) || {};
          }
          return {};
        },
      }),
      clearErrors: assign({
        errors: () => ({}),
      }),
      restoreContext: assign({
        currentStep: ({ event }) => {
          if (event.type === 'RESTORE') {
            return event.savedContext.currentStep;
          }
          return 1;
        },
        data: ({ event }) => {
          if (event.type === 'RESTORE') {
            return event.savedContext.data;
          }
          return {};
        },
        sessionId: ({ event }) => {
          if (event.type === 'RESTORE') {
            return event.savedContext.sessionId;
          }
          return crypto.randomUUID();
        },
      }),
    },
  }).createMachine({
    id,
    initial: 'step',
    context: {
      currentStep: 1,
      totalSteps,
      data: initialData as Partial<TData>,
      errors: {},
      sessionId: crypto.randomUUID(),
      canSkip: false,
    },
    states: {
      step: {
        description: 'Active step - user is editing data',
        on: {
          NEXT: {
            target: 'validating',
            actions: 'mergeData',
          },
          BACK: {
            target: 'step',
            guard: 'canGoBack',
            actions: 'decrementStep',
          },
          GOTO: {
            target: 'step',
            guard: 'canGoToStep',
            actions: 'goToStep',
          },
          SET_DATA: {
            actions: 'mergeData',
          },
          CLEAR_ERRORS: {
            actions: 'clearErrors',
          },
          CANCEL: {
            target: 'cancelled',
          },
          RESTORE: {
            actions: 'restoreContext',
          },
        },
      },
      validating: {
        description: 'Running step validation',
        invoke: {
          id: 'validateStep',
          src: 'validateStep',
          input: ({ context }) => ({
            step: context.currentStep,
            data: context.data,
            validateStep,
          }),
          onDone: [
            {
              // Validation passed, not last step - advance
              target: 'step',
              guard: ({ event }) => {
                const output = event.output as ValidationResult;
                return output.valid;
              },
              actions: [
                'incrementStep',
                // Note: We use a conditional to check if this was the last step
                // If it was, we should go to submitting instead
              ],
            },
            {
              // Validation failed - stay on current step with errors
              target: 'step',
              actions: 'setValidationErrors',
            },
          ],
          onError: {
            target: 'step',
            actions: assign({
              errors: () => ({ _form: 'Validation failed. Please try again.' }),
            }),
          },
        },
      },
      submitting: {
        description: 'Submitting final wizard data',
        invoke: {
          id: 'submitWizard',
          src: 'submitWizard',
          input: ({ context }) => ({
            data: context.data as TData,
            onSubmit,
          }),
          onDone: {
            target: 'completed',
          },
          onError: {
            target: 'step',
            actions: assign({
              errors: ({ event }) => ({
                _form:
                  event.error instanceof Error ?
                    event.error.message
                  : 'Submission failed. Please try again.',
              }),
            }),
          },
        },
      },
      completed: {
        description: 'Wizard finished successfully',
        type: 'final',
      },
      cancelled: {
        description: 'Wizard cancelled by user',
        type: 'final',
      },
    },
  });
}

/**
 * Alternative machine that handles last step submission properly
 * This version uses a more explicit state structure
 */
export function createWizardMachineV2<TData extends Record<string, unknown>>(
  config: WizardConfig<TData>
) {
  const { id, totalSteps, validateStep, onSubmit, initialData = {} } = config;

  return setup({
    types: {} as {
      context: WizardContext<TData>;
      events: WizardEvent<TData>;
    },
    actors: {
      validateStep: fromPromise<ValidationResult, ValidationInput<TData>>(async ({ input }) => {
        return input.validateStep(input.step, input.data);
      }),
      submitWizard: fromPromise<void, SubmitInput<TData>>(async ({ input }) => {
        await input.onSubmit(input.data as TData);
      }),
    },
    guards: {
      canGoBack: ({ context }) => context.currentStep > 1,
      isLastStep: ({ context }) => context.currentStep === context.totalSteps,
      isNotLastStep: ({ context }) => context.currentStep < context.totalSteps,
      validationPassed: ({ event }) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'output' in event &&
          typeof event.output === 'object' &&
          event.output !== null &&
          'valid' in event.output
        ) {
          return (event.output as ValidationResult).valid === true;
        }
        return false;
      },
    },
    actions: {
      incrementStep: assign({
        currentStep: ({ context }) => context.currentStep + 1,
        errors: () => ({}),
      }),
      decrementStep: assign({
        currentStep: ({ context }) => context.currentStep - 1,
        errors: () => ({}),
      }),
      mergeData: assign({
        data: ({ context, event }) => {
          if (event.type === 'NEXT' && event.data) {
            return { ...context.data, ...event.data };
          }
          if (event.type === 'SET_DATA' && event.data) {
            return { ...context.data, ...event.data };
          }
          return context.data;
        },
      }),
      setValidationErrors: assign({
        errors: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object' &&
            event.output !== null &&
            'errors' in event.output
          ) {
            return (event.output.errors as Record<string, string>) || {};
          }
          return {};
        },
      }),
      clearErrors: assign({ errors: () => ({}) }),
      restoreContext: assign({
        currentStep: ({ event }) => (event.type === 'RESTORE' ? event.savedContext.currentStep : 1),
        data: ({ event }) => (event.type === 'RESTORE' ? event.savedContext.data : {}),
        sessionId: ({ event }) =>
          event.type === 'RESTORE' ? event.savedContext.sessionId : crypto.randomUUID(),
      }),
    },
  }).createMachine({
    id,
    initial: 'step',
    context: {
      currentStep: 1,
      totalSteps,
      data: initialData as Partial<TData>,
      errors: {},
      sessionId: crypto.randomUUID(),
      canSkip: false,
    },
    states: {
      step: {
        on: {
          NEXT: {
            target: 'validating',
            actions: 'mergeData',
          },
          BACK: {
            guard: 'canGoBack',
            actions: 'decrementStep',
          },
          SET_DATA: {
            actions: 'mergeData',
          },
          CLEAR_ERRORS: {
            actions: 'clearErrors',
          },
          CANCEL: 'cancelled',
          RESTORE: {
            actions: 'restoreContext',
          },
        },
      },
      validating: {
        invoke: {
          src: 'validateStep',
          input: ({ context }) => ({
            step: context.currentStep,
            data: context.data,
            validateStep,
          }),
          onDone: [
            // Valid + last step → submit
            {
              target: 'submitting',
              guard: ({ context, event }) => {
                const output = event.output as ValidationResult;
                return output.valid && context.currentStep === context.totalSteps;
              },
            },
            // Valid + not last step → advance
            {
              target: 'step',
              guard: ({ context, event }) => {
                const output = event.output as ValidationResult;
                return output.valid && context.currentStep < context.totalSteps;
              },
              actions: 'incrementStep',
            },
            // Invalid → stay with errors
            {
              target: 'step',
              actions: 'setValidationErrors',
            },
          ],
          onError: {
            target: 'step',
            actions: assign({
              errors: () => ({ _form: 'Validation failed. Please try again.' }),
            }),
          },
        },
      },
      submitting: {
        invoke: {
          src: 'submitWizard',
          input: ({ context }) => ({
            data: context.data as TData,
            onSubmit,
          }),
          onDone: 'completed',
          onError: {
            target: 'step',
            actions: assign({
              errors: ({ event }) => ({
                _form:
                  event.error instanceof Error ?
                    event.error.message
                  : 'Submission failed. Please try again.',
              }),
            }),
          },
        },
      },
      completed: {
        type: 'final',
      },
      cancelled: {
        type: 'final',
      },
    },
  });
}

// Export the V2 version as the primary export (more robust)
export { createWizardMachineV2 as createWizardMachine };
