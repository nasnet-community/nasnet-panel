/**
 * DNS Benchmark - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 5.3
 *
 * Desktop layout (>=640px) with data table sorted by response time
 */

import { Button } from '@nasnet/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives/card';
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
import { AlertCircle, PlayCircle, Trophy } from 'lucide-react';
import { useDnsBenchmark } from './useDnsBenchmark';
import type { DnsBenchmarkProps } from './types';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';

export function DnsBenchmarkDesktop({ deviceId, autoRun = false, onSuccess, onError, className }: DnsBenchmarkProps) {
  const { isLoading, isSuccess, isError, result, error, progress, runBenchmark, reset } = useDnsBenchmark({
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
        <CardTitle>DNS Server Benchmark</CardTitle>
        <CardDescription>
          Test response times of all configured DNS servers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={runBenchmark}
            disabled={isLoading}
            className="gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            {isLoading ? 'Running...' : 'Run Benchmark'}
          </Button>
          {result && !isLoading && (
            <Button variant="outline" onClick={reset}>
              Clear Results
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-semantic-info">Testing DNS servers...</p>
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
            <div className="text-sm text-muted-foreground">
              Tested with: <span className="font-medium">{result.testHostname}</span> • Total time: {result.totalTimeMs}ms
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
                    <TableCell className="font-mono text-sm">
                      {server.server}
                    </TableCell>
                    <TableCell>
                      <span className={server.success ? 'text-semantic-success font-medium' : 'text-muted-foreground'}>
                        {formatTime(server.responseTimeMs)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(server.status, index === 0 && server.success)}
                    </TableCell>
                    <TableCell>
                      {server.error && (
                        <span className="text-sm text-semantic-error">{server.error}</span>
                      )}
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

// Add React import for useEffect
import * as React from 'react';
