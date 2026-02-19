/**
 * DNS Benchmark - Mobile Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.4
 *
 * Mobile layout (<640px) with card-based results
 */

import * as React from 'react';
import { Button } from '@nasnet/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives/card';
import { Badge } from '@nasnet/ui/primitives/badge';
import { Progress } from '@nasnet/ui/primitives/progress';
import { AlertCircle, PlayCircle, Trophy, Server } from 'lucide-react';
import { useDnsBenchmark } from './useDnsBenchmark';
import type { DnsBenchmarkProps } from './types';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';

export function DnsBenchmarkMobile({ deviceId, autoRun = false, onSuccess, onError, className }: DnsBenchmarkProps) {
  const { isLoading, isSuccess, isError, result, error, progress, runBenchmark, reset } = useDnsBenchmark({
    deviceId,
    onSuccess,
    onError,
  });

  React.useEffect(() => {
    if (autoRun) {
      runBenchmark();
    }
  }, [autoRun, runBenchmark]);

  const getStatusBadge = (status: string, isFastest: boolean) => {
    if (isFastest) {
      return (
        <Badge variant="success" className="gap-1">
          <Trophy className="h-3 w-3" />
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
  };

  const formatTime = (ms: number) => {
    if (ms < 0) return 'N/A';
    return `${ms}ms`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">DNS Server Benchmark</CardTitle>
        <CardDescription className="text-sm">
          Test response times of all configured DNS servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <Button
            onClick={runBenchmark}
            disabled={isLoading}
            className="w-full gap-2 h-11"
            size="lg"
            aria-label="Run DNS server benchmark"
          >
            <PlayCircle className="h-5 w-5" />
            {isLoading ? 'Running...' : 'Run Benchmark'}
          </Button>
          {result && !isLoading && (
            <Button variant="outline" onClick={reset} className="w-full h-11" size="lg" aria-label="Clear benchmark results">
              Clear Results
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3" role="status" aria-live="polite">
            <Progress value={progress} className="w-full h-2" aria-label={`Benchmark progress: ${progress}%`} />
            <p className="text-sm text-info text-center">Testing DNS servers...</p>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Failed to run benchmark'}</AlertDescription>
          </Alert>
        )}

        {isSuccess && result && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
              Tested with: <span className="font-medium">{result.testHostname}</span>
              <br />
              Total time: {result.totalTimeMs}ms
            </div>

            <div className="space-y-3">
              {result.serverResults.map((server, index) => (
                <Card key={server.server} className="border-l-4" style={{
                  borderLeftColor: index === 0 && server.success ? 'var(--semantic-success)' :
                    !server.success ? 'var(--semantic-error)' :
                    server.status === 'SLOW' ? 'var(--semantic-warning)' :
                    'var(--semantic-info)'
                }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-sm break-all">{server.server}</span>
                      </div>
                      {getStatusBadge(server.status, index === 0 && server.success)}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Response Time</span>
                      <span className={`text-lg font-semibold ${server.success ? 'text-success' : 'text-muted-foreground'}`}>
                        {formatTime(server.responseTimeMs)}
                      </span>
                    </div>

                    {server.error && (
                      <div className="text-xs text-error bg-error/10 p-2 rounded">
                        {server.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
