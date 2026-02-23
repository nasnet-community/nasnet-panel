/**
 * RouterHealthSummaryCard Component
 *
 * @description
 * Platform-adaptive router health summary card showing operational status,
 * resource utilization, and system vitals. Auto-detects viewport size
 * and renders optimized layout for Mobile (<640px) or Desktop (≥640px).
 *
 * Follows Headless + Platform Presenters architecture (ADR-018):
 * - **useRouterHealthCard hook:** Business logic, state management, data fetching
 * - **Mobile/Desktop presenters:** UI rendering only (no logic duplicated)
 * - **This component:** Platform detection wrapper using usePlatform()
 *
 * Mobile layout: Compact row with essential metrics
 * Desktop layout: Full card with all metrics, charts, and actions
 *
 * @architecture Headless + Platform Presenters (ADR-018)
 * @see libs/ui/patterns/common/router-health-summary-card/
 * @see useRouterHealthCard hook documentation
 * @see RouterHealthSummaryCard.Mobile
 * @see RouterHealthSummaryCard.Desktop
 */
import { type UseRouterHealthCardProps } from './useRouterHealthCard';
/**
 * Props for RouterHealthSummaryCard component.
 */
export interface RouterHealthSummaryCardProps extends UseRouterHealthCardProps {
    /** Callback when user requests manual refresh */
    onRefresh?: () => void;
    /** Override connection status (for testing/Storybook) */
    connectionStatus?: 'online' | 'offline' | 'connecting';
    /** Timestamp of last successful data fetch (for testing) */
    lastSeenAt?: Date;
    /** Show compact variant (mobile) - overrides platform detection */
    compact?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * RouterHealthSummaryCard - Platform-adaptive router health display
 *
 * Displays router health metrics with automatic layout adaptation:
 * - Mobile (<640px): Compact row layout
 * - Tablet/Desktop (≥640px): Detailed vertical card layout
 *
 * @example
 * ```tsx
 * import { RouterHealthSummaryCard } from '@nasnet/features/dashboard';
 *
 * function DashboardPage() {
 *   const handleRefresh = async () => {
 *     // Trigger manual data refetch
 *     await refetchRouterHealth();
 *   };
 *
 *   return (
 *     <DashboardLayout>
 *       <RouterHealthSummaryCard
 *         routerId="router-uuid-123"
 *         onRefresh={handleRefresh}
 *       />
 *     </DashboardLayout>
 *   );
 * }
 * ```
 *
 * @example With custom polling
 * ```tsx
 * <RouterHealthSummaryCard
 *   routerId="router-uuid-123"
 *   pollInterval={5000}  // Poll every 5 seconds
 *   enableSubscription={false}  // Disable WebSocket subscription
 * />
 * ```
 */
export declare const RouterHealthSummaryCard: import("react").NamedExoticComponent<RouterHealthSummaryCardProps>;
/**
 * Export presenters for direct use (rare, typically use auto-detecting wrapper)
 */
export { RouterHealthSummaryCardMobile } from './RouterHealthSummaryCard.Mobile';
export { RouterHealthSummaryCardDesktop } from './RouterHealthSummaryCard.Desktop';
/**
 * Export hook for custom implementations
 */
export { useRouterHealthCard } from './useRouterHealthCard';
export type { UseRouterHealthCardProps, UseRouterHealthCardReturn } from './useRouterHealthCard';
//# sourceMappingURL=RouterHealthSummaryCard.d.ts.map