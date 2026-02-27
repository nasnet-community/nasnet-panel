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
          'bg-card border border-border rounded-[var(--semantic-radius-card)]',
          'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
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
        'text-left bg-card border border-border rounded-[var(--semantic-radius-card)]',
        'shadow-[var(--semantic-shadow-card)] dark:shadow-none',
        'transition-all duration-150',
        isInteractive && [
          'cursor-pointer min-h-[44px]',
          'hover:shadow-[var(--semantic-shadow-card)] hover:border-primary/20',
          'active:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
              'h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0',
              'text-muted-foreground'
            )}
          >
            <Icon className={cn(sizeClasses.icon)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <span className={cn('text-2xl font-bold font-display block', valueClasses)}>
            {formattedValue}
          </span>

          {/* Label */}
          <span className="text-sm text-muted-foreground block">
            {label}
          </span>

          {/* Trend indicator */}
          {TrendIcon && props.trendValue && (
            <span
              className={cn('inline-flex items-center gap-0.5 text-xs font-medium mt-1', trendClasses)}
            >
              <TrendIcon className="w-3 h-3" />
              <span>{props.trendValue}</span>
            </span>
          )}

          {/* Description */}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>
      </div>
    </Component>
  );
}

MetricDisplayTabletComponent.displayName = 'MetricDisplayTablet';

export const MetricDisplayTablet = memo(MetricDisplayTabletComponent);
