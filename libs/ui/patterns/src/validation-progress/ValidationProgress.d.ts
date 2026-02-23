/**
 * ValidationProgress Component
 *
 * Displays the 7-stage validation pipeline with status indicators.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */
import * as React from 'react';
import type { ValidationStageName, ValidationStageResult } from './types';
export interface ValidationProgressProps {
    /** Current stage results */
    stages?: ValidationStageResult[];
    /** Which stages to show (defaults to all 7) */
    visibleStages?: ValidationStageName[];
    /** Index of the currently running stage (0-based) */
    currentStage?: number;
    /** Whether validation is complete */
    isComplete?: boolean;
    /** Whether validation passed overall */
    isValid?: boolean;
    /** Total time taken (ms) */
    totalDurationMs?: number;
    /** Whether to auto-expand failed stages */
    autoExpandFailed?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Compact mode (less padding) */
    compact?: boolean;
}
/**
 * Validation pipeline progress display component.
 * Shows all 7 stages with their status and expandable details.
 *
 * @example
 * ```tsx
 * <ValidationProgress
 *   stages={validationResult.stages}
 *   currentStage={2}
 *   isComplete={false}
 *   autoExpandFailed
 * />
 * ```
 */
export declare const ValidationProgress: React.NamedExoticComponent<ValidationProgressProps>;
/**
 * Hook to manage validation progress state.
 */
export declare function useValidationProgress(): {
    stages: ValidationStageResult[];
    currentStageIndex: number;
    isComplete: boolean;
    isValid: boolean | undefined;
    totalDurationMs: number | undefined;
    reset: () => void;
    startStage: (stage: ValidationStageName) => void;
    completeStage: (result: ValidationStageResult) => void;
    finish: (valid: boolean, durationMs?: number) => void;
};
//# sourceMappingURL=ValidationProgress.d.ts.map