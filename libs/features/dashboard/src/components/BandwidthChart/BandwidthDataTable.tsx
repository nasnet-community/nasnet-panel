/**
 * BandwidthDataTable - Accessible tabular representation of bandwidth data
 *
 * @description
 * Provides screen reader-optimized table alternative to chart visualization.
 * Hidden visually by default (`sr-only`) but fully accessible to assistive
 * technologies. Includes timestamp, TX/RX rates (in bps, tabular-nums font),
 * and total transferred bytes. Limited to latest 50 points for readability.
 *
 * **Accessibility:** Table has semantic `<caption>`, `<thead>/<tbody>`,
 * `scope="col"` headers, and `role="region"` for easy navigation.
 * All numerical data uses `font-variant-numeric: tabular-nums` for alignment.
 *
 * **Design Tokens:** Uses semantic spacing and color tokens. Supports toggle
 * to make visible for users preferring tabular data via `data-visible=true`.
 *
 * @param props - Component props { dataPoints, timeRange, className? }
 * @param props.dataPoints - Array of bandwidth measurement points
 * @param props.timeRange - Current time range ('5m', '1h', '24h') for caption
 * @param props.className - Optional CSS class name
 *
 * @returns Memoized table component, screen-reader-only by default
 *
 * @example
 * ```tsx
 * <BandwidthDataTable
 *   dataPoints={historicalData}
 *   timeRange="1h"
 *   className="mt-4"
 * />
 * ```
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { formatBitrate, formatBytes } from './utils';
import type { BandwidthDataTableProps } from './types';
export const BandwidthDataTable = memo<BandwidthDataTableProps>(
  ({ dataPoints, timeRange, className }) => {
    // Limit displayed points to avoid excessive table size
    // Show latest 50 points for readability
    const displayedPoints = dataPoints.slice(-50);

    return (
      <div
        className={cn(
          // Screen reader only by default (hidden visually)
          'sr-only',
          // Can be made visible with data-visible attribute
          'data-[visible=true]:not-sr-only',
          className
        )}
        role="region"
        aria-label="Bandwidth data table"
        aria-live="polite"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="font-display mb-2 text-left text-lg font-semibold">
            Bandwidth Data Table - {timeRange} time range
            {displayedPoints.length < dataPoints.length && (
              <span className="text-muted-foreground">
                {' '}
                (showing latest {displayedPoints.length} of {dataPoints.length} data points)
              </span>
            )}
          </caption>
          <thead>
            <tr className="border-border">
              <th
                scope="col"
                className="px-component-md py-component-sm text-left font-medium"
              >
                Timestamp
              </th>
              <th
                scope="col"
                className="px-component-md py-component-sm text-right font-medium"
              >
                TX Rate (bps)
              </th>
              <th
                scope="col"
                className="px-component-md py-component-sm text-right font-medium"
              >
                RX Rate (bps)
              </th>
              <th
                scope="col"
                className="px-component-md py-component-sm text-right font-medium"
              >
                TX Total (bytes)
              </th>
              <th
                scope="col"
                className="px-component-md py-component-sm text-right font-medium"
              >
                RX Total (bytes)
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedPoints.map((point, index) => {
              const timestamp = new Date(point.timestamp);
              return (
                <tr
                  key={`${point.timestamp}-${index}`}
                  className="border-border hover:bg-muted/50 last:border-0"
                >
                  <td className="px-component-md py-component-sm font-mono">
                    {timestamp.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-component-md py-component-sm text-right font-mono">
                    {formatBitrate(point.txRate)}
                  </td>
                  <td className="px-component-md py-component-sm text-right font-mono">
                    {formatBitrate(point.rxRate)}
                  </td>
                  <td className="px-component-md py-component-sm text-right font-mono">
                    {formatBytes(point.txBytes)}
                  </td>
                  <td className="px-component-md py-component-sm text-right font-mono">
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
