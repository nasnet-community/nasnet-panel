/**
 * BandwidthChartSkeleton - Loading skeleton for bandwidth chart
 * Respects prefers-reduced-motion for accessibility (WCAG AAA)
 */

import { memo } from 'react';
import { Card, CardHeader, CardContent, Skeleton } from '@nasnet/ui/primitives';
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
 * BandwidthChartSkeleton component
 *
 * Displays loading skeleton matching chart dimensions
 * - Respects prefers-reduced-motion (disables shimmer animation)
 * - Matches desktop (300px) or mobile (200px) height
 * - Shows skeleton for controls and chart area
 *
 * @param props - Component props
 */
export const BandwidthChartSkeleton = memo<BandwidthChartSkeletonProps>(
  ({ height = 300, className }) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          {/* Header with controls skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton
              className="h-6 w-32"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
            <div className="flex items-center gap-2">
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
          <div className="mt-2 flex items-center gap-4">
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
          <div className="relative" style={{ height: `${height}px` }}>
            <Skeleton
              className="h-full w-full rounded-md"
              style={{ animationDuration: prefersReducedMotion ? '0s' : '2s' }}
            />
            {/* Grid lines overlay for visual accuracy */}
            <div
              className="absolute inset-0 flex flex-col justify-between px-4 py-2"
              aria-hidden="true"
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-px bg-muted-foreground/10"
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
 * BandwidthChartError component
 *
 * Displays error state with retry button
 *
 * @param props - Component props
 */
export const BandwidthChartError = memo<BandwidthChartErrorProps>(
  ({ message = 'Failed to load bandwidth data', onRetry, className }) => {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
          {/* Error icon */}
          <div className="mb-4 rounded-full bg-destructive/10 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-destructive"
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
          <h3 className="mb-2 text-lg font-semibold">Error Loading Chart</h3>
          <p className="mb-4 text-sm text-muted-foreground">{message}</p>

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                'min-h-[44px]' // WCAG AAA touch target
              )}
            >
              Retry
            </button>
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
 * BandwidthChartEmpty component
 *
 * Displays empty state when no data available
 *
 * @param props - Component props
 */
export const BandwidthChartEmpty = memo<BandwidthChartEmptyProps>(
  ({ className }) => {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
          {/* Empty icon */}
          <div className="mb-4 rounded-full bg-muted p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-muted-foreground"
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
          <h3 className="mb-2 text-lg font-semibold">No Bandwidth Data</h3>
          <p className="text-sm text-muted-foreground">
            No bandwidth data available for the selected time range.
            <br />
            Please check your router connection.
          </p>
        </CardContent>
      </Card>
    );
  }
);

BandwidthChartEmpty.displayName = 'BandwidthChartEmpty';
