/**
 * MetricDisplay Tablet Presenter
 *
 * Balanced layout optimized for tablets (640–1024px) with both touch and mouse support.
 * Combines aspects of mobile (touch-friendly) and desktop (more details) presenters.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { memo, useCallback } from 'react';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { cn, Skeleton } from '@nasnet/ui/primitives';

import { useMetricDisplay } from './useMetricDisplay';

import type { MetricDisplayProps } from './types';

/**
 * Tablet-optimized MetricDisplay presenter
 *
 * - Balanced card layout (between mobile and desktop)
 * - 40–44px minimum touch target for tablet interaction
 * - Hover states for mouse users
 * - Horizontal trend layout (like desktop)
 * - Improved readability with medium sizing
 */
function MetricDisplayTabletComponent(props: MetricDisplayProps) {
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

  // Memoize keyboard handler for stable reference
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isInteractive) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    [isInteractive, onClick]
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-card dark:bg-slate-800 rounded-lg border border-border dark:border-slate-700',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-6 w-6 rounded flex-shrink-0" />
        </div>
      </div>
    );
  }

  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      {...ariaProps}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'text-left bg-card dark:bg-slate-800 rounded-lg border border-border dark:border-slate-700',
        'transition-all duration-200',
        isInteractive && [
          'cursor-pointer min-h-[44px]',
          'hover:shadow-sm hover:border-primary/30 dark:hover:border-slate-600',
          'active:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
        ],
        sizeClasses.container,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <span
            className={cn(
              'block font-medium text-muted-foreground mb-1',
              sizeClasses.label
            )}
          >
            {label}
          </span>

          {/* Value with trend */}
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
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <Icon
            className={cn(
              'text-muted-foreground flex-shrink-0',
              sizeClasses.icon
            )}
          />
        )}
      </div>
    </Component>
  );
}

MetricDisplayTabletComponent.displayName = 'MetricDisplayTablet';

export const MetricDisplayTablet = memo(MetricDisplayTabletComponent);
