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
          'bg-card border border-border rounded-[var(--semantic-radius-card)]',
          'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-32" />
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
        'w-full text-center bg-card border border-border rounded-[var(--semantic-radius-card)]',
        'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
        'transition-all duration-150 flex flex-col items-center gap-2',
        isInteractive && [
          'min-h-[44px] cursor-pointer',
          'active:scale-[0.98] active:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        ],
        sizeClasses.container,
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'h-10 w-10 rounded-lg bg-muted flex items-center justify-center',
            'text-muted-foreground'
          )}
        >
          <Icon className={cn(sizeClasses.icon)} />
        </div>
      )}

      {/* Value */}
      <span className={cn('text-xl font-bold font-display', valueClasses)}>
        {formattedValue}
      </span>

      {/* Label */}
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      {/* Trend indicator */}
      {TrendIcon && props.trendValue && (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendClasses)}>
          <TrendIcon className="w-3 h-3" />
          <span>{props.trendValue}</span>
        </span>
      )}

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
