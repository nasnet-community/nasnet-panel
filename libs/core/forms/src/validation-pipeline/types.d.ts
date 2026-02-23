/**
 * Validation Pipeline Types
 *
 * Types for the 7-stage validation pipeline that integrates
 * with backend validation.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */
/**
 * Validation stage names in execution order
 */
export declare const VALIDATION_STAGES: readonly ["schema", "syntax", "cross-resource", "dependencies", "network", "platform", "dry-run"];
export type ValidationStageName = (typeof VALIDATION_STAGES)[number];
/**
 * Status of a validation stage
 */
export type ValidationStageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
/**
 * A validation error from the backend
 */
export interface ValidationError {
    /** Error code (e.g., 'E001', 'IP_COLLISION') */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Field path in the form (e.g., 'address', 'peers.0.publicKey') */
    fieldPath?: string;
    /** Severity of the error */
    severity: 'error' | 'warning';
    /** Stage that produced this error */
    stage: ValidationStageName;
    /** Suggestions for fixing the error */
    suggestions?: string[];
    /** Related resource IDs if cross-resource error */
    relatedResources?: string[];
}
/**
 * Result of a single validation stage
 */
export interface ValidationStageResult {
    /** Stage name */
    stage: ValidationStageName;
    /** Current status */
    status: ValidationStageStatus;
    /** Errors found in this stage */
    errors: ValidationError[];
    /** Warnings found in this stage */
    warnings: ValidationError[];
    /** Duration in milliseconds */
    durationMs?: number;
    /** Additional stage-specific metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Risk level that determines which stages to run
 */
export type RiskLevel = 'low' | 'medium' | 'high';
/**
 * Configuration for the validation pipeline
 */
export interface ValidationPipelineConfig {
    /** Risk level of the operation */
    riskLevel: RiskLevel;
    /** Whether to stop on first error */
    stopOnError?: boolean;
    /** Stages to skip */
    skipStages?: ValidationStageName[];
    /** Timeout per stage in milliseconds */
    stageTimeout?: number;
    /** Whether to run dry-run stage */
    includeDryRun?: boolean;
}
/**
 * Stages to run based on risk level
 */
export declare const RISK_LEVEL_STAGES: Record<RiskLevel, ValidationStageName[]>;
/**
 * Result of the complete validation pipeline
 */
export interface ValidationPipelineResult {
    /** Whether validation passed */
    isValid: boolean;
    /** All stage results */
    stages: ValidationStageResult[];
    /** All errors across stages */
    errors: ValidationError[];
    /** All warnings across stages */
    warnings: ValidationError[];
    /** Total duration in milliseconds */
    totalDurationMs: number;
    /** Map of field paths to their errors */
    fieldErrors: Record<string, ValidationError[]>;
}
/**
 * Backend validation request
 */
export interface ValidationRequest {
    /** Resource type being validated */
    resourceType: string;
    /** Resource ID if editing existing */
    resourceId?: string;
    /** Form data to validate */
    data: Record<string, unknown>;
    /** Stages to run */
    stages: ValidationStageName[];
    /** Optional router context */
    routerId?: string;
}
/**
 * Backend validation response
 */
export interface ValidationResponse {
    /** Stage results from backend */
    stages: ValidationStageResult[];
    /** Whether all stages passed */
    isValid: boolean;
}
//# sourceMappingURL=types.d.ts.map