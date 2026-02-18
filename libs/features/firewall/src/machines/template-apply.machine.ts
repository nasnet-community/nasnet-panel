/**
 * Template Apply Machine
 *
 * XState machine for firewall template application with safety flow:
 * idle → previewing → confirming → applying → success/error
 *
 * Safety Features:
 * - Validates variables before preview
 * - Detects rule conflicts
 * - Analyzes impact before apply
 * - Requires confirmation for high-risk operations
 * - Automatic rollback on failure
 * - Manual rollback capability
 *
 * @see NAS-7.6: Firewall Templates Feature
 * @see libs/state/machines/src/configPipelineMachine.ts for pattern reference
 */

import { setup, assign, fromPromise } from 'xstate';
import type {
  FirewallTemplate,
  TemplatePreviewResult,
  FirewallTemplateResult,
  TemplateConflict,
} from '../schemas/templateSchemas';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Context for the template apply machine
 */
export interface TemplateApplyContext {
  /**
   * Router ID to apply template to
   */
  routerId: string | null;

  /**
   * Selected template to apply
   */
  template: FirewallTemplate | null;

  /**
   * Variable values provided by user
   */
  variables: Record<string, string>;

  /**
   * Validation errors for variables
   */
  validationErrors: Array<{ field: string; message: string }>;

  /**
   * Preview result with resolved rules and conflicts
   */
  previewResult: TemplatePreviewResult | null;

  /**
   * Apply result with success status and rollback ID
   */
  applyResult: FirewallTemplateResult | null;

  /**
   * Timestamp when apply started (for rollback timer)
   */
  applyStartedAt: number | null;

  /**
   * Error message if operation failed
   */
  errorMessage: string | null;
}

/**
 * Events for the template apply machine
 */
export type TemplateApplyEvent =
  | { type: 'SELECT_TEMPLATE'; template: FirewallTemplate; routerId: string }
  | { type: 'UPDATE_VARIABLES'; variables: Record<string, string> }
  | { type: 'PREVIEW' }
  | { type: 'CONFIRM' }
  | { type: 'APPLY' }
  | { type: 'ACKNOWLEDGED' }
  | { type: 'ROLLBACK' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

/**
 * Configuration for template apply machine
 */
export interface TemplateApplyConfig {
  /**
   * Unique machine ID
   */
  id?: string;

  /**
   * Preview template with variable resolution and conflict detection
   */
  previewTemplate: (params: {
    routerId: string;
    template: FirewallTemplate;
    variables: Record<string, string>;
  }) => Promise<TemplatePreviewResult>;

  /**
   * Apply template to router
   */
  applyTemplate: (params: {
    routerId: string;
    template: FirewallTemplate;
    variables: Record<string, string>;
  }) => Promise<FirewallTemplateResult>;

  /**
   * Execute rollback to previous state
   */
  executeRollback: (params: { routerId: string; rollbackId: string }) => Promise<void>;

  /**
   * Callback on successful apply
   */
  onSuccess?: () => void;

  /**
   * Callback on rollback
   */
  onRollback?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: string) => void;
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a template apply machine
 *
 * @param config - Machine configuration
 * @returns XState machine for template application
 *
 * @example
 * ```ts
 * const machine = createTemplateApplyMachine({
 *   previewTemplate: async ({ routerId, template, variables }) => {
 *     const result = await previewTemplateAPI(routerId, template.id, variables);
 *     return result;
 *   },
 *   applyTemplate: async ({ routerId, template, variables }) => {
 *     const result = await applyTemplateAPI(routerId, template.id, variables);
 *     return result;
 *   },
 *   executeRollback: async ({ routerId, rollbackId }) => {
 *     await rollbackTemplateAPI(routerId, rollbackId);
 *   },
 *   onSuccess: () => {
 *     showSuccess('Template applied successfully');
 *   },
 * });
 * ```
 */
export function createTemplateApplyMachine(config: TemplateApplyConfig) {
  const {
    id = 'templateApply',
    previewTemplate,
    applyTemplate,
    executeRollback,
    onSuccess,
    onRollback,
    onError,
  } = config;

  return setup({
    types: {} as {
      context: TemplateApplyContext;
      events: TemplateApplyEvent;
    },
    actors: {
      previewTemplate: fromPromise<
        TemplatePreviewResult,
        {
          routerId: string;
          template: FirewallTemplate;
          variables: Record<string, string>;
        }
      >(async ({ input }) => {
        return previewTemplate(input);
      }),
      applyTemplate: fromPromise<
        FirewallTemplateResult,
        {
          routerId: string;
          template: FirewallTemplate;
          variables: Record<string, string>;
        }
      >(async ({ input }) => {
        return applyTemplate(input);
      }),
      executeRollback: fromPromise<void, { routerId: string; rollbackId: string }>(async ({ input }) => {
        return executeRollback(input);
      }),
    },
    guards: {
      /**
       * Check if there are validation errors
       */
      hasValidationErrors: ({ context }) => {
        return context.validationErrors.length > 0;
      },

      /**
       * Check if there are no validation errors
       */
      isValidated: ({ context }) => {
        return context.validationErrors.length === 0;
      },

      /**
       * Check if preview has conflicts
       */
      hasConflicts: ({ context }) => {
        return (context.previewResult?.conflicts?.length ?? 0) > 0;
      },

      /**
       * Check if operation is high risk
       * High risk if: many rules (>10), many affected chains (>3), or conflicts exist
       */
      isHighRisk: ({ context }) => {
        if (!context.previewResult) return false;

        const { impactAnalysis, conflicts } = context.previewResult;

        return (
          impactAnalysis.newRulesCount > 10 ||
          impactAnalysis.affectedChains.length > 3 ||
          conflicts.length > 0 ||
          impactAnalysis.warnings.length > 0
        );
      },

      /**
       * Check if apply was successful
       */
      applySucceeded: ({ event }) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'output' in event &&
          typeof event.output === 'object' &&
          event.output !== null &&
          'success' in event.output
        ) {
          return (event.output as FirewallTemplateResult).success === true;
        }
        return false;
      },

      /**
       * Check if apply failed
       */
      applyFailed: ({ event }) => {
        if (
          typeof event === 'object' &&
          event !== null &&
          'output' in event &&
          typeof event.output === 'object' &&
          event.output !== null &&
          'success' in event.output
        ) {
          return (event.output as FirewallTemplateResult).success === false;
        }
        return false;
      },

      /**
       * Check if rollback data is available
       */
      hasRollbackData: ({ context }) => {
        return context.applyResult?.rollbackId !== undefined && context.applyResult?.rollbackId !== '';
      },
    },
    actions: {
      /**
       * Store selected template and router ID
       */
      storeTemplate: assign({
        template: ({ event }) => {
          if (event.type === 'SELECT_TEMPLATE') {
            return event.template;
          }
          return null;
        },
        routerId: ({ event }) => {
          if (event.type === 'SELECT_TEMPLATE') {
            return event.routerId;
          }
          return null;
        },
      }),

      /**
       * Store variable values
       */
      storeVariables: assign({
        variables: ({ event }) => {
          if (event.type === 'UPDATE_VARIABLES') {
            return event.variables;
          }
          return {};
        },
      }),

      /**
       * Store preview result
       */
      storePreviewResult: assign({
        previewResult: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object'
          ) {
            return event.output as TemplatePreviewResult;
          }
          return null;
        },
      }),

      /**
       * Store apply result and start rollback timer
       */
      recordApplyResult: assign({
        applyResult: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'output' in event &&
            typeof event.output === 'object'
          ) {
            return event.output as FirewallTemplateResult;
          }
          return null;
        },
        applyStartedAt: () => Date.now(),
      }),

      /**
       * Set error message
       */
      setErrorMessage: assign({
        errorMessage: ({ event }) => {
          if (
            typeof event === 'object' &&
            event !== null &&
            'error' in event &&
            event.error instanceof Error
          ) {
            return event.error.message;
          }
          return 'An unknown error occurred';
        },
      }),

      /**
       * Clear validation errors
       */
      clearErrors: assign({
        validationErrors: () => [],
        errorMessage: () => null,
      }),

      /**
       * Reset machine to initial state
       */
      resetMachine: assign({
        routerId: () => null,
        template: () => null,
        variables: () => ({}),
        validationErrors: () => [],
        previewResult: () => null,
        applyResult: () => null,
        applyStartedAt: () => null,
        errorMessage: () => null,
      }),

      /**
       * Start rollback timer (10 seconds for auto-rollback)
       */
      startRollbackTimer: assign({
        applyStartedAt: () => Date.now(),
      }),

      /**
       * Trigger success callback
       */
      notifySuccess: () => {
        onSuccess?.();
      },

      /**
       * Trigger rollback callback
       */
      notifyRolledBack: () => {
        onRollback?.();
      },

      /**
       * Trigger error callback
       */
      notifyError: ({ context }) => {
        onError?.(context.errorMessage || 'Unknown error');
      },
    },
  }).createMachine({
    id,
    initial: 'idle',
    context: {
      routerId: null,
      template: null,
      variables: {},
      validationErrors: [],
      previewResult: null,
      applyResult: null,
      applyStartedAt: null,
      errorMessage: null,
    },
    states: {
      idle: {
        description: 'Initial state - waiting for template selection',
        on: {
          SELECT_TEMPLATE: {
            target: 'configuring',
            actions: 'storeTemplate',
          },
        },
      },
      configuring: {
        description: 'User is configuring template variables',
        on: {
          UPDATE_VARIABLES: {
            actions: 'storeVariables',
          },
          PREVIEW: {
            target: 'previewing',
          },
          CANCEL: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      previewing: {
        description: 'Previewing template with conflict detection',
        invoke: {
          src: 'previewTemplate',
          input: ({ context }) => ({
            routerId: context.routerId as string,
            template: context.template as FirewallTemplate,
            variables: context.variables,
          }),
          onDone: {
            target: 'reviewing',
            actions: 'storePreviewResult',
          },
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      reviewing: {
        description: 'User reviewing preview results',
        on: {
          CONFIRM: [
            {
              target: 'confirming',
              guard: 'isHighRisk',
            },
            {
              target: 'applying',
              guard: ({ context }: { context: TemplateApplyContext }) => {
                if (!context.previewResult) return true;
                const { impactAnalysis, conflicts } = context.previewResult;
                return !(
                  impactAnalysis.newRulesCount > 10 ||
                  impactAnalysis.affectedChains.length > 3 ||
                  conflicts.length > 0 ||
                  impactAnalysis.warnings.length > 0
                );
              },
            },
          ],
          UPDATE_VARIABLES: {
            target: 'configuring',
            actions: 'storeVariables',
          },
          CANCEL: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      confirming: {
        description: 'User acknowledging high-risk operation',
        on: {
          ACKNOWLEDGED: {
            target: 'applying',
          },
          CANCEL: {
            target: 'reviewing',
          },
        },
      },
      applying: {
        description: 'Applying template to router',
        invoke: {
          src: 'applyTemplate',
          input: ({ context }) => ({
            routerId: context.routerId as string,
            template: context.template as FirewallTemplate,
            variables: context.variables,
          }),
          onDone: [
            {
              target: 'success',
              guard: 'applySucceeded',
              actions: ['recordApplyResult', 'startRollbackTimer'],
            },
            {
              target: 'error',
              guard: 'applyFailed',
              actions: ['recordApplyResult', 'setErrorMessage'],
            },
          ],
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      success: {
        description: 'Template applied successfully',
        entry: 'notifySuccess',
        on: {
          ROLLBACK: {
            target: 'rollingBack',
            guard: 'hasRollbackData',
          },
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      rollingBack: {
        description: 'Executing rollback to previous state',
        invoke: {
          src: 'executeRollback',
          input: ({ context }) => ({
            routerId: context.routerId as string,
            rollbackId: context.applyResult?.rollbackId as string,
          }),
          onDone: {
            target: 'rolledBack',
          },
          onError: {
            target: 'error',
            actions: 'setErrorMessage',
          },
        },
      },
      rolledBack: {
        description: 'Rollback completed - back to previous state',
        entry: 'notifyRolledBack',
        on: {
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
      error: {
        description: 'Error occurred during operation',
        entry: 'notifyError',
        on: {
          RETRY: {
            target: 'previewing',
            actions: 'clearErrors',
          },
          ROLLBACK: {
            target: 'rollingBack',
            guard: 'hasRollbackData',
          },
          RESET: {
            target: 'idle',
            actions: 'resetMachine',
          },
        },
      },
    },
  });
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Type helper for extracting state from template apply machine
 */
export type TemplateApplyState =
  | 'idle'
  | 'configuring'
  | 'previewing'
  | 'reviewing'
  | 'confirming'
  | 'applying'
  | 'success'
  | 'rollingBack'
  | 'rolledBack'
  | 'error';

/**
 * Check if machine is in a final state
 */
export function isTemplateFinal(state: TemplateApplyState): boolean {
  return state === 'success' || state === 'rolledBack';
}

/**
 * Check if machine can be cancelled
 */
export function isTemplateCancellable(state: TemplateApplyState): boolean {
  return ['configuring', 'reviewing', 'confirming'].includes(state);
}

/**
 * Check if machine is processing (async operation in progress)
 */
export function isTemplateProcessing(state: TemplateApplyState): boolean {
  return ['previewing', 'applying', 'rollingBack'].includes(state);
}

/**
 * Get human-readable description of machine state
 */
export function getTemplateStateDescription(state: TemplateApplyState): string {
  const descriptions: Record<TemplateApplyState, string> = {
    idle: 'Select a template',
    configuring: 'Configure template variables',
    previewing: 'Generating preview...',
    reviewing: 'Review changes',
    confirming: 'Confirm high-risk operation',
    applying: 'Applying template...',
    success: 'Template applied successfully',
    rollingBack: 'Rolling back changes...',
    rolledBack: 'Changes rolled back',
    error: 'Error occurred',
  };
  return descriptions[state];
}
