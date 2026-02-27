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

import { useDiagnosticsPanel, type DiagnosticsPanelProps } from './useDiagnosticsPanel';
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

  const renderTestResult = React.useCallback(
    (result: DiagnosticResult, index: number) => {
      const iconName = getStatusIcon(result.status);
      const statusIcon = getStatusIconComponent(iconName);

      return (
        <AccordionItem
          key={result.id}
          value={`test-${index}`}
        >
          <AccordionTrigger className="focus-visible:ring-ring min-h-[44px] hover:no-underline focus-visible:outline-none focus-visible:ring-2">
            <div className="gap-component-md flex flex-1 items-center text-left">
              <Icon
                icon={statusIcon as LucideIcon}
                className={cn('h-5 w-5 shrink-0', getStatusColor(result.status))}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{result.testName}</div>
                <p className="text-muted-foreground truncate text-sm">{result.message}</p>
              </div>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {formatDuration(result.durationMs)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-component-md p-component-sm bg-muted/50 rounded-[var(--semantic-radius-button)]">
              {result.details && (
                <div className="text-sm">
                  <strong className="text-muted-foreground">Details:</strong>
                  <p className="mt-component-sm whitespace-pre-wrap font-mono text-xs">
                    {result.details}
                  </p>
                </div>
              )}
              {result.errorMessage && (
                <div className="text-sm">
                  <strong className="text-error">Error:</strong>
                  <p className="mt-component-sm text-error whitespace-pre-wrap font-mono text-xs">
                    {result.errorMessage}
                  </p>
                </div>
              )}
              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <div className="text-sm">
                  <strong className="text-muted-foreground">Metadata:</strong>
                  <pre className="mt-component-sm overflow-x-auto font-mono text-xs">
                    {JSON.stringify(result.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    },
    [getStatusIcon, getStatusColor]
  );

  const renderDiagnosticRun = React.useCallback(
    (run: StartupDiagnostics, runIndex: number) => {
      const timestamp = new Date(run.timestamp).toLocaleString();

      return (
        <AccordionItem
          key={run.runGroupID}
          value={`run-${runIndex}`}
        >
          <AccordionTrigger className="focus-visible:ring-ring min-h-[44px] hover:no-underline focus-visible:outline-none focus-visible:ring-2">
            <div className="gap-component-md flex flex-1 items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm font-medium">{timestamp}</div>
                <div className="text-muted-foreground text-sm">
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
            <Accordion
              type="single"
              collapsible
              className="border-border border-t"
              {...({} as any)}
            >
              {run.results.map((result, index) => renderTestResult(result, index))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      );
    },
    [renderTestResult]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Diagnostics</span>
        </CardTitle>

        {/* Action buttons */}
        <div className="gap-component-sm mt-component-md flex items-center">
          <Button
            variant="outline"
            className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2"
            onClick={refreshHistory}
            disabled={isLoadingHistory}
          >
            <Icon
              icon={RefreshCw}
              className={cn('mr-component-sm h-5 w-5', isLoadingHistory && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button
            variant="default"
            className="focus-visible:ring-ring min-h-[44px] flex-1 focus-visible:outline-none focus-visible:ring-2"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            <Icon
              icon={Play}
              className="mr-component-sm h-5 w-5"
              aria-hidden="true"
            />
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-component-md">
        {/* Startup failure alert */}
        {latestRun && hasLatestFailures && (
          <Alert variant="destructive">
            <Icon
              icon={AlertTriangle}
              className="h-5 w-5"
              aria-hidden="true"
            />
            <AlertTitle>Startup Failures</AlertTitle>
            <AlertDescription>
              {latestRun.failedCount} test(s) failed during startup. Expand the latest run below for
              details.
            </AlertDescription>
          </Alert>
        )}

        {/* Error state */}
        {(runError || historyError) && (
          <Alert variant="destructive">
            <Icon
              icon={X}
              className="h-5 w-5"
              aria-hidden="true"
            />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{runError?.message || historyError?.message}</AlertDescription>
          </Alert>
        )}

        {/* Progress during test execution */}
        {isRunning && (
          <div className="space-y-component-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate font-mono text-xs">
                {currentTest || 'Initializing...'}
              </span>
              <span className="ml-component-md shrink-0 font-mono text-xs font-medium">
                {completedTests}/{totalTests}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2"
            />
          </div>
        )}

        {/* Loading state */}
        {isLoadingHistory && !history && (
          <div className="p-component-md text-muted-foreground text-center font-mono text-sm">
            Loading diagnostic history...
          </div>
        )}

        {/* Empty state */}
        {!isLoadingHistory && !history?.length && (
          <div className="p-component-md text-muted-foreground text-center font-mono text-sm">
            No history available. Tap "Run Tests" to start.
          </div>
        )}

        {/* Diagnostic history */}
        {history && history.length > 0 && (
          <div className="space-y-component-md">
            <h3 className="text-muted-foreground text-sm font-medium">History</h3>
            <Accordion
              type="single"
              collapsible
              defaultValue={latestRun ? 'run-0' : undefined}
              {...({} as any)}
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
function getStatusIconComponent(
  status: 'check' | 'x' | 'alert' | 'minus'
): React.ComponentType<any> {
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
