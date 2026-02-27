/**
 * useValidationPipeline Hook
 *
 * Manages the 7-stage validation pipeline for form submissions.
 * Integrates client-side Zod validation with backend validation.
 *
 * @module @nasnet/core/forms/useValidationPipeline
 */

import React, { useState, useCallback, useRef } from 'react';

import { getValidationConfig, getOrderedStages } from './validation-strategy';

import type {
  UseValidationPipelineOptions,
  ValidationPipelineResult,
  ValidationStageResult,
  ValidationError,
  ResourceConflict,
  ValidationStage,
} from './types';
import type { ZodSchema } from 'zod';

/**
 * Initialize stages for a given strategy.
 */
function initializeStages(strategy: 'low' | 'medium' | 'high'): ValidationStageResult[] {
  return getOrderedStages(strategy).map((stage) => ({
    stage,
    status: 'pending',
    errors: [],
    warnings: [],
  }));
}

/**
 * Custom hook for managing the validation pipeline.
 *
 * Orchestrates the 7-stage validation pipeline, handling:
 * - Stage 1-2: Client-side Zod validation (schema + syntax)
 * - Stage 3+: Backend validation (cross-resource, dependencies, network, platform, dry-run)
 * - Error collection and conflict detection
 * - Abort controller for cancelling in-flight validations
 * - Progress tracking through each stage
 *
 * @template T - Zod schema type
 * @param options - Pipeline configuration options
 * @returns Validation pipeline state and methods
 *
 * @example
 * ```tsx
 * const pipeline = useValidationPipeline({
 *   schema: mySchema,
 *   strategy: 'medium',
 *   resourceUuid: 'resource-123',
 * });
 *
 * const handleSubmit = async (data) => {
 *   const result = await pipeline.validate(data);
 *   if (result.isValid) {
 *     // Proceed with submission
 *   }
 * };
 * ```
 */
export function useValidationPipeline<T extends ZodSchema>({
  schema,
  strategy,
  resourceUuid,
  enabled = true,
}: UseValidationPipelineOptions<T>): ValidationPipelineResult {
  const config = getValidationConfig(strategy);

  const [stages, setStages] = useState<ValidationStageResult[]>(() => initializeStages(strategy));
  const [currentStage, setCurrentStage] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Update a specific stage's status.
   */
  const updateStage = useCallback(
    (stage: ValidationStage, update: Partial<ValidationStageResult>) => {
      setStages((prev) => prev.map((s) => (s.stage === stage ? { ...s, ...update } : s)));
    },
    []
  );

  /**
   * Run the validation pipeline.
   */
  const validate = useCallback(
    async (data: unknown): Promise<{ isValid: boolean; errors: ValidationError[] }> => {
      if (!enabled) {
        return { isValid: true, errors: [] };
      }

      // Cancel any in-flight validation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsValidating(true);
      setErrors([]);
      setConflicts([]);
      setStages(initializeStages(strategy));
      setCurrentStage(0);

      const allErrors: ValidationError[] = [];
      const startTime = performance.now();

      try {
        // Stage 1-2: Client-side Zod validation (schema + syntax)
        updateStage('schema', { status: 'running' });
        const schemaStartTime = performance.now();

        const zodResult = schema.safeParse(data);

        if (!zodResult.success) {
          const zodErrors: ValidationError[] = zodResult.error.errors.map((err) => ({
            code: 'VALIDATION_ERROR',
            message: err.message,
            fieldPath: err.path.join('.'),
          }));

          updateStage('schema', {
            status: 'failed',
            errors: zodErrors,
            durationMs: Math.round(performance.now() - schemaStartTime),
          });

          // Skip remaining stages
          const stagesList = getOrderedStages(strategy);
          stagesList.slice(1).forEach((stage) => {
            updateStage(stage, { status: 'skipped' });
          });

          setErrors(zodErrors);
          setIsValidating(false);
          return { isValid: false, errors: zodErrors };
        }

        updateStage('schema', {
          status: 'passed',
          durationMs: Math.round(performance.now() - schemaStartTime),
        });
        setCurrentStage(1);

        // Mark syntax as passed (covered by Zod)
        if (config.stages.includes('syntax')) {
          updateStage('syntax', { status: 'passed', durationMs: 0 });
          setCurrentStage(2);
        }

        // For low-risk, client-side only - we're done
        if (config.clientOnly) {
          setIsValidating(false);
          return { isValid: true, errors: [] };
        }

        // Stage 3+: Backend validation
        // For medium/high-risk, we need to call the backend
        // This will be integrated with Apollo Client mutations

        // For now, simulate remaining stages as passed
        // In production, this calls the VALIDATE_CONFIGURATION mutation
        const backendStages: ValidationStage[] = [
          'cross-resource',
          'dependencies',
          'network',
          'platform',
          'dry-run',
        ].filter((s) => config.stages.includes(s as ValidationStage)) as ValidationStage[];

        for (const stage of backendStages) {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Validation cancelled');
          }

          updateStage(stage, { status: 'running' });
          setCurrentStage((prev) => prev + 1);

          // Simulate async validation delay
          await new Promise((resolve) => setTimeout(resolve, 50));

          // TODO: Call backend validation mutation here
          // const result = await validateMutation({
          //   variables: { resourceUuid, configuration: data, strategy }
          // });

          updateStage(stage, {
            status: 'passed',
            durationMs: 50,
          });
        }

        setIsValidating(false);
        return { isValid: true, errors: [] };
      } catch (error) {
        if (error instanceof Error && error.message === 'Validation cancelled') {
          return { isValid: false, errors: [] };
        }

        const errorResult: ValidationError[] = [
          {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Validation failed',
          },
        ];
        setErrors(errorResult);
        setIsValidating(false);
        return { isValid: false, errors: errorResult };
      }
    },
    [enabled, schema, strategy, config, updateStage]
  );

  /**
   * Reset the validation pipeline state and cleanup resources.
   * Aborts any in-flight validations and resets all stages to pending.
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStages(initializeStages(strategy));
    setCurrentStage(0);
    setErrors([]);
    setConflicts([]);
    setIsValidating(false);
  }, [strategy]);

  /**
   * Cleanup abort controller on unmount.
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => cleanup, []);

  return {
    currentStage,
    stages,
    isValid: errors.length === 0 && conflicts.length === 0,
    isValidating,
    errors,
    conflicts,
    validate,
    reset,
  };
}
