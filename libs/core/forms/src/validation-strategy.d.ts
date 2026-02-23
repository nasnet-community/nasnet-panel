/**
 * Risk-Based Validation Strategy Configuration
 *
 * Defines validation behavior based on operation risk level.
 * Higher risk operations require more validation stages.
 *
 * @module @nasnet/core/forms/validation-strategy
 */
import type { ValidationStrategy, ValidationConfig, ValidationStage } from './types';
/**
 * Configuration for each validation strategy.
 *
 * Maps validation strategy levels to their respective configurations,
 * including validation stages, confirmation requirements, and risk profiles.
 *
 * @example
 * const config = VALIDATION_CONFIGS.high;
 * // Returns full validation pipeline with dry-run for WAN changes
 */
export declare const VALIDATION_CONFIGS: Record<ValidationStrategy, ValidationConfig>;
/**
 * Human-readable stage names for UI display.
 */
export declare const STAGE_LABELS: Record<ValidationStage, string>;
/**
 * Stage descriptions for help text.
 */
export declare const STAGE_DESCRIPTIONS: Record<ValidationStage, string>;
/**
 * Get the validation config for a given strategy.
 */
export declare function getValidationConfig(strategy: ValidationStrategy): ValidationConfig;
/**
 * Check if a stage should run for a given strategy.
 */
export declare function shouldRunStage(strategy: ValidationStrategy, stage: ValidationStage): boolean;
/**
 * Get ordered stages for a strategy.
 */
export declare function getOrderedStages(strategy: ValidationStrategy): ValidationStage[];
//# sourceMappingURL=validation-strategy.d.ts.map