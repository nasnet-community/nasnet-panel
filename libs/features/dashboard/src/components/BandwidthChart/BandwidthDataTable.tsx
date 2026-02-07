/**
 * BandwidthDataTable - Accessible table alternative for bandwidth chart
 * Provides screen reader accessible data representation (WCAG AAA)
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { formatBitrate, formatBytes } from './utils';
import type { BandwidthDataTableProps } from './types';

/**
 * BandwidthDataTable component
 *
 * Provides accessible data table for screen readers as alternative to chart
 * - Hidden visually but accessible to assistive technologies
 * - Can be toggled visible for users who prefer tabular data
 * - Includes all data points with timestamp, rates, and totals
 *
 * @param props - Component props
 */
export const BandwidthDataTable = memo<BandwidthDataTableProps>(
  ({ dataPoints, timeRange, className }) => {
    // Limit displayed points to avoid excessive table size
    // Show latest 50 points for readability
    const displayedPoints = dataPoints.slice(-50);

    return (
      <div
        className={cn(
          // Screen reader only by default
          'sr-only',
          // Can be made visible with data-visible attribute
          'data-[visible=true]:not-sr-only',
          className
        )}
        role="region"
        aria-label="Bandwidth data table"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="mb-2 text-left text-lg font-semibold">
            Bandwidth Data - {timeRange} time range
            {displayedPoints.length < dataPoints.length && (
              <span className="text-muted-foreground">
                {' '}
                (showing latest {displayedPoints.length} of {dataPoints.length}{' '}
                points)
              </span>
            )}
          </caption>
          <thead>
            <tr className="border-b">
              <th
                scope="col"
                className="px-4 py-2 text-left font-medium"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                TX Rate
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                RX Rate
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                TX Total
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right font-medium"
              >
                RX Total
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedPoints.map((point, index) => {
              const timestamp = new Date(point.timestamp);
              return (
                <tr
                  key={`${point.timestamp}-${index}`}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-2">
                    {timestamp.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatBitrate(point.txRate)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatBitrate(point.rxRate)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatBytes(point.txBytes)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatBytes(point.rxBytes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

BandwidthDataTable.displayName = 'BandwidthDataTable';
