/**
 * DNS Lookup Tool - Server Comparison Component
 *
 * Displays side-by-side comparison of DNS lookup results from multiple servers,
 * highlighting differences in query times and resolved records.
 *
 * @description Renders a grid of DNS lookup results with performance indicators.
 * Highlights the fastest response time with a success ring and visual badge.
 * Detects discrepancies when different servers return different numbers of records.
 * Includes a summary section with query statistics.
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.7
 * @see ADR-017 Three-Layer Component Architecture
 * @example
 * ```tsx
 * <DnsServerComparison
 *   results={[
 *     { hostname: 'example.com', recordType: 'A', status: 'SUCCESS', records: [...], ... },
 *   ]}
 * />
 * ```
 */

import { memo, useMemo } from 'react';
import { Card, CardHeader, CardContent, Badge, cn } from '@nasnet/ui/primitives';
import type { DnsLookupResult } from './DnsLookupTool.types';
import { DnsResults } from './DnsResults';
import { isErrorStatus } from './dnsLookup.utils';

export interface DnsServerComparisonProps {
  /** Array of DNS lookup results to compare */
  results: DnsLookupResult[];
  /** Optional CSS class for custom styling */
  className?: string;
}

export const DnsServerComparison = memo(function DnsServerComparison({
  results,
  className,
}: DnsServerComparisonProps) {
  // Memoize fastest time calculation
  const fastestTime = useMemo(
    () => Math.min(...results.map((r) => r.queryTime)),
    [results]
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No results to compare</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-component-md', className)}>
      <div className="text-sm text-muted-foreground mb-component-md">
        Comparing {results.length} DNS {results.length === 1 ? 'server' : 'servers'}
      </div>

      <div className="grid gap-component-md md:grid-cols-2">
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
              <CardHeader className="pb-component-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-mono break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {result.server}
                  </h3>
                  {isFastest && !hasError && (
                    <Badge variant="success">
                      Fastest
                    </Badge>
                  )}
                  {hasError && (
                    <Badge variant="error">{result.status}</Badge>
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
      <div className="mt-component-lg p-component-md bg-muted/50 rounded-card-sm">
        <h4 className="text-sm font-semibold mb-component-sm font-display">Comparison Summary</h4>
        <div className="grid grid-cols-2 gap-component-md text-sm">
          <div>
            <span className="text-muted-foreground">Successful queries:</span>
            <span className="ml-2 font-mono tabular-nums">
              {results.filter((r) => !isErrorStatus(r.status)).length} / {results.length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Fastest response:</span>
            <span className="ml-2 font-mono tabular-nums text-success">
              {fastestTime}
              ms
            </span>
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
              <div className="mt-component-sm p-component-sm bg-warning/10 border border-warning/20 rounded-md text-sm">
                <span className="text-warning font-medium">⚠ Discrepancy detected:</span>
                <span className="ml-component-sm text-muted-foreground">
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
