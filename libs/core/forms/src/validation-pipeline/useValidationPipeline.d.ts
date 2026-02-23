/**
 * useValidationPipeline Hook
 *
 * React hook for running the 7-stage validation pipeline
 * and integrating with React Hook Form.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */
import type { ValidationStageName, ValidationStageResult, ValidationPipelineResult, ValidationRequest, ValidationResponse, RiskLevel } from './types';
import type { FieldValues, UseFormSetError } from 'react-hook-form';
/**
 * State of the validation pipeline
 */
export interface ValidationPipelineState {
    /** Whether validation is currently running */
    isValidating: boolean;
    /** Current stage being validated */
    currentStage: ValidationStageName | null;
    /** Results from all completed stages */
    stageResults: ValidationStageResult[];
    /** Final validation result */
    result: ValidationPipelineResult | null;
    /** Progress (0-100) */
    progress: number;
    /** Any error that occurred during validation */
    error: Error | null;
}
/**
 * Options for the useValidationPipeline hook
 */
export interface UseValidationPipelineOptions<TFieldValues extends FieldValues = FieldValues> {
    /** Function to call the backend validation API */
    validateFn: (request: ValidationRequest) => Promise<ValidationResponse>;
    /** Resource type being validated */
    resourceType: string;
    /** Resource ID if editing existing resource */
    resourceId?: string;
    /** Router ID for context */
    routerId?: string;
    /** Risk level of the operation */
    riskLevel?: RiskLevel;
    /** Whether to stop on first error */
    stopOnError?: boolean;
    /** Stages to skip */
    skipStages?: ValidationStageName[];
    /** Whether to include dry-run stage */
    includeDryRun?: boolean;
    /** React Hook Form setError function for mapping errors to fields */
    setError?: UseFormSetError<TFieldValues>;
    /** Callback when validation completes */
    onComplete?: (result: ValidationPipelineResult) => void;
    /** Callback when a stage completes */
    onStageComplete?: (result: ValidationStageResult) => void;
}
/**
 * Return type for useValidationPipeline
 */
export interface UseValidationPipelineReturn {
    /** Current state of the pipeline */
    state: ValidationPipelineState;
    /** Run validation on the given data */
    validate: (data: Record<string, unknown>) => Promise<ValidationPipelineResult>;
    /** Abort running validation */
    abort: () => void;
    /** Reset the pipeline state */
    reset: () => void;
    /** Whether any errors were found */
    hasErrors: boolean;
    /** Whether any warnings were found */
    hasWarnings: boolean;
    /** Total error count */
    errorCount: number;
    /** Total warning count */
    warningCount: number;
}
/**
 * Hook for running the 7-stage validation pipeline
 *
 * @example
 * ```tsx
 * const { state, validate, hasErrors } = useValidationPipeline({
 *   validateFn: api.validate,
 *   resourceType: 'wireguard-peer',
 *   riskLevel: 'high',
 *   setError: form.setError,
 * });
 *
 * const onSubmit = async (data) => {
 *   const result = await validate(data);
 *   if (result.isValid) {
 *     await api.save(data);
 *   }
 * };
 * ```
 */
export declare function useValidationPipeline<TFieldValues extends FieldValues = FieldValues>(options: UseValidationPipelineOptions<TFieldValues>): UseValidationPipelineReturn;
//# sourceMappingURL=useValidationPipeline.d.ts.map