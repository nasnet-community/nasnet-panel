/**
 * Configuration for a diagnostic step
 * @description A single diagnostic test run by the troubleshooting wizard (e.g., "Check WAN Interface",
 * "Test DNS Resolution"). Each step has a status, optional result, and optional fix suggestion.
 */
export interface DiagnosticStep {
    /** Unique identifier for this diagnostic step (e.g., 'wan', 'dns', 'nat') */
    id: string;
    /** Display name of the step shown to users (e.g., "WAN Interface", "DNS Resolution") */
    name: string;
    /** User-friendly description of what this step tests */
    description: string;
    /** Current execution status: pending (not started), running (in progress), passed (success), failed (error), skipped (user skipped) */
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    /** Result of running this step, if available */
    result?: DiagnosticResult;
    /** Suggested fix if the step failed, if available */
    fix?: FixSuggestion;
}
/**
 * Result of running a diagnostic step
 * @description The outcome of executing a single diagnostic test, including success/failure status,
 * human-readable message, and optional details for debugging.
 */
export interface DiagnosticResult {
    /** Whether the diagnostic test passed (true) or failed (false) */
    success: boolean;
    /** User-friendly message describing the result (e.g., "Interface is connected and working") */
    message: string;
    /** Optional detailed metrics or diagnostic information (e.g., latency ms, response times) */
    details?: Record<string, unknown>;
    /** Optional error code mapping to the fix registry (e.g., 'WAN_DISABLED', 'DNS_FAILED') */
    issueCode?: string;
    /** Time in milliseconds taken to execute this diagnostic step */
    executionTimeMs: number;
}
/**
 * Summary returned when wizard completes
 * @description Final report of the troubleshooting session, including step results, fixes applied,
 * and overall status. Used to display completion summary to the user.
 */
export interface DiagnosticSummary {
    /** Total number of diagnostic steps run */
    totalSteps: number;
    /** Number of steps that passed */
    passedSteps: number;
    /** Number of steps that failed */
    failedSteps: number;
    /** Number of steps the user skipped */
    skippedSteps: number;
    /** List of issue codes for fixes that were successfully applied */
    appliedFixes: string[];
    /** Total time in milliseconds for entire troubleshooting session */
    durationMs: number;
    /** Overall result: 'all_passed' (all tests passed), 'issues_resolved' (fixes applied and verified), 'issues_remaining' (issues remain but can't be auto-fixed), 'contact_isp' (issue is with ISP) */
    finalStatus: 'all_passed' | 'issues_resolved' | 'issues_remaining' | 'contact_isp';
}
/**
 * Record of a fix that was applied
 * @description Audit trail entry for a fix that was attempted on the router. Includes the command
 * executed and whether rollback is available in case the fix caused new problems.
 */
export interface AppliedFix {
    /** Issue code that was fixed (e.g., 'WAN_DISABLED', 'DNS_FAILED') */
    issueCode: string;
    /** RouterOS command or set of commands executed to apply the fix */
    command: string;
    /** Whether the fix was applied successfully */
    success: boolean;
    /** Whether a rollback command is available to undo this fix */
    rollbackAvailable: boolean;
}
/**
 * Fix suggestion from the registry
 * @description A recommended fix for a failed diagnostic test. Can be automatic (RouterOS command)
 * or manual (step-by-step instructions). Includes confidence level and rollback capability.
 */
export interface FixSuggestion {
    /** Unique issue code identifying the problem type (e.g., 'WAN_DISABLED', 'DNS_FAILED') */
    issueCode: string;
    /** Short, user-friendly title (e.g., "Enable Internet Connection") */
    title: string;
    /** Detailed explanation of the fix and why it helps, written for non-technical users */
    description: string;
    /** RouterOS command to auto-fix, or null if fix requires manual steps */
    command: string | null;
    /** Confidence level: 'high' (safe to auto-apply), 'medium' (may need confirmation), 'low' (risky), null (manual fix) */
    confidence: 'high' | 'medium' | 'low' | null;
    /** Whether user confirmation is required before applying this fix */
    requiresConfirmation: boolean;
    /** RouterOS command to undo this fix, if available */
    rollbackCommand?: string | null;
    /** Whether this is a manual fix requiring user intervention (true) or automatic (false) */
    isManualFix: boolean;
    /** Step-by-step manual instructions for user to follow, if isManualFix is true */
    manualSteps?: string[];
}
/**
 * XState machine context
 * @description State container for the troubleshooting wizard XState machine. Holds all mutable state
 * including router context, step progress, and session timing. Updated as the wizard progresses.
 */
export interface TroubleshootContext {
    /** ID of the target router being diagnosed */
    routerId: string;
    /** Name of the WAN interface to test (e.g., 'ether1') */
    wanInterface: string;
    /** Default gateway IP address for the router, or null if not yet detected */
    gateway: string | null;
    /** Array of diagnostic steps being run, with their results */
    steps: DiagnosticStep[];
    /** Zero-based index of the currently executing or last executed step */
    currentStepIndex: number;
    /** Overall wizard state: 'idle' (ready to start), 'running' (tests in progress), 'completed' (done), 'fixPending' (awaiting user confirmation for fix) */
    overallStatus: 'idle' | 'running' | 'completed' | 'fixPending';
    /** List of issue codes for fixes that have been successfully applied during this session */
    appliedFixes: string[];
    /** Timestamp when the troubleshooting session started, or null if not started */
    startTime: Date | null;
    /** Timestamp when the troubleshooting session ended, or null if still running */
    endTime: Date | null;
    /** Captured error if the entire session fails, or null */
    error: Error | null;
}
/**
 * XState machine events
 * @description Events that trigger state transitions in the troubleshooting wizard machine.
 * Includes session lifecycle (START, RESTART, CANCEL) and step progression (STEP_COMPLETE, APPLY_FIX).
 */
export type TroubleshootEvent = {
    type: 'START';
} | {
    type: 'STEP_COMPLETE';
    result: DiagnosticResult;
} | {
    type: 'APPLY_FIX';
    fixId: string;
} | {
    type: 'FIX_APPLIED';
    success: boolean;
} | {
    type: 'SKIP_FIX';
} | {
    type: 'RESTART';
} | {
    type: 'CANCEL';
};
/**
 * ISP information for contact suggestions
 * @description Information about the user's Internet Service Provider, detected from the router
 * configuration or WAN interface. Used to provide helpful contact information when issues appear
 * to be ISP-related.
 */
export interface ISPInfo {
    /** Name of the detected ISP (e.g., "Verizon", "Comcast"), or null if not detected */
    name: string | null;
    /** ISP customer support phone number, or null if not available */
    supportPhone: string | null;
    /** URL to ISP's support portal or website, or null if not available */
    supportUrl: string | null;
    /** Whether the ISP information was successfully detected (true) or is unknown (false) */
    detected: boolean;
}
/**
 * Custom error class for diagnostic failures
 * @description Structured error class used when a diagnostic test fails. Includes a code
 * for categorizing the type of failure and mapping to fixes in the registry.
 */
export declare class DiagnosticError extends Error {
    readonly code: string;
    /**
     * @param code - Error code identifying the failure type (e.g., 'WAN_DISABLED', 'DNS_FAILED'), used for fix lookup
     * @param message - Human-readable error description
     */
    constructor(code: string, message: string);
}
//# sourceMappingURL=troubleshoot.types.d.ts.map