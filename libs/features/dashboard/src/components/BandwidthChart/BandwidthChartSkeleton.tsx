/**
 * Bandwidth chart skeleton, error, and empty state components
 *
 * @description
 * Set of memoized components for loading, error, and empty states:
 * - BandwidthChartSkeleton: pulse animation matching final layout
 * - BandwidthChartError: professional error message with retry button
 * - BandwidthChartEmpty: empty state guidance
 *
 * All components respect `prefers-reduced-motion` for WCAG AAA compliance.
 * Buttons meet 44px touch target minimum for mobile accessibility.
 */

import { memo, useCallback } from 'react';
import { Card, CardHeader, CardContent, Skeleton, Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useReducedMotion } from '@nasnet/ui/layouts';

/**
 * Props for BandwidthChartSkeleton
 */
interface BandwidthChartSkeletonProps {
  /** Height of chart area (300px desktop, 200px mobile) */
  height?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * BandwidthChartSkeleton - Loading skeleton for bandwidth chart
 *
 * @description
 * Displays placeholder skeleton matching final chart layout (card + header + controls).
 * Pulse animation respects `prefers-reduced-motion` setting (disabled → instant/no animation).
 * Height configurable (300px desktop, 200px mobile).
 *
 * @param props - { height?, className? }
 * @param props.height - Chart height in pixels (default 300)
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized skeleton component
 */
export const BandwidthChartSkeleton = memo<BandwidthChartSkeletonProps>(
  ({ height = 300, className }) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-component-sm">
          {/* Header with controls skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton
              className="h-6 w-32"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
            <div className="gap-component-sm flex items-center">
              {/* Time range selector skeleton */}
              <Skeleton
                className="h-11 w-48"
                style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
              />
              {/* Interface filter skeleton */}
              <Skeleton
                className="h-11 w-44"
                style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
              />
            </div>
          </div>

          {/* Current rates skeleton */}
          <div className="mt-component-sm gap-component-lg flex items-center">
            <Skeleton
              className="h-4 w-24"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
            <Skeleton
              className="h-4 w-24"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Chart area skeleton */}
          <div
            className="relative"
            style={{ height: `${height}px` }}
          >
            <Skeleton
              className="h-full w-full rounded-md"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
            {/* Grid lines overlay for visual accuracy */}
            <div
              className="px-component-md py-component-sm absolute inset-0 flex flex-col justify-between"
              aria-hidden="true"
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-muted-foreground/10 h-px"
                  style={{ opacity: 0.3 }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

BandwidthChartSkeleton.displayName = 'BandwidthChartSkeleton';

/**
 * Props for error state
 */
interface BandwidthChartErrorProps {
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * BandwidthChartError - Error state with retry action
 *
 * @description
 * Professional error display with icon, message, and memoized retry button.
 * Button uses `Button` primitive for consistent styling and meets 44px
 * touch target requirement (WCAG AAA).
 *
 * @param props - { message?, onRetry?, className? }
 * @param props.message - Error message text (default: generic message)
 * @param props.onRetry - Memoized callback when retry clicked
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized error component
 */
export const BandwidthChartError = memo<BandwidthChartErrorProps>(
  ({ message = 'Failed to load bandwidth data', onRetry, className }) => {
    // Memoize retry handler to prevent unnecessary re-renders
    const handleRetry = useCallback(() => {
      onRetry?.();
    }, [onRetry]);

    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-component-xl flex min-h-[300px] flex-col items-center justify-center text-center">
          {/* Error icon */}
          <div className="mb-component-md bg-error/10 p-component-md rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-error h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error message */}
          <h3 className="mb-component-sm text-lg font-semibold">Error Loading Chart</h3>
          <p className="mb-component-md text-muted-foreground text-sm">{message}</p>

          {/* Retry button using Button primitive (44px min height) */}
          {onRetry && (
            <Button
              onClick={handleRetry}
              variant="default"
              className="min-h-[44px]"
            >
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

BandwidthChartError.displayName = 'BandwidthChartError';

/**
 * Props for empty state
 */
interface BandwidthChartEmptyProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * BandwidthChartEmpty - Empty state when no data available
 *
 * @description
 * Displays centered empty state with icon, title, and helpful message.
 * Used when data fetch succeeds but no data points returned for selected
 * time range and interface filter.
 *
 * @param props - { className? }
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized empty state component
 */
export const BandwidthChartEmpty = memo<BandwidthChartEmptyProps>(({ className }) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-component-xl flex min-h-[300px] flex-col items-center justify-center text-center">
        {/* Empty icon */}
        <div className="mb-component-md bg-muted p-component-md rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* Empty message */}
        <h3 className="mb-component-sm text-lg font-semibold">No Bandwidth Data</h3>
        <p className="text-muted-foreground text-sm">
          No bandwidth data available for the selected time range.
          <br />
          Please check your router connection.
        </p>
      </CardContent>
    </Card>
  );
});

BandwidthChartEmpty.displayName = 'BandwidthChartEmpty';
