/**
 * Execution Progress Component
 * Displays real-time progress of batch job execution
 * Shows progress bar, command list, and status indicators
 */

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import {
  CheckCircle,
  XCircle,
  Circle,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { BatchJob, BatchJobStatus } from '@nasnet/api-client/queries';

export interface ExecutionProgressProps {
  /**
   * Current batch job data
   */
  job: BatchJob | null;

  /**
   * Whether job is still loading
   */
  isLoading?: boolean;

  /**
   * Error from job fetch
   */
  error?: Error | null;

  /**
   * Callback to cancel the job
   */
  onCancel?: () => void;

  /**
   * Callback to retry after failure
   */
  onRetry?: () => void;

  /**
   * Whether cancel is in progress
   */
  isCancelling?: boolean;

  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Status colors and icons mapping
 */
const STATUS_CONFIG: Record<
  BatchJobStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  pending: {
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Waiting to start...',
  },
  running: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    label: 'Applying configuration...',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Configuration applied successfully!',
  },
  failed: {
    icon: XCircle,
    color: 'text-error',
    bgColor: 'bg-error/10',
    label: 'Configuration failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Cancelled',
  },
  rolled_back: {
    icon: RotateCcw,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Rolled back due to errors',
  },
};

/**
 * ExecutionProgress Component
 *
 * Displays real-time progress of configuration application.
 * Features:
 * - Animated progress bar
 * - Command status list
 * - Error display
 * - Cancel/retry options
 *
 * @example
 * ```tsx
 * <ExecutionProgress
 *   job={batchJob}
 *   onCancel={handleCancel}
 *   onRetry={handleRetry}
 * />
 * ```
 */
export const ExecutionProgress = memo(function ExecutionProgress({
  job,
  isLoading = false,
  error,
  onCancel,
  onRetry,
  isCancelling = false,
  className,
}: ExecutionProgressProps) {
  // Memoize status checks (MUST be before early returns)
  const isTerminal = useMemo(
    () => job ? ['completed', 'failed', 'cancelled', 'rolled_back'].includes(job.status) : false,
    [job]
  );
  const isRunning = useMemo(
    () => job ? (job.status === 'running' || job.status === 'pending') : false,
    [job]
  );

  // Memoize handlers (MUST be before early returns)
  const handleCancel = useCallback(() => onCancel?.(), [onCancel]);
  const handleRetry = useCallback(() => onRetry?.(), [onRetry]);

  // If still loading initial data
  if (isLoading && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="status" aria-label="Starting job">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">Starting job...</p>
      </div>
    );
  }

  // If there's an error fetching job
  if (error && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-8" role="alert">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-error" aria-hidden="true" />
        </div>
        <p className="text-foreground font-medium mb-1">
          Failed to track job
        </p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {error.message}
        </p>
        {onRetry && (
          <button
            onClick={handleRetry}
            aria-label="Retry tracking the batch job"
            className="min-h-[44px] btn-action px-4 py-2 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[job.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl ${statusConfig.bgColor}`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon
            className={`w-6 h-6 ${statusConfig.color} ${
              job.status === 'running' ? 'animate-spin' : ''
            }`}
          />
          <div className="flex-1">
            <p className={`font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </p>
            {job.currentCommand && isRunning && (
              <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                {job.currentCommand}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2" role="status" aria-label={`Progress: ${Math.round(job.progress.percent)}% complete`}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {job.progress.current} / {job.progress.total} commands
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(job.progress.percent)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress.percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              job.status === 'failed' || job.status === 'rolled_back'
                ? 'bg-error'
                : job.status === 'completed'
                ? 'bg-success'
                : 'bg-primary'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(job.progress.percent)}% complete</span>
          <div className="flex gap-3">
            <span className="text-success">
              {job.progress.succeeded} succeeded
            </span>
            {job.progress.failed > 0 && (
              <span className="text-error">{job.progress.failed} failed</span>
            )}
            {job.progress.skipped > 0 && (
              <span className="text-muted-foreground">{job.progress.skipped} skipped</span>
            )}
          </div>
        </div>
      </div>

      {/* Errors List */}
      <AnimatePresence>
        {job.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" aria-hidden="true" />
              <h4 className="text-sm font-medium text-error">
                {job.errors.length} error{job.errors.length > 1 ? 's' : ''}
              </h4>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-error/10 rounded-lg border border-error/20">
              {job.errors.map((err, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-error"
                >
                  <span className="text-muted-foreground">Line {err.lineNumber}:</span>{' '}
                  {err.error}
                  <p className="text-muted-foreground truncate">
                    {err.command}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rollback info */}
      {job.status === 'rolled_back' && job.rollbackCount !== undefined && (
        <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg" role="alert">
          <RotateCcw className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-warning">
              Configuration rolled back
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.rollbackCount} change{job.rollbackCount > 1 ? 's' : ''} were
              reverted to restore previous state.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {isRunning && onCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            aria-label={isCancelling ? 'Cancelling job' : 'Cancel running job'}
            className="min-h-[44px] btn-destructive px-4 py-2 rounded-lg text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Cancelling...
              </>
            ) : (
              'Cancel'
            )}
          </button>
        )}

        {isTerminal && job.status === 'failed' && onRetry && (
          <button
            onClick={handleRetry}
            aria-label="Retry applying configuration"
            className="min-h-[44px] btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
});

ExecutionProgress.displayName = 'ExecutionProgress';

