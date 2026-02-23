// libs/features/diagnostics/src/machines/troubleshoot-machine.ts
import { createMachine, assign } from 'xstate';
import type {
  TroubleshootContext,
  TroubleshootEvent,
  DiagnosticStep,
  DiagnosticResult,
} from '../types/troubleshoot.types';
import { getFix } from '../constants/fix-registry';

/** Initial diagnostic steps, all pending until execution */
const INITIAL_STEPS: DiagnosticStep[] = [
  { id: 'wan', name: 'WAN Interface', description: 'Check physical connection', status: 'pending' },
  { id: 'gateway', name: 'Gateway', description: 'Ping default gateway', status: 'pending' },
  { id: 'internet', name: 'Internet', description: 'Ping external server', status: 'pending' },
  { id: 'dns', name: 'DNS', description: 'Test name resolution', status: 'pending' },
  { id: 'nat', name: 'NAT', description: 'Verify masquerade rules', status: 'pending' },
];

/**
 * Factory function to create a troubleshoot machine instance with a specific routerId.
 * Each wizard instance gets its own isolated machine state.
 *
 * State flow:
 * - idle: Waiting to start
 * - initializing: Detecting network configuration (WAN interface, gateway)
 * - runningDiagnostic:
 *   - executingStep: Running a diagnostic test
 *   - stepComplete: Evaluating step result
 *   - awaitingFixDecision: Waiting for user to apply or skip fix
 *   - applyingFix: Executing fix command
 *   - verifyingFix: Re-running diagnostic to verify fix
 *   - nextStep: Moving to next diagnostic
 * - completed: All diagnostics finished
 *
 * Events:
 * - START: Begin diagnostics
 * - APPLY_FIX: Apply the suggested fix
 * - SKIP_FIX: Skip fix and continue
 * - RESTART: Reset to idle
 * - CANCEL: Cancel from any state
 *
 * @param routerId The router UUID to run diagnostics against
 * @returns XState machine configured for troubleshooting
 */
export function createTroubleshootMachine(routerId: string) {
  return createMachine({
    id: 'troubleshootWizard',
    initial: 'idle',
    context: {
      routerId,
      wanInterface: 'ether1', // Will be detected in initializing state
      gateway: null,
      steps: INITIAL_STEPS,
      currentStepIndex: 0,
      overallStatus: 'idle',
      appliedFixes: [],
      startTime: null,
      endTime: null,
      error: null,
    } as TroubleshootContext,

    states: {
      idle: {
        on: {
          START: {
            target: 'initializing',
            actions: assign({
              startTime: () => new Date(),
              overallStatus: 'running',
              error: null,
            }),
          },
        },
      },

      // Detect WAN interface and gateway before running diagnostics
      initializing: {
        invoke: {
          src: 'detectNetworkConfig',
          input: ({ context }) => ({ routerId: context.routerId }),
          onDone: {
            target: 'runningDiagnostic',
            actions: assign({
              wanInterface: ({ event }) => event.output.wanInterface,
              gateway: ({ event }) => event.output.gateway,
            }),
          },
          onError: {
            target: 'runningDiagnostic',
            // Continue with defaults if detection fails
            actions: assign({
              wanInterface: 'ether1',
              gateway: null,
            }),
          },
        },
      },

      runningDiagnostic: {
        initial: 'executingStep',
        states: {
          executingStep: {
            entry: assign({
              steps: ({ context }) =>
                context.steps.map((step, i) =>
                  i === context.currentStepIndex
                    ? { ...step, status: 'running' as const }
                    : step
                ),
            }),
            invoke: {
              src: 'executeDiagnosticStep',
              input: ({ context }) => ({
                step: context.steps[context.currentStepIndex],
                routerId: context.routerId,
                wanInterface: context.wanInterface,
                gateway: context.gateway,
              }),
              onDone: {
                target: 'stepComplete',
                actions: assign({
                  steps: ({ context, event }) =>
                    context.steps.map((step, i) =>
                      i === context.currentStepIndex
                        ? {
                            ...step,
                            status: event.output.success ? 'passed' : 'failed',
                            result: event.output,
                            fix: event.output.success ? undefined : getFix(step.id, event.output),
                          }
                        : step
                    ),
                }),
              },
              onError: {
                target: 'stepComplete',
                actions: assign({
                  steps: ({ context }) =>
                    context.steps.map((step, i) =>
                      i === context.currentStepIndex
                        ? {
                            ...step,
                            status: 'failed' as const,
                            result: {
                              success: false,
                              message: 'Diagnostic failed unexpectedly',
                              executionTimeMs: 0,
                            },
                          }
                        : step
                    ),
                }),
              },
            },
          },

          stepComplete: {
            always: [
              // If step failed and has a fix available, wait for user decision
              {
                target: 'awaitingFixDecision',
                guard: ({ context }) =>
                  context.steps[context.currentStepIndex].status === 'failed' &&
                  !!context.steps[context.currentStepIndex].fix,
              },
              // If more steps, continue
              {
                target: 'nextStep',
                guard: ({ context }) => context.currentStepIndex < context.steps.length - 1,
              },
              // If last step, complete
              { target: '#troubleshootWizard.completed' },
            ],
          },

          awaitingFixDecision: {
            on: {
              APPLY_FIX: { target: 'applyingFix' },
              SKIP_FIX: { target: 'nextStep' },
            },
          },

          applyingFix: {
            invoke: {
              src: 'applyFix',
              input: ({ context }) => ({
                routerId: context.routerId,
                fix: context.steps[context.currentStepIndex].fix,
              }),
              onDone: {
                target: 'verifyingFix',
                actions: assign({
                  appliedFixes: ({ context, event }) =>
                    event.output.success
                      ? [
                          ...context.appliedFixes,
                          context.steps[context.currentStepIndex].fix!.issueCode,
                        ]
                      : context.appliedFixes,
                }),
              },
              onError: { target: 'awaitingFixDecision' },
            },
          },

          verifyingFix: {
            // Re-run the same diagnostic step to verify fix worked
            invoke: {
              src: 'executeDiagnosticStep',
              input: ({ context }) => ({
                step: context.steps[context.currentStepIndex],
                routerId: context.routerId,
                wanInterface: context.wanInterface,
                gateway: context.gateway,
              }),
              onDone: [
                // Fix worked - proceed to next step
                {
                  target: 'nextStep',
                  guard: ({ event }) => event.output.success,
                  actions: assign({
                    steps: ({ context, event }) =>
                      context.steps.map((step, i) =>
                        i === context.currentStepIndex
                          ? { ...step, status: 'passed' as const, result: event.output }
                          : step
                      ),
                  }),
                },
                // Fix didn't work - show "issue persists" state
                {
                  target: 'awaitingFixDecision',
                  actions: assign({
                    steps: ({ context, event }) =>
                      context.steps.map((step, i) =>
                        i === context.currentStepIndex
                          ? {
                              ...step,
                              result: {
                                ...event.output,
                                message: 'Fix applied, but issue persists',
                              },
                            }
                          : step
                      ),
                  }),
                },
              ],
            },
          },

          nextStep: {
            always: [
              {
                target: 'executingStep',
                guard: ({ context }) => context.currentStepIndex < context.steps.length - 1,
                actions: assign({
                  currentStepIndex: ({ context }) => context.currentStepIndex + 1,
                }),
              },
              { target: '#troubleshootWizard.completed' },
            ],
          },
        },
      },

      completed: {
        entry: assign({
          overallStatus: 'completed',
          endTime: () => new Date(),
        }),
        on: {
          RESTART: {
            target: 'idle',
            actions: assign({
              steps: () => INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as const })),
              currentStepIndex: 0,
              appliedFixes: [],
              startTime: null,
              endTime: null,
              error: null,
              overallStatus: 'idle',
            }),
          },
        },
      },
    },

    // Global cancel handler - can cancel from any state
    on: {
      CANCEL: {
        target: '.idle',
        actions: assign({ overallStatus: 'idle' }),
      },
    },
  });
}

export type TroubleshootMachine = ReturnType<typeof createTroubleshootMachine>;
