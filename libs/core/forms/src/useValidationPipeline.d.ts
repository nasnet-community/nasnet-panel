/**
 * useValidationPipeline Hook
 *
 * Manages the 7-stage validation pipeline for form submissions.
 * Integrates client-side Zod validation with backend validation.
 *
 * @module @nasnet/core/forms/useValidationPipeline
 */
import type { UseValidationPipelineOptions, ValidationPipelineResult } from './types';
import type { ZodSchema } from 'zod';
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
export declare function useValidationPipeline<T extends ZodSchema>({ schema, strategy, resourceUuid, enabled, }: UseValidationPipelineOptions<T>): ValidationPipelineResult;
//# sourceMappingURL=useValidationPipeline.d.ts.map