/**
 * DashboardLayout Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Responsive CSS Grid layout that adapts to mobile, tablet, and desktop viewports.
 * Implements platform-specific layouts per UX Design Section 2.3.
 *
 * Platform Layouts:
 * - Mobile (<640px): Single column, full-width cards
 * - Tablet (640-1024px): 2-column grid, collapsible sidebar
 * - Desktop (>1024px): 3-column grid, fixed sidebar (240px)
 *
 * @see ADR-017: Three-Layer Component Architecture
 * @see Docs/design/ux-design/2-core-user-experience.md#Adaptive Layouts
 */
import { type ReactNode } from 'react';
export interface DashboardLayoutProps {
    /** Child widgets/cards to render in grid */
    children: ReactNode;
    /** Callback when refresh button is clicked */
    onRefresh?: () => void;
    /** Show refresh button (default: true) */
    showRefresh?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * DashboardLayout - Responsive grid layout for dashboard widgets
 * @description Responsive CSS Grid layout that adapts to mobile, tablet, and desktop viewports
 *
 * Automatically adjusts grid columns based on viewport:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 *
 * @example
 * ```tsx
 * <DashboardLayout onRefresh={handleRefresh}>
 *   <RouterHealthSummaryCard routerId="router-1" />
 *   <NetworkStatusCard routerId="router-1" />
 *   <AlertsCard routerId="router-1" />
 * </DashboardLayout>
 * ```
 */
export declare const DashboardLayout: import("react").NamedExoticComponent<DashboardLayoutProps>;
/**
 * Type export for external consumption
 */
export type { DashboardLayoutProps as DashboardLayoutPropsType };
//# sourceMappingURL=DashboardLayout.d.ts.map