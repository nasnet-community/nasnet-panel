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
/**
 * CardLayout - Responsive grid for card-based layouts
 */
export declare const CardLayout: React.MemoExoticComponent<React.ForwardRefExoticComponent<CardLayoutProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=card-layout.d.ts.map