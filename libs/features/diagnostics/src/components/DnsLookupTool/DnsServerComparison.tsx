/**
 * DNS Lookup Tool - Server Comparison Component
 *
 * Displays side-by-side comparison of DNS lookup results from multiple servers,
 * highlighting differences in query times and resolved records.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.7
 */

import { memo } from 'react';
import { Card, CardHeader, CardContent, Badge } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/core/utils';
import type { DnsLookupResult } from './DnsLookupTool.types';
import { DnsResults } from './DnsResults';
import { isErrorStatus } from './dnsLookup.utils';

export interface DnsServerComparisonProps {
  results: DnsLookupResult[];
  className?: string;
}

export const DnsServerComparison = memo(function DnsServerComparison({
  results,
  className,
}: DnsServerComparisonProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No results to compare</p>
      </div>
    );
  }

  // Find fastest query time
  const fastestTime = Math.min(...results.map((r) => r.queryTime));

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-sm text-muted-foreground mb-4">
        Comparing {results.length} DNS {results.length === 1 ? 'server' : 'servers'}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result, index) => {
          const isFastest = result.queryTime === fastestTime && results.length > 1;
          const hasError = isErrorStatus(result.status);

          return (
            <Card
              key={index}
              className={cn(
                'relative',
                isFastest && !hasError && 'ring-2 ring-success',
                hasError && 'opacity-75'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-mono">{result.server}</h3>
                  {isFastest && !hasError && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Fastest
                    </Badge>
                  )}
                  {hasError && (
                    <Badge variant="destructive">{result.status}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasError ? (
                  <div className="text-sm text-error">
                    {result.error || 'Query failed'}
                  </div>
                ) : (
                  <DnsResults result={result} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Comparison Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Successful queries:</span>
            <span className="ml-2 font-mono">
              {results.filter((r) => !isErrorStatus(r.status)).length} / {results.length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Fastest response:</span>
            <span className="ml-2 font-mono text-success">{fastestTime}ms</span>
          </div>
        </div>

        {/* Check for discrepancies in results */}
        {(() => {
          const successfulResults = results.filter((r) => !isErrorStatus(r.status));
          if (successfulResults.length < 2) return null;

          const recordCounts = successfulResults.map((r) => r.records.length);
          const hasDiscrepancy = new Set(recordCounts).size > 1;

          if (hasDiscrepancy) {
            return (
              <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded text-sm">
                <span className="text-warning font-medium">⚠ Discrepancy detected:</span>
                <span className="ml-2 text-muted-foreground">
                  Different servers returned different numbers of records
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
});

DnsServerComparison.displayName = 'DnsServerComparison';
