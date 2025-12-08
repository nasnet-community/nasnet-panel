/**
 * Traffic Indicator Component
 * Compact inline traffic visualization with mini bars
 */

import { formatBytes } from '@nasnet/core/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrafficIndicatorProps {
  txBytes: number;
  rxBytes: number;
  txRate?: number;
  rxRate?: number;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export function TrafficIndicator({
  txBytes,
  rxBytes,
  txRate,
  rxRate,
  showLabels = false,
  compact = false,
  className,
}: TrafficIndicatorProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 text-xs font-mono', className)}>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <ArrowDown className="w-3 h-3" />
          {formatBytes(rxBytes)}
        </span>
        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
          <ArrowUp className="w-3 h-3" />
          {formatBytes(txBytes)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-[60px]">
          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
          {showLabels && (
            <span className="text-xs text-slate-500 dark:text-slate-400">RX</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
              {formatBytes(rxBytes)}
            </span>
            {rxRate !== undefined && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                {formatBytes(rxRate)}/s
              </span>
            )}
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full w-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-[60px]">
          <ArrowUp className="w-3.5 h-3.5 text-purple-500" />
          {showLabels && (
            <span className="text-xs text-slate-500 dark:text-slate-400">TX</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
              {formatBytes(txBytes)}
            </span>
            {txRate !== undefined && (
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                {formatBytes(txRate)}/s
              </span>
            )}
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}




