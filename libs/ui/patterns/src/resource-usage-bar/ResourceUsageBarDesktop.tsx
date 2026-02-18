/**
 * ResourceUsageBar Desktop Presenter
 *
 * Compact presenter optimized for desktop/larger screens.
 * Features:
 * - 24px height (compact)
 * - Inline horizontal layout
 * - Information-dense display
 * - Hover states for interactivity
 */

import { AlertCircle, AlertTriangle, Check, Circle, HelpCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { useResourceUsageBar } from './useResourceUsageBar';

import type { ResourceUsageBarProps, UsageStatus } from './types';

// ===== Constants =====

/**
 * Status icon mapping
 */
const STATUS_ICONS: Record<UsageStatus, typeof Circle> = {
  idle: Circle,
  normal: Check,
  warning: AlertTriangle,
  critical: AlertTriangle,
  danger: AlertCircle,
  unknown: HelpCircle,
};

/**
 * Status color classes (semantic tokens)
 */
const STATUS_COLORS: Record<
  UsageStatus,
  { bg: string; fill: string; text: string; icon: string }
> = {
  idle: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    fill: 'bg-gray-400 dark:bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'text-gray-500 dark:text-gray-400',
  },
  normal: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    fill: 'bg-semantic-success',
    text: 'text-semantic-success',
    icon: 'text-semantic-success',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    fill: 'bg-semantic-warning',
    text: 'text-semantic-warning',
    icon: 'text-semantic-warning',
  },
  critical: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    fill: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    fill: 'bg-semantic-error',
    text: 'text-semantic-error',
    icon: 'text-semantic-error',
  },
  unknown: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    fill: 'bg-gray-400 dark:bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'text-gray-500 dark:text-gray-400',
  },
};

// ===== Component =====

/**
 * Desktop presenter for ResourceUsageBar
 *
 * Compact, information-dense display optimized for larger screens.
 * Uses horizontal inline layout.
 */
export function ResourceUsageBarDesktop(props: ResourceUsageBarProps) {
  const { showValues = true, showPercentage = true, className } = props;
  const state = useResourceUsageBar(props);

  const colors = STATUS_COLORS[state.status];
  const Icon = STATUS_ICONS[state.status];

  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="region"
      aria-label={state.label}
    >
      {/* Label and Icon */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <Icon className={cn('h-3.5 w-3.5', colors.icon)} aria-label={state.statusLabel} />
        <span className="text-sm font-medium text-foreground">{state.label}</span>
      </div>

      {/* Progress Bar - 24px height (compact) */}
      <div className="flex-1 min-w-[120px]">
        <div
          className={cn(
            'relative h-6 rounded-md overflow-hidden',
            colors.bg,
            'border border-gray-200 dark:border-gray-700',
            'transition-all duration-200'
          )}
          role="progressbar"
          aria-label={state.ariaLabel}
          aria-valuenow={state.ariaValueNow}
          aria-valuemin={state.ariaValueMin}
          aria-valuemax={state.ariaValueMax}
          aria-valuetext={state.ariaValueText}
        >
          {/* Fill */}
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              colors.fill,
              'flex items-center justify-end px-2'
            )}
            style={{ width: `${state.percentage}%` }}
          >
            {/* Percentage inside bar (if enough space) */}
            {showPercentage && state.percentage > 20 && (
              <span className="text-xs font-semibold text-white drop-shadow-sm">
                {state.percentageText}
              </span>
            )}
          </div>

          {/* Percentage outside bar (if not enough space inside) */}
          {showPercentage && state.percentage <= 20 && (
            <span
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'text-xs font-semibold',
                colors.text
              )}
            >
              {state.percentageText}
            </span>
          )}
        </div>
      </div>

      {/* Values Display */}
      {showValues && (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Used</span>
            <span className={cn('text-sm font-semibold font-mono', colors.text)}>
              {state.usedText}
            </span>
          </div>
          <span className="text-muted-foreground">/</span>
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold font-mono text-foreground">
              {state.totalText}
            </span>
          </div>
        </div>
      )}

      {/* Screen reader status announcement */}
      <span className="sr-only">
        {state.label} status: {state.statusLabel}. {state.ariaValueText}.
      </span>
    </div>
  );
}
