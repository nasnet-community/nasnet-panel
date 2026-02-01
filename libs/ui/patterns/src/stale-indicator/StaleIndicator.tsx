/**
 * StaleIndicator Component
 *
 * Displays a visual indicator when data is stale (from cache while offline).
 * Provides last updated timestamp and optional refresh action.
 *
 * @module @nasnet/ui/patterns/stale-indicator
 */

import * as React from 'react';

import { RefreshCw, Clock, WifiOff } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

/**
 * Props for StaleIndicator component
 */
export interface StaleIndicatorProps {
  /** Whether the data is currently stale */
  isStale: boolean;

  /** Timestamp of when the data was last successfully fetched */
  lastUpdated?: Date | null;

  /** Callback when refresh button is clicked */
  onRefresh?: () => void;

  /** Whether a refresh is in progress */
  isRefreshing?: boolean;

  /** Whether the app is offline */
  isOffline?: boolean;

  /** Custom message to display */
  message?: string;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Additional CSS classes */
  className?: string;
}

/**
 * Format relative time from a date.
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Size-specific classes
 */
const sizeClasses = {
  sm: {
    container: 'py-1 px-2 text-xs gap-1.5',
    icon: 'w-3 h-3',
    button: 'p-0.5',
  },
  md: {
    container: 'py-1.5 px-3 text-sm gap-2',
    icon: 'w-4 h-4',
    button: 'p-1',
  },
  lg: {
    container: 'py-2 px-4 text-base gap-2.5',
    icon: 'w-5 h-5',
    button: 'p-1.5',
  },
} as const;

/**
 * StaleIndicator Component
 *
 * Shows a visual indicator when data is stale, typically due to being
 * served from cache while the app is offline or the backend is unreachable.
 *
 * Features:
 * - Visual badge with stale/offline status
 * - Last updated timestamp with relative formatting
 * - Optional refresh button with loading state
 * - Three size variants (sm, md, lg)
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StaleIndicator isStale={true} lastUpdated={new Date()} />
 *
 * // With refresh action
 * <StaleIndicator
 *   isStale={true}
 *   lastUpdated={lastFetchTime}
 *   onRefresh={refetch}
 *   isRefreshing={loading}
 * />
 *
 * // Offline indicator
 * <StaleIndicator
 *   isStale={true}
 *   isOffline={true}
 *   lastUpdated={lastFetchTime}
 *   message="You're offline. Showing cached data."
 * />
 * ```
 */
export function StaleIndicator({
  isStale,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  isOffline = false,
  message,
  size = 'md',
  className,
}: StaleIndicatorProps) {
  // Don't render if data is fresh
  if (!isStale) {
    return null;
  }

  const classes = sizeClasses[size];
  const Icon = isOffline ? WifiOff : Clock;
  const defaultMessage = isOffline
    ? 'Offline - showing cached data'
    : 'Data may be outdated';

  const timeAgo = lastUpdated ? formatRelativeTime(lastUpdated) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full',
        // Colors - warning style for stale data
        'bg-amber-50 dark:bg-amber-950/30',
        'text-amber-700 dark:text-amber-400',
        'border border-amber-200 dark:border-amber-800',
        // Size-specific
        classes.container,
        className
      )}
    >
      {/* Status icon */}
      <Icon
        className={cn(
          classes.icon,
          'flex-shrink-0',
          isOffline && 'text-amber-600 dark:text-amber-500'
        )}
        aria-hidden="true"
      />

      {/* Message and timestamp */}
      <span className="flex-1">
        {message || defaultMessage}
        {timeAgo && (
          <span className="opacity-75 ml-1">
            (Last updated: {timeAgo})
          </span>
        )}
      </span>

      {/* Refresh button */}
      {onRefresh && !isOffline && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'rounded-full',
            'hover:bg-amber-100 dark:hover:bg-amber-900/50',
            'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            classes.button
          )}
          aria-label={isRefreshing ? 'Refreshing...' : 'Refresh data'}
        >
          <RefreshCw
            className={cn(
              classes.icon,
              isRefreshing && 'animate-spin'
            )}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

StaleIndicator.displayName = 'StaleIndicator';
