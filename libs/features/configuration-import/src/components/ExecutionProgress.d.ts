/**
 * Execution Progress Component
 * Displays real-time progress of batch job execution
 * Shows progress bar, command list, and status indicators
 */
import type { BatchJob } from '@nasnet/api-client/queries';
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
export declare const ExecutionProgress: import("react").NamedExoticComponent<ExecutionProgressProps>;
//# sourceMappingURL=ExecutionProgress.d.ts.map