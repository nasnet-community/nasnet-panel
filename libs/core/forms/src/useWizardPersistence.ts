/**
 * useWizardPersistence Hook
 *
 * Persists multi-step wizard state including step data, current step,
 * and completed steps. Supports TTL expiration and progress recovery.
 *
 * @module @nasnet/core/forms/useWizardPersistence
 */

import * as React from 'react';

import type { FieldValues } from 'react-hook-form';

/**
 * Persisted wizard state structure
 */
export interface WizardPersistedState<TStepData extends Record<string, FieldValues>> {
  /** Data for each step keyed by step ID */
  stepData: Partial<TStepData>;
  /** Current step index or ID */
  currentStep: string | number;
  /** Array of completed step IDs */
  completedSteps: string[];
  /** When the wizard was started */
  startedAt: number;
  /** When the state was last updated */
  updatedAt: number;
  /** Optional wizard metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options for useWizardPersistence
 */
export interface UseWizardPersistenceOptions<TStepData extends Record<string, FieldValues>> {
  /** Unique key for this wizard's storage */
  storageKey: string;
  /** Step IDs in order */
  stepIds: string[];
  /** Initial step (defaults to first step) */
  initialStep?: string | number;
  /** Storage implementation (defaults to sessionStorage) */
  storage?: Storage;
  /** Time-to-live in milliseconds (default: 24 hours) */
  ttlMs?: number;
  /** Callback when state is restored */
  onRestore?: (state: WizardPersistedState<TStepData>) => void;
  /** Callback when state expires */
  onExpire?: () => void;
}

/**
 * Return type for useWizardPersistence
 */
export interface UseWizardPersistenceReturn<TStepData extends Record<string, FieldValues>> {
  /** Current wizard state */
  state: WizardPersistedState<TStepData>;
  /** Whether there was restored data */
  wasRestored: boolean;
  /** Current step ID */
  currentStep: string;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Array of completed step IDs */
  completedSteps: string[];
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the wizard is on the last step */
  isLastStep: boolean;
  /** Whether the wizard is on the first step */
  isFirstStep: boolean;
  /** Get data for a specific step */
  getStepData: <K extends keyof TStepData>(stepId: K) => TStepData[K] | undefined;
  /** Set data for a specific step */
  setStepData: <K extends keyof TStepData>(stepId: K, data: TStepData[K]) => void;
  /** Mark a step as completed */
  completeStep: (stepId: string) => void;
  /** Navigate to a specific step */
  goToStep: (stepId: string | number) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Check if a step is completed */
  isStepCompleted: (stepId: string) => boolean;
  /** Check if can navigate to a step */
  canGoToStep: (stepId: string) => boolean;
  /** Reset wizard to initial state */
  reset: () => void;
  /** Clear all persisted data */
  clearPersistence: () => void;
  /** Get aggregated data from all steps */
  getAllStepData: () => Partial<TStepData>;
  /** Update metadata */
  setMetadata: (metadata: Record<string, unknown>) => void;
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook for persisting multi-step wizard state.
 *
 * Handles:
 * - Step data persistence for each wizard step
 * - Current step tracking and navigation
 * - Completed steps tracking
 * - Progress calculation
 * - TTL expiration
 * - State restoration on page reload
 *
 * @example
 * ```tsx
 * type WizardData = {
 *   basic: { name: string; description: string };
 *   network: { address: string; port: number };
 *   security: { password: string; twoFactor: boolean };
 * };
 *
 * function VPNWizard() {
 *   const wizard = useWizardPersistence<WizardData>({
 *     storageKey: 'vpn-setup-wizard',
 *     stepIds: ['basic', 'network', 'security'],
 *     ttlMs: 60 * 60 * 1000, // 1 hour
 *   });
 *
 *   const handleStepComplete = (stepId: string, data: any) => {
 *     wizard.setStepData(stepId, data);
 *     wizard.completeStep(stepId);
 *     wizard.nextStep();
 *   };
 *
 *   const handleSubmit = () => {
 *     const allData = wizard.getAllStepData();
 *     // Submit allData to backend
 *     wizard.clearPersistence();
 *   };
 *
 *   return (
 *     <>
 *       {wizard.wasRestored && <Alert>Progress restored</Alert>}
 *       <ProgressBar value={wizard.progress} />
 *       <WizardStep step={wizard.currentStep} />
 *     </>
 *   );
 * }
 * ```
 */
export function useWizardPersistence<
  TStepData extends Record<string, FieldValues>
>(options: UseWizardPersistenceOptions<TStepData>): UseWizardPersistenceReturn<TStepData> {
  const {
    storageKey,
    stepIds,
    initialStep = stepIds[0],
    storage = typeof window !== 'undefined' ? sessionStorage : undefined,
    ttlMs = DEFAULT_TTL,
    onRestore,
    onExpire,
  } = options;

  const [wasRestored, setWasRestored] = React.useState(false);

  // Create initial state
  const createInitialState = React.useCallback(
    (): WizardPersistedState<TStepData> => ({
      stepData: {},
      currentStep: initialStep,
      completedSteps: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    }),
    [initialStep]
  );

  // Try to restore state from storage
  const restoreState = React.useCallback((): WizardPersistedState<TStepData> | null => {
    if (!storage) return null;

    const saved = storage.getItem(storageKey);
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved) as WizardPersistedState<TStepData>;

      // Check TTL
      if (Date.now() - parsed.startedAt > ttlMs) {
        storage.removeItem(storageKey);
        onExpire?.();
        return null;
      }

      return parsed;
    } catch {
      storage.removeItem(storageKey);
      return null;
    }
  }, [storage, storageKey, ttlMs, onExpire]);

  // Initialize state
  const [state, setState] = React.useState<WizardPersistedState<TStepData>>(() => {
    const restored = restoreState();
    if (restored) {
      return restored;
    }
    return createInitialState();
  });

  // Track restoration
  React.useEffect(() => {
    const restored = restoreState();
    if (restored) {
      setWasRestored(true);
      onRestore?.(restored);
    }
  }, [restoreState, onRestore]); // Dependencies for proper cleanup

  // Persist state to storage
  const persistState = React.useCallback(
    (newState: WizardPersistedState<TStepData>) => {
      if (!storage) return;

      const withTimestamp = {
        ...newState,
        updatedAt: Date.now(),
      };

      storage.setItem(storageKey, JSON.stringify(withTimestamp));
    },
    [storage, storageKey]
  );

  // Update state and persist
  const updateState = React.useCallback(
    (updater: (prev: WizardPersistedState<TStepData>) => WizardPersistedState<TStepData>) => {
      setState((prev) => {
        const next = updater(prev);
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  // Computed values
  const currentStepId =
    typeof state.currentStep === 'number'
      ? stepIds[state.currentStep]
      : state.currentStep;

  const currentStepIndex = stepIds.indexOf(currentStepId);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepIds.length - 1;
  const progress = Math.round(
    (state.completedSteps.length / stepIds.length) * 100
  );

  // Actions
  const getStepData = React.useCallback(
    <K extends keyof TStepData>(stepId: K): TStepData[K] | undefined => {
      return state.stepData[stepId] as TStepData[K] | undefined;
    },
    [state.stepData]
  );

  const setStepData = React.useCallback(
    <K extends keyof TStepData>(stepId: K, data: TStepData[K]) => {
      updateState((prev) => ({
        ...prev,
        stepData: {
          ...prev.stepData,
          [stepId]: data,
        },
      }));
    },
    [updateState]
  );

  const completeStep = React.useCallback(
    (stepId: string) => {
      updateState((prev) => ({
        ...prev,
        completedSteps: prev.completedSteps.includes(stepId)
          ? prev.completedSteps
          : [...prev.completedSteps, stepId],
      }));
    },
    [updateState]
  );

  const goToStep = React.useCallback(
    (step: string | number) => {
      const stepId = typeof step === 'number' ? stepIds[step] : step;
      if (!stepIds.includes(stepId)) return;

      updateState((prev) => ({
        ...prev,
        currentStep: stepId,
      }));
    },
    [stepIds, updateState]
  );

  const nextStep = React.useCallback(() => {
    if (isLastStep) return;
    goToStep(currentStepIndex + 1);
  }, [isLastStep, currentStepIndex, goToStep]);

  const prevStep = React.useCallback(() => {
    if (isFirstStep) return;
    goToStep(currentStepIndex - 1);
  }, [isFirstStep, currentStepIndex, goToStep]);

  const isStepCompleted = React.useCallback(
    (stepId: string) => state.completedSteps.includes(stepId),
    [state.completedSteps]
  );

  const canGoToStep = React.useCallback(
    (stepId: string) => {
      const targetIndex = stepIds.indexOf(stepId);
      if (targetIndex === -1) return false;

      // Can always go to completed steps or current step
      if (state.completedSteps.includes(stepId)) return true;
      if (stepId === currentStepId) return true;

      // Can go to next step if current is completed
      if (targetIndex === currentStepIndex + 1) {
        return state.completedSteps.includes(currentStepId);
      }

      return false;
    },
    [stepIds, state.completedSteps, currentStepId, currentStepIndex]
  );

  const reset = React.useCallback(() => {
    const initial = createInitialState();
    setState(initial);
    persistState(initial);
    setWasRestored(false);
  }, [createInitialState, persistState]);

  const clearPersistence = React.useCallback(() => {
    storage?.removeItem(storageKey);
    const initial = createInitialState();
    setState(initial);
    setWasRestored(false);
  }, [storage, storageKey, createInitialState]);

  const getAllStepData = React.useCallback(
    () => state.stepData,
    [state.stepData]
  );

  const setMetadata = React.useCallback(
    (metadata: Record<string, unknown>) => {
      updateState((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          ...metadata,
        },
      }));
    },
    [updateState]
  );

  return {
    state,
    wasRestored,
    currentStep: currentStepId,
    currentStepIndex,
    completedSteps: state.completedSteps,
    progress,
    isLastStep,
    isFirstStep,
    getStepData,
    setStepData,
    completeStep,
    goToStep,
    nextStep,
    prevStep,
    isStepCompleted,
    canGoToStep,
    reset,
    clearPersistence,
    getAllStepData,
    setMetadata,
  };
}
