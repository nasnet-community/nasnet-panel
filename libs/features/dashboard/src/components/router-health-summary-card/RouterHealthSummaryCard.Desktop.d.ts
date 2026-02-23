/**
 * RouterHealthSummaryCard Desktop Presenter
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Desktop-optimized presenter for router health summary.
 * Pro-grade density with detailed metrics and visual health indicator.
 *
 * Platform: Desktop (>1024px) and Tablet (640-1024px)
 * - Vertical card layout
 * - Detailed metrics display
 * - Visual health gauge/indicator
 * - Progress bars for CPU/Memory
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import React from 'react';
import type { UseRouterHealthCardReturn } from './useRouterHealthCard';
export interface RouterHealthSummaryCardDesktopProps {
    /** Computed state from headless hook */
    state: UseRouterHealthCardReturn;
    /** Callback when refresh is clicked */
    onRefresh?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Desktop presenter for router health summary
 *
 * Detailed vertical card with visual health indicator and progress bars.
 * Optimized for larger viewports with pro-grade information density.
 *
 * @description Renders a detailed health card with metrics, progress bars, and status indicators for desktop/tablet views.
 */
export declare const RouterHealthSummaryCardDesktop: React.NamedExoticComponent<RouterHealthSummaryCardDesktopProps>;
/**
 * Loading skeleton for desktop presenter
 *
 * @description Displays a skeleton placeholder while router health data is loading.
 */
export declare const RouterHealthSummaryCardDesktopSkeleton: React.NamedExoticComponent<{
    className?: string;
}>;
//# sourceMappingURL=RouterHealthSummaryCard.Desktop.d.ts.map