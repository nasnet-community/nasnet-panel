/**
 * useWizard React Hook
 *
 * Provides a convenient React hook for wizard state machines.
 * Handles machine creation, state tracking, and persistence.
 *
 * Features:
 * - Automatic machine creation from config
 * - Session persistence and recovery
 * - Type-safe step data
 * - Progress tracking
 * - Error handling
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { createWizardMachine } from '../wizardMachine';
import {
  persistMachineState,
  restoreMachineState,
  clearMachineState,
  hasSavedSession,
  formatSessionAge,
  getSessionAge,
} from '../persistence';
import type { WizardConfig, WizardContext } from '../types';

// ===== Hook Return Type =====

/**
 * Return type for useWizard hook
 */
export interface UseWizardReturn<TData> {
  /**
   * Current step number (1-indexed)
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Collected wizard data
   */
  data: Partial<TData>;

  /**
   * Validation errors by field name
   */
  errors: Record<string, string>;

  /**
   * Session ID for persistence
   */
  sessionId: string;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Whether the wizard is validating current step
   */
  isValidating: boolean;

  /**
   * Whether the wizard is submitting
   */
  isSubmitting: boolean;

  /**
   * Whether the wizard is completed
   */
  isCompleted: boolean;

  /**
   * Whether the wizard is cancelled
   */
  isCancelled: boolean;

  /**
   * Whether the wizard is on the first step
   */
  isFirstStep: boolean;

  /**
   * Whether the wizard is on the last step
   */
  isLastStep: boolean;

  /**
   * Whether a session can be restored
   */
  canRestore: boolean;

  /**
   * Age of saved session (if exists)
   */
  savedSessionAge: string | null;

  /**
   * Advance to next step with optional data
   */
  next: (data?: Partial<TData>) => void;

  /**
   * Go back to previous step
   */
  back: () => void;

  /**
   * Go to specific step (if allowed)
   */
  goToStep: (step: number) => void;

  /**
   * Set data without advancing
   */
  setData: (data: Partial<TData>) => void;

  /**
   * Clear validation errors
   */
  clearErrors: () => void;

  /**
   * Cancel the wizard
   */
  cancel: () => void;

  /**
   * Restore saved session
   */
  restore: () => void;

  /**
   * Discard saved session
   */
  discardSession: () => void;

  /**
   * Check if a specific step can be accessed
   */
  canAccessStep: (step: number) => boolean;
}

// ===== Hook Options =====

/**
 * Options for useWizard hook
 */
export interface UseWizardOptions {
  /**
   * Whether to auto-persist state changes
   * @default true
   */
  autoPersist?: boolean;

  /**
   * Whether to auto-restore on mount
   * @default false (shows prompt instead)
   */
  autoRestore?: boolean;

  /**
   * Callback when session is restored
   */
  onRestore?: () => void;

  /**
   * Callback when wizard completes
   */
  onComplete?: () => void;

  /**
   * Callback when wizard is cancelled
   */
  onCancel?: () => void;
}

// ===== Hook Implementation =====

/**
 * React hook for wizard state machine
 *
 * @template TData - Type of wizard data
 * @param config - Wizard configuration
 * @param options - Hook options
 * @returns Wizard state and actions
 *
 * @example
 * ```tsx
 * interface VPNSetupData {
 *   provider: string;
 *   serverAddress: string;
 *   credentials: { username: string; password: string };
 * }
 *
 * function VPNSetupWizard() {
 *   const wizard = useWizard<VPNSetupData>({
 *     id: 'vpn-setup',
 *     totalSteps: 3,
 *     validateStep: async (step, data) => {
 *       if (step === 1 && !data.provider) {
 *         return { valid: false, errors: { provider: 'Select a provider' } };
 *       }
 *       return { valid: true };
 *     },
 *     onSubmit: async (data) => {
 *       await createVPNConnection(data);
 *     },
 *   });
 *
 *   if (wizard.canRestore) {
 *     return (
 *       <ResumePrompt
 *         age={wizard.savedSessionAge}
 *         onResume={wizard.restore}
 *         onDiscard={wizard.discardSession}
 *       />
 *     );
 *   }
 *
 *   return (
 *     <WizardContainer>
 *       <StepIndicator current={wizard.currentStep} total={wizard.totalSteps} />
 *       <StepContent step={wizard.currentStep} data={wizard.data} errors={wizard.errors} />
 *       <WizardActions
 *         onBack={wizard.back}
 *         onNext={() => wizard.next(stepData)}
 *         disableBack={wizard.isFirstStep}
 *         disableNext={wizard.isValidating}
 *       />
 *     </WizardContainer>
 *   );
 * }
 * ```
 */
export function useWizard<TData extends Record<string, unknown>>(
  config: WizardConfig<TData>,
  options: UseWizardOptions = {}
): UseWizardReturn<TData> {
  const {
    autoPersist = true,
    autoRestore = false,
    onRestore,
    onComplete,
    onCancel,
  } = options;

  // Track if we should show restore prompt
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [savedSessionAgeMs, setSavedSessionAgeMs] = useState<number | null>(null);

  // Create the machine
  const machine = useMemo(
    () => createWizardMachine<TData>(config),
    [config.id, config.totalSteps]
  );

  // Use the machine
  const [state, send] = useMachine(machine);

  // Check for saved session on mount
  useEffect(() => {
    if (hasSavedSession(config.id)) {
      const age = getSessionAge(config.id);
      setSavedSessionAgeMs(age);

      if (autoRestore) {
        // Auto-restore
        const saved = restoreMachineState<WizardContext<TData>>(config.id);
        if (saved) {
          send({ type: 'RESTORE', savedContext: saved.context });
          onRestore?.();
        }
      } else {
        // Show restore prompt
        setShowRestorePrompt(true);
      }
    }
  }, [config.id, autoRestore]);

  // Persist state changes
  useEffect(() => {
    if (!autoPersist) return;

    const stateValue =
      typeof state.value === 'string' ? state.value : JSON.stringify(state.value);

    // Don't persist final states
    if (state.matches('completed') || state.matches('cancelled')) {
      clearMachineState(config.id);
    } else {
      persistMachineState(config.id, stateValue, state.context);
    }
  }, [state, config.id, autoPersist]);

  // Handle completion
  useEffect(() => {
    if (state.matches('completed')) {
      clearMachineState(config.id);
      onComplete?.();
    }
  }, [state.matches('completed')]);

  // Handle cancellation
  useEffect(() => {
    if (state.matches('cancelled')) {
      clearMachineState(config.id);
      onCancel?.();
    }
  }, [state.matches('cancelled')]);

  // Actions
  const next = useCallback(
    (data?: Partial<TData>) => {
      send({ type: 'NEXT', data });
    },
    [send]
  );

  const back = useCallback(() => {
    send({ type: 'BACK' });
  }, [send]);

  const goToStep = useCallback(
    (step: number) => {
      send({ type: 'GOTO', step });
    },
    [send]
  );

  const setData = useCallback(
    (data: Partial<TData>) => {
      send({ type: 'SET_DATA', data });
    },
    [send]
  );

  const clearErrors = useCallback(() => {
    send({ type: 'CLEAR_ERRORS' });
  }, [send]);

  const cancel = useCallback(() => {
    send({ type: 'CANCEL' });
  }, [send]);

  const restore = useCallback(() => {
    const saved = restoreMachineState<WizardContext<TData>>(config.id);
    if (saved) {
      send({ type: 'RESTORE', savedContext: saved.context });
      setShowRestorePrompt(false);
      onRestore?.();
    }
  }, [config.id, send, onRestore]);

  const discardSession = useCallback(() => {
    clearMachineState(config.id);
    setShowRestorePrompt(false);
  }, [config.id]);

  const canAccessStep = useCallback(
    (step: number) => {
      // Can access current step or any previous step
      return step >= 1 && step <= state.context.currentStep;
    },
    [state.context.currentStep]
  );

  // Computed values
  const progress = Math.round(
    ((state.context.currentStep - 1) / (state.context.totalSteps - 1)) * 100
  );

  return {
    // State
    currentStep: state.context.currentStep,
    totalSteps: state.context.totalSteps,
    data: state.context.data,
    errors: state.context.errors,
    sessionId: state.context.sessionId,
    progress: Number.isNaN(progress) ? 0 : progress,

    // Status flags
    isValidating: state.matches('validating'),
    isSubmitting: state.matches('submitting'),
    isCompleted: state.matches('completed'),
    isCancelled: state.matches('cancelled'),
    isFirstStep: state.context.currentStep === 1,
    isLastStep: state.context.currentStep === state.context.totalSteps,

    // Session recovery
    canRestore: showRestorePrompt,
    savedSessionAge: savedSessionAgeMs ? formatSessionAge(savedSessionAgeMs) : null,

    // Actions
    next,
    back,
    goToStep,
    setData,
    clearErrors,
    cancel,
    restore,
    discardSession,
    canAccessStep,
  };
}

/**
 * Hook for checking if a wizard has a saved session
 * Useful for showing "Resume" buttons in navigation
 */
export function useWizardSession(machineId: string): {
  hasSavedSession: boolean;
  sessionAge: string | null;
  discardSession: () => void;
} {
  const [hasSaved, setHasSaved] = useState(false);
  const [ageMs, setAgeMs] = useState<number | null>(null);

  useEffect(() => {
    setHasSaved(hasSavedSession(machineId));
    setAgeMs(getSessionAge(machineId));
  }, [machineId]);

  const discard = useCallback(() => {
    clearMachineState(machineId);
    setHasSaved(false);
    setAgeMs(null);
  }, [machineId]);

  return {
    hasSavedSession: hasSaved,
    sessionAge: ageMs ? formatSessionAge(ageMs) : null,
    discardSession: discard,
  };
}
