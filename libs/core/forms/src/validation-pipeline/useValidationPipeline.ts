/**
 * useValidationPipeline Hook
 *
 * React hook for running the 7-stage validation pipeline
 * and integrating with React Hook Form.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */

import * as React from 'react';

import type { FieldValues, UseFormSetError, Path } from 'react-hook-form';

import type {
  ValidationStageName,
  ValidationStageResult,
  ValidationPipelineConfig,
  ValidationPipelineResult,
  ValidationRequest,
  ValidationResponse,
  RiskLevel,
} from './types';
import { ValidationPipeline, mapToFormErrors } from './ValidationPipeline';

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

const initialState: ValidationPipelineState = {
  isValidating: false,
  currentStage: null,
  stageResults: [],
  result: null,
  progress: 0,
  error: null,
};

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
export function useValidationPipeline<TFieldValues extends FieldValues = FieldValues>(
  options: UseValidationPipelineOptions<TFieldValues>
): UseValidationPipelineReturn {
  const {
    validateFn,
    resourceType,
    resourceId,
    routerId,
    riskLevel = 'medium',
    stopOnError = false,
    skipStages,
    includeDryRun = false,
    setError,
    onComplete,
    onStageComplete,
  } = options;

  const [state, setState] = React.useState<ValidationPipelineState>(initialState);
  const pipelineRef = React.useRef<ValidationPipeline | null>(null);

  // Build pipeline config
  const config = React.useMemo<ValidationPipelineConfig>(() => ({
    riskLevel,
    stopOnError,
    skipStages,
    includeDryRun,
  }), [riskLevel, stopOnError, skipStages, includeDryRun]);

  /**
   * Validate the given data through the pipeline
   */
  const validate = React.useCallback(
    async (data: Record<string, unknown>): Promise<ValidationPipelineResult> => {
      setState({
        ...initialState,
        isValidating: true,
      });

      const pipeline = new ValidationPipeline(
        {
          validateFn,
          onStageStart: (stage) => {
            setState((prev) => ({
              ...prev,
              currentStage: stage,
            }));
          },
          onStageComplete: (result) => {
            setState((prev) => ({
              ...prev,
              stageResults: [...prev.stageResults, result],
            }));
            onStageComplete?.(result);
          },
          onProgress: (current, total) => {
            setState((prev) => ({
              ...prev,
              progress: Math.round((current / total) * 100),
            }));
          },
        },
        config
      );

      pipelineRef.current = pipeline;

      try {
        const result = await pipeline.validate(
          resourceType,
          data,
          resourceId,
          routerId
        );

        // Map errors to form fields if setError is provided
        if (setError && result.fieldErrors) {
          const formErrors = mapToFormErrors(result.fieldErrors);
          for (const [fieldPath, error] of Object.entries(formErrors)) {
            setError(fieldPath as Path<TFieldValues>, error);
          }
        }

        setState((prev) => ({
          ...prev,
          isValidating: false,
          currentStage: null,
          result,
          progress: 100,
        }));

        onComplete?.(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isValidating: false,
          currentStage: null,
          error: errorObj,
        }));
        throw errorObj;
      }
    },
    [validateFn, config, resourceType, resourceId, routerId, setError, onComplete, onStageComplete]
  );

  /**
   * Abort running validation
   */
  const abort = React.useCallback(() => {
    pipelineRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isValidating: false,
      currentStage: null,
    }));
  }, []);

  /**
   * Reset the pipeline state
   */
  const reset = React.useCallback(() => {
    setState(initialState);
  }, []);

  // Computed values
  const hasErrors = (state.result?.errors.length ?? 0) > 0;
  const hasWarnings = (state.result?.warnings.length ?? 0) > 0;
  const errorCount = state.result?.errors.length ?? 0;
  const warningCount = state.result?.warnings.length ?? 0;

  return {
    state,
    validate,
    abort,
    reset,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
  };
}
