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
        className={cn('gap-component-md grid grid-cols-2 sm:grid-cols-4', className)}
        aria-busy="true"
        aria-label={t('status.loading')}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-card-lg border-border p-component-md animate-pulse border"
          >
            <div className="bg-muted mb-3 h-8 w-8 rounded-lg" />
            <div className="bg-muted mb-1 h-6 w-12 rounded" />
            <div className="bg-muted h-3 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('gap-component-md grid grid-cols-2 sm:grid-cols-4', className)}
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
            className="bg-card rounded-card-lg border-border p-component-md border"
          >
            <div
              className={cn(
                'rounded-card-sm mb-3 flex h-8 w-8 items-center justify-center',
                iconClass
              )}
            >
              <Icon
                className="h-4 w-4"
                aria-hidden="true"
              />
            </div>
            <p className="text-foreground mb-1 font-mono text-2xl font-bold leading-none">
              {stat.value}
            </p>
            <p className="text-muted-foreground font-display text-xs">{stat.label}</p>
            {stat.subLabel && (
              <p className="text-muted-foreground mt-0.5 text-xs">{stat.subLabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
});

NetworkQuickStats.displayName = 'NetworkQuickStats';
