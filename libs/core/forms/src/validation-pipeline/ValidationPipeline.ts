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
 * Creates and runs a validation pipeline
 */
export class ValidationPipeline {
  private options: ValidationPipelineOptions;
  private config: ValidationPipelineConfig;
  private results: Map<ValidationStageName, ValidationStageResult> = new Map();
  private aborted = false;

  constructor(
    options: ValidationPipelineOptions,
    config: ValidationPipelineConfig
  ) {
    this.options = options;
    this.config = config;
  }

  /**
   * Runs the validation pipeline for the given data
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
   */
  abort(): void {
    this.aborted = true;
  }

  /**
   * Gets the stages to run based on configuration
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
   * Runs local Zod schema validation
   */
  private async runSchemaValidation(
    data: Record<string, unknown>
  ): Promise<ValidationStageResult> {
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
            message:
              error instanceof Error
                ? error.message
                : 'Validation service unavailable',
            severity: 'error',
            stage,
          });
          this.options.onStageComplete?.(result);
        }
      }
    }
  }

  /**
   * Builds the final validation result
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
 * Maps backend validation errors to React Hook Form errors
 *
 * @example
 * ```ts
 * const result = await pipeline.validate('wireguard-peer', formData);
 * const formErrors = mapToFormErrors(result.fieldErrors);
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
 * Creates a validation pipeline with default options
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
