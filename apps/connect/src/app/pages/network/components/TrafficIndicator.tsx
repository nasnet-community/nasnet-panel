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
      <div className={cn('flex items-center gap-3 text-xs font-mono', className)}>
        <span className="flex items-center gap-1 text-success">
          <ArrowDown className="w-3 h-3" />
          {formatBytes(rxBytes)}
        </span>
        <span className="flex items-center gap-1 text-secondary">
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
          <ArrowDown className="w-3.5 h-3.5 text-success" />
          {showLabels && (
            <span className="text-xs text-muted-foreground">{t('traffic.rx')}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground">
              {formatBytes(rxBytes)}
            </span>
            {rxRate !== undefined && (
              <span className="text-xs font-mono text-success">
                {formatBytes(rxRate)}/s
              </span>
            )}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success/60 to-success rounded-full w-full" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-[60px]">
          <ArrowUp className="w-3.5 h-3.5 text-secondary" />
          {showLabels && (
            <span className="text-xs text-muted-foreground">{t('traffic.tx')}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-foreground">
              {formatBytes(txBytes)}
            </span>
            {txRate !== undefined && (
              <span className="text-xs font-mono text-secondary">
                {formatBytes(txRate)}/s
              </span>
            )}
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary/60 to-secondary rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
});

TrafficIndicator.displayName = 'TrafficIndicator';

























