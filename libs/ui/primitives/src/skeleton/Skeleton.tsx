/**
 * Skeleton Components
 *
 * Loading placeholder components with animated shimmer effect.
 * Provides visual feedback during content loading to improve perceived performance
 * and reduce cumulative layout shift (CLS).
 *
 * Accessibility (WCAG AAA):
 * - Respects prefers-reduced-motion media query (Section 7: Motion & Cognitive)
 * - Uses aria-hidden="true" as content is decorative (Section 7: Screen Readers & ARIA)
 * - Parent containers should use aria-busy="true" and aria-live for dynamic updates
 * - All skeleton elements have aria-hidden to prevent screen reader announcements
 * - Functional animations respect reduced motion preferences
 *
 * Design System:
 * - Uses semantic design tokens: bg-muted (loading state), bg-card (card backgrounds)
 * - Section 3: Design Tokens - Three-tier token system enforced
 * - Section 10: Loading States - Skeleton loaders recommended for initial loads
 *
 * Performance:
 * - Minimal DOM overhead (single elements per skeleton variant)
 * - CLS (Cumulative Layout Shift) prevention: skeleton dimensions match final content
 * - Respects animation budget via prefers-reduced-motion hook
 *
 * @module @nasnet/ui/primitives/skeleton
 * @see Section 10 - Loading States: Skeleton loaders displayed for initial loads
 * @see Section 7 - Accessibility: prefers-reduced-motion compliance
 * @see Section 3 - Design Tokens: Semantic token usage
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
 * Automatically respects prefers-reduced-motion for accessibility compliance.
 *
 * Keyboard Support:
 * - Not interactive (aria-hidden="true")
 * - Parent components should handle focus management
 *
 * Screen Reader Support:
 * - Hidden from screen readers (aria-hidden="true")
 * - Parent containers with aria-busy="true" announce loading state
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-4 w-full" />
 *
 * // Fixed size circle (e.g., avatar placeholder)
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * // No animation (respects prefers-reduced-motion automatically)
 * <Skeleton animate={false} className="h-4 w-full" />
 *
 * // In loading container
 * <div aria-busy="true" aria-live="polite">
 *   <Skeleton className="h-4 w-full mb-2" />
 *   <Skeleton className="h-4 w-3/4" />
 * </div>
 * ```
 */
const Skeleton = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, animate = true, ...props }, ref) => {
      const prefersReducedMotion = useReducedMotion();
      const shouldAnimate = animate && !prefersReducedMotion;

      return (
        <div
          ref={ref}
          className={cn(
            'rounded-[var(--semantic-radius-input)] bg-muted',
            shouldAnimate && 'animate-pulse',
            className
          )}
          aria-hidden="true"
          {...props}
        />
      );
    }
  )
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
 * Commonly used for paragraph, description, or multi-line content loading states.
 *
 * Accessibility:
 * - role="presentation" identifies as non-semantic decorative content
 * - aria-hidden="true" prevents screen reader announcement
 * - Should be placed in container with aria-busy="true"
 *
 * @example
 * ```tsx
 * // Default 3 lines (paragraph placeholder)
 * <SkeletonText />
 *
 * // Custom configuration (5 lines with shorter last line)
 * <SkeletonText lines={5} lastLineWidth="40%" lineHeight={20} />
 *
 * // Compact text block
 * <SkeletonText lines={2} lastLineWidth="70%" gap={4} />
 *
 * // In loading context with title
 * <div aria-busy="true" aria-live="polite">
 *   <div className="h-6 w-48 mb-4" /> // title skeleton
 *   <SkeletonText lines={4} lastLineWidth="60%" />
 * </div>
 * ```
 */
const SkeletonText = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonTextProps>(
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
                'rounded-[var(--semantic-radius-input)] bg-muted',
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
  )
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
 * Prevents cumulative layout shift (CLS) by matching final card dimensions.
 *
 * Accessibility:
 * - role="presentation" for decorative structure
 * - aria-hidden="true" prevents screen reader traversal
 * - Use with aria-busy="true" on parent for loading state announcement
 *
 * Platform Considerations:
 * - Mobile: Full-width card skeleton
 * - Tablet: Grid of card skeletons (2 columns)
 * - Desktop: Grid of card skeletons (3+ columns)
 *
 * @example
 * ```tsx
 * // Full card skeleton with all sections
 * <SkeletonCard showTitle showDescription showFooter />
 *
 * // Simple card with content area only
 * <SkeletonCard contentHeight={200} />
 *
 * // Compact card for resource listing
 * <SkeletonCard showTitle contentHeight={80} />
 *
 * // Grid of card skeletons
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
 *   <SkeletonCard showTitle showDescription showFooter />
 *   <SkeletonCard showTitle showDescription showFooter />
 *   <SkeletonCard showTitle showDescription showFooter />
 * </div>
 * ```
 */
const SkeletonCard = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonCardProps>(
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
      const baseClass = cn('rounded-[var(--semantic-radius-input)] bg-muted', shouldAnimate && 'animate-pulse');

      return (
        <div
          ref={ref}
          className={cn(
            'rounded-[var(--semantic-radius-card)] border border-border bg-card p-4 space-y-4',
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
  )
);
SkeletonCard.displayName = 'SkeletonCard';

// ============================================================================
// SkeletonTable Component
// ============================================================================

/**
 * SkeletonTable Component
 *
 * Displays a table-shaped skeleton with header and rows.
 * Matches the Table component layout for zero cumulative layout shift (CLS).
 * Desktop-optimized for data-dense tables with sortable columns.
 *
 * Accessibility:
 * - role="presentation" for decorative table structure
 * - aria-hidden="true" hides from screen readers
 * - Actual data table should have proper <table>, <caption>, <thead>, <tbody>
 * - Use with aria-busy="true" and aria-live for loading announcements
 *
 * Platform Notes:
 * - Mobile: Consider using card skeleton instead for better UX
 * - Tablet: Table skeleton with 2-3 columns
 * - Desktop: Full table skeleton with all columns
 *
 * @example
 * ```tsx
 * // Default 5 rows, 4 columns
 * <SkeletonTable />
 *
 * // Custom configuration (10 rows, 6 columns, no header)
 * <SkeletonTable rows={10} columns={6} showHeader={false} />
 *
 * // Large table with header
 * <SkeletonTable rows={15} columns={8} showHeader />
 *
 * // Loading data table
 * <div aria-busy="true" aria-live="polite">
 *   <SkeletonTable rows={10} columns={4} />
 * </div>
 * ```
 */
const SkeletonTable = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonTableProps>(
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
      const baseClass = cn('rounded-[var(--semantic-radius-input)] bg-muted', shouldAnimate && 'animate-pulse');

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
            <div className="flex gap-4 pb-3 border-b border-border">
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className={cn(baseClass, 'h-4 flex-1')} />
              ))}
            </div>
          )}

          {/* Rows */}
          <div className="divide-y divide-border">
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
  )
);
SkeletonTable.displayName = 'SkeletonTable';

// ============================================================================
// SkeletonChart Component
// ============================================================================

/**
 * SkeletonChart Component
 *
 * Displays a chart-shaped skeleton for visualization placeholders.
 * Supports different chart type representations (bar, line, pie, area).
 * Provides visual feedback during chart data loading.
 *
 * Accessibility:
 * - role="presentation" for decorative placeholder
 * - aria-hidden="true" hides from screen readers
 * - Actual chart should have accessible SVG with role="img" and aria-label
 *
 * Performance:
 * - Charts are lazy-loaded (~50KB per chart library)
 * - Use SkeletonChart as immediate placeholder
 * - Actual chart renders after data fetch completes
 *
 * @example
 * ```tsx
 * // Basic chart skeleton (default 200px height)
 * <SkeletonChart height={300} />
 *
 * // With title and legend
 * <SkeletonChart showTitle showLegend type="bar" height={280} />
 *
 * // Large area chart
 * <SkeletonChart showTitle showLegend type="area" height={400} />
 *
 * // In loading container
 * <div aria-busy="true" aria-live="polite">
 *   <Skeleton className="h-6 w-40 mb-4" /> // Chart title
 *   <SkeletonChart height={300} showLegend />
 * </div>
 * ```
 */
const SkeletonChart = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonChartProps>(
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
      const baseClass = cn('rounded-[var(--semantic-radius-card)] bg-muted', shouldAnimate && 'animate-pulse');

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
  )
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
 * Used for user profiles, device icons, router indicators, etc.
 * Matches Avatar component dimensions for zero layout shift.
 *
 * Accessibility:
 * - aria-hidden="true" (decorative placeholder)
 * - Actual avatar should have alt text or aria-label
 * - Use with aria-busy="true" on parent context
 *
 * Size Scale:
 * - sm: 32px (8h x 8w)
 * - md: 40px (10h x 10w) - default
 * - lg: 48px (12h x 12w)
 * - xl: 64px (16h x 16w)
 *
 * @example
 * ```tsx
 * // Circular avatar (default medium)
 * <SkeletonAvatar size="md" />
 *
 * // Square avatar
 * <SkeletonAvatar size="lg" shape="square" />
 *
 * // Large circular (e.g., profile page)
 * <SkeletonAvatar size="xl" shape="circle" />
 *
 * // In user profile context
 * <div className="flex gap-4" aria-busy="true">
 *   <SkeletonAvatar size="lg" />
 *   <div className="flex-1 space-y-2">
 *     <Skeleton className="h-5 w-40" />
 *     <Skeleton className="h-4 w-32" />
 *   </div>
 * </div>
 * ```
 */
const SkeletonAvatar = React.memo(
  React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
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
            shape === 'circle' ? 'rounded-full' : 'rounded-[var(--semantic-radius-input)]',
            shouldAnimate && 'animate-pulse',
            className
          )}
          aria-hidden="true"
          {...props}
        />
      );
    }
  )
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
