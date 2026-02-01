/**
 * Validation Pipeline
 *
 * 7-stage validation pipeline for integrating with backend validation.
 *
 * @module @nasnet/core/forms/validation-pipeline
 */

export type {
  ValidationStageName,
  ValidationStageStatus,
  ValidationError,
  ValidationStageResult,
  RiskLevel,
  ValidationPipelineConfig,
  ValidationPipelineResult,
  ValidationRequest,
  ValidationResponse,
} from './types';
export { VALIDATION_STAGES, RISK_LEVEL_STAGES } from './types';
export {
  ValidationPipeline,
  mapToFormErrors,
  createValidationPipeline,
  type ValidationPipelineOptions,
} from './ValidationPipeline';
export {
  useValidationPipeline,
  type ValidationPipelineState,
  type UseValidationPipelineOptions,
  type UseValidationPipelineReturn,
} from './useValidationPipeline';
