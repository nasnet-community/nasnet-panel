// libs/features/diagnostics/src/types/troubleshoot.types.ts

/**
 * Configuration for a diagnostic step
 */
export interface DiagnosticStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  result?: DiagnosticResult;
  fix?: FixSuggestion;
}

/**
 * Result of running a diagnostic step
 */
export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  issueCode?: string; // Maps to FIX_REGISTRY key
  executionTimeMs: number;
}

/**
 * Summary returned when wizard completes
 */
export interface DiagnosticSummary {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  appliedFixes: string[];
  durationMs: number;
  finalStatus: 'all_passed' | 'issues_resolved' | 'issues_remaining' | 'contact_isp';
}

/**
 * Record of a fix that was applied
 */
export interface AppliedFix {
  issueCode: string;
  command: string;
  success: boolean;
  rollbackAvailable: boolean;
}

/**
 * Fix suggestion from the registry
 */
export interface FixSuggestion {
  issueCode: string;
  title: string;
  description: string;
  command: string | null; // null = manual fix required
  confidence: 'high' | 'medium' | 'low' | null; // null for manual fixes
  requiresConfirmation: boolean;
  rollbackCommand?: string | null;
  isManualFix: boolean;
  manualSteps?: string[];
}

/**
 * XState machine context
 */
export interface TroubleshootContext {
  routerId: string;
  wanInterface: string;
  gateway: string | null;
  steps: DiagnosticStep[];
  currentStepIndex: number;
  overallStatus: 'idle' | 'running' | 'completed' | 'fixPending';
  appliedFixes: string[];
  startTime: Date | null;
  endTime: Date | null;
  error: Error | null;
}

/**
 * XState machine events
 */
export type TroubleshootEvent =
  | { type: 'START' }
  | { type: 'STEP_COMPLETE'; result: DiagnosticResult }
  | { type: 'APPLY_FIX'; fixId: string }
  | { type: 'FIX_APPLIED'; success: boolean }
  | { type: 'SKIP_FIX' }
  | { type: 'RESTART' }
  | { type: 'CANCEL' };

/**
 * ISP information for contact suggestions
 */
export interface ISPInfo {
  name: string | null;
  supportPhone: string | null;
  supportUrl: string | null;
  detected: boolean;
}

/**
 * Custom error class for diagnostic failures
 */
export class DiagnosticError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DiagnosticError';
  }
}
