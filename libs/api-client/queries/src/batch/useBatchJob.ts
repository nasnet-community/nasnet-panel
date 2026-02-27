/**
 * TanStack Query hooks for batch job operations
 * Used to submit, track, and cancel batch configuration jobs
 * Communicates with rosproxy batch job API
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { batchKeys } from '../system/queryKeys';

/**
 * Execution protocol for batch jobs
 */
export type BatchProtocol = 'api' | 'ssh' | 'telnet';

/**
 * Batch job status
 */
export type BatchJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back';

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
 * API response format from rosproxy (snake_case)
 */
interface RosproxyBatchJobResponse {
  id: string;
  router_ip: string;
  protocol: BatchProtocol;
  status: BatchJobStatus;
  progress: {
    total: number;
    current: number;
    percent: number;
    succeeded: number;
    failed: number;
    skipped: number;
  };
  current_command?: string;
  errors: Array<{
    line_number: number;
    command: string;
    error: string;
    timestamp: string;
  }>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  dry_run: boolean;
  rollback_enabled: boolean;
  rollback_count?: number;
}

interface RosproxyCreateResponse {
  job_id: string;
  total_commands: number;
  status: BatchJobStatus;
}

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  return '';
}

/**
 * Transforms rosproxy response to our format
 */
function transformBatchJob(response: RosproxyBatchJobResponse): BatchJob {
  return {
    id: response.id,
    routerIp: response.router_ip,
    protocol: response.protocol,
    status: response.status,
    progress: response.progress,
    currentCommand: response.current_command,
    errors: response.errors.map((e) => ({
      lineNumber: e.line_number,
      command: e.command,
      error: e.error,
      timestamp: e.timestamp,
    })),
    createdAt: response.created_at,
    startedAt: response.started_at,
    completedAt: response.completed_at,
    dryRun: response.dry_run,
    rollbackEnabled: response.rollback_enabled,
    rollbackCount: response.rollback_count,
  };
}

/**
 * Creates a batch job via rosproxy API
 */
async function createBatchJob(request: CreateBatchJobRequest): Promise<CreateBatchJobResponse> {
  const response = await fetch(`${getBaseUrl()}/api/batch/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      router_ip: request.routerIp,
      username: request.username,
      password: request.password,
      protocol: request.protocol,
      use_tls: request.useTls ?? false,
      script: request.script,
      commands: request.commands,
      dry_run: request.dryRun ?? false,
      rollback_enabled: request.rollbackEnabled ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to create batch job: ${response.statusText}`);
  }

  const data: RosproxyCreateResponse = await response.json();
  return {
    jobId: data.job_id,
    totalCommands: data.total_commands,
    status: data.status,
  };
}

/**
 * Fetches batch job status from rosproxy API
 */
async function fetchBatchJob(jobId: string): Promise<BatchJob> {
  const response = await fetch(`${getBaseUrl()}/api/batch/jobs/${jobId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch batch job: ${response.statusText}`);
  }

  const data: RosproxyBatchJobResponse = await response.json();
  return transformBatchJob(data);
}

/**
 * Cancels a batch job via rosproxy API
 */
async function cancelBatchJob(jobId: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/batch/jobs/${jobId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to cancel batch job: ${response.statusText}`);
  }
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
export function useBatchJob(
  jobId: string | null,
  options?: {
    /**
     * Polling interval in ms while job is running
     * @default 1000
     */
    pollingInterval?: number;
  }
): UseQueryResult<BatchJob, Error> {
  const pollingInterval = options?.pollingInterval ?? 1000;

  return useQuery({
    queryKey: batchKeys.job(jobId ?? ''),
    queryFn: () => fetchBatchJob(jobId!),
    enabled: !!jobId,
    // Poll while running or pending
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'running' || status === 'pending') {
        return pollingInterval;
      }
      return false;
    },
    refetchIntervalInBackground: false,
    staleTime: 0, // Always refetch for real-time updates
    retry: 2,
  });
}

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
export function useCreateBatchJob(): UseMutationResult<
  CreateBatchJobResponse,
  Error,
  CreateBatchJobRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatchJob,
    onSuccess: (data) => {
      // Invalidate batch queries to refetch
      queryClient.invalidateQueries({ queryKey: batchKeys.all });
      // Pre-populate the job query cache
      queryClient.setQueryData(batchKeys.job(data.jobId), {
        id: data.jobId,
        status: data.status,
        progress: {
          total: data.totalCommands,
          current: 0,
          percent: 0,
          succeeded: 0,
          failed: 0,
          skipped: 0,
        },
      });
    },
  });
}

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
export function useCancelBatchJob(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBatchJob,
    onSuccess: (_, jobId) => {
      // Invalidate the specific job query
      queryClient.invalidateQueries({ queryKey: batchKeys.job(jobId) });
    },
  });
}
