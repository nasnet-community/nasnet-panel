/**
 * useStepper Hook Tests
 *
 * Comprehensive test suite for the headless stepper hook.
 * Tests cover navigation, validation, state preservation, completion, and skip functionality.
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useStepper } from '../use-stepper';

import type { StepConfig, StepperConfig, ValidationResult } from '../use-stepper.types';

// ===== Test Helpers =====

/**
 * Create a basic step configuration
 */
function createStep(id: string, title: string, options?: Partial<StepConfig>): StepConfig {
  return {
    id,
    title,
    ...options,
  };
}

/**
 * Create a basic stepper configuration
 */
function createConfig(steps: StepConfig[], options?: Partial<StepperConfig>): StepperConfig {
  return {
    steps,
    ...options,
  };
}

/**
 * Create a validation function that always passes
 */
function createPassingValidation(): (data: unknown) => Promise<ValidationResult> {
  return vi.fn().mockResolvedValue({ valid: true });
}

/**
 * Create a validation function that always fails
 */
function createFailingValidation(
  errors: Record<string, string> = { field: 'Error message' }
): (data: unknown) => Promise<ValidationResult> {
  return vi.fn().mockResolvedValue({ valid: false, errors });
}

// ===== Test Data =====

const basicSteps: StepConfig[] = [
  createStep('step1', 'Step 1'),
  createStep('step2', 'Step 2'),
  createStep('step3', 'Step 3'),
];

// ===== Navigation Tests =====

describe('useStepper navigation', () => {
  it('should initialize at first step', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentStep.id).toBe('step1');
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it('should initialize at custom initial step', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps, { initialStep: 1 })));

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentStep.id).toBe('step2');
    expect(result.current.isFirst).toBe(false);
    expect(result.current.isLast).toBe(false);
  });

  it('should advance to next step on next()', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentStep.id).toBe('step2');
  });

  it('should go back on prev()', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps, { initialStep: 1 })));

    act(() => {
      result.current.prev();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentStep.id).toBe('step1');
  });

  it('should not go before first step', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    act(() => {
      result.current.prev();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isFirst).toBe(true);
  });

  it('should allow goTo() any step when freeNavigation is true', async () => {
    const { result } = renderHook(() =>
      useStepper(createConfig(basicSteps, { freeNavigation: true }))
    );

    let success = false;
    await act(async () => {
      success = await result.current.goTo(2);
    });

    expect(success).toBe(true);
    expect(result.current.currentIndex).toBe(2);
  });

  it('should call onStepChange when navigating', async () => {
    const onStepChange = vi.fn();
    const { result } = renderHook(() => useStepper(createConfig(basicSteps, { onStepChange })));

    await act(async () => {
      await result.current.next();
    });

    expect(onStepChange).toHaveBeenCalledWith(0, 1);
  });
});

// ===== Validation Tests =====

describe('useStepper validation', () => {
  it('should run validation before next()', async () => {
    const validate = createPassingValidation();
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    await act(async () => {
      await result.current.next();
    });

    expect(validate).toHaveBeenCalled();
    expect(result.current.currentIndex).toBe(1);
  });

  it('should block navigation when validation fails', async () => {
    const validate = createFailingValidation({ name: 'Name is required' });
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.errors).toEqual({ name: 'Name is required' });
  });

  it('should set errors on validation failure', async () => {
    const validate = createFailingValidation({
      ip: 'Invalid IP address',
      gateway: 'Gateway required',
    });
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.errors).toEqual({
      ip: 'Invalid IP address',
      gateway: 'Gateway required',
    });
    expect(result.current.stepsWithErrors).toContain('step1');
  });

  it('should skip validation when no validate function', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.errors).toEqual({});
  });

  it('should mark step complete after successful validation', async () => {
    const validate = createPassingValidation();
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.completedSteps.has('step1')).toBe(true);
    expect(result.current.isStepCompleted('step1')).toBe(true);
  });
});

// ===== State Preservation Tests =====

describe('useStepper state preservation', () => {
  it('should preserve step data on prev()', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    // Set data on first step
    act(() => {
      result.current.setStepData({ name: 'John' });
    });

    // Advance to second step
    await act(async () => {
      await result.current.next();
    });

    // Go back
    act(() => {
      result.current.prev();
    });

    expect(result.current.getStepData('step1')).toEqual({ name: 'John' });
  });

  it('should clear all data on reset()', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    // Set data and advance
    act(() => {
      result.current.setStepData({ name: 'John' });
    });

    await act(async () => {
      await result.current.next();
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.getStepData('step1')).toBeUndefined();
    expect(result.current.completedSteps.size).toBe(0);
    expect(result.current.isCompleted).toBe(false);
  });

  it('should return all step data in getAllStepData()', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    // Set data on first step
    act(() => {
      result.current.setStepData({ step1Data: 'value1' });
    });

    // Advance and set data on second step
    await act(async () => {
      await result.current.next();
    });

    act(() => {
      result.current.setStepData({ step2Data: 'value2' });
    });

    const allData = result.current.getAllStepData();

    expect(allData.get('step1')).toEqual({ step1Data: 'value1' });
    expect(allData.get('step2')).toEqual({ step2Data: 'value2' });
  });

  it('should initialize with initial step data', () => {
    const initialData = new Map<string, unknown>();
    initialData.set('step1', { prefilledName: 'Jane' });
    initialData.set('step2', { prefilledAddress: '456 Oak' });

    const { result } = renderHook(() =>
      useStepper(createConfig(basicSteps, { initialStepData: initialData }))
    );

    expect(result.current.getStepData('step1')).toEqual({ prefilledName: 'Jane' });
    expect(result.current.getStepData('step2')).toEqual({ prefilledAddress: '456 Oak' });
  });
});

// ===== Completion Tests =====

describe('useStepper completion', () => {
  it('should call onComplete when finishing last step', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useStepper(createConfig(basicSteps, { onComplete })));

    // Navigate through all steps
    await act(async () => {
      await result.current.next();
    });
    await act(async () => {
      await result.current.next();
    });
    await act(async () => {
      await result.current.next();
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.isCompleted).toBe(true);
  });

  it('should pass all step data to onComplete', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useStepper(createConfig(basicSteps, { onComplete })));

    // Set data on first step
    act(() => {
      result.current.setStepData({ name: 'John' });
    });

    // Navigate and set data
    await act(async () => {
      await result.current.next();
    });

    act(() => {
      result.current.setStepData({ email: 'john@example.com' });
    });

    await act(async () => {
      await result.current.next();
    });

    act(() => {
      result.current.setStepData({ confirmed: true });
    });

    await act(async () => {
      await result.current.next();
    });

    expect(onComplete).toHaveBeenCalled();
    const passedData = onComplete.mock.calls[0][0] as Map<string, unknown>;
    expect(passedData.get('step1')).toEqual({ name: 'John' });
    expect(passedData.get('step2')).toEqual({ email: 'john@example.com' });
    expect(passedData.get('step3')).toEqual({ confirmed: true });
  });
});

// ===== Skip Tests =====

describe('useStepper skip', () => {
  it('should skip step when canSkip is true', () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { canSkip: true }),
      createStep('step2', 'Step 2'),
      createStep('step3', 'Step 3'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    let skipped = false;
    act(() => {
      skipped = result.current.skip();
    });

    expect(skipped).toBe(true);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.skippedSteps.has('step1')).toBe(true);
  });

  it('should not skip step when canSkip is false', () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { canSkip: false }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    let skipped = false;
    act(() => {
      skipped = result.current.skip();
    });

    expect(skipped).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should not skip step when canSkip is undefined', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    let skipped = false;
    act(() => {
      skipped = result.current.skip();
    });

    expect(skipped).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should track skipped steps separately from completed', async () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { canSkip: true }),
      createStep('step2', 'Step 2'),
      createStep('step3', 'Step 3'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    // Skip first step
    act(() => {
      result.current.skip();
    });

    // Complete second step
    await act(async () => {
      await result.current.next();
    });

    expect(result.current.skippedSteps.has('step1')).toBe(true);
    expect(result.current.completedSteps.has('step1')).toBe(false);
    expect(result.current.completedSteps.has('step2')).toBe(true);
    expect(result.current.skippedSteps.has('step2')).toBe(false);
  });

  it('should get correct status for skipped step', () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { canSkip: true }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    act(() => {
      result.current.skip();
    });

    expect(result.current.getStepStatus('step1')).toBe('skipped');
  });

  it('should complete wizard when skipping last step', () => {
    const onComplete = vi.fn();
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1'),
      createStep('step2', 'Step 2', { canSkip: true }),
    ];

    const { result } = renderHook(() =>
      useStepper(createConfig(steps, { onComplete, initialStep: 1 }))
    );

    act(() => {
      result.current.skip();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(onComplete).toHaveBeenCalled();
  });
});

// ===== Progress Tests =====

describe('useStepper progress', () => {
  it('should calculate progress correctly', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    expect(result.current.progress).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalSteps).toBe(3);

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.progress).toBe(33); // 1/3 = 33%
    expect(result.current.completedCount).toBe(1);
  });

  it('should include skipped steps in progress', () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { canSkip: true }),
      createStep('step2', 'Step 2'),
      createStep('step3', 'Step 3'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    // Skip first step
    act(() => {
      result.current.skip();
    });

    expect(result.current.progress).toBe(33);
    expect(result.current.completedCount).toBe(1);
  });

  it('should return 100 for single step wizard after completion', async () => {
    const steps = [createStep('only', 'Only Step')];
    const { result } = renderHook(() => useStepper(createConfig(steps)));

    expect(result.current.progress).toBe(0);

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.progress).toBe(100);
  });
});

// ===== Edge Cases =====

describe('useStepper edge cases', () => {
  it('should throw error for empty steps array', () => {
    // Wrap in a function because renderHook doesn't catch synchronous errors well
    const testFn = () => {
      try {
        renderHook(() => useStepper(createConfig([])));
        return false;
      } catch {
        return true;
      }
    };

    expect(testFn()).toBe(true);
  });

  it('should throw error for invalid initial step', () => {
    const testFn = () => {
      try {
        renderHook(() => useStepper(createConfig(basicSteps, { initialStep: 5 })));
        return false;
      } catch {
        return true;
      }
    };

    expect(testFn()).toBe(true);
  });

  it('should handle single step wizard', async () => {
    const onComplete = vi.fn();
    const steps = [createStep('only', 'Only Step')];
    const { result } = renderHook(() => useStepper(createConfig(steps, { onComplete })));

    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(true);

    await act(async () => {
      await result.current.next();
    });

    expect(onComplete).toHaveBeenCalled();
    expect(result.current.isCompleted).toBe(true);
  });

  it('should not advance after completion', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    // Complete wizard
    await act(async () => {
      await result.current.next();
    });
    await act(async () => {
      await result.current.next();
    });
    await act(async () => {
      await result.current.next();
    });

    expect(result.current.isCompleted).toBe(true);

    let success = false;
    await act(async () => {
      success = await result.current.next();
    });

    expect(success).toBe(false);
  });

  it('should handle goTo with same index', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    let success = false;
    await act(async () => {
      success = await result.current.goTo(0);
    });

    expect(success).toBe(true);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should handle goTo with negative index', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    let success = false;
    await act(async () => {
      success = await result.current.goTo(-1);
    });

    expect(success).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should handle goTo with index beyond steps length', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    let success = false;
    await act(async () => {
      success = await result.current.goTo(100);
    });

    expect(success).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should correctly report canAccessStep', async () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    // Initially only first step is accessible
    expect(result.current.canAccessStep(0)).toBe(true);
    expect(result.current.canAccessStep(1)).toBe(false);
    expect(result.current.canAccessStep(2)).toBe(false);

    // After completing first step
    await act(async () => {
      await result.current.next();
    });

    expect(result.current.canAccessStep(0)).toBe(true);
    expect(result.current.canAccessStep(1)).toBe(true);
    expect(result.current.canAccessStep(2)).toBe(false);
  });

  it('should handle clearErrors correctly', async () => {
    const validate = createFailingValidation({ field: 'Error' });
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    await act(async () => {
      await result.current.next();
    });

    expect(result.current.errors).toEqual({ field: 'Error' });

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it('should handle setStepErrors correctly', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    act(() => {
      result.current.setStepErrors('step1', { custom: 'Custom error' });
    });

    expect(result.current.errors).toEqual({ custom: 'Custom error' });
    expect(result.current.stepsWithErrors).toContain('step1');
  });

  it('should skip validation when validateOnChange is false', async () => {
    const validate = createPassingValidation();
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1', { validate }),
      createStep('step2', 'Step 2'),
    ];

    const { result } = renderHook(() =>
      useStepper(createConfig(steps, { validateOnChange: false }))
    );

    await act(async () => {
      await result.current.next();
    });

    expect(validate).not.toHaveBeenCalled();
    expect(result.current.currentIndex).toBe(1);
  });
});

// ===== Step Status Tests =====

describe('useStepper step status', () => {
  it('should return correct status for each step state', async () => {
    const steps: StepConfig[] = [
      createStep('step1', 'Step 1'),
      createStep('step2', 'Step 2', { canSkip: true }),
      createStep('step3', 'Step 3'),
      createStep('step4', 'Step 4'),
    ];

    const { result } = renderHook(() => useStepper(createConfig(steps)));

    // Step 1 is active
    expect(result.current.getStepStatus('step1')).toBe('active');
    expect(result.current.getStepStatus('step2')).toBe('pending');
    expect(result.current.getStepStatus('step3')).toBe('pending');
    expect(result.current.getStepStatus('step4')).toBe('pending');

    // Complete step 1
    await act(async () => {
      await result.current.next();
    });

    expect(result.current.getStepStatus('step1')).toBe('completed');
    expect(result.current.getStepStatus('step2')).toBe('active');

    // Skip step 2
    act(() => {
      result.current.skip();
    });

    expect(result.current.getStepStatus('step2')).toBe('skipped');
    expect(result.current.getStepStatus('step3')).toBe('active');
  });

  it('should return error status for steps with errors', () => {
    const { result } = renderHook(() => useStepper(createConfig(basicSteps)));

    act(() => {
      result.current.setStepErrors('step1', { field: 'Error' });
    });

    expect(result.current.getStepStatus('step1')).toBe('error');
  });
});
