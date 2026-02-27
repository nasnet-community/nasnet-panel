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
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-7 w-24" />
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
          'cursor-pointer',
          'hover:shadow-[var(--semantic-shadow-card)] hover:border-primary/20',
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

MetricDisplayDesktopComponent.displayName = 'MetricDisplayDesktop';

export const MetricDisplayDesktop = memo(MetricDisplayDesktopComponent);
