/**
 * RouterHealthSummaryCard Mobile Presenter
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Mobile-optimized presenter for router health summary.
 * Compact layout with 64px height row, expandable to bottom sheet.
 *
 * Platform: Mobile (<640px)
 * - Single row, compact display
 * - 44px touch targets (WCAG AAA)
 * - Tap to expand to bottom sheet (future enhancement)
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import React from 'react';
import type { UseRouterHealthCardReturn } from './useRouterHealthCard';
export interface RouterHealthSummaryCardMobileProps {
    /** Computed state from headless hook */
    state: UseRouterHealthCardReturn;
    /** Callback when refresh is clicked */
    onRefresh?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Mobile presenter for router health summary
 *
 * Compact row layout optimized for mobile viewports.
 * Shows essential info: name, status badge, health indicator.
 *
 * Future enhancements:
 * - Tap to expand to bottom sheet with full details
 * - Swipe left to reveal quick actions
 * - Long press to copy router UUID
 *
 * @description Renders a compact card with 44px touch targets for mobile devices.
 */
export declare const RouterHealthSummaryCardMobile: React.NamedExoticComponent<RouterHealthSummaryCardMobileProps>;
/**
 * Loading skeleton for mobile presenter
 *
 * @description Displays a skeleton placeholder while router health data is loading.
 */
export declare const RouterHealthSummaryCardMobileSkeleton: React.NamedExoticComponent<{
    className?: string;
}>;
//# sourceMappingURL=RouterHealthSummaryCard.Mobile.d.ts.map