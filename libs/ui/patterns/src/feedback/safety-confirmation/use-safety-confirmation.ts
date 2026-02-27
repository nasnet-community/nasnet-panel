/**
 * useSafetyConfirmation Headless Hook
 *
 * Manages all state and logic for the SafetyConfirmation component:
 * - Type-to-confirm validation (exact match, case sensitivity)
 * - Countdown timer with urgency levels
 * - Confirmation flow with async operation support
 *
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 * Countdown timer pattern reused from SessionExpiringDialog.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see libs/ui/patterns/src/session-expiring-dialog/SessionExpiringDialog.tsx
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  UseSafetyConfirmationConfig,
  UseSafetyConfirmationReturn,
  UrgencyLevel,
} from './safety-confirmation.types';

/**
 * Format seconds as MM:SS
 * Reused from SessionExpiringDialog pattern
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate urgency level based on remaining time
 * Thresholds adapted for shorter countdowns (5-15 seconds typical)
 */
function getUrgencyLevel(remaining: number, total: number): UrgencyLevel {
  if (remaining <= 2) return 'critical';
  if (remaining <= 5) return 'urgent';
  return 'normal';
}

/**
 * Headless hook for SafetyConfirmation component
 *
 * Contains ALL business logic for dangerous operation confirmation:
 * - Text validation (exact match with optional case sensitivity)
 * - Countdown timer with auto-start on validation
 * - Urgency level calculation for visual feedback
 * - Async confirmation with loading state
 *
 * @example
 * ```tsx
 * const hook = useSafetyConfirmation({
 *   confirmText: 'RESET',
 *   countdownSeconds: 10,
 *   onConfirm: async () => {
 *     await resetRouter();
 *   },
 *   onCancel: () => {
 *     console.log('User cancelled');
 *   },
 * });
 *
 * // Use hook.typedText, hook.isConfirmTextValid, etc. in your UI
 * ```
 */
export function useSafetyConfirmation(
  config: UseSafetyConfirmationConfig
): UseSafetyConfirmationReturn {
  const { confirmText, countdownSeconds = 10, caseSensitive = true, onConfirm, onCancel } = config;

  // ===== Input State =====
  const [typedText, setTypedText] = useState('');

  // ===== Countdown State =====
  const [countdownRemaining, setCountdownRemaining] = useState(countdownSeconds);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // ===== Processing State =====
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== Derived: Text Validation =====
  const isConfirmTextValid = useMemo(() => {
    if (!typedText || !confirmText) return false;

    if (caseSensitive) {
      return typedText === confirmText;
    }
    return typedText.toLowerCase() === confirmText.toLowerCase();
  }, [typedText, confirmText, caseSensitive]);

  // ===== Derived: Countdown Progress =====
  const countdownProgress = useMemo(() => {
    // Progress fills up as time decreases (inverse of remaining)
    return ((countdownSeconds - countdownRemaining) / countdownSeconds) * 100;
  }, [countdownRemaining, countdownSeconds]);

  // ===== Derived: Urgency Level =====
  const urgencyLevel = useMemo(
    () => getUrgencyLevel(countdownRemaining, countdownSeconds),
    [countdownRemaining, countdownSeconds]
  );

  // ===== Derived: Formatted Time =====
  const formattedTime = useMemo(() => formatTime(countdownRemaining), [countdownRemaining]);

  // ===== Derived: Can Confirm =====
  const canConfirm = useMemo(() => {
    return isConfirmTextValid && countdownRemaining === 0 && !isProcessing;
  }, [isConfirmTextValid, countdownRemaining, isProcessing]);

  // ===== Effect: Auto-start countdown when text becomes valid =====
  useEffect(() => {
    if (isConfirmTextValid && !isCountingDown && countdownRemaining > 0) {
      setIsCountingDown(true);
    }
    // If text becomes invalid while counting down, pause the countdown
    if (!isConfirmTextValid && isCountingDown) {
      setIsCountingDown(false);
    }
  }, [isConfirmTextValid, isCountingDown, countdownRemaining]);

  // ===== Effect: Countdown Timer =====
  // Reused pattern from SessionExpiringDialog
  useEffect(() => {
    if (!isCountingDown) return;

    const interval = setInterval(() => {
      setCountdownRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          setIsCountingDown(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown]);

  // ===== Actions =====

  const startCountdown = useCallback(() => {
    if (isConfirmTextValid && !isCountingDown) {
      setIsCountingDown(true);
    }
  }, [isConfirmTextValid, isCountingDown]);

  const cancelCountdown = useCallback(() => {
    setIsCountingDown(false);
    setCountdownRemaining(countdownSeconds);
  }, [countdownSeconds]);

  const reset = useCallback(() => {
    setTypedText('');
    setCountdownRemaining(countdownSeconds);
    setIsCountingDown(false);
    setIsProcessing(false);
  }, [countdownSeconds]);

  const cancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const confirm = useCallback(async () => {
    if (!canConfirm) return;

    setIsProcessing(true);
    try {
      await onConfirm();
      reset();
    } finally {
      setIsProcessing(false);
    }
  }, [canConfirm, onConfirm, reset]);

  return {
    // Input state
    typedText,
    setTypedText,
    isConfirmTextValid,

    // Countdown state
    countdownRemaining,
    countdownProgress,
    isCountingDown,
    urgencyLevel,
    formattedTime,

    // Actions
    startCountdown,
    cancelCountdown,
    confirm,
    cancel,
    reset,

    // Derived
    canConfirm,
    isProcessing,
  };
}
