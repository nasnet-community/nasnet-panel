/**
 * PingStatistics Component
 *
 * Displays ping test statistics in a semantic definition list.
 * Shows:
 * - Packets sent/received/lost
 * - Packet loss percentage with color coding
 * - Min/Avg/Max RTT
 * - Standard deviation
 *
 * Uses semantic HTML (dl/dt/dd) for accessibility.
 */

import { memo } from 'react';
import { Badge, cn } from '@nasnet/ui/primitives';
import type { PingStatistics as PingStatisticsType } from './PingTool.types';

/**
 * Props for PingStatistics component
 */
export interface PingStatisticsProps {
  /** Statistics to display */
  statistics: PingStatisticsType;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Get status color based on packet loss percentage
 */
function getStatusColor(lossPercent: number): string {
  if (lossPercent >= 100) return 'text-error'; // Red - host unreachable
  if (lossPercent >= 50) return 'text-error'; // Red - critical loss
  if (lossPercent > 0) return 'text-warning'; // Amber - some loss
  return 'text-success'; // Green - no loss
}

/**
 * Get badge variant based on packet loss
 */
function getBadgeVariant(lossPercent: number): 'error' | 'warning' | 'success' {
  if (lossPercent >= 50) return 'error';
  if (lossPercent > 0) return 'warning';
  return 'success';
}

/**
 * Format RTT value with unit
 */
function formatRtt(rtt: number | null): string {
  if (rtt === null) return 'N/A';
  return `${rtt.toFixed(2)} ms`;
}

/**
 * PingStatistics - Display ping test statistics
 *
 * Semantic component using dl/dt/dd for accessibility.
 * Color-codes packet loss based on severity.
 * Shows RTT values in monospace font for technical readability.
 *
 * @example
 * ```tsx
 * <PingStatistics
 *   statistics={{
 *     sent: 10,
 *     received: 9,
 *     lost: 1,
 *     lossPercent: 10,
 *     minRtt: 11.8,
 *     avgRtt: 12.9,
 *     maxRtt: 14.2,
 *     stdDev: 0.95,
 *   }}
 * />
 * ```
 */
export const PingStatistics = memo(function PingStatistics({
  statistics,
  className,
}: PingStatisticsProps) {
  const { sent, received, lost, lossPercent, minRtt, avgRtt, maxRtt, stdDev } = statistics;

  const statusColor = getStatusColor(lossPercent);
  const badgeVariant = getBadgeVariant(lossPercent);

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistics</h3>
        {lossPercent >= 100 ?
          <Badge variant="error">Host Unreachable</Badge>
        : lossPercent > 0 ?
          <Badge variant={badgeVariant}>{lossPercent}% Loss</Badge>
        : sent > 0 ?
          <Badge variant="success">No Loss</Badge>
        : null}
      </div>

      {/* Statistics grid */}
      <dl
        className="gap-component-lg grid grid-cols-2"
        aria-label="Ping statistics summary"
      >
        {/* Packets Sent */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Packets Sent</dt>
          <dd className="text-2xl font-bold">{sent}</dd>
        </div>

        {/* Packets Received */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Packets Received</dt>
          <dd className="text-success text-2xl font-bold">{received}</dd>
        </div>

        {/* Packets Lost */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Packets Lost</dt>
          <dd className={cn('text-2xl font-bold', lost > 0 && 'text-error')}>{lost}</dd>
        </div>

        {/* Packet Loss Percentage */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Packet Loss</dt>
          <dd className={cn('text-2xl font-bold', statusColor)}>{lossPercent}%</dd>
        </div>

        {/* Min RTT */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Min RTT</dt>
          <dd className="font-mono text-lg font-semibold">{formatRtt(minRtt)}</dd>
        </div>

        {/* Avg RTT */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Avg RTT</dt>
          <dd className="font-mono text-lg font-semibold">{formatRtt(avgRtt)}</dd>
        </div>

        {/* Max RTT */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Max RTT</dt>
          <dd className="font-mono text-lg font-semibold">{formatRtt(maxRtt)}</dd>
        </div>

        {/* Std Dev */}
        <div className="space-y-component-xs">
          <dt className="text-muted-foreground text-sm">Std Dev</dt>
          <dd className="text-muted-foreground font-mono text-lg font-semibold">
            {formatRtt(stdDev)}
          </dd>
        </div>
      </dl>
    </div>
  );
});

PingStatistics.displayName = 'PingStatistics';
