/**
 * MetricDisplay Mobile Presenter
 *
 * Touch-optimized presenter for mobile devices.
 * Features larger touch targets, simplified layout.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { cn, Skeleton } from '@nasnet/ui/primitives';

import { useMetricDisplay } from './useMetricDisplay';

import type { MetricDisplayProps } from './types';

/**
 * Mobile-optimized MetricDisplay presenter
 *
 * - Full-width card layout
 * - 44px minimum touch target
 * - Larger text for readability
 * - Vertical stacking for narrow screens
 */
export function MetricDisplayMobile(props: MetricDisplayProps) {
  const { label, icon: Icon, description, isLoading, onClick, className } = props;

  const {
    formattedValue,
    isInteractive,
    trendIconName,
    trendClasses,
    valueClasses,
    sizeClasses,
    ariaProps,
  } = useMetricDisplay(props);

  // Render trend icon
  const TrendIcon = trendIconName === 'arrow-up'
    ? ArrowUp
    : trendIconName === 'arrow-down'
      ? ArrowDown
      : trendIconName === 'minus'
        ? Minus
        : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700',
          sizeClasses.container,
          className
        )}
      >
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      {...ariaProps}
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700',
        'transition-all duration-200',
        isInteractive && 'min-h-[44px] active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-700/50',
        sizeClasses.container,
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <Icon
            className={cn(
              'text-slate-500 dark:text-slate-400 flex-shrink-0',
              sizeClasses.icon
            )}
          />
        )}
        <span
          className={cn(
            'font-medium text-slate-600 dark:text-slate-400',
            sizeClasses.label
          )}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={cn(sizeClasses.value, valueClasses)}>
          {formattedValue}
        </span>

        {/* Trend indicator */}
        {TrendIcon && props.trendValue && (
          <span className={cn('flex items-center gap-0.5', trendClasses, sizeClasses.trend)}>
            <TrendIcon className="w-3 h-3" />
            <span>{props.trendValue}</span>
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </Component>
  );
}
