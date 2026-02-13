/**
 * CounterCellDesktop Component
 * Desktop presenter for counter visualization
 *
 * ADR-018: Headless + Platform Presenters
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Progress, Badge, cn, useReducedMotion } from '@nasnet/ui/primitives';
import { Activity, TrendingUp } from 'lucide-react';
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
export function CounterCellDesktop({
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
  const counterVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Packets Count */}
      <motion.div
        className="flex items-center gap-2 min-w-[120px]"
        {...counterVariants}
      >
        <Activity className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Packets</span>
          <span
            className={cn(
              'text-sm font-mono tabular-nums',
              isUnused && 'text-muted-foreground'
            )}
          >
            {formattedPackets}
          </span>
        </div>
      </motion.div>

      {/* Bytes Count */}
      <motion.div
        className="flex flex-col min-w-[100px]"
        {...counterVariants}
      >
        <span className="text-xs text-muted-foreground">Bytes</span>
        <span
          className={cn(
            'text-sm font-mono tabular-nums',
            isUnused && 'text-muted-foreground'
          )}
        >
          {formattedBytes}
        </span>
      </motion.div>

      {/* Rate Display (if enabled) */}
      {showRate && (
        <motion.div
          className="flex items-center gap-2 min-w-[80px]"
          {...counterVariants}
        >
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Rate</span>
            <span className="text-sm font-mono tabular-nums text-blue-600 dark:text-blue-400">
              Live
            </span>
          </div>
        </motion.div>
      )}

      {/* Progress Bar (if enabled) */}
      {showBar && (
        <div className="flex-1 min-w-[120px] max-w-[200px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {percentOfMax.toFixed(1)}%
            </span>
            {isUnused && (
              <Badge variant="outline" className="text-xs">
                Unused
              </Badge>
            )}
          </div>
          <Progress
            value={percentOfMax}
            className="h-2"
            indicatorClassName={cn(
              isUnused && 'bg-muted',
              !isUnused && percentOfMax > 80 && 'bg-red-500',
              !isUnused && percentOfMax > 50 && percentOfMax <= 80 && 'bg-amber-500',
              !isUnused && percentOfMax <= 50 && 'bg-green-500'
            )}
          />
        </div>
      )}
    </div>
  );
}
