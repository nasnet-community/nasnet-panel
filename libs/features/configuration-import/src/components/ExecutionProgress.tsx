/**
 * Execution Progress Component
 * Displays real-time progress of batch job execution
 * Shows progress bar, command list, and status indicators
 */

import { motion, AnimatePresence } from 'framer-motion';
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
    color: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    label: 'Waiting to start...',
  },
  running: {
    icon: Loader2,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    label: 'Applying configuration...',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success-light dark:bg-success/20',
    label: 'Configuration applied successfully!',
  },
  failed: {
    icon: XCircle,
    color: 'text-error',
    bgColor: 'bg-error-light dark:bg-error/20',
    label: 'Configuration failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    label: 'Cancelled',
  },
  rolled_back: {
    icon: RotateCcw,
    color: 'text-warning',
    bgColor: 'bg-warning-light dark:bg-warning/20',
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
export function ExecutionProgress({
  job,
  isLoading = false,
  error,
  onCancel,
  onRetry,
  isCancelling = false,
}: ExecutionProgressProps) {
  // If still loading initial data
  if (isLoading && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Starting job...</p>
      </div>
    );
  }

  // If there's an error fetching job
  if (error && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 rounded-full bg-error-light dark:bg-error/20 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-error" />
        </div>
        <p className="text-slate-900 dark:text-slate-100 font-medium mb-1">
          Failed to track job
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
          {error.message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-action px-4 py-2 rounded-lg text-sm"
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
  const isTerminal = ['completed', 'failed', 'cancelled', 'rolled_back'].includes(
    job.status
  );
  const isRunning = job.status === 'running' || job.status === 'pending';

  return (
    <div className="space-y-6">
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
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1 truncate">
                {job.currentCommand}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {job.progress.current} / {job.progress.total} commands
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.progress.percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              job.status === 'failed' || job.status === 'rolled_back'
                ? 'bg-error'
                : job.status === 'completed'
                ? 'bg-success'
                : 'bg-primary-500'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{Math.round(job.progress.percent)}% complete</span>
          <div className="flex gap-3">
            <span className="text-success">
              {job.progress.succeeded} succeeded
            </span>
            {job.progress.failed > 0 && (
              <span className="text-error">{job.progress.failed} failed</span>
            )}
            {job.progress.skipped > 0 && (
              <span className="text-slate-400">{job.progress.skipped} skipped</span>
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
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <h4 className="text-sm font-medium text-error">
                {job.errors.length} error{job.errors.length > 1 ? 's' : ''}
              </h4>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-error-light/30 dark:bg-error/10 rounded-lg border border-error/20">
              {job.errors.map((err, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-error-dark dark:text-error-light"
                >
                  <span className="text-slate-500">Line {err.lineNumber}:</span>{' '}
                  {err.error}
                  <p className="text-slate-500 dark:text-slate-400 truncate">
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
        <div className="flex items-start gap-3 p-3 bg-warning-light/50 dark:bg-warning/10 border border-warning/30 rounded-lg">
          <RotateCcw className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-dark dark:text-warning">
              Configuration rolled back
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
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
            onClick={onCancel}
            disabled={isCancelling}
            className="btn-destructive px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel'
            )}
          </button>
        )}

        {isTerminal && job.status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

