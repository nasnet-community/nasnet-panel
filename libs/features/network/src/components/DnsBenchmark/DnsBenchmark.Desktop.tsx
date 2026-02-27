/**
 * DNS Benchmark - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.3
 *
 * @description Desktop layout (>=640px) with data table sorted by response time.
 * Provides detailed DNS server benchmark results with status indicators and
 * response time metrics.
 */

import * as React from 'react';
import { Trophy, PlayCircle, AlertCircle } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives/table';
import { Badge } from '@nasnet/ui/primitives/badge';
import { Progress } from '@nasnet/ui/primitives/progress';
import { Icon } from '@nasnet/ui/primitives/icon';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { cn } from '@nasnet/ui/utils';
import { usePlatform } from '@nasnet/ui/layouts';
import { useDnsBenchmark } from './useDnsBenchmark';
import type { DnsBenchmarkProps } from './types';

/**
 * Desktop presenter for DNS Benchmark component
 *
 * @internal Platform presenter - use DnsBenchmark wrapper for auto-detection
 */
function DnsBenchmarkDesktopComponent({
  deviceId,
  autoRun = false,
  onSuccess,
  onError,
  className,
}: DnsBenchmarkProps) {
  const { isLoading, isSuccess, isError, result, error, progress, runBenchmark, reset } =
    useDnsBenchmark({
      deviceId,
      onSuccess,
      onError,
    });

  // Auto-run on mount if enabled
  React.useEffect(() => {
    if (autoRun) {
      runBenchmark();
    }
  }, [autoRun, runBenchmark]);

  const getStatusBadge = React.useCallback((status: string, isFastest: boolean) => {
    if (isFastest) {
      return (
        <Badge
          variant="success"
          className="gap-1"
        >
          <Trophy
            className="h-3 w-3"
            aria-hidden
          />
          Fastest
        </Badge>
      );
    }

    switch (status) {
      case 'GOOD':
        return <Badge variant="info">Good</Badge>;
      case 'SLOW':
        return <Badge variant="warning">Slow</Badge>;
      case 'UNREACHABLE':
        return <Badge variant="error">Unreachable</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }, []);

  const formatTime = React.useCallback((ms: number) => {
    if (ms < 0) return 'N/A';
    return `${ms}ms`;
  }, []);

  const handleRunBenchmark = React.useCallback(() => {
    runBenchmark();
  }, [runBenchmark]);

  const handleReset = React.useCallback(() => {
    reset();
  }, [reset]);

  return (
    <Card className={cn('category-networking', className)}>
      <CardHeader>
        <CardTitle>DNS Server Benchmark</CardTitle>
        <CardDescription>Test response times of all configured DNS servers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-component-md">
        <div className="gap-component-sm flex items-center">
          <Button
            onClick={handleRunBenchmark}
            disabled={isLoading}
            className="gap-component-sm"
            aria-label="Run DNS server benchmark"
          >
            <PlayCircle
              className="h-4 w-4"
              aria-hidden
            />
            {isLoading ? 'Running...' : 'Run Benchmark'}
          </Button>
          {result && !isLoading && (
            <Button
              variant="outline"
              onClick={handleReset}
              aria-label="Clear benchmark results"
            >
              Clear Results
            </Button>
          )}
        </div>

        {isLoading && (
          <div
            className="space-y-component-sm"
            role="status"
            aria-live="polite"
          >
            <Progress
              value={progress}
              className="w-full"
              aria-label={`Benchmark progress: ${progress}%`}
            />
            <p className="text-muted-foreground text-sm">Testing DNS servers...</p>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle
              className="h-4 w-4"
              aria-hidden
            />
            <AlertDescription>{error || 'Failed to run benchmark'}</AlertDescription>
          </Alert>
        )}

        {isSuccess && result && (
          <div className="space-y-component-md">
            <div className="text-muted-foreground text-sm">
              Tested with: <span className="font-mono font-medium">{result.testHostname}</span> •
              Total time: <span className="font-mono">{result.totalTimeMs}ms</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DNS Server</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.serverResults.map((server, index) => (
                  <TableRow key={server.server}>
                    <TableCell className="font-mono text-sm">{server.server}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          server.success ? 'text-success font-medium' : 'text-muted-foreground',
                          'font-mono'
                        )}
                      >
                        {formatTime(server.responseTimeMs)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(server.status, index === 0 && server.success)}
                    </TableCell>
                    <TableCell>
                      {server.error && <span className="text-error text-sm">{server.error}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

DnsBenchmarkDesktopComponent.displayName = 'DnsBenchmarkDesktop';

export const DnsBenchmarkDesktop = React.memo(DnsBenchmarkDesktopComponent);
