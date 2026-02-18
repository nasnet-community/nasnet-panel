/**
 * CounterCellMobile Component
 * Mobile presenter for counter visualization
 *
 * ADR-018: Headless + Platform Presenters
 */

import { useMemo } from 'react';

import { Activity } from 'lucide-react';

import { Badge, cn, Progress } from '@nasnet/ui/primitives';

import { formatPackets, formatBytes } from './use-rule-counter-visualization';

import type { CounterCellProps } from './CounterCell';

/**
 * Mobile Presenter for CounterCell
 *
 * Displays counter statistics in a vertical stacked layout:
 * - Packets and bytes in vertical stack
 * - 44px minimum touch targets
 * - Simpler, cleaner layout (no rate display)
 * - Optional progress bar
 */
export function CounterCellMobile({
  packets,
  bytes,
  percentOfMax,
  isUnused,
  showBar = true,
  className,
}: CounterCellProps) {
  // Format values
  const formattedPackets = useMemo(() => formatPackets(packets), [packets]);
  const formattedBytes = useMemo(() => formatBytes(bytes), [bytes]);

  return (
    <div className={cn('flex flex-col gap-3 py-2', className)}>
      {/* Header with unused badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Traffic</span>
        </div>
        {isUnused && (
          <Badge variant="outline" className="text-xs">
            Unused
          </Badge>
        )}
      </div>

      {/* Counters - Vertical Stack */}
      <div className="flex flex-col gap-2">
        {/* Packets */}
        <div className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-md bg-muted/50">
          <span className="text-sm text-muted-foreground">Packets</span>
          <span
            className={cn(
              'text-base font-mono tabular-nums font-medium',
              isUnused && 'text-muted-foreground'
            )}
          >
            {formattedPackets}
          </span>
        </div>

        {/* Bytes */}
        <div className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-md bg-muted/50">
          <span className="text-sm text-muted-foreground">Bytes</span>
          <span
            className={cn(
              'text-base font-mono tabular-nums font-medium',
              isUnused && 'text-muted-foreground'
            )}
          >
            {formattedBytes}
          </span>
        </div>
      </div>

      {/* Progress Bar (if enabled) */}
      {showBar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Relative Traffic
            </span>
            <span className="text-xs font-medium tabular-nums">
              {percentOfMax.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={percentOfMax}
            className={cn(
              'h-2',
              isUnused && '[&>div]:bg-muted',
              !isUnused && percentOfMax > 80 && '[&>div]:bg-red-500',
              !isUnused && percentOfMax > 50 && percentOfMax <= 80 && '[&>div]:bg-amber-500',
              !isUnused && percentOfMax <= 50 && '[&>div]:bg-green-500'
            )}
          />
        </div>
      )}
    </div>
  );
}
