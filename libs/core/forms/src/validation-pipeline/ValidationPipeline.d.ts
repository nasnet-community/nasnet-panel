/**
 * Validation Pipeline
 *
 * Orchestrates the 7-stage validation pipeline, integrating
 * with backend validation and mapping errors to form fields.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */
import type { ValidationStageName, ValidationStageResult, ValidationPipelineConfig, ValidationPipelineResult, ValidationError, ValidationRequest, ValidationResponse } from './types';
/**
 * Options for creating a validation pipeline
 *
 * @interface ValidationPipelineOptions
 * @property {function} validateFn - Function to call the backend validation API
 * @property {function} onStageStart - Optional callback when a validation stage starts
 * @property {function} onStageComplete - Optional callback when a validation stage completes
 * @property {function} onProgress - Optional callback for progress updates (current, total)
 *
 * @example
 * ```ts
 * const options: ValidationPipelineOptions = {
 *   validateFn: async (req) => await api.validate(req),
 *   onStageStart: (stage) => console.log(`Stage ${stage} started`),
 *   onStageComplete: (result) => console.log(`Stage ${result.stage} result:`, result),
 *   onProgress: (current, total) => console.log(`Progress: ${current}/${total}`),
 * };
 * ```
 */
export interface ValidationPipelineOptions {
    /** Function to call the backend validation API */
    validateFn: (request: ValidationRequest) => Promise<ValidationResponse>;
    /** Callback when a stage starts */
    onStageStart?: (stage: ValidationStageName) => void;
    /** Callback when a stage completes */
    onStageComplete?: (result: ValidationStageResult) => void;
    /** Callback for progress updates */
    onProgress?: (current: number, total: number) => void;
}
/**
 * Orchestrates a 7-stage validation pipeline for configuration data
 *
 * The pipeline runs validation stages (schema, syntax, cross-resource, dependencies,
 * network, platform, dry-run) and collects errors/warnings from each stage. It integrates
 * with backend validation and supports callback notifications for progress tracking.
 *
 * @class ValidationPipeline
 * @property {ValidationPipelineOptions} options - Options including callbacks and validation function
 * @property {ValidationPipelineConfig} config - Configuration including risk level and stage selection
 * @property {Map<ValidationStageName, ValidationStageResult>} results - Results from each validation stage
 * @property {boolean} aborted - Whether the pipeline has been aborted
 *
 * @example
 * ```ts
 * const pipeline = new ValidationPipeline(
 *   {
 *     validateFn: async (req) => await api.validate(req),
 *     onProgress: (current, total) => updateProgressBar(current, total),
 *   },
 *   { riskLevel: 'high', stopOnError: false }
 * );
 *
 * const result = await pipeline.validate('wireguard-peer', formData, peerId, routerId);
 * if (!result.isValid) {
 *   const formErrors = mapToFormErrors(result.fieldErrors);
 *   form.setError(formErrors);
 * }
 * ```
 */
export declare class ValidationPipeline {
    /** Options including validation function and callbacks */
    private options;
    /** Configuration including risk level and stage selection */
    private config;
    /** Results from each validation stage */
    private results;
    /** Whether the pipeline has been aborted */
    private aborted;
    /**
     * Creates a new validation pipeline
     *
     * @param {ValidationPipelineOptions} options - Options including validation function and callbacks
     * @param {ValidationPipelineConfig} config - Configuration for stage selection and error handling
     */
    constructor(options: ValidationPipelineOptions, config: ValidationPipelineConfig);
    /**
     * Runs the validation pipeline for the given data
     *
     * Executes schema validation first (local), then calls backend for remaining stages based on risk level.
     * Supports abort, progress callbacks, and selective stage execution.
     *
     * @param {string} resourceType - Type of resource being validated (e.g., 'wireguard-peer', 'interface')
     * @param {Record<string, unknown>} data - Form data to validate
     * @param {string} [resourceId] - ID of existing resource being edited (for updates)
     * @param {string} [routerId] - ID of the router context for validation
     * @returns {Promise<ValidationPipelineResult>} Complete validation results with all stage results and field errors
     *
     * @example
     * ```ts
     * const result = await pipeline.validate(
     *   'wireguard-peer',
     *   { publicKey: '...', endpoint: '...' },
     *   'peer-123',
     *   'router-456'
     * );
     * console.log(`Valid: ${result.isValid}, Errors: ${result.errors.length}`);
     * ```
     */
    validate(resourceType: string, data: Record<string, unknown>, resourceId?: string, routerId?: string): Promise<ValidationPipelineResult>;
    /**
     * Aborts the running pipeline
     *
     * Stops pipeline execution at the next stage check. Running stages will be marked as skipped.
     *
     * @example
     * ```ts
     * const abortController = new AbortController();
     * setTimeout(() => pipeline.abort(), 5000); // Abort after 5 seconds
     * ```
     */
    abort(): void;
    /**
     * Determines which validation stages to run based on risk level and configuration
     *
     * @private
     * @returns {ValidationStageName[]} Array of stage names to execute in order
     */
    private getStagesToRun;
    /**
     * Runs local Zod schema validation (stage 1)
     *
     * Executes the schema validation stage which checks form data against Zod schema.
     * This is a placeholder - actual schema would be passed in at runtime.
     *
     * @private
     * @param {Record<string, unknown>} data - Form data to validate
     * @returns {Promise<ValidationStageResult>} Schema validation stage result
     */
    private runSchemaValidation;
    /**
     * Runs backend validation for the specified stages
     *
     * Calls the backend validation API with the data and requested stages.
     * Handles stage result processing, progress updates, and error collection.
     * Supports early termination on error if configured.
     *
     * @private
     * @param {string} resourceType - Type of resource being validated
     * @param {Record<string, unknown>} data - Form data to validate
     * @param {ValidationStageName[]} stages - Stages to run on backend
     * @param {string} [resourceId] - ID of existing resource
     * @param {string} [routerId] - Router context ID
     * @param {number} [totalStages] - Total stages for progress calculation
     * @returns {Promise<void>}
     */
    private runBackendValidation;
    /**
     * Aggregates all stage results into a single pipeline result
     *
     * Collects all errors and warnings from all stages, groups field-specific errors,
     * and determines overall validation status.
     *
     * @private
     * @param {number} startTime - Start time from performance.now() for duration calculation
     * @returns {ValidationPipelineResult} Aggregated validation pipeline result
     */
    private buildResult;
}
/**
 * Maps backend validation errors to React Hook Form error format
 *
 * Transforms pipeline field errors into the format expected by React Hook Form's
 * `form.setError()` method. Takes the first error per field (primary error).
 *
 * @param {Record<string, ValidationError[]>} fieldErrors - Map of field paths to error arrays
 * @returns {Record<string, {type: string; message: string}>} Object in React Hook Form error format
 *
 * @example
 * ```ts
 * const result = await pipeline.validate('wireguard-peer', formData);
 * const formErrors = mapToFormErrors(result.fieldErrors);
 * // Returns: { publicKey: { type: 'E001', message: 'Invalid key format' } }
 * form.setError(formErrors);
 * ```
 */
export declare function mapToFormErrors(fieldErrors: Record<string, ValidationError[]>): Record<string, {
    type: string;
    message: string;
}>;
/**
 * Creates a validation pipeline with sensible defaults
 *
 * Factory function that simplifies pipeline creation by combining the validation
 * function with optional callbacks and configuration.
 *
 * @param {function} validateFn - Backend validation API function
 * @param {ValidationPipelineConfig} config - Pipeline configuration (risk level, etc.)
 * @param {Omit<ValidationPipelineOptions, 'validateFn'>} [callbacks] - Optional lifecycle callbacks
 * @returns {ValidationPipeline} Configured and ready-to-use validation pipeline
 *
 * @example
 * ```ts
 * const pipeline = createValidationPipeline(
 *   async (req) => await api.validate(req),
 *   { riskLevel: 'high', stopOnError: true },
 *   {
 *     onProgress: (current, total) => setProgress(current / total),
 *     onStageComplete: (result) => console.log(`${result.stage}: ${result.status}`),
 *   }
 * );
 *
 * const result = await pipeline.validate('interface', formData);
 * ```
 */
export declare function createValidationPipeline(validateFn: ValidationPipelineOptions['validateFn'], config: ValidationPipelineConfig, callbacks?: Omit<ValidationPipelineOptions, 'validateFn'>): ValidationPipeline;
//# sourceMappingURL=ValidationPipeline.d.ts.map