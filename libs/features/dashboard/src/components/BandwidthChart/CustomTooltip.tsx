/**
 * CustomTooltip - Custom Recharts tooltip for bandwidth chart
 * Displays timestamp, rates (TX/RX), and total bytes (AC 5.5.3)
 * @description
 * Renders an accessible tooltip with bandwidth metrics. Shows TX/RX rates with
 * color-coded indicators and total bytes. WCAG AAA compliant with proper contrast,
 * semantic HTML, and screen reader support via aria-live updates.
 * @example
 * <CustomTooltip active={true} payload={[...]} label={timestamp} />
 */

import { memo } from 'react';
import { cn } from '@nasnet/ui/utils';
import { formatBitrate, formatBytes } from './utils';
import type { CustomTooltipProps } from './types';

/**
 * CustomTooltip component for Recharts
 *
 * Requirements (AC 5.5.3):
 * - Timestamp (e.g., "14:35:22")
 * - TX rate (e.g., "2.5 Mbps")
 * - RX rate (e.g., "15.2 Mbps")
 * - TX bytes total (e.g., "450 MB")
 * - RX bytes total (e.g., "2.1 GB")
 *
 * Accessibility features:
 * - role="tooltip" for semantic structure
 * - aria-live="polite" for screen reader announcements
 * - 7:1 contrast ratio for WCAG AAA compliance
 * - Color paired with text labels (not sole identifier)
 *
 * @param props - Recharts tooltip props with active state, payload, and label
 */
export const CustomTooltip = memo<CustomTooltipProps>(
  ({ active, payload, label }) => {
    // Hide tooltip when not active or no data
    if (!active || !payload?.length) return null;

    // Extract data from Recharts payload
    const txData = payload.find((p) => p.dataKey === 'txRate');
    const rxData = payload.find((p) => p.dataKey === 'rxRate');
    const dataPoint = payload[0]?.payload;

    // Parse timestamp
    const timestamp = label ? new Date(label) : new Date();

    return (
      <div
        className={cn(
          'rounded-lg border bg-background p-3 shadow-lg',
          'text-sm',
          // Ensure proper contrast for accessibility (WCAG AAA)
          'contrast-more:border-2'
        )}
        role="tooltip"
        aria-live="polite"
      >
        {/* Timestamp */}
        <p className="mb-2 text-muted-foreground">
          {timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </p>

        {/* Traffic rates */}
        <div className="space-y-1">
          {/* TX Rate */}
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: '#3B82F6' }}
              aria-hidden="true"
            />
            <span className="font-medium">TX:</span>
            <span>{formatBitrate(txData?.value || 0)}</span>
          </div>

          {/* RX Rate */}
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: '#22C55E' }}
              aria-hidden="true"
            />
            <span className="font-medium">RX:</span>
            <span>{formatBitrate(rxData?.value || 0)}</span>
          </div>
        </div>

        {/* Total bytes (if available) */}
        {dataPoint && (
          <>
            <hr className="my-2 border-border" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">TX Total:</span>{' '}
                {formatBytes(dataPoint.txBytes)}
              </p>
              <p>
                <span className="font-medium">RX Total:</span>{' '}
                {formatBytes(dataPoint.rxBytes)}
              </p>
            </div>
          </>
        )}
      </div>
    );
  }
);

CustomTooltip.displayName = 'CustomTooltip';
