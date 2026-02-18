/**
 * useSafetyConfirmation Hook Tests
 *
 * Tests for the headless hook including:
 * - Type validation logic (exact match, case sensitivity)
 * - Countdown timer behavior
 * - Urgency level transitions
 * - State transitions (reset, cancel)
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSafetyConfirmation } from './use-safety-confirmation';

import type { UseSafetyConfirmationConfig } from './safety-confirmation.types';

describe('useSafetyConfirmation', () => {
  const defaultConfig: UseSafetyConfirmationConfig = {
    confirmText: 'RESET',
    countdownSeconds: 10,
    caseSensitive: true,
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty typed text', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.typedText).toBe('');
    });

    it('should initialize with countdown at full duration', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.countdownRemaining).toBe(10);
      expect(result.current.countdownProgress).toBe(0);
    });

    it('should initialize with isConfirmTextValid as false', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.isConfirmTextValid).toBe(false);
    });

    it('should initialize with canConfirm as false', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.canConfirm).toBe(false);
    });

    it('should initialize with isCountingDown as false', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.isCountingDown).toBe(false);
    });

    it('should initialize with normal urgency level', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.urgencyLevel).toBe('normal');
    });

    it('should format time correctly', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      expect(result.current.formattedTime).toBe('00:10');
    });
  });

  describe('Type Validation - Case Sensitive', () => {
    it('should validate exact match', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      expect(result.current.isConfirmTextValid).toBe(true);
    });

    it('should reject partial match', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RES');
      });

      expect(result.current.isConfirmTextValid).toBe(false);
    });

    it('should reject case mismatch when case sensitive', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('reset');
      });

      expect(result.current.isConfirmTextValid).toBe(false);
    });

    it('should reject empty input', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('');
      });

      expect(result.current.isConfirmTextValid).toBe(false);
    });

    it('should reject extra characters', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET!');
      });

      expect(result.current.isConfirmTextValid).toBe(false);
    });
  });

  describe('Type Validation - Case Insensitive', () => {
    it('should accept case mismatch when case insensitive', () => {
      const { result } = renderHook(() =>
        useSafetyConfirmation({ ...defaultConfig, caseSensitive: false })
      );

      act(() => {
        result.current.setTypedText('reset');
      });

      expect(result.current.isConfirmTextValid).toBe(true);
    });

    it('should accept mixed case when case insensitive', () => {
      const { result } = renderHook(() =>
        useSafetyConfirmation({ ...defaultConfig, caseSensitive: false })
      );

      act(() => {
        result.current.setTypedText('ReSeT');
      });

      expect(result.current.isConfirmTextValid).toBe(true);
    });
  });

  describe('Countdown Timer Behavior', () => {
    it('should start countdown when text becomes valid', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      // Set valid text
      act(() => {
        result.current.setTypedText('RESET');
      });

      // Verify countdown started
      expect(result.current.isCountingDown).toBe(true);
    });

    it('should decrement countdown every second', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      // Set valid text to start countdown
      act(() => {
        result.current.setTypedText('RESET');
      });

      // Initial state
      expect(result.current.countdownRemaining).toBe(10);

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.countdownRemaining).toBe(9);
    });

    it('should update progress as countdown decreases', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 5 seconds (50% progress)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.countdownProgress).toBe(50);
    });

    it('should stop countdown at zero', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance past 10 seconds
      act(() => {
        vi.advanceTimersByTime(12000);
      });

      expect(result.current.countdownRemaining).toBe(0);
      expect(result.current.isCountingDown).toBe(false);
    });

    it('should pause countdown when text becomes invalid', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      // Start countdown
      act(() => {
        result.current.setTypedText('RESET');
      });

      expect(result.current.isCountingDown).toBe(true);

      // Advance some time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Make text invalid
      act(() => {
        result.current.setTypedText('RESE');
      });

      expect(result.current.isCountingDown).toBe(false);
    });
  });

  describe('Urgency Levels', () => {
    it('should be normal when > 5 seconds remain', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 4 seconds (6 remaining)
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.urgencyLevel).toBe('normal');
    });

    it('should be urgent when 3-5 seconds remain', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 6 seconds (4 remaining)
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(result.current.urgencyLevel).toBe('urgent');
    });

    it('should be critical when <= 2 seconds remain', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 8 seconds (2 remaining)
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(result.current.urgencyLevel).toBe('critical');
    });
  });

  describe('Can Confirm State', () => {
    it('should be false when text is invalid', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('WRONG');
      });

      expect(result.current.canConfirm).toBe(false);
    });

    it('should be false when countdown is not complete', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.canConfirm).toBe(false);
    });

    it('should be true when text is valid and countdown is complete', () => {
      const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

      act(() => {
        result.current.setTypedText('RESET');
      });

      // Advance 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('Actions', () => {
    describe('reset', () => {
      it('should reset all state to initial values', () => {
        const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

        // Set up some state
        act(() => {
          result.current.setTypedText('RESET');
        });

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        // Reset
        act(() => {
          result.current.reset();
        });

        expect(result.current.typedText).toBe('');
        expect(result.current.countdownRemaining).toBe(10);
        expect(result.current.isCountingDown).toBe(false);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    describe('cancel', () => {
      it('should reset state and call onCancel', () => {
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useSafetyConfirmation({ ...defaultConfig, onCancel })
        );

        act(() => {
          result.current.setTypedText('RESET');
          result.current.cancel();
        });

        expect(result.current.typedText).toBe('');
        expect(onCancel).toHaveBeenCalledOnce();
      });
    });

    describe('cancelCountdown', () => {
      it('should reset timer when called with invalid text', () => {
        const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

        act(() => {
          result.current.setTypedText('RESET');
        });

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        // Make text invalid first, then cancel
        act(() => {
          result.current.setTypedText('');
          result.current.cancelCountdown();
        });

        expect(result.current.isCountingDown).toBe(false);
        expect(result.current.countdownRemaining).toBe(10);
      });

      it('should reset countdown remaining even when text is still valid', () => {
        const { result } = renderHook(() => useSafetyConfirmation(defaultConfig));

        act(() => {
          result.current.setTypedText('RESET');
        });

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        // Countdown remaining should be 5 at this point
        expect(result.current.countdownRemaining).toBe(5);

        act(() => {
          result.current.cancelCountdown();
        });

        // Timer should be reset to 10
        expect(result.current.countdownRemaining).toBe(10);
        // But countdown restarts because text is still valid (auto-start effect)
        expect(result.current.isCountingDown).toBe(true);
      });
    });

    describe('confirm', () => {
      it('should not execute if canConfirm is false', async () => {
        const onConfirm = vi.fn();
        const { result } = renderHook(() =>
          useSafetyConfirmation({ ...defaultConfig, onConfirm })
        );

        await act(async () => {
          await result.current.confirm();
        });

        expect(onConfirm).not.toHaveBeenCalled();
      });

      it('should execute onConfirm when canConfirm is true', async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        const { result } = renderHook(() =>
          useSafetyConfirmation({ ...defaultConfig, onConfirm })
        );

        act(() => {
          result.current.setTypedText('RESET');
        });

        act(() => {
          vi.advanceTimersByTime(10000);
        });

        expect(result.current.canConfirm).toBe(true);

        await act(async () => {
          await result.current.confirm();
        });

        expect(onConfirm).toHaveBeenCalledOnce();
      });

      it('should set isProcessing while executing', async () => {
        let resolveConfirm: () => void;
        const onConfirm = vi.fn().mockImplementation(
          () =>
            new Promise<void>((resolve) => {
              resolveConfirm = resolve;
            })
        );

        const { result } = renderHook(() =>
          useSafetyConfirmation({ ...defaultConfig, onConfirm })
        );

        act(() => {
          result.current.setTypedText('RESET');
        });

        act(() => {
          vi.advanceTimersByTime(10000);
        });

        expect(result.current.canConfirm).toBe(true);

        // Start confirm but don't await
        let confirmPromise: Promise<void>;
        act(() => {
          confirmPromise = result.current.confirm();
        });

        // Should be processing
        expect(result.current.isProcessing).toBe(true);

        // Resolve the confirm
        await act(async () => {
          resolveConfirm!();
          await confirmPromise;
        });

        // Should no longer be processing
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format single digit seconds with leading zero', () => {
      const { result } = renderHook(() =>
        useSafetyConfirmation({ ...defaultConfig, countdownSeconds: 5 })
      );

      expect(result.current.formattedTime).toBe('00:05');
    });

    it('should format minutes correctly', () => {
      const { result } = renderHook(() =>
        useSafetyConfirmation({ ...defaultConfig, countdownSeconds: 65 })
      );

      expect(result.current.formattedTime).toBe('01:05');
    });
  });
});
