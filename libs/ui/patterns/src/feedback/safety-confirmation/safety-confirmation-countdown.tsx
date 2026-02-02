/**
 * SafetyConfirmationCountdown Component
 *
 * Countdown timer display with progress bar and urgency-based styling.
 * Changes color as countdown progresses: normal → urgent → critical.
 *
 * Pattern reused from SessionExpiringDialog.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see libs/ui/patterns/src/session-expiring-dialog/SessionExpiringDialog.tsx
 */

import { cn, Progress } from '@nasnet/ui/primitives';

import type { SafetyConfirmationCountdownProps } from './safety-confirmation.types';

/**
 * Countdown timer component for safety confirmation dialogs
 *
 * Features:
 * - Progress bar with urgency-based coloring
 * - MM:SS time display
 * - Three urgency levels: normal, urgent, critical
 * - Pulse animation for critical state
 * - Screen reader announcements via aria-live
 *
 * Color mapping (using semantic tokens):
 * - normal: text-muted-foreground, bg-muted (> 5 seconds)
 * - urgent: text-warning, bg-warning/10 (3-5 seconds)
 * - critical: text-destructive, bg-destructive/10, animate-pulse (≤ 2 seconds)
 *
 * @example
 * ```tsx
 * <SafetyConfirmationCountdown
 *   isCountingDown={hook.isCountingDown}
 *   progress={hook.countdownProgress}
 *   formattedTime={hook.formattedTime}
 *   urgencyLevel={hook.urgencyLevel}
 * />
 * ```
 */
export function SafetyConfirmationCountdown({
  isCountingDown,
  progress,
  formattedTime,
  urgencyLevel,
  className,
}: SafetyConfirmationCountdownProps) {
  // Don't render anything if not counting down
  if (!isCountingDown && progress === 0) {
    return null;
  }

  // Calculate if countdown is complete
  const isComplete = progress >= 100;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Time Display */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={cn(
            'text-center font-mono text-3xl font-bold',
            urgencyLevel === 'normal' && 'text-muted-foreground',
            urgencyLevel === 'urgent' && 'text-warning',
            urgencyLevel === 'critical' && 'animate-pulse text-destructive'
          )}
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${formattedTime} remaining`}
        >
          {formattedTime}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={cn(
          'rounded-full p-1',
          urgencyLevel === 'normal' && 'bg-muted',
          urgencyLevel === 'urgent' && 'bg-warning/10',
          urgencyLevel === 'critical' && 'bg-destructive/10'
        )}
      >
        <Progress
          value={progress}
          className={cn(
            'h-2',
            urgencyLevel === 'normal' && '[&>div]:bg-muted-foreground',
            urgencyLevel === 'urgent' && '[&>div]:bg-warning',
            urgencyLevel === 'critical' && '[&>div]:bg-destructive'
          )}
          aria-label="Countdown progress"
        />
      </div>

      {/* Status Text */}
      <p
        className={cn(
          'text-center text-xs',
          urgencyLevel === 'normal' && 'text-muted-foreground',
          urgencyLevel === 'urgent' && 'text-warning',
          urgencyLevel === 'critical' && 'text-destructive'
        )}
      >
        {isComplete
          ? 'Countdown complete. You may now confirm.'
          : 'Please wait for countdown to complete'}
      </p>
    </div>
  );
}
