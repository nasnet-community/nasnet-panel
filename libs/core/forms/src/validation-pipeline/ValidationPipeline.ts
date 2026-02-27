/**
 * Validation Pipeline
 *
 * Orchestrates the 7-stage validation pipeline, integrating
 * with backend validation and mapping errors to form fields.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */

import { RISK_LEVEL_STAGES, VALIDATION_STAGES } from './types';

import type {
  ValidationStageName,
  ValidationStageResult,
  ValidationPipelineConfig,
  ValidationPipelineResult,
  ValidationError,
  ValidationRequest,
  ValidationResponse,
} from './types';

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
export class ValidationPipeline {
  /** Options including validation function and callbacks */
  private options: ValidationPipelineOptions;
  /** Configuration including risk level and stage selection */
  private config: ValidationPipelineConfig;
  /** Results from each validation stage */
  private results: Map<ValidationStageName, ValidationStageResult> = new Map();
  /** Whether the pipeline has been aborted */
  private aborted = false;

  /**
   * Creates a new validation pipeline
   *
   * @param {ValidationPipelineOptions} options - Options including validation function and callbacks
   * @param {ValidationPipelineConfig} config - Configuration for stage selection and error handling
   */
  constructor(options: ValidationPipelineOptions, config: ValidationPipelineConfig) {
    this.options = options;
    this.config = config;
  }

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
  async validate(
    resourceType: string,
    data: Record<string, unknown>,
    resourceId?: string,
    routerId?: string
  ): Promise<ValidationPipelineResult> {
    const startTime = performance.now();
    this.results.clear();
    this.aborted = false;

    // Determine which stages to run based on risk level
    const stagesToRun = this.getStagesToRun();
    const totalStages = stagesToRun.length;

    // Initialize all stages as pending
    for (const stage of VALIDATION_STAGES) {
      this.results.set(stage, {
        stage,
        status: stagesToRun.includes(stage) ? 'pending' : 'skipped',
        errors: [],
        warnings: [],
      });
    }

    // Run local schema validation first
    const schemaResult = await this.runSchemaValidation(data);
    this.results.set('schema', schemaResult);
    this.options.onStageComplete?.(schemaResult);
    this.options.onProgress?.(1, totalStages);

    // If schema validation failed and stopOnError, don't continue
    if (schemaResult.status === 'failed' && this.config.stopOnError) {
      return this.buildResult(startTime);
    }

    // Call backend for remaining stages
    const remainingStages = stagesToRun.filter((s) => s !== 'schema');
    if (remainingStages.length > 0 && !this.aborted) {
      await this.runBackendValidation(
        resourceType,
        data,
        remainingStages,
        resourceId,
        routerId,
        totalStages
      );
    }

    return this.buildResult(startTime);
  }

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
  abort(): void {
    this.aborted = true;
  }

  /**
   * Determines which validation stages to run based on risk level and configuration
   *
   * @private
   * @returns {ValidationStageName[]} Array of stage names to execute in order
   */
  private getStagesToRun(): ValidationStageName[] {
    let stages = [...RISK_LEVEL_STAGES[this.config.riskLevel]];

    // Remove dry-run if not included
    if (!this.config.includeDryRun) {
      stages = stages.filter((s) => s !== 'dry-run');
    }

    // Remove skipped stages
    if (this.config.skipStages) {
      stages = stages.filter((s) => !this.config.skipStages!.includes(s));
    }

    return stages;
  }

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
  private async runSchemaValidation(data: Record<string, unknown>): Promise<ValidationStageResult> {
    const startTime = performance.now();
    this.options.onStageStart?.('schema');

    // This is a placeholder - actual schema validation would use Zod
    // In real implementation, the schema would be passed in
    const result: ValidationStageResult = {
      stage: 'schema',
      status: 'passed',
      errors: [],
      warnings: [],
      durationMs: performance.now() - startTime,
    };

    return result;
  }

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
  private async runBackendValidation(
    resourceType: string,
    data: Record<string, unknown>,
    stages: ValidationStageName[],
    resourceId?: string,
    routerId?: string,
    totalStages?: number
  ): Promise<void> {
    // Mark stages as running
    for (const stage of stages) {
      this.options.onStageStart?.(stage);
      const currentResult = this.results.get(stage)!;
      currentResult.status = 'running';
    }

    try {
      const response = await this.options.validateFn({
        resourceType,
        resourceId,
        data,
        stages,
        routerId,
      });

      // Process each stage result
      let completedCount = 1; // schema already done
      for (const stageResult of response.stages) {
        if (this.aborted) break;

        this.results.set(stageResult.stage, stageResult);
        this.options.onStageComplete?.(stageResult);
        completedCount++;
        this.options.onProgress?.(completedCount, totalStages ?? stages.length);

        // Stop on error if configured
        if (stageResult.status === 'failed' && this.config.stopOnError) {
          // Mark remaining stages as skipped
          for (const stage of stages) {
            const result = this.results.get(stage);
            if (result && result.status === 'running') {
              result.status = 'skipped';
            }
          }
          break;
        }
      }
    } catch (error) {
      // Mark all running stages as failed
      for (const stage of stages) {
        const result = this.results.get(stage);
        if (result && result.status === 'running') {
          result.status = 'failed';
          result.errors.push({
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Validation service unavailable',
            severity: 'error',
            stage,
          });
          this.options.onStageComplete?.(result);
        }
      }
    }
  }

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
  private buildResult(startTime: number): ValidationPipelineResult {
    const stages = Array.from(this.results.values());
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const fieldErrors: Record<string, ValidationError[]> = {};

    let isValid = true;

    for (const stage of stages) {
      if (stage.status === 'failed') {
        isValid = false;
      }

      for (const error of stage.errors) {
        errors.push(error);
        if (error.fieldPath) {
          if (!fieldErrors[error.fieldPath]) {
            fieldErrors[error.fieldPath] = [];
          }
          fieldErrors[error.fieldPath].push(error);
        }
      }

      for (const warning of stage.warnings) {
        warnings.push(warning);
        if (warning.fieldPath) {
          if (!fieldErrors[warning.fieldPath]) {
            fieldErrors[warning.fieldPath] = [];
          }
          fieldErrors[warning.fieldPath].push(warning);
        }
      }
    }

    return {
      isValid,
      stages,
      errors,
      warnings,
      totalDurationMs: performance.now() - startTime,
      fieldErrors,
    };
  }
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
export function mapToFormErrors(
  fieldErrors: Record<string, ValidationError[]>
): Record<string, { type: string; message: string }> {
  const formErrors: Record<string, { type: string; message: string }> = {};

  for (const [fieldPath, errors] of Object.entries(fieldErrors)) {
    // Take the first error for each field
    const error = errors[0];
    if (error) {
      formErrors[fieldPath] = {
        type: error.code,
        message: error.message,
      };
    }
  }

  return formErrors;
}

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
export function createValidationPipeline(
  validateFn: ValidationPipelineOptions['validateFn'],
  config: ValidationPipelineConfig,
  callbacks?: Omit<ValidationPipelineOptions, 'validateFn'>
): ValidationPipeline {
  return new ValidationPipeline(
    {
      validateFn,
      ...callbacks,
    },
    config
  );
}
