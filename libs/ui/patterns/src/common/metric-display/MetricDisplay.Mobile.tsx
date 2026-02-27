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
  const TrendIcon =
    trendIconName === 'arrow-up' ? ArrowUp
    : trendIconName === 'arrow-down' ? ArrowDown
    : trendIconName === 'minus' ? Minus
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
          'bg-card border-border rounded-[var(--semantic-radius-card)] border',
          'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="mb-2 h-4 w-20" />
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
        'bg-card border-border w-full rounded-[var(--semantic-radius-card)] border text-center',
        'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
        'flex flex-col items-center gap-2 transition-all duration-150',
        isInteractive && [
          'min-h-[44px] cursor-pointer',
          'active:bg-muted active:scale-[0.98]',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        ],
        sizeClasses.container,
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'bg-muted flex h-10 w-10 items-center justify-center rounded-lg',
            'text-muted-foreground'
          )}
        >
          <Icon className={cn(sizeClasses.icon)} />
        </div>
      )}

      {/* Value */}
      <span className={cn('font-display text-xl font-bold', valueClasses)}>{formattedValue}</span>

      {/* Label */}
      <span className="text-muted-foreground text-sm">{label}</span>

      {/* Trend indicator */}
      {TrendIcon && props.trendValue && (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendClasses)}>
          <TrendIcon className="h-3 w-3" />
          <span>{props.trendValue}</span>
        </span>
      )}

      {/* Description */}
      {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
    </Component>
  );
}

MetricDisplayMobileComponent.displayName = 'MetricDisplayMobile';

export const MetricDisplayMobile = memo(MetricDisplayMobileComponent);
