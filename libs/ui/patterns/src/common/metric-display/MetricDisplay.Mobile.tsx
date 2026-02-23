/**
 * MetricDisplay Mobile Presenter
 *
 * Touch-optimized presenter for mobile devices (<640px).
 * Features 44px minimum touch targets, simplified vertical layout, and reduced motion support.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { memo, useCallback } from 'react';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { cn, Skeleton } from '@nasnet/ui/primitives';

import { useMetricDisplay } from './useMetricDisplay';

import type { MetricDisplayProps } from './types';

/**
 * Mobile-optimized MetricDisplay presenter
 *
 * - Full-width card layout for narrow screens
 * - 44px minimum touch target for accessibility
 * - Larger text for improved readability on small screens
 * - Vertical stacking for mobile scrolling
 * - Active scale feedback for touch interaction
 */
function MetricDisplayMobileComponent(props: MetricDisplayProps) {
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
          'bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700',
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
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full text-left bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700',
        'transition-all duration-200',
        isInteractive && 'min-h-[44px] active:scale-[0.98] active:bg-muted',
        sizeClasses.container,
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <Icon
            className={cn(
              'text-muted-foreground flex-shrink-0',
              sizeClasses.icon
            )}
          />
        )}
        <span
          className={cn(
            'font-medium text-muted-foreground',
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
        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </Component>
  );
}

MetricDisplayMobileComponent.displayName = 'MetricDisplayMobile';

export const MetricDisplayMobile = memo(MetricDisplayMobileComponent);
