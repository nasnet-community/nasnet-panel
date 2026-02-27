/**
 * Validation Progress Types
 *
 * Types for the 7-stage validation pipeline UI.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */

/**
 * Validation stage identifiers matching the 7-stage pipeline.
 */
export type ValidationStageName =
  | 'schema'
  | 'syntax'
  | 'cross-resource'
  | 'dependencies'
  | 'network'
  | 'platform'
  | 'dry-run';

/**
 * Status of a validation stage.
 */
export type ValidationStageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * Validation error from a stage.
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Path to the field that caused the error */
  fieldPath?: string;
  /** UUID of related resource (for cross-resource errors) */
  resourceUuid?: string;
  /** Suggested fix for the error */
  suggestedFix?: string;
}

/**
 * Validation warning (non-blocking issue).
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Human-readable warning message */
  message: string;
  /** Path to the field that caused the warning */
  fieldPath?: string;
}

/**
 * Result of a single validation stage.
 */
export interface ValidationStageResult {
  /** Stage identifier */
  stage: ValidationStageName;
  /** Current status */
  status: ValidationStageStatus;
  /** Errors from this stage */
  errors: ValidationError[];
  /** Warnings from this stage */
  warnings: ValidationWarning[];
  /** Time taken to complete the stage (ms) */
  durationMs?: number;
}

/**
 * Stage metadata for display purposes.
 */
export interface StageMeta {
  /** Display label */
  label: string;
  /** Description of what the stage validates */
  description: string;
  /** Icon name (lucide-react) */
  icon: string;
}

/**
 * Full validation result from the pipeline.
 */
export interface ValidationResult {
  /** Whether all stages passed */
  isValid: boolean;
  /** Results from each stage */
  stages: ValidationStageResult[];
  /** All errors from all stages */
  errors: ValidationError[];
  /** All warnings from all stages */
  warnings: ValidationWarning[];
}
