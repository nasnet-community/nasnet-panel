/**
 * TracerouteHopsList - Component to display traceroute hops
 *
 * Displays a list of discovered hops with latency color-coding:
 * - Green: <50ms (excellent)
 * - Yellow: 50-150ms (acceptable)
 * - Red: >150ms (poor)
 * - Gray: timeout (no response)
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { Clock, Server, AlertCircle } from 'lucide-react';
import type { TracerouteHop } from './TracerouteTool.types';

interface TracerouteHopsListProps {
  /** List of discovered hops */
  hops: TracerouteHop[];
  /** Whether traceroute is currently running */
  isRunning: boolean;
}

/**
 * Get latency color class based on average latency
 */
function getLatencyColorClass(avgLatencyMs: number | null | undefined): string {
  if (avgLatencyMs === null || avgLatencyMs === undefined) {
    return 'text-muted-foreground'; // Timeout/no response
  }
  if (avgLatencyMs < 50) {
    return 'text-green-600 dark:text-green-400'; // Excellent
  }
  if (avgLatencyMs < 150) {
    return 'text-yellow-600 dark:text-yellow-400'; // Acceptable
  }
  return 'text-red-600 dark:text-red-400'; // Poor
}

/**
 * Format latency for display
 */
function formatLatency(latencyMs: number | null | undefined): string {
  if (latencyMs === null || latencyMs === undefined) {
    return '* * *'; // Timeout
  }
  return `${latencyMs.toFixed(1)} ms`;
}

/**
 * TracerouteHopsList component
 *
 * Displays hops in a scrollable list with latency color-coding.
 */
export const TracerouteHopsList = memo(function TracerouteHopsList({
  hops,
  isRunning,
}: TracerouteHopsListProps) {
  if (hops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No hops discovered yet</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-2 max-h-[600px] overflow-y-auto pr-2"
      role="list"
      aria-label="Traceroute hops"
    >
      {hops.map((hop) => {
        const latencyColorClass = getLatencyColorClass(hop.avgLatencyMs);
        const hasTimeout = hop.probes.some((probe) => !probe.success);

        return (
          <div
            key={hop.hopNumber}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors',
              'hover:bg-accent/50'
            )}
            role="listitem"
          >
            {/* Hop number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-mono font-semibold text-primary">
                {hop.hopNumber}
              </span>
            </div>

            {/* Hop details */}
            <div className="flex-1 min-w-0">
              {/* Address and hostname */}
              <div className="flex items-center gap-2 mb-1">
                {hop.status === 'TIMEOUT' || hop.status === 'UNREACHABLE' ? (
                  <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {hop.address ? (
                    <>
                      <span className="font-mono text-sm font-medium break-all">
                        {hop.address}
                      </span>
                      {hop.hostname && hop.hostname !== hop.address && (
                        <span className="text-xs text-muted-foreground ml-2 break-all">
                          ({hop.hostname})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground font-mono">
                      * * * (no response)
                    </span>
                  )}
                </div>
              </div>

              {/* Latency and probes */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className={cn('h-3 w-3', latencyColorClass)} aria-hidden="true" />
                  <span className={cn('font-mono font-medium', latencyColorClass)}>
                    {formatLatency(hop.avgLatencyMs)}
                  </span>
                </div>

                {/* Individual probe latencies */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  {hop.probes.map((probe, idx) => (
                    <span
                      key={`${hop.hopNumber}-probe-${probe.probeNumber}`}
                      className={cn(
                        probe.success && probe.latencyMs !== null
                          ? getLatencyColorClass(probe.latencyMs)
                          : 'text-muted-foreground'
                      )}
                    >
                      {probe.success && probe.latencyMs !== null
                        ? `${probe.latencyMs.toFixed(1)}`
                        : '*'}
                    </span>
                  ))}
                </div>

                {/* Packet loss indicator */}
                {hop.packetLoss > 0 && (
                  <span className="text-xs text-destructive font-medium">
                    {hop.packetLoss.toFixed(0)}% loss
                  </span>
                )}

                {/* ICMP code if available */}
                {hasTimeout && hop.probes.some((p) => p.icmpCode) && (
                  <span className="text-xs text-muted-foreground">
                    {hop.probes.find((p) => p.icmpCode)?.icmpCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading indicator for next hop */}
      {isRunning && (
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border bg-card border-dashed',
            'opacity-50'
          )}
          role="status"
          aria-live="polite"
          aria-label="Discovering next hop"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-mono font-semibold text-primary">
              {hops.length + 1}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">
              Discovering hop {hops.length + 1}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TracerouteHopsList.displayName = 'TracerouteHopsList';
