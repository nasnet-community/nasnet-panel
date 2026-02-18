/**
 * useStepper - Headless Stepper Hook
 *
 * Manages all step navigation, validation, and state management for stepper UIs.
 * Consumed by all stepper UI variants (Vertical, Horizontal, Content, Mini).
 *
 * This hook follows the Headless + Platform Presenter pattern (ADR-018):
 * - All business logic is contained in this hook
 * - UI presenters consume this hook and provide platform-optimized rendering
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *     { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Wizard complete!', data),
 * });
 *
 * return (
 *   <div>
 *     <h2>{stepper.currentStep.title}</h2>
 *     <Button onClick={stepper.prev} disabled={stepper.isFirst}>Back</Button>
 *     <Button onClick={stepper.next} disabled={!stepper.canProceed}>
 *       {stepper.isLast ? 'Complete' : 'Next'}
 *     </Button>
 *   </div>
 * );
 * ```
 */

import { useState, useCallback, useMemo, useRef } from 'react';

import type {
  StepperConfig,
  StepConfig,
  UseStepperReturn,
  StepState,
  StepErrors,
  StepStatus,
} from './use-stepper.types';

// ===== Helper Functions =====

/**
 * Create initial step state
 */
function createInitialStepState(
  steps: StepConfig[],
  initialStepData?: Map<string, unknown>,
  initialStep = 0
): Map<string, StepState> {
  const states = new Map<string, StepState>();

  steps.forEach((step, index) => {
    states.set(step.id, {
      status: index === initialStep ? 'active' : 'pending',
      completed: false,
      skipped: false,
      errors: {},
      visited: index === initialStep,
      data: initialStepData?.get(step.id) ?? undefined,
    });
  });

  return states;
}

/**
 * Compute step status based on state
 */
function computeStepStatus(
  stepId: string,
  currentStepId: string,
  stepState: StepState
): StepStatus {
  if (stepState.skipped) return 'skipped';
  if (stepState.completed) return 'completed';
  if (Object.keys(stepState.errors).length > 0) return 'error';
  if (stepId === currentStepId) return 'active';
  return 'pending';
}

// ===== Main Hook =====

/**
 * Headless stepper hook - manages all step navigation and validation logic
 *
 * @param config - Stepper configuration
 * @returns Stepper state and actions
 */
export function useStepper(config: StepperConfig): UseStepperReturn {
  const {
    steps,
    onComplete,
    onStepChange,
    validateOnChange = true,
    initialStep = 0,
    initialStepData,
    freeNavigation = false,
  } = config;

  // Validate configuration
  if (steps.length === 0) {
    throw new Error('useStepper: steps array must have at least one step');
  }

  if (initialStep < 0 || initialStep >= steps.length) {
    throw new Error(
      `useStepper: initialStep (${initialStep}) must be between 0 and ${steps.length - 1}`
    );
  }

  // ===== State =====

  const [currentIndex, setCurrentIndex] = useState(initialStep);
  const [stepStates, setStepStates] = useState<Map<string, StepState>>(() =>
    createInitialStepState(steps, initialStepData, initialStep)
  );
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Ref to track validation in progress (prevent double submission)
  const validationInProgressRef = useRef(false);

  // ===== Derived Values =====

  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Get current step errors
  const errors = useMemo((): StepErrors => {
    return stepStates.get(currentStep.id)?.errors ?? {};
  }, [stepStates, currentStep.id]);

  // Get all steps with errors
  const stepsWithErrors = useMemo((): string[] => {
    const result: string[] = [];
    stepStates.forEach((state, stepId) => {
      if (Object.keys(state.errors).length > 0) {
        result.push(stepId);
      }
    });
    return result;
  }, [stepStates]);

  // Calculate progress
  const progress = useMemo((): number => {
    if (steps.length <= 1) return isCompleted ? 100 : 0;
    const completed = completedSteps.size + skippedSteps.size;
    return Math.round((completed / steps.length) * 100);
  }, [steps.length, completedSteps.size, skippedSteps.size, isCompleted]);

  const completedCount = useMemo((): number => {
    return completedSteps.size + skippedSteps.size;
  }, [completedSteps.size, skippedSteps.size]);

  // Can proceed (not currently validating)
  const canProceed = !isValidating;

  // ===== Step State Helpers =====

  /**
   * Update step state
   */
  const updateStepState = useCallback(
    (stepId: string, updates: Partial<StepState>) => {
      setStepStates((prev) => {
        const newStates = new Map(prev);
        const current = newStates.get(stepId);
        if (current) {
          newStates.set(stepId, { ...current, ...updates });
        }
        return newStates;
      });
    },
    []
  );

  /**
   * Mark step as completed
   */
  const markStepComplete = useCallback(
    (stepId: string) => {
      setCompletedSteps((prev) => new Set(prev).add(stepId));
      updateStepState(stepId, { completed: true, status: 'completed' });
    },
    [updateStepState]
  );

  /**
   * Mark step as visited
   */
  const markStepVisited = useCallback(
    (stepId: string) => {
      updateStepState(stepId, { visited: true, status: 'active' });
    },
    [updateStepState]
  );

  /**
   * Set errors for a step
   */
  const setStepErrors = useCallback(
    (stepId: string, errors: StepErrors) => {
      updateStepState(stepId, {
        errors,
        status: Object.keys(errors).length > 0 ? 'error' : 'active',
      });
    },
    [updateStepState]
  );

  /**
   * Clear errors for current step
   */
  const clearErrors = useCallback(() => {
    setStepErrors(currentStep.id, {});
  }, [currentStep.id, setStepErrors]);

  // ===== Step Data Management =====

  /**
   * Set data for current step
   */
  const setStepData = useCallback(
    (data: unknown) => {
      updateStepState(currentStep.id, { data });
    },
    [currentStep.id, updateStepState]
  );

  /**
   * Get data for a specific step
   */
  const getStepData = useCallback(
    <T = unknown>(stepId: string): T | undefined => {
      return stepStates.get(stepId)?.data as T | undefined;
    },
    [stepStates]
  );

  /**
   * Get all step data as a map
   */
  const getAllStepData = useCallback((): Map<string, unknown> => {
    const data = new Map<string, unknown>();
    stepStates.forEach((state, stepId) => {
      if (state.data !== undefined) {
        data.set(stepId, state.data);
      }
    });
    return data;
  }, [stepStates]);

  // ===== Validation =====

  /**
   * Validate current step
   */
  const validate = useCallback(async (): Promise<boolean> => {
    const step = steps[currentIndex];

    // If no validation function, always valid
    if (!step.validate) {
      clearErrors();
      return true;
    }

    // Prevent double validation
    if (validationInProgressRef.current) {
      return false;
    }

    validationInProgressRef.current = true;
    setIsValidating(true);

    try {
      const stepData = stepStates.get(step.id)?.data;
      const result = await step.validate(stepData);

      if (result.valid) {
        clearErrors();
        validationInProgressRef.current = false;
        setIsValidating(false);
        return true;
      } else {
        setStepErrors(step.id, result.errors ?? {});
        validationInProgressRef.current = false;
        setIsValidating(false);
        return false;
      }
    } catch (error) {
      // Handle validation errors
      const errorMessage =
        error instanceof Error ? error.message : 'Validation failed';
      setStepErrors(step.id, { _validation: errorMessage });
      validationInProgressRef.current = false;
      setIsValidating(false);
      return false;
    }
  }, [currentIndex, steps, stepStates, clearErrors, setStepErrors]);

  // ===== Navigation =====

  /**
   * Advance to next step (validates first)
   */
  const next = useCallback(async (): Promise<boolean> => {
    // Already at last step and completed
    if (isCompleted) return false;

    // Validate if configured
    if (validateOnChange) {
      const valid = await validate();
      if (!valid) return false;
    }

    // If last step, complete the wizard
    if (isLast) {
      markStepComplete(currentStep.id);
      setIsCompleted(true);
      await onComplete?.(getAllStepData());
      return true;
    }

    // Mark current step complete and advance
    markStepComplete(currentStep.id);

    const nextIndex = currentIndex + 1;
    const nextStep = steps[nextIndex];

    // Notify step change
    onStepChange?.(currentIndex, nextIndex);

    // Update current index and mark next step as visited/active
    setCurrentIndex(nextIndex);
    markStepVisited(nextStep.id);

    return true;
  }, [
    isCompleted,
    isLast,
    validateOnChange,
    validate,
    currentStep.id,
    currentIndex,
    steps,
    markStepComplete,
    markStepVisited,
    onStepChange,
    onComplete,
    getAllStepData,
  ]);

  /**
   * Go back to previous step (no validation required)
   */
  const prev = useCallback(() => {
    if (isFirst) return;

    const prevIndex = currentIndex - 1;

    // Notify step change
    onStepChange?.(currentIndex, prevIndex);

    // Update current step status to completed (if it was)
    const currentState = stepStates.get(currentStep.id);
    if (currentState?.completed) {
      updateStepState(currentStep.id, { status: 'completed' });
    } else {
      updateStepState(currentStep.id, { status: 'pending' });
    }

    // Set previous step as active
    setCurrentIndex(prevIndex);
    updateStepState(steps[prevIndex].id, { status: 'active' });
  }, [
    isFirst,
    currentIndex,
    currentStep.id,
    steps,
    stepStates,
    updateStepState,
    onStepChange,
  ]);

  /**
   * Jump to a specific step by index
   */
  const goTo = useCallback(
    async (index: number): Promise<boolean> => {
      // Validate index
      if (index < 0 || index >= steps.length) {
        return false;
      }

      // Same step, no-op
      if (index === currentIndex) {
        return true;
      }

      const targetStep = steps[index];

      // Check if step is accessible
      if (!freeNavigation) {
        // Can only go to completed steps or current step
        const targetState = stepStates.get(targetStep.id);
        if (!targetState?.completed && !targetState?.skipped && index > currentIndex) {
          return false;
        }
      }

      // Notify step change
      onStepChange?.(currentIndex, index);

      // Update current step status
      const currentState = stepStates.get(currentStep.id);
      if (currentState?.completed) {
        updateStepState(currentStep.id, { status: 'completed' });
      } else if (currentState?.skipped) {
        updateStepState(currentStep.id, { status: 'skipped' });
      } else {
        updateStepState(currentStep.id, { status: 'pending' });
      }

      // Go to target step
      setCurrentIndex(index);
      markStepVisited(targetStep.id);

      return true;
    },
    [
      steps,
      currentIndex,
      freeNavigation,
      stepStates,
      currentStep.id,
      updateStepState,
      markStepVisited,
      onStepChange,
    ]
  );

  /**
   * Skip current step (if allowed)
   */
  const skip = useCallback((): boolean => {
    const step = steps[currentIndex];

    // Check if step can be skipped
    if (!step.canSkip) {
      return false;
    }

    // Mark as skipped
    setSkippedSteps((prev) => new Set(prev).add(step.id));
    updateStepState(step.id, { skipped: true, status: 'skipped' });

    // If last step, complete
    if (isLast) {
      setIsCompleted(true);
      onComplete?.(getAllStepData());
      return true;
    }

    // Advance to next step
    const nextIndex = currentIndex + 1;
    const nextStep = steps[nextIndex];

    onStepChange?.(currentIndex, nextIndex);
    setCurrentIndex(nextIndex);
    markStepVisited(nextStep.id);

    return true;
  }, [
    currentIndex,
    steps,
    isLast,
    updateStepState,
    markStepVisited,
    onStepChange,
    onComplete,
    getAllStepData,
  ]);

  // ===== Utilities =====

  /**
   * Check if a step is accessible
   */
  const canAccessStep = useCallback(
    (index: number): boolean => {
      if (index < 0 || index >= steps.length) return false;
      if (freeNavigation) return true;

      const step = steps[index];
      const state = stepStates.get(step.id);

      // Can access completed, skipped, or current step
      return (
        state?.completed ||
        state?.skipped ||
        index === currentIndex ||
        index < currentIndex
      );
    },
    [steps, freeNavigation, stepStates, currentIndex]
  );

  /**
   * Check if a specific step is completed
   */
  const isStepCompleted = useCallback(
    (stepId: string): boolean => {
      return completedSteps.has(stepId);
    },
    [completedSteps]
  );

  /**
   * Get visual status for a step
   */
  const getStepStatus = useCallback(
    (stepId: string): StepStatus => {
      const state = stepStates.get(stepId);
      if (!state) return 'pending';
      return computeStepStatus(stepId, currentStep.id, state);
    },
    [stepStates, currentStep.id]
  );

  /**
   * Reset the stepper to initial state
   */
  const reset = useCallback(() => {
    setCurrentIndex(initialStep);
    setStepStates(createInitialStepState(steps, initialStepData, initialStep));
    setCompletedSteps(new Set());
    setSkippedSteps(new Set());
    setIsValidating(false);
    setIsCompleted(false);
    validationInProgressRef.current = false;
  }, [steps, initialStep, initialStepData]);

  // ===== Return =====

  return {
    // Current State
    currentStep,
    currentIndex,
    steps,
    completedSteps,
    skippedSteps,
    stepStates,

    // Navigation
    next,
    prev,
    goTo,
    skip,

    // Status Flags
    isFirst,
    isLast,
    canProceed,
    isValidating,
    isCompleted,

    // Validation
    errors,
    stepsWithErrors,
    setStepErrors,
    clearErrors,
    validate,

    // Step Data
    getStepData,
    setStepData,
    getAllStepData,

    // Progress
    progress,
    completedCount,
    totalSteps,

    // Utilities
    canAccessStep,
    isStepCompleted,
    getStepStatus,
    reset,
  };
}
