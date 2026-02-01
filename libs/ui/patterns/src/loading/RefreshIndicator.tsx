/**
 * RefreshIndicator Component
 *
 * Subtle top-bar progress indicator for background data refreshes.
 * Used during stale-while-revalidate to show revalidation is happening.
 *
 * @module @nasnet/ui/patterns/loading
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface RefreshIndicatorProps {
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Position of the indicator */
  position?: 'top' | 'bottom';
  /** Style variant */
  variant?: 'bar' | 'dots';
  /** Color variant */
  color?: 'primary' | 'secondary' | 'muted';
  /** Fixed position (stays at top of viewport) vs relative */
  fixed?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Color configurations
// ============================================================================

const colorConfig = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted-foreground/50',
} as const;

// ============================================================================
// RefreshIndicator Component
// ============================================================================

/**
 * RefreshIndicator Component
 *
 * Shows a subtle progress indicator during background data refreshes.
 * Commonly placed at the top of a page or container.
 *
 * @example
 * ```tsx
 * // At top of page
 * <RefreshIndicator isRefreshing={isRevalidating} />
 *
 * // Fixed to viewport top
 * <RefreshIndicator isRefreshing={isRevalidating} fixed />
 *
 * // Bottom position with dots
 * <RefreshIndicator
 *   isRefreshing={isRevalidating}
 *   position="bottom"
 *   variant="dots"
 * />
 * ```
 */
export function RefreshIndicator({
  isRefreshing,
  position = 'top',
  variant = 'bar',
  color = 'primary',
  fixed = false,
  className,
}: RefreshIndicatorProps) {
  if (!isRefreshing) {
    return null;
  }

  const positionClasses = fixed
    ? position === 'top'
      ? 'fixed top-0 left-0 right-0 z-50'
      : 'fixed bottom-0 left-0 right-0 z-50'
    : position === 'top'
      ? 'absolute top-0 left-0 right-0'
      : 'absolute bottom-0 left-0 right-0';

  if (variant === 'dots') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Refreshing data"
        className={cn(
          positionClasses,
          'flex items-center justify-center py-1 gap-1',
          className
        )}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              colorConfig[color],
              'animate-pulse'
            )}
            style={{
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
        <span className="sr-only">Refreshing data</span>
      </div>
    );
  }

  // Bar variant (default)
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Refreshing data"
      className={cn(positionClasses, 'h-0.5 overflow-hidden', className)}
    >
      <div
        className={cn(
          'h-full w-1/3',
          colorConfig[color],
          'animate-[slide-right_1s_ease-in-out_infinite]'
        )}
        style={{
          animation: 'slide-right 1s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes slide-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
      <span className="sr-only">Refreshing data</span>
    </div>
  );
}

RefreshIndicator.displayName = 'RefreshIndicator';
