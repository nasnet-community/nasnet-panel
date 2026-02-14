/**
 * useDiagnosticsPanel Hook
 *
 * Headless hook containing all business logic for DiagnosticsPanel.
 * Manages diagnostic test execution, history, and progress monitoring.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 */

import { useState, useCallback, useMemo } from 'react';
import {
  useDiagnosticHistory,
  useRunDiagnostics,
  useDiagnosticsProgressSubscription,
  getStartupDiagnostics,
  hasFailures,
  type DiagnosticStatus,
  type DiagnosticResult,
  type StartupDiagnostics,
} from '@nasnet/api-client/queries';

/**
 * Props for DiagnosticsPanel component
 */
export interface DiagnosticsPanelProps {
  /** Router ID */
  routerId: string;

  /** Service instance ID */
  instanceId: string;

  /** Service name for fetching available tests */
  serviceName: string;

  /** Maximum history entries to fetch (default 10) */
  maxHistory?: number;

  /** Callback when diagnostics complete */
  onDiagnosticsComplete?: (results: DiagnosticResult[]) => void;

  /** Additional CSS class */
  className?: string;
}

/**
 * Return type for useDiagnosticsPanel hook
 */
export interface UseDiagnosticsPanelReturn {
  // History
  history: StartupDiagnostics[] | undefined;
  latestRun: StartupDiagnostics | undefined;
  hasLatestFailures: boolean;

  // Test execution
  runDiagnostics: () => Promise<void>;
  isRunning: boolean;
  runError: Error | undefined;

  // Progress tracking
  progress: number; // 0-100
  currentTest: string | undefined;
  completedTests: number;
  totalTests: number;

  // Loading states
  isLoadingHistory: boolean;
  historyError: Error | undefined;

  // Actions
  refreshHistory: () => void;
  clearError: () => void;

  // Result helpers
  getStatusColor: (status: DiagnosticStatus) => string;
  getStatusIcon: (status: DiagnosticStatus) => 'check' | 'x' | 'alert' | 'minus';
  formatDuration: (ms: number) => string;
}

/**
 * Headless hook for DiagnosticsPanel
 *
 * Features:
 * - Display diagnostic history with pass/fail indicators
 * - Run manual diagnostics with progress tracking
 * - Show startup failure alerts
 * - Real-time progress updates via subscription
 */
export function useDiagnosticsPanel(
  props: DiagnosticsPanelProps
): UseDiagnosticsPanelReturn {
  const { routerId, instanceId, maxHistory = 10, onDiagnosticsComplete } = props;

  // Fetch diagnostic history
  const {
    history,
    loading: isLoadingHistory,
    error: historyError,
    refetch: refreshHistory,
  } = useDiagnosticHistory(routerId, instanceId, maxHistory);

  // Run diagnostics mutation
  const [runDiagnosticsMutation, { data: runData, loading: isRunning, error: runError }] =
    useRunDiagnostics();

  // Progress subscription
  const { progress: progressData } = useDiagnosticsProgressSubscription(
    routerId,
    instanceId,
    isRunning
  );

  // Local error state for clearing
  const [localError, setLocalError] = useState<Error | undefined>();

  // Get latest diagnostic run
  const latestRun = useMemo(() => getStartupDiagnostics(history), [history]);

  // Check if latest run has failures
  const hasLatestFailures = useMemo(() => hasFailures(latestRun), [latestRun]);

  // Extract progress from subscription
  const progress = progressData?.progress ?? 0;
  const currentTest = progressData?.result.testName;
  const completedTests = progressData?.completedTests ?? 0;
  const totalTests = progressData?.totalTests ?? 0;

  // Run diagnostics
  const runDiagnostics = useCallback(async () => {
    try {
      setLocalError(undefined);
      const result = await runDiagnosticsMutation({
        variables: {
          input: {
            routerID: routerId,
            instanceID: instanceId,
            testNames: [], // Run all tests
          },
        },
      });

      if (result.data?.success && result.data.results) {
        onDiagnosticsComplete?.(result.data.results);
      }
    } catch (err) {
      setLocalError(err as Error);
    }
  }, [runDiagnosticsMutation, routerId, instanceId, onDiagnosticsComplete]);

  // Clear error
  const clearError = useCallback(() => {
    setLocalError(undefined);
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: DiagnosticStatus): string => {
    switch (status) {
      case 'PASS':
        return 'text-green-600 dark:text-green-400';
      case 'FAIL':
        return 'text-red-600 dark:text-red-400';
      case 'WARNING':
        return 'text-amber-600 dark:text-amber-400';
      case 'SKIPPED':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-muted-foreground';
    }
  }, []);

  // Get status icon
  const getStatusIcon = useCallback(
    (status: DiagnosticStatus): 'check' | 'x' | 'alert' | 'minus' => {
      switch (status) {
        case 'PASS':
          return 'check';
        case 'FAIL':
          return 'x';
        case 'WARNING':
          return 'alert';
        case 'SKIPPED':
          return 'minus';
        default:
          return 'minus';
      }
    },
    []
  );

  // Format duration
  const formatDuration = useCallback((ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  return {
    history,
    latestRun,
    hasLatestFailures,
    runDiagnostics,
    isRunning,
    runError: localError || runError,
    progress,
    currentTest,
    completedTests,
    totalTests,
    isLoadingHistory,
    historyError,
    refreshHistory,
    clearError,
    getStatusColor,
    getStatusIcon,
    formatDuration,
  };
}
