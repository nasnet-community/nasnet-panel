/**
 * DHCP Pool Card Component
 * Displays individual pool with utilization visualization
 */

import React from 'react';

import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DHCPPool, DHCPLease } from '@nasnet/core/types';

import { calculatePoolSize, getUtilizationTextColor, getUtilizationBgColor } from '../utils';

interface DHCPPoolCardProps {
  pool: DHCPPool;
  leases: DHCPLease[];
  className?: string;
}

export const DHCPPoolCard = React.memo(function DHCPPoolCard({ pool, leases, className = '' }: DHCPPoolCardProps) {
  const { t } = useTranslation('network');
  // Ensure ranges is always an array
  const ranges = Array.isArray(pool.ranges) ? pool.ranges : [];
  const totalSize = calculatePoolSize(ranges);
  const usedCount = leases.filter(l => l.status === 'bound').length;
  const availableCount = totalSize - usedCount;
  const utilizationPercent = totalSize > 0 ? Math.round((usedCount / totalSize) * 100) : 0;

  return (
    <div className={`bg-card rounded-card-sm border border-border p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-category-dhcp/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-category-dhcp" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {pool.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('dhcp.poolLabel')}
            </p>
          </div>
        </div>
        <span className={`text-lg font-bold ${getUtilizationTextColor(utilizationPercent)}`}>
          {utilizationPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-3">
        <div
          className={`${getUtilizationBgColor(utilizationPercent)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-md p-2">
          <p className="text-lg font-bold text-foreground">{usedCount}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.assigned')}</p>
        </div>
        <div className="bg-muted rounded-md p-2">
          <p className="text-lg font-bold text-foreground">{availableCount}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.available')}</p>
        </div>
        <div className="bg-muted rounded-md p-2">
          <p className="text-lg font-bold text-foreground">{totalSize}</p>
          <p className="text-xs text-muted-foreground">{t('dhcp.total')}</p>
        </div>
      </div>

      {/* IP Ranges */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-1">{t('dhcp.ipRanges')}</p>
        <div className="space-y-1">
          {ranges.length > 0 ? (
            ranges.map((range, idx) => (
              <p key={idx} className="text-sm font-mono text-foreground">
                {range}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">{t('dhcp.noRanges')}</p>
          )}
        </div>
      </div>
    </div>
  );
});

DHCPPoolCard.displayName = 'DHCPPoolCard';
