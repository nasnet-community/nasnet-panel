// libs/features/diagnostics/src/hooks/useTroubleshootWizard.ts
import { useMachine } from '@xstate/react';
import { useCallback, useMemo, useEffect } from 'react';
import { createTroubleshootMachine } from '../machines/troubleshoot-machine';
import { TROUBLESHOOT_MESSAGES } from '../i18n/troubleshoot-messages';
import { detectWanInterface, detectGateway } from '../utils/network-detection';
import { executeDiagnosticStep } from '../services/diagnostic-executor';
import { applyFixCommand } from '../services/fix-applicator';
import type {
  DiagnosticSummary,
  AppliedFix,
  DiagnosticStep,
  TroubleshootContext,
} from '../types/troubleshoot.types';

export interface UseTroubleshootWizardProps {
  /** Router UUID to run diagnostics against */
  routerId: string;
  /** Auto-start wizard on mount (default: false) */
  autoStart?: boolean;
  /** Callback when wizard completes with final summary */
  onComplete?: (summary: DiagnosticSummary) => void;
  /** Callback when a fix is successfully applied */
  onFixApplied?: (fix: AppliedFix) => void;
}

export interface UseTroubleshootWizardReturn {
  // === State ===
  /** Current state string (e.g., "idle", "initializing", "runningDiagnostic", "completed") */
  state: string;
  /** True when wizard is idle and no diagnostics are running */
  isIdle: boolean;
  /** True when actively running diagnostic steps */
  isRunning: boolean;
  /** True when initializing network detection */
  isInitializing: boolean;
  /** True when all diagnostics have completed */
  isCompleted: boolean;
  /** True when waiting for user decision on applying a fix */
  isAwaitingFixDecision: boolean;
  /** True when applying a fix command to the router */
  isApplyingFix: boolean;
  /** True when verifying that an applied fix resolved the issue */
  isVerifying: boolean;

  // === Data ===
  /** Array of all diagnostic steps with their current status */
  steps: DiagnosticStep[];
  /** The current step being executed or displayed */
  currentStep: DiagnosticStep;
  /** Zero-indexed position of current step */
  currentStepIndex: number;
  /** Progress object with current, total, and percentage */
  progress: { current: number; total: number; percentage: number };
  /** Localized messages for the current step */
  messages: {
    name: string;
    description: string;
    runningMessage: string;
    passedMessage: string;
    failedMessage: string;
  };
  /** List of fix issue codes that have been applied */
  appliedFixes: string[];
  /** Current error, if any */
  error: Error | null;

  // === Actions ===
  /** Start the diagnostic wizard */
  start: () => void;
  /** Apply the suggested fix for the current failed step */
  applyFix: () => void;
  /** Skip the fix and continue to next step */
  skipFix: () => void;
  /** Restart the entire wizard from idle state */
  restart: () => void;
  /** Cancel the wizard and return to idle */
  cancel: () => void;
}

/**
 * Hook for managing the troubleshoot wizard state machine and lifecycle.
 * Orchestrates network detection, diagnostic execution, fix application, and verification.
 *
 * The wizard follows this flow:
 * 1. Idle → 2. Initializing (detect WAN/gateway) → 3. Running Diagnostics → 4. Awaiting Fix Decision → 5. Applying Fix → 6. Verifying → 7. Completed
 *
 * @param props Configuration for the wizard hook
 * @returns Hook return object with state, data, and action callbacks
 *
 * @example
 * ```tsx
 * const wizard = useTroubleshootWizard({
 *   routerId: 'router-123',
 *   autoStart: false,
 *   onComplete: (summary) => console.log('Done:', summary),
 *   onFixApplied: (fix) => console.log('Applied:', fix),
 * });
 *
 * return (
 *   <>
 *     <button onClick={wizard.start}>Start Diagnostics</button>
 *     {wizard.isRunning && <Progress value={wizard.progress.percentage} />}
 *   </>
 * );
 * ```
 */
export function useTroubleshootWizard({
  routerId,
  autoStart = false,
  onComplete,
  onFixApplied,
}: UseTroubleshootWizardProps): UseTroubleshootWizardReturn {
  // Create machine instance with routerId, memoized to prevent recreations
  const machine = useMemo(() => createTroubleshootMachine(routerId), [routerId]);

  const [state, send] = useMachine(machine, {
    // Provide service implementations via input
    ...({
      actors: {
        detectNetworkConfig: async ({ input }: { input: any }) => {
          const wanInterface = await detectWanInterface(input.routerId);
          const gateway = await detectGateway(input.routerId);
          return { wanInterface, gateway };
        },
        executeDiagnosticStep: async ({ input }: { input: any }) => {
          return executeDiagnosticStep(
            input.step.id,
            input.routerId,
            input.sessionId ?? input.step.id
          );
        },
        applyFix: async ({ input }: { input: any }) => {
          const result = await applyFixCommand(input.routerId, input.fix);
          if (result.success && onFixApplied) {
            onFixApplied({
              issueCode: input.fix.issueCode,
              command: input.fix.command || '',
              success: true,
              rollbackAvailable: !!input.fix.rollbackCommand,
            });
          }
          return result;
        },
      },
    } as any),
  });

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) {
      send({ type: 'START' });
    }
  }, [autoStart, send]);

  // Call onComplete when wizard finishes
  useEffect(() => {
    if (state.matches('completed') && onComplete) {
      const summary = computeSummary(state.context);
      onComplete(summary);
    }
  }, [state.value, onComplete]);

  // Memoized selector for current step
  const currentStep = useMemo(
    () => state.context.steps[state.context.currentStepIndex],
    [state.context.steps, state.context.currentStepIndex]
  );

  // Memoized progress calculation
  const progress = useMemo(
    () => ({
      current: state.context.currentStepIndex + 1,
      total: state.context.steps.length,
      percentage: ((state.context.currentStepIndex + 1) / state.context.steps.length) * 100,
    }),
    [state.context.currentStepIndex, state.context.steps.length]
  );

  // Memoized messages for current step
  const messages = useMemo(() => getMessagesForStep(currentStep), [currentStep]);

  // Memoized action callbacks
  const start = useCallback(() => send({ type: 'START' }), [send]);
  const applyFix = useCallback(() => send({ type: 'APPLY_FIX' }), [send]);
  const skipFix = useCallback(() => send({ type: 'SKIP_FIX' }), [send]);
  const restart = useCallback(() => send({ type: 'RESTART' }), [send]);
  const cancel = useCallback(() => send({ type: 'CANCEL' }), [send]);

  return {
    // State
    state: String(state.value),
    isIdle: state.matches('idle'),
    isRunning: state.matches('runningDiagnostic'),
    isInitializing: state.matches('initializing'),
    isCompleted: state.matches('completed'),
    isAwaitingFixDecision: state.matches({ runningDiagnostic: 'awaitingFixDecision' }),
    isApplyingFix: state.matches({ runningDiagnostic: 'applyingFix' }),
    isVerifying: state.matches({ runningDiagnostic: 'verifyingFix' }),

    // Data
    steps: state.context.steps,
    currentStep,
    currentStepIndex: state.context.currentStepIndex,
    progress,
    messages,
    appliedFixes: state.context.appliedFixes,
    error: state.context.error,

    // Actions
    start,
    applyFix,
    skipFix,
    restart,
    cancel,
  };
}

/**
 * Computes a summary object from the wizard's final context.
 * Determines overall status based on passed/failed steps and applied fixes.
 *
 * @param context The final machine context after diagnostics complete
 * @returns Summary with statistics and final status determination
 */
function computeSummary(context: TroubleshootContext): DiagnosticSummary {
  const passedSteps = context.steps.filter((s) => s.status === 'passed').length;
  const failedSteps = context.steps.filter((s) => s.status === 'failed').length;
  const skippedSteps = context.steps.filter((s) => s.status === 'skipped').length;

  let finalStatus: DiagnosticSummary['finalStatus'];
  if (failedSteps === 0) {
    finalStatus = 'all_passed';
  } else if (context.appliedFixes.length > 0) {
    finalStatus = 'issues_resolved';
  } else if (context.steps.find((s) => s.fix?.issueCode === 'NO_INTERNET')?.status === 'failed') {
    finalStatus = 'contact_isp';
  } else {
    finalStatus = 'issues_remaining';
  }

  return {
    totalSteps: context.steps.length,
    passedSteps,
    failedSteps,
    skippedSteps,
    appliedFixes: context.appliedFixes,
    durationMs:
      context.endTime && context.startTime ?
        context.endTime.getTime() - context.startTime.getTime()
      : 0,
    finalStatus,
  };
}

/**
 * Retrieves localized messages for a diagnostic step.
 * Falls back to English defaults if translations are missing.
 *
 * @param step The diagnostic step
 * @returns Messages object with name, description, and status-specific messages
 */
function getMessagesForStep(step: DiagnosticStep) {
  const stepId = step.id as keyof typeof TROUBLESHOOT_MESSAGES.steps;
  const stepMessages = TROUBLESHOOT_MESSAGES.steps[stepId];

  return {
    name: stepMessages?.name || step.name,
    description: stepMessages?.description || step.description,
    runningMessage: stepMessages?.running || 'Running diagnostic...',
    passedMessage: stepMessages?.passed || 'Check passed',
    failedMessage:
      step.result?.issueCode ?
        (stepMessages?.failed as Record<string, string>)?.[step.result.issueCode] ||
        step.result?.message
      : step.result?.message || 'Check failed',
  };
}
