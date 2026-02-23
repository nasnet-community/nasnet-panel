import type { DiagnosticStep } from '../../types/troubleshoot.types';
interface StepAnnouncerProps {
    /** The current diagnostic step being executed */
    currentStep: DiagnosticStep;
    /** Zero-indexed position of current step in the sequence */
    currentStepIndex: number;
    /** Total number of steps in the diagnostic sequence */
    totalSteps: number;
    /** True when a fix is being applied to the router */
    isApplyingFix: boolean;
    /** True when verifying that the applied fix resolved the issue */
    isVerifying: boolean;
    /** True when all diagnostic steps have completed */
    isCompleted: boolean;
}
/**
 * ARIA live region component for screen reader announcements.
 * Announces diagnostic step progress, results, fix application status, and wizard completion.
 * Uses `aria-live="polite"` to notify users without interrupting current speech.
 *
 * @example
 * ```tsx
 * <StepAnnouncer
 *   currentStep={step}
 *   currentStepIndex={0}
 *   totalSteps={5}
 *   isApplyingFix={false}
 *   isVerifying={false}
 *   isCompleted={false}
 * />
 * ```
 *
 * @wcag AAA compliance:
 * - Uses `aria-live="polite"` for non-intrusive announcements
 * - Uses `aria-atomic="true"` to announce full message context
 * - Hidden from visual display (`sr-only`) but available to assistive tech
 * - Announces all state changes: running, passed, failed, applying, verifying, completed
 */
export declare const StepAnnouncer: import("react").NamedExoticComponent<StepAnnouncerProps>;
export {};
//# sourceMappingURL=StepAnnouncer.d.ts.map