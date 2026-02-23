/**
 * Tests for useWizardPersistence
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type FieldValues } from 'react-hook-form';

import { useWizardPersistence } from '../useWizardPersistence';

interface TestWizardData extends Record<string, FieldValues> {
  step1: { name: string };
  step2: { email: string };
  step3: { password: string };
}

describe('useWizardPersistence', () => {
  const stepIds = ['step1', 'step2', 'step3'];
  let mockStorage: Storage;

  beforeEach(() => {
    // Create mock storage
    const store: Record<string, string> = {};
    mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  describe('initialization', () => {
    it('initializes with first step as current', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      expect(result.current.currentStep).toBe('step1');
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
    });

    it('initializes with custom initial step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          initialStep: 'step2',
          storage: mockStorage,
        })
      );

      expect(result.current.currentStep).toBe('step2');
      expect(result.current.currentStepIndex).toBe(1);
    });

    it('starts with 0% progress', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      expect(result.current.progress).toBe(0);
      expect(result.current.completedSteps).toEqual([]);
    });
  });

  describe('navigation', () => {
    it('navigates to next step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe('step2');
      expect(result.current.currentStepIndex).toBe(1);
    });

    it('navigates to previous step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          initialStep: 'step2',
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe('step1');
    });

    it('goes to specific step by ID', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.goToStep('step3');
      });

      expect(result.current.currentStep).toBe('step3');
      expect(result.current.isLastStep).toBe(true);
    });

    it('goes to specific step by index', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe('step3');
    });

    it('does not go past last step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          initialStep: 'step3',
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe('step3');
      expect(result.current.isLastStep).toBe(true);
    });

    it('does not go before first step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe('step1');
      expect(result.current.isFirstStep).toBe(true);
    });
  });

  describe('step data management', () => {
    it('sets and gets step data', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setStepData('step1', { name: 'Test User' });
      });

      expect(result.current.getStepData('step1')).toEqual({ name: 'Test User' });
    });

    it('gets all step data', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setStepData('step1', { name: 'Test' });
        result.current.setStepData('step2', { email: 'test@test.com' });
      });

      const allData = result.current.getAllStepData();
      expect(allData.step1).toEqual({ name: 'Test' });
      expect(allData.step2).toEqual({ email: 'test@test.com' });
    });
  });

  describe('step completion', () => {
    it('marks step as completed', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.completeStep('step1');
      });

      expect(result.current.isStepCompleted('step1')).toBe(true);
      expect(result.current.completedSteps).toContain('step1');
    });

    it('updates progress when steps are completed', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.completeStep('step1');
      });

      expect(result.current.progress).toBe(33); // 1/3 = 33%

      act(() => {
        result.current.completeStep('step2');
      });

      expect(result.current.progress).toBe(67); // 2/3 = 67%
    });

    it('does not duplicate completed steps', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.completeStep('step1');
        result.current.completeStep('step1');
      });

      expect(result.current.completedSteps).toEqual(['step1']);
    });
  });

  describe('persistence', () => {
    it('persists state to storage', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setStepData('step1', { name: 'Test' });
        result.current.completeStep('step1');
        result.current.nextStep();
      });

      expect(mockStorage.setItem).toHaveBeenCalled();

      // Verify the stored data
      const storedData = JSON.parse(
        (mockStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] ?? '{}'
      );
      expect(storedData.stepData.step1).toEqual({ name: 'Test' });
      expect(storedData.completedSteps).toContain('step1');
      expect(storedData.currentStep).toBe('step2');
    });

    it('clears persistence', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setStepData('step1', { name: 'Test' });
        result.current.completeStep('step1');
      });

      act(() => {
        result.current.clearPersistence();
      });

      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-wizard');
      expect(result.current.currentStep).toBe('step1');
      expect(result.current.completedSteps).toEqual([]);
    });

    it('resets wizard state', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setStepData('step1', { name: 'Test' });
        result.current.completeStep('step1');
        result.current.nextStep();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe('step1');
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.getStepData('step1')).toBeUndefined();
    });
  });

  describe('metadata', () => {
    it('sets and persists metadata', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setMetadata({ source: 'dashboard', version: 1 });
      });

      expect(result.current.state.metadata).toEqual({
        source: 'dashboard',
        version: 1,
      });
    });
  });

  describe('canGoToStep', () => {
    it('can go to current step', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      expect(result.current.canGoToStep('step1')).toBe(true);
    });

    it('can go to completed steps', () => {
      const { result } = renderHook(() =>
        useWizardPersistence<TestWizardData>({
          storageKey: 'test-wizard',
          stepIds,
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.completeStep('step1');
        result.current.nextStep();
        result.current.completeStep('step2');
        result.current.nextStep();
      });

      // Should be able to go back to completed steps
      expect(result.current.canGoToStep('step1')).toBe(true);
      expect(result.current.canGoToStep('step2')).toBe(true);
    });
  });
});
