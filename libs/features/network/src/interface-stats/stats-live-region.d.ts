/**
 * StatsLiveRegion Component
 * Screen reader announcements for interface statistics updates
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 9 - Accessibility)
 */
import React from 'react';
import type { InterfaceStats } from '@nasnet/api-client/generated';
/**
 * Props for StatsLiveRegion component
 */
export interface StatsLiveRegionProps {
    /** Current interface statistics */
    stats: InterfaceStats | null;
    /** Interface display name */
    interfaceName: string;
}
/**
 * StatsLiveRegion Component
 *
 * Provides ARIA live region announcements for screen reader users.
 * Announces statistics updates in a non-intrusive way with debouncing
 * to prevent announcement spam.
 *
 * Features:
 * - Debounced announcements (max 1 per 5 seconds)
 * - Polite interruption level (doesn't interrupt current reading)
 * - Atomic updates (entire message read together)
 * - Screen-reader only (visually hidden)
 *
 * @description Accessible live region for announcing real-time interface statistics changes to screen reader users
 *
 * @example
 * ```tsx
 * <StatsLiveRegion
 *   stats={statsState.stats}
 *   interfaceName="ether1 - WAN"
 * />
 * ```
 */
declare const StatsLiveRegion: React.NamedExoticComponent<StatsLiveRegionProps>;
export { StatsLiveRegion };
//# sourceMappingURL=stats-live-region.d.ts.map