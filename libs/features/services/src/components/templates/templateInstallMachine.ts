/**
 * Template Install Wizard Machine
 *
 * XState machine for the template installation wizard flow.
 * Manages the 4-step process: Variables → Review → Installing → Routing
 */

import { setup, assign, fromPromise } from 'xstate';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

/**
 * Template installation context
 */
export interface TemplateInstallContext {
  /** Router ID */
  routerId: string;
  /** Template being installed */
  template: ServiceTemplate | null;
  /** Template ID */
  templateId: string;
  /** Variable values entered by user */
  variables: Record<string, unknown>;
  /** Whether this is a dry run (preview) */
  dryRun: boolean;
  /** Installation result */
  installResult: {
    success: boolean;
    instanceIDs: string[];
    errors: string[];
  } | null;
  /** Installation progress */
  progress: {
    phase: string;
    current: number;
    total: number;
    currentService: string | null;
  } | null;
  /** Selected routing rules to apply */
  selectedRoutingRules: string[];
  /** Current step (1-4) */
  currentStep: number;
  /** Validation errors */
  errors: Record<string, string>;
}

/**
 * Template install wizard events
 */
export type TemplateInstallEvent =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_VARIABLES'; variables: Record<string, unknown> }
  | { type: 'START_INSTALL' }
  | {
      type: 'INSTALL_COMPLETE';
      result: { success: boolean; instanceIDs: string[]; errors: string[] };
    }
  | { type: 'INSTALL_FAILED'; error: string }
  | {
      type: 'PROGRESS_UPDATE';
      progress: { phase: string; current: number; total: number; currentService: string | null };
    }
  | { type: 'TOGGLE_ROUTING_RULE'; ruleId: string }
  | { type: 'SKIP_ROUTING' }
  | { type: 'APPLY_ROUTING' }
  | { type: 'CANCEL' }
  | { type: 'COMPLETE' };

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

/**
 * Create template installation wizard machine
 *
 * @description Creates an XState machine for the template installation wizard flow.
 * Manages a 4-step process: Variables → Review → Installing → Routing.
 *
 * @param initialContext - Initial context values for the machine
 * @returns XState machine builder for template installation
 */
export function createTemplateInstallMachine(initialContext: Partial<TemplateInstallContext>) {
  return setup({
    types: {} as {
      context: TemplateInstallContext;
      events: TemplateInstallEvent;
    },
    actors: {
      validateVariables: fromPromise<
        ValidationResult,
        { variables: Record<string, unknown>; template: ServiceTemplate | null }
      >(async ({ input }) => {
        const { variables, template } = input;

        if (!template) {
          return { valid: false, errors: { template: 'Template not found' } };
        }

        const errors: Record<string, string> = {};

        // Validate required variables
        for (const variable of template.configVariables) {
          if (variable.required && !variables[variable.name]) {
            errors[variable.name] = `${variable.label} is required`;
          }
        }

        return {
          valid: Object.keys(errors).length === 0,
          errors: Object.keys(errors).length > 0 ? errors : undefined,
        };
      }),
    },
    guards: {
      canGoNext: ({ context }) => {
        if (context.currentStep === 1) {
          // Variables step - check if all required variables are filled
          return Object.keys(context.errors).length === 0;
        }
        return true;
      },
      canGoPrev: ({ context }) => {
        // Can't go back during installation
        return context.currentStep > 1 && context.currentStep !== 3;
      },
    },
  }).createMachine({
    id: 'templateInstall',
    initial: 'variables',
    context: {
      routerId: '',
      template: null,
      templateId: '',
      variables: {},
      dryRun: false,
      installResult: null,
      progress: null,
      selectedRoutingRules: [],
      currentStep: 1,
      errors: {},
      ...initialContext,
    },
    states: {
      variables: {
        entry: assign({ currentStep: 1 }),
        on: {
          SET_VARIABLES: {
            actions: assign({
              variables: ({ event }) => event.variables,
            }),
          },
          NEXT: {
            target: 'review',
            guard: 'canGoNext',
          },
          CANCEL: 'cancelled',
        },
      },
      review: {
        entry: assign({ currentStep: 2 }),
        on: {
          PREV: 'variables',
          START_INSTALL: 'installing',
          CANCEL: 'cancelled',
        },
      },
      installing: {
        entry: assign({ currentStep: 3 }),
        on: {
          PROGRESS_UPDATE: {
            actions: assign({
              progress: ({ event }) => event.progress,
            }),
          },
          INSTALL_COMPLETE: {
            target: 'routing',
            actions: assign({
              installResult: ({ event }) => event.result,
            }),
          },
          INSTALL_FAILED: {
            target: 'failed',
            actions: assign({
              errors: ({ event }) => ({ install: event.error }),
            }),
          },
          CANCEL: 'cancelled',
        },
      },
      routing: {
        entry: assign({ currentStep: 4 }),
        on: {
          TOGGLE_ROUTING_RULE: {
            actions: assign({
              selectedRoutingRules: ({ context, event }) => {
                const { selectedRoutingRules } = context;
                const { ruleId } = event;

                if (selectedRoutingRules.includes(ruleId)) {
                  return selectedRoutingRules.filter((id) => id !== ruleId);
                }
                return [...selectedRoutingRules, ruleId];
              },
            }),
          },
          SKIP_ROUTING: 'completed',
          APPLY_ROUTING: 'completed',
        },
      },
      completed: {
        type: 'final',
      },
      cancelled: {
        type: 'final',
      },
      failed: {
        type: 'final',
      },
    },
  });
}
