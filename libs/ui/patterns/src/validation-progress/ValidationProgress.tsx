/**
 * ValidationProgress Component
 *
 * Displays the 7-stage validation pipeline with status indicators.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */


import * as React from 'react';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { ValidationStage } from './ValidationStage';

import type {
  ValidationStageName,
  ValidationStageResult,
  ValidationStageStatus,
} from './types';

/**
 * Default order of validation stages.
 */
const STAGE_ORDER: ValidationStageName[] = [
  'schema',
  'syntax',
  'cross-resource',
  'dependencies',
  'network',
  'platform',
  'dry-run',
];

/**
 * Create initial stage results with pending status.
 */
function createInitialStages(stages: ValidationStageName[]): ValidationStageResult[] {
  return stages.map((stage) => ({
    stage,
    status: 'pending' as ValidationStageStatus,
    errors: [],
    warnings: [],
  }));
}

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
export function ValidationProgress({
  stages: providedStages,
  visibleStages = STAGE_ORDER,
  currentStage,
  isComplete = false,
  isValid,
  totalDurationMs,
  autoExpandFailed = true,
  className,
  compact = false,
}: ValidationProgressProps) {
  // Track which stages are expanded
  const [expandedStages, setExpandedStages] = React.useState<Set<ValidationStageName>>(new Set());

  // Merge provided stages with defaults
  const stages = React.useMemo(() => {
    const defaults = createInitialStages(visibleStages);
    if (!providedStages) return defaults;

    return defaults.map((defaultStage) => {
      const provided = providedStages.find((s) => s.stage === defaultStage.stage);
      return provided || defaultStage;
    });
  }, [providedStages, visibleStages]);

  // Auto-expand failed stages
  React.useEffect(() => {
    if (autoExpandFailed) {
      const failedStages = stages
        .filter((s) => s.status === 'failed')
        .map((s) => s.stage);
      if (failedStages.length > 0) {
        setExpandedStages((prev) => {
          const newSet = new Set(prev);
          failedStages.forEach((stage) => newSet.add(stage));
          return newSet;
        });
      }
    }
  }, [stages, autoExpandFailed]);

  // Calculate summary stats
  const summary = React.useMemo(() => {
    const passed = stages.filter((s) => s.status === 'passed').length;
    const failed = stages.filter((s) => s.status === 'failed').length;
    const running = stages.filter((s) => s.status === 'running').length;
    const pending = stages.filter((s) => s.status === 'pending').length;
    const skipped = stages.filter((s) => s.status === 'skipped').length;
    const totalErrors = stages.reduce((sum, s) => sum + s.errors.length, 0);
    const totalWarnings = stages.reduce((sum, s) => sum + s.warnings.length, 0);

    return { passed, failed, running, pending, skipped, totalErrors, totalWarnings };
  }, [stages]);

  const toggleStage = (stage: ValidationStageName) => {
    setExpandedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isComplete && isValid && `Validation passed. ${summary.passed} of ${stages.length} stages passed.`}
        {isComplete && !isValid && `Validation failed. ${summary.failed} error${summary.failed !== 1 ? 's' : ''} found.`}
        {!isComplete && summary.running > 0 && `Validating stage ${summary.passed + summary.running} of ${stages.length}.`}
      </div>

      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        )}
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          {isComplete ? (
            isValid ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium text-sm text-success">
                  Validation Passed
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-error" />
                <span className="font-medium text-sm text-error">
                  Validation Failed
                </span>
              </>
            )
          ) : summary.running > 0 ? (
            <>
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="font-medium text-sm text-primary">
                Validating...
              </span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm text-muted-foreground">
                Ready to validate
              </span>
            </>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {summary.passed > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {summary.passed}
            </span>
          )}
          {summary.failed > 0 && (
            <span className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-error" />
              {summary.failed}
            </span>
          )}
          {totalDurationMs !== undefined && isComplete && (
            <span>{totalDurationMs}ms</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 bg-muted rounded-full overflow-hidden mx-3"
        role="progressbar"
        aria-label="Validation progress"
        aria-valuemin={0}
        aria-valuemax={stages.length}
        aria-valuenow={summary.passed + summary.failed + summary.skipped}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            summary.failed > 0 ? 'bg-error' :
            isComplete ? 'bg-success' :
            'bg-primary'
          )}
          initial={{ width: 0 }}
          animate={{
            width: `${((summary.passed + summary.failed + summary.skipped) / stages.length) * 100}%`,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Stages list */}
      <div className={cn('space-y-0', compact ? 'pt-1' : 'pt-2')}>
        {stages.map((result, index) => (
          <ValidationStage
            key={result.stage}
            result={result}
            isExpanded={expandedStages.has(result.stage)}
            onToggle={() => toggleStage(result.stage)}
            showConnector={index < stages.length - 1}
            index={index}
          />
        ))}
      </div>

      {/* Summary footer */}
      {isComplete && (summary.totalErrors > 0 || summary.totalWarnings > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-lg border p-3 mt-2 mx-3',
            summary.totalErrors > 0 ? 'bg-error/5 border-error/20' : 'bg-warning/5 border-warning/20'
          )}
        >
          <p className="text-sm font-medium">
            {summary.totalErrors > 0 && (
              <span className="text-error">
                {summary.totalErrors} error{summary.totalErrors !== 1 ? 's' : ''}
              </span>
            )}
            {summary.totalErrors > 0 && summary.totalWarnings > 0 && ' and '}
            {summary.totalWarnings > 0 && (
              <span className="text-warning">
                {summary.totalWarnings} warning{summary.totalWarnings !== 1 ? 's' : ''}
              </span>
            )}
            {' '}found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click on failed stages to see details and suggestions.
          </p>
        </motion.div>
      )}
    </div>
  );
}

ValidationProgress.displayName = 'ValidationProgress';

/**
 * Hook to manage validation progress state.
 */
export function useValidationProgress() {
  const [stages, setStages] = React.useState<ValidationStageResult[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = React.useState(-1);
  const [isComplete, setIsComplete] = React.useState(false);
  const [isValid, setIsValid] = React.useState<boolean | undefined>(undefined);
  const [totalDurationMs, setTotalDurationMs] = React.useState<number | undefined>(undefined);

  const reset = React.useCallback(() => {
    setStages([]);
    setCurrentStageIndex(-1);
    setIsComplete(false);
    setIsValid(undefined);
    setTotalDurationMs(undefined);
  }, []);

  const startStage = React.useCallback((stage: ValidationStageName) => {
    setStages((prev) => {
      const existing = prev.find((s) => s.stage === stage);
      if (existing) {
        return prev.map((s) =>
          s.stage === stage ? { ...s, status: 'running' as const } : s
        );
      }
      return [...prev, { stage, status: 'running' as const, errors: [], warnings: [] }];
    });
    setCurrentStageIndex((prev) => prev + 1);
  }, []);

  const completeStage = React.useCallback((result: ValidationStageResult) => {
    setStages((prev) =>
      prev.map((s) => (s.stage === result.stage ? result : s))
    );
  }, []);

  const finish = React.useCallback((valid: boolean, durationMs?: number) => {
    setIsComplete(true);
    setIsValid(valid);
    setTotalDurationMs(durationMs);
  }, []);

  return {
    stages,
    currentStageIndex,
    isComplete,
    isValid,
    totalDurationMs,
    reset,
    startStage,
    completeStage,
    finish,
  };
}
