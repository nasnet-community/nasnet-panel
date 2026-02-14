import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_DIAGNOSTIC_HISTORY,
  GET_AVAILABLE_DIAGNOSTICS,
  RUN_SERVICE_DIAGNOSTICS,
  SUBSCRIBE_DIAGNOSTICS_PROGRESS,
} from './logs-diagnostics.graphql';

/**
 * Diagnostic test status
 */
export type DiagnosticStatus = 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';

/**
 * Result of a single diagnostic test
 */
export interface DiagnosticResult {
  id: string;
  instanceID: string;
  testName: string;
  status: DiagnosticStatus;
  message: string;
  details?: string;
  durationMs: number;
  runGroupID?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
}

/**
 * Startup diagnostics collected during instance boot
 */
export interface StartupDiagnostics {
  instanceID: string;
  runGroupID: string;
  results: DiagnosticResult[];
  overallStatus: DiagnosticStatus;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  totalTests: number;
  timestamp: string;
}

/**
 * A single diagnostic test definition
 */
export interface DiagnosticTest {
  name: string;
  description: string;
  category: string;
}

/**
 * Complete diagnostic suite for a service type
 */
export interface DiagnosticSuite {
  serviceName: string;
  tests: DiagnosticTest[];
}

/**
 * Diagnostic progress event for subscriptions
 */
export interface DiagnosticsProgress {
  instanceID: string;
  runGroupID: string;
  result: DiagnosticResult;
  progress: number; // 0-100
  completedTests: number;
  totalTests: number;
  timestamp: string;
}

/**
 * Input for running diagnostics
 */
export interface RunDiagnosticsInput {
  routerID: string;
  instanceID: string;
  testNames?: string[];
}

/**
 * Payload for run diagnostics mutation
 */
export interface RunDiagnosticsPayload {
  success: boolean;
  results?: DiagnosticResult[];
  runGroupID?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Hook to fetch diagnostic history for a service instance
 *
 * Retrieves past diagnostic results grouped by run_group_id.
 * Use this to display historical test results and trends.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @param limit - Maximum number of run groups to return (default 10)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Diagnostic history data, loading state, and error
 *
 * @example
 * ```tsx
 * const { history, loading, error, refetch } = useDiagnosticHistory('router-1', 'instance-1', 10);
 *
 * if (history) {
 *   history.forEach(run => {
 *     console.log(`Run ${run.runGroupID}: ${run.passedCount}/${run.totalTests} passed`);
 *   });
 * }
 * ```
 */
export function useDiagnosticHistory(
  routerId: string,
  instanceId: string,
  limit: number = 10,
  enabled: boolean = true
) {
  const { data, loading, error, refetch } = useQuery(GET_DIAGNOSTIC_HISTORY, {
    variables: { routerID: routerId, instanceID: instanceId, limit },
    skip: !enabled || !routerId || !instanceId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    history: data?.diagnosticHistory as StartupDiagnostics[] | undefined,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get available diagnostic tests for a service type
 *
 * Fetches the diagnostic suite definition for a service.
 * Use this to display available tests before running diagnostics.
 *
 * @param serviceName - Service name (e.g., 'tor', 'singbox', 'adguard')
 * @param enabled - Whether to enable the query (default: true)
 * @returns Diagnostic suite data, loading state, and error
 *
 * @example
 * ```tsx
 * const { suite, loading, error } = useAvailableDiagnostics('tor');
 *
 * if (suite) {
 *   suite.tests.forEach(test => {
 *     console.log(`${test.name}: ${test.description}`);
 *   });
 * }
 * ```
 */
export function useAvailableDiagnostics(
  serviceName: string,
  enabled: boolean = true
) {
  const { data, loading, error } = useQuery(GET_AVAILABLE_DIAGNOSTICS, {
    variables: { serviceName },
    skip: !enabled || !serviceName,
    fetchPolicy: 'cache-first', // Suite definitions don't change often
  });

  return {
    suite: data?.availableDiagnostics as DiagnosticSuite | undefined,
    loading,
    error,
  };
}

/**
 * Hook to manually run diagnostics on a service instance
 *
 * Executes health checks and connectivity tests.
 * Use this to trigger manual diagnostic runs from the UI.
 *
 * @returns Mutation function, result data, and loading/error states
 *
 * @example
 * ```tsx
 * const [runDiagnostics, { data, loading, error }] = useRunDiagnostics();
 *
 * const handleRunTests = async () => {
 *   const result = await runDiagnostics({
 *     variables: {
 *       input: {
 *         routerID: 'router-1',
 *         instanceID: 'instance-1',
 *         testNames: ['process_health', 'tor_socks5'] // Optional: specific tests
 *       }
 *     }
 *   });
 *
 *   if (result.data?.runServiceDiagnostics.success) {
 *     console.log('Diagnostics completed:', result.data.runServiceDiagnostics.results);
 *   }
 * };
 * ```
 */
export function useRunDiagnostics() {
  const [runDiagnostics, { data, loading, error }] = useMutation(
    RUN_SERVICE_DIAGNOSTICS,
    {
      // Refetch diagnostic history after running tests
      refetchQueries: ['GetDiagnosticHistory'],
      awaitRefetchQueries: true,
    }
  );

  return [
    runDiagnostics,
    {
      data: data?.runServiceDiagnostics as RunDiagnosticsPayload | undefined,
      loading,
      error,
    },
  ] as const;
}

/**
 * Hook to subscribe to diagnostic progress updates
 *
 * Monitors real-time progress as diagnostic tests execute.
 * Emits events as each test completes.
 * Use this to display progress bars and live test results.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Progress data, loading state, and error
 *
 * @example
 * ```tsx
 * const { progress, loading, error } = useDiagnosticsProgressSubscription(
 *   'router-1',
 *   'instance-1'
 * );
 *
 * useEffect(() => {
 *   if (progress) {
 *     console.log(`Progress: ${progress.progress}% (${progress.completedTests}/${progress.totalTests})`);
 *     console.log(`Latest result: ${progress.result.testName} - ${progress.result.status}`);
 *   }
 * }, [progress]);
 * ```
 */
export function useDiagnosticsProgressSubscription(
  routerId: string,
  instanceId: string,
  enabled: boolean = true
) {
  const { data, loading, error } = useSubscription(
    SUBSCRIBE_DIAGNOSTICS_PROGRESS,
    {
      variables: { routerID: routerId, instanceID: instanceId },
      skip: !enabled || !routerId || !instanceId,
      onData: ({ data }) => {
        if (data.data?.diagnosticsProgress) {
          const progress = data.data.diagnosticsProgress;
          // Apollo Client automatically updates the cache
          // Additional side effects can be added here (e.g., progress notifications)
          console.log(
            `Diagnostic progress: ${progress.completedTests}/${progress.totalTests} - ${progress.result.testName}: ${progress.result.status}`
          );
        }
      },
    }
  );

  return {
    progress: data?.diagnosticsProgress as DiagnosticsProgress | undefined,
    loading,
    error,
  };
}

/**
 * Get the most recent startup diagnostics for an instance
 *
 * Convenience function to extract the latest diagnostic run from history.
 * Use this to quickly check if the service started successfully.
 *
 * @param history - Diagnostic history array
 * @returns Most recent startup diagnostics or undefined
 *
 * @example
 * ```tsx
 * const { history } = useDiagnosticHistory('router-1', 'instance-1');
 * const latestRun = getStartupDiagnostics(history);
 *
 * if (latestRun?.overallStatus === 'FAIL') {
 *   showAlert('Service startup failed!');
 * }
 * ```
 */
export function getStartupDiagnostics(
  history?: StartupDiagnostics[]
): StartupDiagnostics | undefined {
  return history?.[0]; // History is sorted by timestamp descending
}

/**
 * Check if a diagnostic run has any failures
 *
 * Utility function to determine if diagnostics contain failures.
 * Use this for conditional rendering of alerts and error states.
 *
 * @param diagnostics - Startup diagnostics to check
 * @returns True if any tests failed
 *
 * @example
 * ```tsx
 * const { history } = useDiagnosticHistory('router-1', 'instance-1');
 * const latestRun = getStartupDiagnostics(history);
 *
 * if (hasFailures(latestRun)) {
 *   return <FailureAlert diagnostics={latestRun} />;
 * }
 * ```
 */
export function hasFailures(diagnostics?: StartupDiagnostics): boolean {
  return (diagnostics?.failedCount ?? 0) > 0;
}
