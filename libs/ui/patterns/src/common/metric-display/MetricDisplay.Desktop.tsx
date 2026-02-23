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
          'bg-card dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700',
          sizeClasses.container,
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-7 w-24" />
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
        'text-left bg-card dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700',
        'transition-all duration-150',
        isInteractive && [
          'cursor-pointer',
          'hover:shadow-md hover:border-primary/20 dark:hover:border-slate-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
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
              'block font-medium text-muted-foreground mb-1',
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
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <Icon
            className={cn(
              'text-muted-foreground flex-shrink-0 ml-3',
              sizeClasses.icon
            )}
          />
        )}
      </div>
    </Component>
  );
}

MetricDisplayDesktopComponent.displayName = 'MetricDisplayDesktop';

export const MetricDisplayDesktop = memo(MetricDisplayDesktopComponent);
