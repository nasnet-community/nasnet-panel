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
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
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
        'bg-card border-border rounded-[var(--semantic-radius-card)] border text-left',
        'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
        'transition-all duration-150',
        isInteractive && [
          'min-h-[44px] cursor-pointer',
          'hover:border-primary/20 hover:shadow-[var(--semantic-shadow-card)]',
          'active:bg-muted',
          'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        ],
        sizeClasses.container,
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              'text-muted-foreground'
            )}
          >
            <Icon className={cn(sizeClasses.icon)} />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Value */}
          <span className={cn('font-display block text-2xl font-bold', valueClasses)}>
            {formattedValue}
          </span>

          {/* Label */}
          <span className="text-muted-foreground block text-sm">{label}</span>

          {/* Trend indicator */}
          {TrendIcon && props.trendValue && (
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-0.5 text-xs font-medium',
                trendClasses
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>{props.trendValue}</span>
            </span>
          )}

          {/* Description */}
          {description && (
            <p className="text-muted-foreground mt-1 truncate text-xs">{description}</p>
          )}
        </div>
      </div>
    </Component>
  );
}

MetricDisplayTabletComponent.displayName = 'MetricDisplayTablet';

export const MetricDisplayTablet = memo(MetricDisplayTabletComponent);
