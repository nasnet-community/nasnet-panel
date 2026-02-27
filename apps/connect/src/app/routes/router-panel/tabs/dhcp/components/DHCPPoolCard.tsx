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

export const DHCPPoolCard = React.memo(function DHCPPoolCard({
  pool,
  leases,
  className = '',
}: DHCPPoolCardProps) {
  const { t } = useTranslation('network');
  // Ensure ranges is always an array
  const ranges = Array.isArray(pool.ranges) ? pool.ranges : [];
  const totalSize = calculatePoolSize(ranges);
  const usedCount = leases.filter((l) => l.status === 'bound').length;
  const availableCount = totalSize - usedCount;
  const utilizationPercent = totalSize > 0 ? Math.round((usedCount / totalSize) * 100) : 0;

  return (
    <div
      className={`bg-card rounded-card-sm border-border border-l-category-dhcp border border-l-4 p-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-category-dhcp/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Database
              className="text-category-dhcp h-4 w-4"
              aria-hidden={true}
            />
          </div>
          <div>
            <h3 className="text-foreground font-display text-sm font-semibold">{pool.name}</h3>
            <p className="text-muted-foreground text-xs">{t('dhcp.poolLabel')}</p>
          </div>
        </div>
        <span
          className={`font-mono text-lg font-bold ${getUtilizationTextColor(utilizationPercent)}`}
        >
          {utilizationPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="bg-muted mb-3 h-2 w-full rounded-full">
        <div
          className={`${getUtilizationBgColor(utilizationPercent)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-md p-2">
          <p className="text-foreground text-lg font-bold">{usedCount}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.assigned')}</p>
        </div>
        <div className="bg-muted rounded-md p-2">
          <p className="text-foreground text-lg font-bold">{availableCount}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.available')}</p>
        </div>
        <div className="bg-muted rounded-md p-2">
          <p className="text-foreground text-lg font-bold">{totalSize}</p>
          <p className="text-muted-foreground text-xs">{t('dhcp.total')}</p>
        </div>
      </div>

      {/* IP Ranges */}
      <div className="border-border mt-3 border-t pt-3">
        <p className="text-muted-foreground font-display mb-1 text-xs font-semibold">
          {t('dhcp.ipRanges')}
        </p>
        <div className="space-y-1">
          {ranges.length > 0 ?
            ranges.map((range, idx) => (
              <p
                key={idx}
                className="text-foreground font-mono text-sm"
              >
                {range}
              </p>
            ))
          : <p className="text-muted-foreground text-sm italic">{t('dhcp.noRanges')}</p>}
        </div>
      </div>
    </div>
  );
});

DHCPPoolCard.displayName = 'DHCPPoolCard';
