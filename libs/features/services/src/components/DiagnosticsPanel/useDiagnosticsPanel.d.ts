/**
 * useDiagnosticsPanel Hook
 *
 * Headless hook containing all business logic for DiagnosticsPanel.
 * Manages diagnostic test execution, history, and progress monitoring.
 * Provides all state and action methods needed by platform presenters.
 *
 * @description
 * Features:
 * - Display diagnostic history with pass/fail indicators
 * - Run manual diagnostics with progress tracking
 * - Show startup failure alerts
 * - Real-time progress updates via subscription
 * - Status color and icon mapping
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters Pattern
 */
import { type DiagnosticStatus, type DiagnosticResult, type StartupDiagnostics } from '@nasnet/api-client/queries';
/**
 * Props for DiagnosticsPanel component
 *
 * @interface DiagnosticsPanelProps
 */
export interface DiagnosticsPanelProps {
    /** Router ID to run diagnostics for */
    routerId: string;
    /** Service instance ID to run diagnostics for */
    instanceId: string;
    /** Service name for fetching available tests */
    serviceName: string;
    /** Maximum history entries to fetch (default 10) */
    maxHistory?: number;
    /** Callback when diagnostics complete - receives test results */
    onDiagnosticsComplete?: (results: DiagnosticResult[]) => void;
    /** Optional CSS class for custom styling */
    className?: string;
}
/**
 * Return type for useDiagnosticsPanel hook
 */
export interface UseDiagnosticsPanelReturn {
    history: StartupDiagnostics[] | undefined;
    latestRun: StartupDiagnostics | undefined;
    hasLatestFailures: boolean;
    runDiagnostics: () => Promise<void>;
    isRunning: boolean;
    runError: Error | undefined;
    progress: number;
    currentTest: string | undefined;
    completedTests: number;
    totalTests: number;
    isLoadingHistory: boolean;
    historyError: Error | undefined;
    refreshHistory: () => void;
    clearError: () => void;
    getStatusColor: (status: DiagnosticStatus) => string;
    getStatusIcon: (status: DiagnosticStatus) => 'check' | 'x' | 'alert' | 'minus';
    formatDuration: (ms: number) => string;
}
/**
 * Headless hook for DiagnosticsPanel
 *
 * @description
 * Manages all business logic for the DiagnosticsPanel component.
 * Handles test execution, history fetching, progress tracking, and result formatting.
 * All state and computed values are provided to platform presenters.
 *
 * @param props - Component configuration
 * @returns Object with all state, actions, and helper methods
 *
 * @example
 * ```tsx
 * const diagnostics = useDiagnosticsPanel({
 *   routerId: 'router-123',
 *   instanceId: 'instance-456',
 *   serviceName: 'openvpn'
 * });
 *
 * return <DiagnosticsPanelDesktop {...diagnostics} />;
 * ```
 */
export declare function useDiagnosticsPanel(props: DiagnosticsPanelProps): UseDiagnosticsPanelReturn;
//# sourceMappingURL=useDiagnosticsPanel.d.ts.map