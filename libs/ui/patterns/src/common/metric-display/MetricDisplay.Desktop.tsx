/**
 * MetricDisplay Desktop Presenter
 *
 * Optimized for desktop with hover states and denser layout.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { cn, Skeleton } from '@nasnet/ui/primitives';

import { useMetricDisplay } from './useMetricDisplay';

import type { MetricDisplayProps } from './types';

/**
 * Desktop-optimized MetricDisplay presenter
 *
 * - Compact card layout
 * - Hover states for interactivity
 * - Horizontal layout for trend
 * - Keyboard navigation support
 */
export function MetricDisplayDesktop(props: MetricDisplayProps) {
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
  const TrendIcon =
    trendIconName === 'arrow-up'
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
          'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
    );
  }

  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      {...ariaProps}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700',
        'transition-all duration-150',
        isInteractive && [
          'cursor-pointer',
          'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        ],
        sizeClasses.container,
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <span
            className={cn(
              'block font-medium text-slate-600 dark:text-slate-400 mb-1',
              sizeClasses.label
            )}
          >
            {label}
          </span>

          {/* Value with trend inline */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn(sizeClasses.value, valueClasses)}>{formattedValue}</span>

            {/* Trend indicator */}
            {TrendIcon && props.trendValue && (
              <span
                className={cn('flex items-center gap-0.5', trendClasses, sizeClasses.trend)}
              >
                <TrendIcon className="w-3 h-3" />
                <span>{props.trendValue}</span>
              </span>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <Icon
            className={cn(
              'text-slate-400 dark:text-slate-500 flex-shrink-0 ml-3',
              sizeClasses.icon
            )}
          />
        )}
      </div>
    </Component>
  );
}
