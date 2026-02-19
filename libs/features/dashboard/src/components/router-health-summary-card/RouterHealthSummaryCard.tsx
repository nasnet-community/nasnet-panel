/**
 * RouterHealthSummaryCard Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Platform-adaptive router health summary card.
 * Auto-detects viewport and renders appropriate presenter (Mobile/Desktop).
 *
 * Architecture Pattern: Headless + Platform Presenters (ADR-018)
 * - useRouterHealthCard hook: Business logic (headless)
 * - Mobile/Desktop presenters: UI only (no logic)
 * - This component: Platform detection wrapper
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see Story 4.3: Responsive Layout for platform detection
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useRouterHealthCard, type UseRouterHealthCardProps } from './useRouterHealthCard';
import { RouterHealthSummaryCardMobile } from './RouterHealthSummaryCard.Mobile';
import { RouterHealthSummaryCardDesktop } from './RouterHealthSummaryCard.Desktop';

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
export const RouterHealthSummaryCard = memo(function RouterHealthSummaryCard({
  routerId,
  pollInterval,
  enableSubscription,
  onRefresh,
  compact,
  className,
}: RouterHealthSummaryCardProps) {
  // Get platform for presenter selection
  const platform = usePlatform();

  // Execute headless hook (business logic)
  const state = useRouterHealthCard({
    routerId,
    pollInterval,
    enableSubscription,
  });

  // Combine internal refetch with external onRefresh callback
  const handleRefresh = async () => {
    await state.refetch();
    onRefresh?.();
  };

  // Select presenter based on platform (or explicit compact prop)
  const isMobile = compact ?? platform === 'mobile';

  return isMobile ? (
    <RouterHealthSummaryCardMobile state={state} onRefresh={handleRefresh} className={className} />
  ) : (
    <RouterHealthSummaryCardDesktop state={state} onRefresh={handleRefresh} className={className} />
  );
});

RouterHealthSummaryCard.displayName = 'RouterHealthSummaryCard';

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
