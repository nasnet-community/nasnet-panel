/**
 * TanStack Query hooks for batch job operations
 * Used to submit, track, and cancel batch configuration jobs
 * Communicates with rosproxy batch job API
 */
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
/**
 * Execution protocol for batch jobs
 */
export type BatchProtocol = 'api' | 'ssh' | 'telnet';
/**
 * Batch job status
 */
export type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
/**
 * Error entry in batch job
 */
export interface BatchJobError {
    lineNumber: number;
    command: string;
    error: string;
    timestamp: string;
}
/**
 * Progress information for a batch job
 */
export interface BatchJobProgress {
    total: number;
    current: number;
    percent: number;
    succeeded: number;
    failed: number;
    skipped: number;
}
/**
 * Batch job status response from rosproxy
 */
export interface BatchJob {
    id: string;
    routerIp: string;
    protocol: BatchProtocol;
    status: BatchJobStatus;
    progress: BatchJobProgress;
    currentCommand?: string;
    errors: BatchJobError[];
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    dryRun: boolean;
    rollbackEnabled: boolean;
    rollbackCount?: number;
}
/**
 * Request to create a batch job
 */
export interface CreateBatchJobRequest {
    routerIp: string;
    username: string;
    password: string;
    protocol: BatchProtocol;
    useTls?: boolean;
    script?: string;
    commands?: string[];
    dryRun?: boolean;
    rollbackEnabled?: boolean;
}
/**
 * Response from creating a batch job
 */
export interface CreateBatchJobResponse {
    jobId: string;
    totalCommands: number;
    status: BatchJobStatus;
}
/**
 * React Query hook for fetching batch job status
 * Automatically polls while job is running
 *
 * @param jobId - Batch job ID to fetch
 * @param options - Query options
 * @returns Query result with batch job data
 *
 * @example
 * ```tsx
 * function JobProgress({ jobId }: { jobId: string }) {
 *   const { data: job, isLoading } = useBatchJob(jobId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <ProgressBar value={job.progress.percent} />
 *   );
 * }
 * ```
 */
export declare function useBatchJob(jobId: string | null, options?: {
    /**
     * Polling interval in ms while job is running
     * @default 1000
     */
    pollingInterval?: number;
}): UseQueryResult<BatchJob, Error>;
/**
 * React Query mutation hook for creating batch jobs
 *
 * @returns Mutation result for creating batch jobs
 *
 * @example
 * ```tsx
 * function ConfigApply() {
 *   const createJob = useCreateBatchJob();
 *
 *   const handleApply = async (script: string) => {
 *     const result = await createJob.mutateAsync({
 *       routerIp: '192.168.88.1',
 *       username: 'admin',
 *       password: 'secret',
 *       protocol: 'api',
 *       script,
 *     });
 *     console.log('Job started:', result.jobId);
 *   };
 * }
 * ```
 */
export declare function useCreateBatchJob(): UseMutationResult<CreateBatchJobResponse, Error, CreateBatchJobRequest>;
/**
 * React Query mutation hook for cancelling batch jobs
 *
 * @returns Mutation result for cancelling batch jobs
 *
 * @example
 * ```tsx
 * function CancelButton({ jobId }: { jobId: string }) {
 *   const cancelJob = useCancelBatchJob();
 *
 *   return (
 *     <button
 *       onClick={() => cancelJob.mutate(jobId)}
 *       disabled={cancelJob.isPending}
 *     >
 *       Cancel
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useCancelBatchJob(): UseMutationResult<void, Error, string>;
//# sourceMappingURL=useBatchJob.d.ts.map