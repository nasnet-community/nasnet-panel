/**
 * StaleDataBadge Component
 *
 * Compact badge indicating data is from cache and may be stale.
 * Used during stale-while-revalidate patterns.
 *
 * @module @nasnet/ui/patterns/loading
 */

import * as React from 'react';

import { Clock, RefreshCw } from 'lucide-react';

import { cn, Badge } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface StaleDataBadgeProps {
  /** Last update timestamp */
  lastUpdated?: Date | null;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
  /** Callback when badge is clicked (to trigger refresh) */
  onRefresh?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show relative time ("2m ago") vs absolute time */
  showRelativeTime?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Helper functions
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// StaleDataBadge Component
// ============================================================================

/**
 * StaleDataBadge Component
 *
 * Shows a small badge indicating cached/stale data with optional refresh.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StaleDataBadge lastUpdated={new Date()} />
 *
 * // With refresh action
 * <StaleDataBadge
 *   lastUpdated={lastFetchTime}
 *   isRefreshing={isLoading}
 *   onRefresh={refetch}
 * />
 * ```
 */
export function StaleDataBadge({
  lastUpdated,
  isRefreshing = false,
  onRefresh,
  size = 'sm',
  showRelativeTime = true,
  className,
}: StaleDataBadgeProps) {
  const timeText = lastUpdated
    ? showRelativeTime
      ? formatRelativeTime(lastUpdated)
      : lastUpdated.toLocaleTimeString()
    : 'Unknown';

  const isClickable = onRefresh && !isRefreshing;

  const content = (
    <>
      {isRefreshing ? (
        <RefreshCw className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4', 'animate-spin')} />
      ) : (
        <Clock className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      )}
      <span>{isRefreshing ? 'Refreshing...' : timeText}</span>
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className={cn(
          'inline-flex items-center gap-1 rounded-full',
          'bg-amber-50 dark:bg-amber-950/30',
          'text-amber-700 dark:text-amber-400',
          'border border-amber-200 dark:border-amber-800',
          'hover:bg-amber-100 dark:hover:bg-amber-900/50',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1',
          'transition-colors',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
          className
        )}
        aria-label={isRefreshing ? 'Refreshing data' : `Last updated ${timeText}. Click to refresh.`}
      >
        {content}
      </button>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-amber-50 dark:bg-amber-950/30',
        'text-amber-700 dark:text-amber-400',
        'border-amber-200 dark:border-amber-800',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className
      )}
    >
      {content}
    </Badge>
  );
}

StaleDataBadge.displayName = 'StaleDataBadge';
