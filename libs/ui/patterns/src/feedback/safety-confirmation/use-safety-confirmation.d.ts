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
import type { UseSafetyConfirmationConfig, UseSafetyConfirmationReturn } from './safety-confirmation.types';
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
export declare function useSafetyConfirmation(config: UseSafetyConfirmationConfig): UseSafetyConfirmationReturn;
//# sourceMappingURL=use-safety-confirmation.d.ts.map