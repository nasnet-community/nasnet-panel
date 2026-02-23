/**
 * DiagnosticsPanel Mobile Presenter
 *
 * Mobile-optimized presenter for DiagnosticsPanel pattern.
 * Touch-first interface with 44px targets and simplified layout.
 *
 * @description
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Expandable accordions for test details
 * - Simplified layout for small screens
 * - Progress indicator during execution
 * - Startup failure alerts
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { Play, RefreshCw, Check, X, AlertTriangle, Minus } from 'lucide-react';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import {
  useDiagnosticsPanel,
  type DiagnosticsPanelProps,
} from './useDiagnosticsPanel';
import type { DiagnosticResult, StartupDiagnostics } from '@nasnet/api-client/queries';

/**
 * DiagnosticsPanelMobile component
 *
 * @description
 * Mobile presenter for DiagnosticsPanel with touch-optimized interface.
 * Uses accordions for test details with 44px touch targets.
 * Simplified layout for small screens with progressive disclosure.
 *
 * @param props - Component props
 * @returns Rendered mobile diagnostics panel
 */
function DiagnosticsPanelMobileComponent(props: DiagnosticsPanelProps) {
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

  const renderTestResult = React.useCallback((result: DiagnosticResult, index: number) => {
    const iconName = getStatusIcon(result.status);
    const statusIcon = getStatusIconComponent(iconName);

    return (
      <AccordionItem key={result.id} value={`test-${index}`}>
        <AccordionTrigger className="min-h-[44px] hover:no-underline">
          <div className="flex items-center gap-3 flex-1 text-left">
            <Icon icon={statusIcon as LucideIcon} className={cn('h-5 w-5 shrink-0', getStatusColor(result.status))} aria-hidden="true" />
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
  }, [getStatusIcon, getStatusColor]);

  const renderDiagnosticRun = React.useCallback((run: StartupDiagnostics, runIndex: number) => {
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
          <Accordion type="single" collapsible className="border-t" {...{} as any}>
            {run.results.map((result, index) => renderTestResult(result, index))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    );
  }, [renderTestResult]);

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
            <Icon icon={RefreshCw} className={cn('mr-2 h-5 w-5', isLoadingHistory && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
          <Button
            variant="default"
            className="flex-1 h-11"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <Icon icon={Play} className="mr-2 h-5 w-5" aria-hidden="true" />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Startup failure alert */}
        {latestRun && hasLatestFailures && (
          <Alert variant="destructive">
            <Icon icon={AlertTriangle} className="h-5 w-5" aria-hidden="true" />
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
            <Icon icon={X} className="h-5 w-5" aria-hidden="true" />
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
              {...{} as any}
            >
              {history.map((run, index) => renderDiagnosticRun(run, index))}
            </Accordion>
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

export const DiagnosticsPanelMobile = React.memo(DiagnosticsPanelMobileComponent);
DiagnosticsPanelMobile.displayName = 'DiagnosticsPanel.Mobile';
