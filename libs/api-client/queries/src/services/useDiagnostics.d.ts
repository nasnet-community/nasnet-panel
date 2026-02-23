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
    progress: number;
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
    errors?: Array<{
        field: string;
        message: string;
    }>;
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
export declare function useDiagnosticHistory(routerId: string, instanceId: string, limit?: number, enabled?: boolean): {
    history: StartupDiagnostics[] | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
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
export declare function useAvailableDiagnostics(serviceName: string, enabled?: boolean): {
    suite: DiagnosticSuite | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
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
export declare function useRunDiagnostics(): readonly [(options?: import("@apollo/client").MutationFunctionOptions<any, import("@apollo/client").OperationVariables, import("@apollo/client").DefaultContext, import("@apollo/client").ApolloCache<any>> | undefined) => Promise<import("@apollo/client").FetchResult<any>>, {
    readonly data: RunDiagnosticsPayload | undefined;
    readonly loading: boolean;
    readonly error: import("@apollo/client").ApolloError | undefined;
}];
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
export declare function useDiagnosticsProgressSubscription(routerId: string, instanceId: string, enabled?: boolean): {
    progress: DiagnosticsProgress | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
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
export declare function getStartupDiagnostics(history?: StartupDiagnostics[]): StartupDiagnostics | undefined;
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
export declare function hasFailures(diagnostics?: StartupDiagnostics): boolean;
//# sourceMappingURL=useDiagnostics.d.ts.map