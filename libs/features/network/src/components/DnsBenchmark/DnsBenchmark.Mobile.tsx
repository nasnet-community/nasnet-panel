/**
 * DNS Benchmark - Mobile Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.4
 *
 * @description Mobile layout (<640px) with card-based results.
 * Optimized for touch with full-width buttons and responsive spacing.
 */

import * as React from 'react';
import { Trophy, PlayCircle, Server, AlertCircle } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives/card';
import { Badge } from '@nasnet/ui/primitives/badge';
import { Progress } from '@nasnet/ui/primitives/progress';
import { Icon } from '@nasnet/ui/primitives/icon';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { cn } from '@nasnet/ui/utils';
import { useDnsBenchmark } from './useDnsBenchmark';
import type { DnsBenchmarkProps } from './types';

/**
 * Mobile presenter for DNS Benchmark component
 *
 * @internal Platform presenter - use DnsBenchmark wrapper for auto-detection
 */
function DnsBenchmarkMobileComponent({
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

  React.useEffect(() => {
    if (autoRun) {
      runBenchmark();
    }
  }, [autoRun, runBenchmark]);

  const getStatusBadge = React.useCallback(
    (status: string, isFastest: boolean) => {
      if (isFastest) {
        return (
          <Badge variant="success" className="gap-1">
            <Trophy className="h-3 w-3" aria-hidden />
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
    },
    []
  );

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
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>DNS Server Benchmark</CardTitle>
        <CardDescription>
          Test response times of all configured DNS servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-component-md">
        <div className="flex flex-col gap-component-sm">
          <Button
            onClick={handleRunBenchmark}
            disabled={isLoading}
            className="w-full gap-2 h-11"
            size="lg"
            aria-label="Run DNS server benchmark"
          >
            <PlayCircle className="h-5 w-5" aria-hidden />
            {isLoading ? 'Running...' : 'Run Benchmark'}
          </Button>
          {result && !isLoading && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full h-11"
              size="lg"
              aria-label="Clear benchmark results"
            >
              Clear Results
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-component-sm" role="status" aria-live="polite">
            <Progress
              value={progress}
              className="w-full h-2"
              aria-label={`Benchmark progress: ${progress}%`}
            />
            <p className="text-sm text-info text-center">Testing DNS servers...</p>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription>{error || 'Failed to run benchmark'}</AlertDescription>
          </Alert>
        )}

        {isSuccess && result && (
          <div className="space-y-component-md">
            <div className="text-xs text-muted-foreground text-center p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
              Tested with:{' '}
              <span className="font-mono font-medium">{result.testHostname}</span>
              <br />
              Total time: <span className="font-mono">{result.totalTimeMs}ms</span>
            </div>

            <div className="space-y-component-sm">
              {result.serverResults.map((server, index) => {
                const borderColor =
                  index === 0 && server.success
                    ? 'var(--semantic-success)'
                    : !server.success
                      ? 'var(--semantic-error)'
                      : server.status === 'SLOW'
                        ? 'var(--semantic-warning)'
                        : 'var(--semantic-info)';

                return (
                  <Card
                    key={server.server}
                    className="border-l-4"
                    style={{ borderLeftColor: borderColor }}
                  >
                    <CardContent className="p-component-md space-y-component-sm">
                      <div className="flex items-start justify-between gap-component-sm">
                        <div className="flex items-center gap-component-sm">
                          <Server
                            className="h-4 w-4 text-muted-foreground flex-shrink-0"
                            aria-hidden
                          />
                          <span className="font-mono text-sm break-all">
                            {server.server}
                          </span>
                        </div>
                        {getStatusBadge(
                          server.status,
                          index === 0 && server.success
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Response Time
                        </span>
                        <span
                          className={cn(
                            'text-lg font-semibold font-mono',
                            server.success ? 'text-success' : 'text-muted-foreground'
                          )}
                        >
                          {formatTime(server.responseTimeMs)}
                        </span>
                      </div>

                      {server.error && (
                        <div className="text-xs text-error bg-error/10 p-component-sm rounded-[var(--semantic-radius-button)]">
                          {server.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

DnsBenchmarkMobileComponent.displayName = 'DnsBenchmarkMobile';

export const DnsBenchmarkMobile = React.memo(DnsBenchmarkMobileComponent);
