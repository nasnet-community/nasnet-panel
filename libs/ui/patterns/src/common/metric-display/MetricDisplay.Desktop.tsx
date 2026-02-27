/**
 * MetricDisplay Desktop Presenter
 *
 * Optimized for desktop (>1024px) with hover states, denser layout, and full details visibility.
 * Supports keyboard navigation and mouse interaction with comprehensive accessibility.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */

import { memo, useCallback } from 'react';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { cn, Skeleton } from '@nasnet/ui/primitives';

import { useMetricDisplay } from './useMetricDisplay';

import type { MetricDisplayProps } from './types';

/**
 * Desktop-optimized MetricDisplay presenter
 *
 * - Compact card layout with semantic design tokens
 * - Hover states for mouse users
 * - Horizontal trend layout for quick scanning
 * - Full keyboard navigation support (Enter/Space)
 * - Responsive focus indicators (3px ring offset)
 */
function MetricDisplayDesktopComponent(props: MetricDisplayProps) {
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
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-7 w-24" />
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
          'cursor-pointer',
          'hover:border-primary/20 hover:shadow-[var(--semantic-shadow-card)]',
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

MetricDisplayDesktopComponent.displayName = 'MetricDisplayDesktop';

export const MetricDisplayDesktop = memo(MetricDisplayDesktopComponent);
