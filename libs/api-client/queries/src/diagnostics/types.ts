/**
 * Diagnostics Types
 * Manual type definitions for internet troubleshooting (NAS-5.11)
 * TODO: Replace with codegen types once schema validation is fixed
 */

/**
 * Diagnostic step type
 */
export enum TroubleshootStepType {
  WAN = 'WAN',
  GATEWAY = 'GATEWAY',
  INTERNET = 'INTERNET',
  DNS = 'DNS',
  NAT = 'NAT',
}

/**
 * Status of a diagnostic step
 */
export enum TroubleshootStepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/**
 * Confidence level for a fix suggestion
 */
export enum FixConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Status of a fix application
 */
export enum FixApplicationStatus {
  AVAILABLE = 'AVAILABLE',
  APPLYING = 'APPLYING',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
  ISSUE_PERSISTS = 'ISSUE_PERSISTS',
}

/**
 * Overall status of a troubleshooting session
 */
export enum TroubleshootSessionStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  RUNNING = 'RUNNING',
  AWAITING_FIX_DECISION = 'AWAITING_FIX_DECISION',
  APPLYING_FIX = 'APPLYING_FIX',
  VERIFYING_FIX = 'VERIFYING_FIX',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Result of a single diagnostic step
 */
export interface TroubleshootStepResult {
  success: boolean;
  message: string;
  details?: string;
  executionTimeMs: number;
  issueCode?: string;
  target?: string;
}

/**
 * Suggested fix for a failed diagnostic step
 */
export interface TroubleshootFixSuggestion {
  issueCode: string;
  title: string;
  explanation: string;
  confidence: FixConfidence;
  requiresConfirmation: boolean;
  isManualFix: boolean;
  manualSteps?: string[];
  command?: string;
  rollbackCommand?: string;
}

/**
 * ISP contact information
 */
export interface ISPInfo {
  name: string;
  phone?: string;
  url?: string;
}

/**
 * A single step in the troubleshooting wizard
 */
export interface TroubleshootStep {
  id: TroubleshootStepType;
  name: string;
  description: string;
  status: TroubleshootStepStatus;
  result?: TroubleshootStepResult;
  fix?: TroubleshootFixSuggestion;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Complete troubleshooting session
 */
export interface TroubleshootSession {
  id: string;
  routerId: string;
  steps: TroubleshootStep[];
  currentStepIndex: number;
  status: TroubleshootSessionStatus;
  wanInterface?: string;
  gateway?: string;
  ispInfo?: ISPInfo;
  appliedFixes: string[];
  startedAt: string;
  completedAt?: string;
}

/**
 * Network configuration detection result
 */
export interface NetworkConfigDetection {
  wanInterface: string;
  gateway?: string;
  ispInfo?: ISPInfo;
}

/**
 * Result of starting a troubleshooting session
 */
export interface StartTroubleshootPayload {
  session?: TroubleshootSession;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

/**
 * Result of running a diagnostic step
 */
export interface RunTroubleshootStepPayload {
  step: TroubleshootStep;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

/**
 * Result of applying a fix
 */
export interface ApplyFixPayload {
  success: boolean;
  message: string;
  status: FixApplicationStatus;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}
