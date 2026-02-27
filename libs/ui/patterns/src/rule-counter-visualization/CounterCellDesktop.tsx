/**
 * CounterCellDesktop Component
 * Desktop presenter for counter visualization
 *
 * ADR-018: Headless + Platform Presenters
 */

import { memo, useMemo } from 'react';

import { motion } from 'framer-motion';
import { Activity, TrendingUp } from 'lucide-react';

import { Progress, Badge, cn, useReducedMotion } from '@nasnet/ui/primitives';

import { formatPackets, formatBytes } from './use-rule-counter-visualization';

import type { CounterCellProps } from './CounterCell';

/**
 * Desktop Presenter for CounterCell
 *
 * Displays counter statistics in a horizontal layout:
 * - Packets count | Bytes formatted | Rate (if enabled) | Progress bar (if enabled)
 * - Dense layout optimized for data tables
 * - Animated counters (respects prefers-reduced-motion)
 */
export const CounterCellDesktop = memo(function CounterCellDesktop({
  packets,
  bytes,
  percentOfMax,
  isUnused,
  showRate = false,
  showBar = true,
  className,
}: CounterCellProps) {
  const prefersReducedMotion = useReducedMotion();

  // Format values
  const formattedPackets = useMemo(() => formatPackets(packets), [packets]);
  const formattedBytes = useMemo(() => formatBytes(bytes), [bytes]);

  // Animation variants for counters
  const counterVariants =
    prefersReducedMotion ?
      {}
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Packets Count */}
      <motion.div
        className="flex min-w-[120px] items-center gap-2"
        {...counterVariants}
      >
        <Activity className="text-muted-foreground h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">Packets</span>
          <span
            className={cn('font-mono text-sm tabular-nums', isUnused && 'text-muted-foreground')}
          >
            {formattedPackets}
          </span>
        </div>
      </motion.div>

      {/* Bytes Count */}
      <motion.div
        className="flex min-w-[100px] flex-col"
        {...counterVariants}
      >
        <span className="text-muted-foreground text-xs">Bytes</span>
        <span className={cn('font-mono text-sm tabular-nums', isUnused && 'text-muted-foreground')}>
          {formattedBytes}
        </span>
      </motion.div>

      {/* Rate Display (if enabled) */}
      {showRate && (
        <motion.div
          className="flex min-w-[80px] items-center gap-2"
          {...counterVariants}
        >
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Rate</span>
            <span className="font-mono text-sm tabular-nums text-blue-600 dark:text-blue-400">
              Live
            </span>
          </div>
        </motion.div>
      )}

      {/* Progress Bar (if enabled) */}
      {showBar && (
        <div className="min-w-[120px] max-w-[200px] flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{percentOfMax.toFixed(1)}%</span>
            {isUnused && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                Unused
              </Badge>
            )}
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
});

CounterCellDesktop.displayName = 'CounterCellDesktop';
