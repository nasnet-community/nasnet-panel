/**
 * Card Layout Component
 *
 * Responsive grid layout for card-based content. Automatically adjusts
 * columns and spacing based on viewport size. Optionally applies consistent
 * styling to all child cards.
 *
 * Features:
 * - Responsive column layout (1-4 columns or auto)
 * - Configurable gap between cards
 * - Optional variant styling for child cards
 * - Mobile-first responsive design (1 col → 2 → 3/4 cols)
 * - Semantic grid with proper accessibility
 * - Respects prefers-reduced-motion for hover transitions
 *
 * Platform Support:
 * - Mobile (<640px): 1 column, compact spacing
 * - Tablet (640-1024px): 2 columns, balanced spacing
 * - Desktop (>1024px): 3-4 columns (configurable), generous spacing
 *
 * @example
 * ```tsx
 * // Auto-responsive layout (1 → 2 → 3 columns)
 * <CardLayout columns="auto" gap="lg" variant="elevated">
 *   <Card title="Item 1">Content</Card>
 *   <Card title="Item 2">Content</Card>
 *   <Card title="Item 3">Content</Card>
 * </CardLayout>
 *
 * // Fixed 3-column layout
 * <CardLayout columns={3} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </CardLayout>
 * ```
 *
 * @see {@link CardLayoutProps} for prop interface
 */

import * as React from 'react';
import { useMemo } from 'react';

import { cn } from '@nasnet/ui/primitives';
import { useReducedMotion } from '@nasnet/core/utils';

/**
 * CardLayout component props
 * @interface CardLayoutProps
 */
export interface CardLayoutProps {
  /** Child card elements to layout in grid */
  children: React.ReactNode;
  /** Number of columns or 'auto' for responsive layout */
  columns?: 1 | 2 | 3 | 4 | 'auto';
  /** Spacing between cards (applies semantic token spacing) */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Optional visual variant to apply to all child cards */
  variant?: 'elevated' | 'interactive' | 'flat';
  /** Optional custom className for root grid element */
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-component-sm',
  md: 'gap-component-md lg:gap-component-lg',
  lg: 'gap-component-lg',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
  auto: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
};

const getVariantClasses = (prefersReducedMotion: boolean) => ({
  elevated: 'bg-card rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)]',
  interactive: cn(
    'bg-card border border-border rounded-[var(--semantic-radius-card)]',
    !prefersReducedMotion && 'hover:shadow-[var(--semantic-shadow-card)] transition-shadow duration-150'
  ),
  flat: 'bg-card border border-border rounded-[var(--semantic-radius-card)]',
});

/**
 * CardLayout - Responsive grid layout for card-based content
 * Applies consistent responsive spacing and optional variant styling to child cards.
 */
const CardLayoutImpl = React.forwardRef<HTMLDivElement, CardLayoutProps>(
  ({ children, columns = 'auto', gap = 'md', variant, className }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const variantClasses = useMemo(
      () => getVariantClasses(prefersReducedMotion),
      [prefersReducedMotion]
    );

    // Memoize variant styling computation
    const childrenWithVariant = useMemo(() => {
      if (!variant) return children;

      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: cn(
              variantClasses[variant],
              child.props.className
            ),
          } as { className?: string });
        }
        return child;
      });
    }, [children, variant, variantClasses]);

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        role="region"
        aria-label="Card layout"
      >
        {childrenWithVariant}
      </div>
    );
  }
);

CardLayoutImpl.displayName = 'CardLayout';

/**
 * CardLayout - Responsive grid for card-based layouts
 */
export const CardLayout = React.memo(CardLayoutImpl);




























