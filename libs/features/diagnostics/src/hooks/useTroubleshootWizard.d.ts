import type { DiagnosticSummary, AppliedFix, DiagnosticStep } from '../types/troubleshoot.types';
export interface UseTroubleshootWizardProps {
    /** Router UUID to run diagnostics against */
    routerId: string;
    /** Auto-start wizard on mount (default: false) */
    autoStart?: boolean;
    /** Callback when wizard completes with final summary */
    onComplete?: (summary: DiagnosticSummary) => void;
    /** Callback when a fix is successfully applied */
    onFixApplied?: (fix: AppliedFix) => void;
}
export interface UseTroubleshootWizardReturn {
    /** Current state string (e.g., "idle", "initializing", "runningDiagnostic", "completed") */
    state: string;
    /** True when wizard is idle and no diagnostics are running */
    isIdle: boolean;
    /** True when actively running diagnostic steps */
    isRunning: boolean;
    /** True when initializing network detection */
    isInitializing: boolean;
    /** True when all diagnostics have completed */
    isCompleted: boolean;
    /** True when waiting for user decision on applying a fix */
    isAwaitingFixDecision: boolean;
    /** True when applying a fix command to the router */
    isApplyingFix: boolean;
    /** True when verifying that an applied fix resolved the issue */
    isVerifying: boolean;
    /** Array of all diagnostic steps with their current status */
    steps: DiagnosticStep[];
    /** The current step being executed or displayed */
    currentStep: DiagnosticStep;
    /** Zero-indexed position of current step */
    currentStepIndex: number;
    /** Progress object with current, total, and percentage */
    progress: {
        current: number;
        total: number;
        percentage: number;
    };
    /** Localized messages for the current step */
    messages: {
        name: string;
        description: string;
        runningMessage: string;
        passedMessage: string;
        failedMessage: string;
    };
    /** List of fix issue codes that have been applied */
    appliedFixes: string[];
    /** Current error, if any */
    error: Error | null;
    /** Start the diagnostic wizard */
    start: () => void;
    /** Apply the suggested fix for the current failed step */
    applyFix: () => void;
    /** Skip the fix and continue to next step */
    skipFix: () => void;
    /** Restart the entire wizard from idle state */
    restart: () => void;
    /** Cancel the wizard and return to idle */
    cancel: () => void;
}
/**
 * Hook for managing the troubleshoot wizard state machine and lifecycle.
 * Orchestrates network detection, diagnostic execution, fix application, and verification.
 *
 * The wizard follows this flow:
 * 1. Idle → 2. Initializing (detect WAN/gateway) → 3. Running Diagnostics → 4. Awaiting Fix Decision → 5. Applying Fix → 6. Verifying → 7. Completed
 *
 * @param props Configuration for the wizard hook
 * @returns Hook return object with state, data, and action callbacks
 *
 * @example
 * ```tsx
 * const wizard = useTroubleshootWizard({
 *   routerId: 'router-123',
 *   autoStart: false,
 *   onComplete: (summary) => console.log('Done:', summary),
 *   onFixApplied: (fix) => console.log('Applied:', fix),
 * });
 *
 * return (
 *   <>
 *     <button onClick={wizard.start}>Start Diagnostics</button>
 *     {wizard.isRunning && <Progress value={wizard.progress.percentage} />}
 *   </>
 * );
 * ```
 */
export declare function useTroubleshootWizard({ routerId, autoStart, onComplete, onFixApplied, }: UseTroubleshootWizardProps): UseTroubleshootWizardReturn;
//# sourceMappingURL=useTroubleshootWizard.d.ts.map