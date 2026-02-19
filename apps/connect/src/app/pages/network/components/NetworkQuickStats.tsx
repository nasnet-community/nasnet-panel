/**
 * Network Quick Stats Component
 * Horizontal row of compact stat tiles for at-a-glance network metrics
 * (total interfaces, active count, IP addresses, connected devices, etc.)
 */

import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

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
  cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NetworkQuickStats({
  stats,
  isLoading = false,
  className,
}: NetworkQuickStatsProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-4 gap-3',
          className,
        )}
        aria-busy="true"
        aria-label="Loading network statistics"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 mb-3" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-1" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
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
      aria-label="Network quick stats"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const iconClass = ICON_BG[stat.variant ?? 'slate'];

        return (
          <div
            key={idx}
            role="listitem"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', iconClass)}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            {stat.subLabel && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.subLabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
