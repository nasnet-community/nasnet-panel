/**
 * Skeleton Components
 *
 * Loading placeholder components with animated shimmer effect.
 * Provides visual feedback during content loading to improve perceived performance
 * and reduce cumulative layout shift (CLS).
 *
 * Accessibility:
 * - Respects prefers-reduced-motion media query
 * - Uses aria-hidden="true" as content is decorative
 * - Parent containers should use aria-busy="true" and aria-live
 *
 * @module @nasnet/ui/primitives/skeleton
 */

import * as React from 'react';

import { useReducedMotion } from '../hooks';
import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to animate the skeleton */
  animate?: boolean;
}

export interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of text lines to display */
  lines?: number;
  /** Width of the last line (e.g., '60%', '100px') */
  lastLineWidth?: string;
  /** Height of each line in pixels */
  lineHeight?: number;
  /** Gap between lines in pixels */
  gap?: number;
  /** Whether to animate */
  animate?: boolean;
}

export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show title skeleton */
  showTitle?: boolean;
  /** Show description skeleton */
  showDescription?: boolean;
  /** Show footer with actions */
  showFooter?: boolean;
  /** Height of the main content area */
  contentHeight?: number;
  /** Whether to animate */
  animate?: boolean;
}

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Show table header */
  showHeader?: boolean;
  /** Whether to animate */
  animate?: boolean;
}

export interface SkeletonChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show chart title */
  showTitle?: boolean;
  /** Show legend placeholder */
  showLegend?: boolean;
  /** Height of chart area */
  height?: number;
  /** Chart type for different visual representations */
  type?: 'bar' | 'line' | 'pie' | 'area';
  /** Whether to animate */
  animate?: boolean;
}

export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Shape of the avatar */
  shape?: 'circle' | 'square';
  /** Whether to animate */
  animate?: boolean;
}

// ============================================================================
// Base Skeleton Component
// ============================================================================

/**
 * Base Skeleton Component
 *
 * Displays a loading placeholder with animated shimmer effect.
 * Used as building block for other skeleton components.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-4 w-full" />
 *
 * // Fixed size
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * // No animation (reduced motion)
 * <Skeleton animate={false} className="h-4 w-full" />
 * ```
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animate = true, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md bg-muted',
          shouldAnimate && 'animate-pulse',
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// ============================================================================
// SkeletonText Component
// ============================================================================

/**
 * SkeletonText Component
 *
 * Displays multiple lines of skeleton text with varying widths.
 * Last line is typically shorter for a more natural appearance.
 *
 * @example
 * ```tsx
 * // Default 3 lines
 * <SkeletonText />
 *
 * // Custom configuration
 * <SkeletonText lines={5} lastLineWidth="40%" lineHeight={20} />
 * ```
 */
const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      className,
      lines = 3,
      lastLineWidth = '60%',
      lineHeight = 16,
      gap = 8,
      animate = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;

    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        role="presentation"
        aria-hidden="true"
        style={{ gap }}
        {...props}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'rounded-md bg-muted',
              shouldAnimate && 'animate-pulse'
            )}
            style={{
              height: lineHeight,
              width: index === lines - 1 ? lastLineWidth : '100%',
            }}
          />
        ))}
      </div>
    );
  }
);
SkeletonText.displayName = 'SkeletonText';

// ============================================================================
// SkeletonCard Component
// ============================================================================

/**
 * SkeletonCard Component
 *
 * Displays a card-shaped skeleton matching the Card component layout.
 * Includes optional title, description, content area, and footer.
 *
 * @example
 * ```tsx
 * // Full card skeleton
 * <SkeletonCard showTitle showDescription showFooter />
 *
 * // Simple card
 * <SkeletonCard contentHeight={200} />
 * ```
 */
const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      showTitle = true,
      showDescription = false,
      showFooter = false,
      contentHeight = 120,
      animate = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;
    const baseClass = cn('rounded-md bg-muted', shouldAnimate && 'animate-pulse');

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card p-4 space-y-4',
          className
        )}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {/* Header */}
        {(showTitle || showDescription) && (
          <div className="space-y-2">
            {showTitle && <div className={cn(baseClass, 'h-5 w-1/2')} />}
            {showDescription && <div className={cn(baseClass, 'h-4 w-3/4')} />}
          </div>
        )}

        {/* Content area */}
        <div className={cn(baseClass, 'w-full')} style={{ height: contentHeight }} />

        {/* Footer with action buttons */}
        {showFooter && (
          <div className="flex gap-2 pt-2">
            <div className={cn(baseClass, 'h-9 w-20')} />
            <div className={cn(baseClass, 'h-9 w-20')} />
          </div>
        )}
      </div>
    );
  }
);
SkeletonCard.displayName = 'SkeletonCard';

// ============================================================================
// SkeletonTable Component
// ============================================================================

/**
 * SkeletonTable Component
 *
 * Displays a table-shaped skeleton with header and rows.
 * Matches the Table component layout for zero layout shift.
 *
 * @example
 * ```tsx
 * // Default 5 rows, 4 columns
 * <SkeletonTable />
 *
 * // Custom configuration
 * <SkeletonTable rows={10} columns={6} showHeader={false} />
 * ```
 */
const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  (
    {
      className,
      rows = 5,
      columns = 4,
      showHeader = true,
      animate = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;
    const baseClass = cn('rounded bg-muted', shouldAnimate && 'animate-pulse');

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex gap-4 pb-3 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className={cn(baseClass, 'h-4 flex-1')} />
            ))}
          </div>
        )}

        {/* Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 py-3">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(baseClass, 'h-4 flex-1')}
                  style={{
                    // Vary widths for more natural appearance
                    maxWidth: colIndex === 0 ? '40%' : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
SkeletonTable.displayName = 'SkeletonTable';

// ============================================================================
// SkeletonChart Component
// ============================================================================

/**
 * SkeletonChart Component
 *
 * Displays a chart-shaped skeleton for visualization placeholders.
 * Supports different chart type representations.
 *
 * @example
 * ```tsx
 * // Basic chart skeleton
 * <SkeletonChart height={300} />
 *
 * // With title and legend
 * <SkeletonChart showTitle showLegend type="bar" />
 * ```
 */
const SkeletonChart = React.forwardRef<HTMLDivElement, SkeletonChartProps>(
  (
    {
      className,
      showTitle = false,
      showLegend = false,
      height = 200,
      type: _type = 'bar',
      animate = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;
    const baseClass = cn('rounded-md bg-muted', shouldAnimate && 'animate-pulse');

    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        role="presentation"
        aria-hidden="true"
        {...props}
      >
        {/* Title */}
        {showTitle && <div className={cn(baseClass, 'h-5 w-1/3')} />}

        {/* Chart area */}
        <div
          className={cn(baseClass, 'w-full')}
          style={{ height }}
        />

        {/* Legend */}
        {showLegend && (
          <div className="flex gap-4 justify-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(baseClass, 'h-3 w-3 rounded-full')} />
                <div className={cn(baseClass, 'h-3 w-16')} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
SkeletonChart.displayName = 'SkeletonChart';

// ============================================================================
// SkeletonAvatar Component
// ============================================================================

const avatarSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
} as const;

/**
 * SkeletonAvatar Component
 *
 * Displays a circular or square avatar placeholder.
 * Used for user profiles, device icons, etc.
 *
 * @example
 * ```tsx
 * // Circular avatar
 * <SkeletonAvatar size="md" />
 *
 * // Square avatar
 * <SkeletonAvatar size="lg" shape="square" />
 * ```
 */
const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  (
    {
      className,
      size = 'md',
      shape = 'circle',
      animate = true,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted',
          avatarSizes[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-md',
          shouldAnimate && 'animate-pulse',
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);
SkeletonAvatar.displayName = 'SkeletonAvatar';

// ============================================================================
// Exports
// ============================================================================

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
};
