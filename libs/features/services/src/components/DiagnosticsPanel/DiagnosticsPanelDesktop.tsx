/**
 * DiagnosticsPanel Desktop Presenter
 *
 * Desktop-optimized presenter for DiagnosticsPanel pattern.
 * Displays diagnostic test results with pass/fail indicators.
 * Provides full details visibility with expandable test results.
 *
 * @description
 * Features:
 * - Pass/fail indicators with color coding
 * - Expandable test result details
 * - Progress bar during test execution
 * - Startup failure alerts
 * - Diagnostic history
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { Play, RefreshCw, Check, X, AlertTriangle, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Alert,
  AlertDescription,
  AlertTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import {
  useDiagnosticsPanel,
  type DiagnosticsPanelProps,
} from './useDiagnosticsPanel';
import type { DiagnosticResult, StartupDiagnostics } from '@nasnet/api-client/queries';

/**
 * DiagnosticsPanelDesktop component
 *
 * @description
 * Desktop presenter for DiagnosticsPanel with full detail visibility.
 * Displays test results in expandable collapsibles with complete metadata.
 * Shows startup failure alerts and historical diagnostic runs.
 *
 * @param props - Component props
 * @returns Rendered desktop diagnostics panel
 */
function DiagnosticsPanelDesktopComponent(props: DiagnosticsPanelProps) {
  const { className } = props;

  const {
    latestRun,
    hasLatestFailures,
    history,
    runDiagnostics,
    isRunning,
    runError,
    progress,
    currentTest,
    completedTests,
    totalTests,
    isLoadingHistory,
    historyError,
    refreshHistory,
    getStatusColor,
    getStatusIcon,
    formatDuration,
  } = useDiagnosticsPanel(props);

  const [expandedTests, setExpandedTests] = React.useState<Set<string>>(new Set());
  const [expandedRuns, setExpandedRuns] = React.useState<Set<string>>(
    new Set(latestRun ? [latestRun.runGroupID] : [])
  );

  const toggleTest = React.useCallback((testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  }, []);

  const toggleRun = React.useCallback((runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  }, []);

  const renderTestResult = React.useCallback((result: DiagnosticResult) => {
    const iconName = getStatusIcon(result.status);
    const isExpanded = expandedTests.has(result.id);
    const statusIcon = getStatusIconComponent(iconName);

    return (
      <Collapsible
        key={result.id}
        open={isExpanded}
        onOpenChange={() => toggleTest(result.id)}
      >
        <div className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-md transition-colors">
          <Icon icon={statusIcon as LucideIcon} className={cn('h-5 w-5', getStatusColor(result.status))} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{result.testName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDuration(result.durationMs)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{result.message}</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="ml-11 p-3 bg-muted/50 rounded-md space-y-2">
            {result.details && (
              <div className="text-sm">
                <strong className="text-muted-foreground">Details:</strong>
                <p className="mt-1 whitespace-pre-wrap">{result.details}</p>
              </div>
            )}
            {result.errorMessage && (
              <div className="text-sm">
                <strong className="text-destructive">Error:</strong>
                <p className="mt-1 text-destructive whitespace-pre-wrap">
                  {result.errorMessage}
                </p>
              </div>
            )}
            {result.metadata && Object.keys(result.metadata).length > 0 && (
              <div className="text-sm">
                <strong className="text-muted-foreground">Metadata:</strong>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }, [expandedTests, getStatusIcon, getStatusColor, toggleTest]);

  const renderDiagnosticRun = React.useCallback((run: StartupDiagnostics) => {
    const isExpanded = expandedRuns.has(run.runGroupID);
    const timestamp = new Date(run.timestamp).toLocaleString();

    return (
      <Collapsible
        key={run.runGroupID}
        open={isExpanded}
        onOpenChange={() => toggleRun(run.runGroupID)}
      >
        <div className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 hover:bg-accent/50 cursor-pointer">
              <div className="flex items-center gap-3">
                <Icon icon={isExpanded ? ChevronDown : ChevronRight} className="h-5 w-5" aria-hidden="true" />
                <div>
                  <div className="font-medium">{timestamp}</div>
                  <div className="text-sm text-muted-foreground">
                    {run.passedCount} passed, {run.failedCount} failed,{' '}
                    {run.warningCount} warnings
                  </div>
                </div>
              </div>
              <Badge
                variant={run.overallStatus === 'PASS' ? 'success' : 'error'}
                className="ml-auto"
              >
                {run.overallStatus}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t">
              {run.results.map((result) => renderTestResult(result))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }, [expandedRuns, toggleRun, renderTestResult]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Diagnostics</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHistory}
              disabled={isLoadingHistory}
            >
              <Icon icon={RefreshCw} className={cn('mr-2 h-4 w-4', isLoadingHistory && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              <Icon icon={Play} className="mr-2 h-4 w-4" aria-hidden="true" />
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Startup failure alert */}
        {latestRun && hasLatestFailures && (
          <Alert variant="destructive">
            <Icon icon={AlertTriangle} className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Startup Failures Detected</AlertTitle>
            <AlertDescription>
              {latestRun.failedCount} diagnostic test(s) failed during service startup.
              Review the results below for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Error state */}
        {(runError || historyError) && (
          <Alert variant="destructive">
            <Icon icon={X} className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {runError?.message || historyError?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress during test execution */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Running: {currentTest || 'Initializing...'}
              </span>
              <span className="font-medium">
                {completedTests} / {totalTests}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Loading state */}
        {isLoadingHistory && !history && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Loading diagnostic history...
          </div>
        )}

        {/* Empty state */}
        {!isLoadingHistory && !history?.length && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No diagnostic history available. Click "Run Diagnostics" to start.
          </div>
        )}

        {/* Diagnostic history */}
        {history && history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Diagnostic History
            </h3>
            {history.map((run) => renderDiagnosticRun(run))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to map status to icon components
function getStatusIconComponent(status: 'check' | 'x' | 'alert' | 'minus'): React.ComponentType<any> {
  const iconMap: Record<string, React.ComponentType<any>> = {
    check: Check,
    x: X,
    alert: AlertTriangle,
    minus: Minus,
  };
  return iconMap[status] || Minus;
}

export const DiagnosticsPanelDesktop = React.memo(DiagnosticsPanelDesktopComponent);
DiagnosticsPanelDesktop.displayName = 'DiagnosticsPanel.Desktop';
