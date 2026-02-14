/**
 * DiagnosticsPanel Mobile Presenter
 *
 * Mobile-optimized presenter for DiagnosticsPanel pattern.
 * Touch-first interface with 44px targets and simplified layout.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import {
  Check,
  X,
  AlertTriangle,
  Minus,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nasnet/ui/primitives';

import {
  useDiagnosticsPanel,
  type DiagnosticsPanelProps,
} from './useDiagnosticsPanel';
import type { DiagnosticResult, StartupDiagnostics } from '@nasnet/api-client/queries';

/**
 * Icon map for test status
 */
const StatusIcon = {
  check: Check,
  x: X,
  alert: AlertTriangle,
  minus: Minus,
};

/**
 * Mobile presenter for DiagnosticsPanel
 *
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Expandable accordions for test details
 * - Simplified layout for small screens
 * - Progress indicator during execution
 * - Startup failure alerts
 */
export function DiagnosticsPanelMobile(props: DiagnosticsPanelProps) {
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

  const renderTestResult = (result: DiagnosticResult, index: number) => {
    const Icon = StatusIcon[getStatusIcon(result.status)];

    return (
      <AccordionItem key={result.id} value={`test-${index}`}>
        <AccordionTrigger className="min-h-[44px] hover:no-underline">
          <div className="flex items-center gap-3 flex-1 text-left">
            <Icon className={`h-5 w-5 ${getStatusColor(result.status)} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{result.testName}</div>
              <p className="text-sm text-muted-foreground truncate">{result.message}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDuration(result.durationMs)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 p-3 bg-muted/50 rounded-md">
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
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderDiagnosticRun = (run: StartupDiagnostics, runIndex: number) => {
    const timestamp = new Date(run.timestamp).toLocaleString();

    return (
      <AccordionItem key={run.runGroupID} value={`run-${runIndex}`}>
        <AccordionTrigger className="min-h-[44px] hover:no-underline">
          <div className="flex items-center justify-between flex-1 gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{timestamp}</div>
              <div className="text-sm text-muted-foreground">
                {run.passedCount}✓ {run.failedCount}✗ {run.warningCount}⚠
              </div>
            </div>
            <Badge
              variant={run.overallStatus === 'PASS' ? 'success' : 'error'}
              className="shrink-0"
            >
              {run.overallStatus}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Accordion type="single" collapsible className="border-t">
            {run.results.map((result, index) => renderTestResult(result, index))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Diagnostics</span>
        </CardTitle>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={refreshHistory}
            disabled={isLoadingHistory}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            className="flex-1 h-11"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <Play className="mr-2 h-5 w-5" />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Startup failure alert */}
        {latestRun && hasLatestFailures && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Startup Failures</AlertTitle>
            <AlertDescription>
              {latestRun.failedCount} test(s) failed during startup. Expand the latest
              run below for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Error state */}
        {(runError || historyError) && (
          <Alert variant="destructive">
            <X className="h-5 w-5" />
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
              <span className="text-muted-foreground truncate">
                {currentTest || 'Initializing...'}
              </span>
              <span className="font-medium shrink-0 ml-2">
                {completedTests}/{totalTests}
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
            No history available. Tap "Run Tests" to start.
          </div>
        )}

        {/* Diagnostic history */}
        {history && history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">History</h3>
            <Accordion
              type="single"
              collapsible
              defaultValue={latestRun ? 'run-0' : undefined}
            >
              {history.map((run, index) => renderDiagnosticRun(run, index))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
