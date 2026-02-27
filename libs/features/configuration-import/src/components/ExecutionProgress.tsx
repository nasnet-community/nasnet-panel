/**
 * Execution Progress Component
 * Displays real-time progress of batch job execution
 * Shows progress bar, command list, and status indicators
 */

import { memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import { CheckCircle, XCircle, Circle, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
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
    () => (job ? ['completed', 'failed', 'cancelled', 'rolled_back'].includes(job.status) : false),
    [job]
  );
  const isRunning = useMemo(
    () => (job ? job.status === 'running' || job.status === 'pending' : false),
    [job]
  );

  // Memoize handlers (MUST be before early returns)
  const handleCancel = useCallback(() => onCancel?.(), [onCancel]);
  const handleRetry = useCallback(() => onRetry?.(), [onRetry]);

  // If still loading initial data
  if (isLoading && !job) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        role="status"
        aria-label="Starting job"
      >
        <Loader2
          className="text-primary mb-4 h-8 w-8 animate-spin"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Starting job...</p>
      </div>
    );
  }

  // If there's an error fetching job
  if (error && !job) {
    return (
      <div
        className="py-component-xl flex flex-col items-center justify-center"
        role="alert"
      >
        <div className="bg-error/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <XCircle
            className="text-error h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <p className="text-foreground mb-1 font-medium">Failed to track job</p>
        <p className="text-muted-foreground mb-4 text-center text-sm">{error.message}</p>
        {onRetry && (
          <button
            onClick={handleRetry}
            aria-label="Retry tracking the batch job"
            className="btn-action px-component-md focus-visible:ring-ring min-h-[44px] rounded-lg py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
    <div className={cn('space-y-component-lg', className)}>
      {/* Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-component-md rounded-xl ${statusConfig.bgColor}`}
      >
        <div className="gap-component-md flex items-center">
          <StatusIcon
            className={`h-6 w-6 ${statusConfig.color} ${
              job.status === 'running' ? 'animate-spin' : ''
            }`}
          />
          <div className="flex-1">
            <p className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
            {job.currentCommand && isRunning && (
              <p className="text-muted-foreground mt-component-sm truncate font-mono text-xs">
                {job.currentCommand}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div
        className="space-y-component-sm"
        role="status"
        aria-label={`Progress: ${Math.round(job.progress.percent)}% complete`}
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">
            {job.progress.current} / {job.progress.total} commands
          </span>
        </div>
        <div
          className="bg-muted h-3 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={Math.round(job.progress.percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress.percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              job.status === 'failed' || job.status === 'rolled_back' ? 'bg-error'
              : job.status === 'completed' ? 'bg-success'
              : 'bg-primary'
            }`}
          />
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{Math.round(job.progress.percent)}% complete</span>
          <div className="gap-component-md flex">
            <span className="text-success">{job.progress.succeeded} succeeded</span>
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
            className="space-y-component-sm"
            role="alert"
          >
            <div className="gap-component-sm flex items-center">
              <AlertTriangle
                className="text-error h-4 w-4"
                aria-hidden="true"
              />
              <h4 className="text-error text-sm font-medium">
                {job.errors.length} error{job.errors.length > 1 ? 's' : ''}
              </h4>
            </div>
            <div className="space-y-component-sm p-component-md bg-error/10 border-error/20 max-h-32 overflow-y-auto rounded-lg border">
              {job.errors.map((err, index) => (
                <div
                  key={index}
                  className="text-error font-mono text-xs"
                >
                  <span className="text-muted-foreground">Line {err.lineNumber}:</span> {err.error}
                  <p className="text-muted-foreground truncate">{err.command}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rollback info */}
      {job.status === 'rolled_back' && job.rollbackCount !== undefined && (
        <div
          className="gap-component-md p-component-md bg-warning/10 border-warning/30 flex items-start rounded-lg border"
          role="alert"
        >
          <RotateCcw
            className="text-warning mt-0.5 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-warning text-sm font-medium">Configuration rolled back</p>
            <p className="text-muted-foreground mt-component-sm text-xs">
              {job.rollbackCount} change{job.rollbackCount > 1 ? 's' : ''} were reverted to restore
              previous state.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="gap-component-md flex justify-end">
        {isRunning && onCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            aria-label={isCancelling ? 'Cancelling job' : 'Cancel running job'}
            className="btn-destructive px-component-md py-component-sm gap-component-sm focus-visible:ring-ring flex min-h-[44px] items-center rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {isCancelling ?
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Cancelling...
              </>
            : 'Cancel'}
          </button>
        )}

        {isTerminal && job.status === 'failed' && onRetry && (
          <button
            onClick={handleRetry}
            aria-label="Retry applying configuration"
            className="btn-secondary px-component-md py-component-sm gap-component-sm focus-visible:ring-ring flex min-h-[44px] items-center rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <RotateCcw
              className="h-4 w-4"
              aria-hidden="true"
            />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
});

ExecutionProgress.displayName = 'ExecutionProgress';
