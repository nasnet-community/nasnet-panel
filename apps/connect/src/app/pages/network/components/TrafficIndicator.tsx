/**
 * Traffic Indicator Component
 * Compact inline traffic visualization with mini bars
 */

import React from 'react';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatBytes } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

interface TrafficIndicatorProps {
  txBytes: number;
  rxBytes: number;
  txRate?: number;
  rxRate?: number;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export const TrafficIndicator = React.memo(function TrafficIndicator({
  txBytes,
  rxBytes,
  txRate,
  rxRate,
  showLabels = false,
  compact = false,
  className,
}: TrafficIndicatorProps) {
  const { t } = useTranslation('network');
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 font-mono text-xs', className)}>
        <span className="text-success flex min-h-[44px] content-center items-center gap-1">
          <ArrowDown
            className="h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono">{formatBytes(rxBytes)}</span>
        </span>
        <span className="text-secondary flex min-h-[44px] content-center items-center gap-1">
          <ArrowUp
            className="h-3 w-3 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="font-mono">{formatBytes(txBytes)}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex min-h-[44px] items-center gap-2">
        <div className="flex min-w-[60px] flex-shrink-0 items-center gap-1.5">
          <ArrowDown
            className="text-success h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          {showLabels && <span className="text-muted-foreground text-xs">{t('traffic.rx')}</span>}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-foreground font-mono text-xs">{formatBytes(rxBytes)}</span>
            {rxRate !== undefined && (
              <span className="text-success font-mono text-xs font-medium">
                {formatBytes(rxRate)}/s
              </span>
            )}
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full shadow-sm">
            <div className="from-success/70 to-success h-full w-full rounded-full bg-gradient-to-r" />
          </div>
        </div>
      </div>

      <div className="flex min-h-[44px] items-center gap-2">
        <div className="flex min-w-[60px] flex-shrink-0 items-center gap-1.5">
          <ArrowUp
            className="text-secondary h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          {showLabels && <span className="text-muted-foreground text-xs">{t('traffic.tx')}</span>}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-foreground font-mono text-xs">{formatBytes(txBytes)}</span>
            {txRate !== undefined && (
              <span className="text-secondary font-mono text-xs font-medium">
                {formatBytes(txRate)}/s
              </span>
            )}
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full shadow-sm">
            <div className="from-secondary/70 to-secondary h-full w-full rounded-full bg-gradient-to-r" />
          </div>
        </div>
      </div>
    </div>
  );
});

TrafficIndicator.displayName = 'TrafficIndicator';
