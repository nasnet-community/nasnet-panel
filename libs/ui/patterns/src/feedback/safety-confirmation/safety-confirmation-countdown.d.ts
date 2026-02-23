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
export declare function SafetyConfirmationCountdown({ isCountingDown, progress, formattedTime, urgencyLevel, className, }: SafetyConfirmationCountdownProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=safety-confirmation-countdown.d.ts.map