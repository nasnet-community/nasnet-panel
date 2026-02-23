import type { DiagnosticSummary, DiagnosticStep } from '../../types/troubleshoot.types';
interface WizardSummaryProps {
    /** Summary data from completed diagnostic wizard including final status and applied fixes */
    summary: DiagnosticSummary;
    /** List of all diagnostic steps with their final status and results */
    steps: DiagnosticStep[];
    /** Callback when user clicks Run Again button to restart wizard */
    onRestart: () => void;
    /** Callback when user clicks Close button to dismiss wizard */
    onClose: () => void;
}
/**
 * Displays a comprehensive summary of completed diagnostics including:
 * - Overall status (all passed, issues resolved, contact ISP, or issues remaining)
 * - Statistics (passed/failed/duration)
 * - Detailed results for each step
 * - List of applied fixes
 * - Action buttons to restart or close
 *
 * @example
 * ```tsx
 * <WizardSummary
 *   summary={summary}
 *   steps={steps}
 *   onRestart={handleRestart}
 *   onClose={handleClose}
 * />
 * ```
 *
 * @wcag AAA compliance:
 * - Uses semantic HTML: <h2>, <h3>, role="list"
 * - Color-coded status with icon + text labels (not color alone)
 * - All buttons have min 44px touch targets
 * - Focus indicators on all interactive elements
 * - Statistics clearly labeled and accessible to screen readers
 * - Detailed results with proper heading hierarchy
 */
export declare const WizardSummary: import("react").NamedExoticComponent<WizardSummaryProps>;
export {};
//# sourceMappingURL=WizardSummary.d.ts.map