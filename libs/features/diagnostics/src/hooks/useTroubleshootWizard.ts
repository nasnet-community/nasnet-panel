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
  /** Callback when wizard completes */
  onComplete?: (summary: DiagnosticSummary) => void;
  /** Callback when fix is applied */
  onFixApplied?: (fix: AppliedFix) => void;
}

export interface UseTroubleshootWizardReturn {
  // === State ===
  state: string;
  isIdle: boolean;
  isRunning: boolean;
  isInitializing: boolean;
  isCompleted: boolean;
  isAwaitingFixDecision: boolean;
  isApplyingFix: boolean;
  isVerifying: boolean;

  // === Data ===
  steps: DiagnosticStep[];
  currentStep: DiagnosticStep;
  currentStepIndex: number;
  progress: { current: number; total: number; percentage: number };
  messages: {
    name: string;
    description: string;
    runningMessage: string;
    passedMessage: string;
    failedMessage: string;
  };
  appliedFixes: string[];
  error: Error | null;

  // === Actions ===
  start: () => void;
  applyFix: () => void;
  skipFix: () => void;
  restart: () => void;
  cancel: () => void;
}

export function useTroubleshootWizard({
  routerId,
  autoStart = false,
  onComplete,
  onFixApplied,
}: UseTroubleshootWizardProps): UseTroubleshootWizardReturn {
  // Create machine instance with routerId
  const machine = useMemo(() => createTroubleshootMachine(routerId), [routerId]);

  const [state, send] = useMachine(machine, {
    // Provide service implementations
    actors: {
      detectNetworkConfig: async ({ input }) => {
        const wanInterface = await detectWanInterface(input.routerId);
        const gateway = await detectGateway(input.routerId);
        return { wanInterface, gateway };
      },
      executeDiagnosticStep: async ({ input }) => {
        return executeDiagnosticStep(
          input.step.id,
          input.routerId,
          input.wanInterface,
          input.gateway
        );
      },
      applyFix: async ({ input }) => {
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

  // Memoized selectors
  const currentStep = useMemo(
    () => state.context.steps[state.context.currentStepIndex],
    [state.context.steps, state.context.currentStepIndex]
  );

  const progress = useMemo(
    () => ({
      current: state.context.currentStepIndex + 1,
      total: state.context.steps.length,
      percentage: ((state.context.currentStepIndex + 1) / state.context.steps.length) * 100,
    }),
    [state.context.currentStepIndex, state.context.steps.length]
  );

  const messages = useMemo(() => getMessagesForStep(currentStep), [currentStep]);

  // Actions
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

function computeSummary(context: TroubleshootContext): DiagnosticSummary {
  const passedSteps = context.steps.filter((s) => s.status === 'passed').length;
  const failedSteps = context.steps.filter((s) => s.status === 'failed').length;
  const skippedSteps = context.steps.filter((s) => s.status === 'skipped').length;

  let finalStatus: DiagnosticSummary['finalStatus'];
  if (failedSteps === 0) {
    finalStatus = 'all_passed';
  } else if (context.appliedFixes.length > 0 && failedSteps === 0) {
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
      context.endTime && context.startTime
        ? context.endTime.getTime() - context.startTime.getTime()
        : 0,
    finalStatus,
  };
}

function getMessagesForStep(step: DiagnosticStep) {
  const stepId = step.id as keyof typeof TROUBLESHOOT_MESSAGES.steps;
  const stepMessages = TROUBLESHOOT_MESSAGES.steps[stepId];

  return {
    name: stepMessages?.name || step.name,
    description: stepMessages?.description || step.description,
    runningMessage: stepMessages?.running || 'Running diagnostic...',
    passedMessage: stepMessages?.passed || 'Check passed',
    failedMessage: step.result?.issueCode
      ? (stepMessages?.failed as Record<string, string>)?.[step.result.issueCode] ||
        step.result?.message
      : step.result?.message || 'Check failed',
  };
}
