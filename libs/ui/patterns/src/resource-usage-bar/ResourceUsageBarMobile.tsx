/**
 * ResourceUsageBar Mobile Presenter
 *
 * Touch-optimized presenter for small screens.
 * Features:
 * - 44px minimum height (touch target)
 * - Bold, high-contrast text
 * - Larger visual elements
 * - Vertical layout for values
 */

import { AlertCircle, AlertTriangle, Check, Circle, HelpCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { ResourceUsageBarProps, UsageStatus } from './types';
import { useResourceUsageBar } from './useResourceUsageBar';

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
 * Background, text, and border colors for each status
 */
const STATUS_COLORS: Record<
  UsageStatus,
  { bg: string; fill: string; text: string; border: string }
> = {
  idle: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    fill: 'bg-gray-400 dark:bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
  },
  normal: {
    bg: 'bg-green-100 dark:bg-green-950',
    fill: 'bg-semantic-success',
    text: 'text-semantic-success',
    border: 'border-green-300 dark:border-green-700',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    fill: 'bg-semantic-warning',
    text: 'text-semantic-warning',
    border: 'border-amber-300 dark:border-amber-700',
  },
  critical: {
    bg: 'bg-orange-100 dark:bg-orange-950',
    fill: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-300 dark:border-orange-700',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-950',
    fill: 'bg-semantic-error',
    text: 'text-semantic-error',
    border: 'border-red-300 dark:border-red-700',
  },
  unknown: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    fill: 'bg-gray-400 dark:bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
  },
};

// ===== Component =====

/**
 * Mobile presenter for ResourceUsageBar
 *
 * Optimized for touch interaction and small screens.
 * Uses vertical layout with larger text and icons.
 */
export function ResourceUsageBarMobile(props: ResourceUsageBarProps) {
  const { showValues = true, showPercentage = true, className } = props;
  const state = useResourceUsageBar(props);

  const colors = STATUS_COLORS[state.status];
  const Icon = STATUS_ICONS[state.status];

  return (
    <div
      className={cn('flex flex-col gap-3 p-3 rounded-lg', className)}
      role="region"
      aria-label={state.label}
    >
      {/* Header: Label and Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{state.label}</span>
          <Icon
            className={cn('h-4 w-4', colors.text)}
            aria-label={state.statusLabel}
          />
        </div>

        {showPercentage && (
          <span className={cn('text-base font-bold', colors.text)}>
            {state.percentageText}
          </span>
        )}
      </div>

      {/* Progress Bar - 44px height for touch target */}
      <div
        className={cn(
          'relative h-[44px] rounded-full overflow-hidden',
          colors.bg,
          'border-2',
          colors.border
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
            'flex items-center justify-end pr-3'
          )}
          style={{ width: `${state.percentage}%` }}
        >
          {/* Percentage inside bar (if enough space) */}
          {showPercentage && state.percentage > 15 && (
            <span className="text-sm font-bold text-white drop-shadow-sm">
              {state.percentageText}
            </span>
          )}
        </div>
      </div>

      {/* Values Display */}
      {showValues && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Used: <span className={cn('font-bold', colors.text)}>{state.usedText}</span>
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            Total: <span className="font-bold text-foreground">{state.totalText}</span>
          </span>
        </div>
      )}

      {/* Screen reader status announcement */}
      <span className="sr-only">
        {state.label} status: {state.statusLabel}. {state.ariaValueText}.
      </span>
    </div>
  );
}
