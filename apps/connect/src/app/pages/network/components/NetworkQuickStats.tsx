/**
 * Network Quick Stats Component
 * Horizontal row of compact stat tiles for at-a-glance network metrics
 * (total interfaces, active count, IP addresses, connected devices, etc.)
 */

import React from 'react';

import { type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickStat {
  /** Short label beneath the value */
  label: string;
  /** Numeric or string metric value */
  value: number | string;
  /** Optional sub-label (e.g. unit or trend) */
  subLabel?: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Semantic colour variant for the icon background */
  variant?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'blue' | 'slate';
}

interface NetworkQuickStatsProps {
  /** Stats to display — typically 3-5 tiles */
  stats: QuickStat[];
  /** Show loading skeletons */
  isLoading?: boolean;
  /** Additional Tailwind classes for the grid wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Colour maps
// ---------------------------------------------------------------------------

const ICON_BG: Record<NonNullable<QuickStat['variant']>, string> = {
  cyan: 'bg-info/15 text-info',
  emerald: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  red: 'bg-error/15 text-error',
  purple: 'bg-category-monitoring/15 text-category-monitoring',
  blue: 'bg-info/15 text-info',
  slate: 'bg-muted/15 text-muted-foreground',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NetworkQuickStats = React.memo(function NetworkQuickStats({
  stats,
  isLoading = false,
  className,
}: NetworkQuickStatsProps) {
  const { t } = useTranslation('network');
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-4 gap-3',
          className,
        )}
        aria-busy="true"
        aria-label={t('status.loading')}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-card rounded-xl border border-border p-4"
          >
            <div className="w-8 h-8 rounded-lg bg-muted mb-3" />
            <div className="h-6 bg-muted rounded w-12 mb-1" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 gap-3',
        className,
      )}
      role="list"
      aria-label={t('status.quickStats')}
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const iconClass = ICON_BG[stat.variant ?? 'slate'];

        return (
          <div
            key={idx}
            role="listitem"
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', iconClass)}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-foreground leading-none mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            {stat.subLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{stat.subLabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
});

NetworkQuickStats.displayName = 'NetworkQuickStats';
