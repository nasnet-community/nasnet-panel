/**
 * InterfaceStatsPanel Component
 * Main wrapper with headless logic and platform detection
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Desktop: Dense data layout with grid sections
 * - Mobile: Card-based layout with 44px touch targets
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 */
import React from 'react';
import { InterfaceStatsPanelDesktop } from './interface-stats-panel-desktop';
import { InterfaceStatsPanelMobile } from './interface-stats-panel-mobile';
import type { InterfaceStatsPanelProps } from './interface-stats-panel.types';
/**
 * InterfaceStatsPanel Component
 *
 * Displays real-time interface statistics with platform-specific UI:
 * - TX/RX bytes, packets, errors, drops
 * - Calculated bandwidth rates
 * - Error rate percentage with trend indicators
 * - Threshold-based warnings
 *
 * @description Auto-detects platform and renders appropriate presenter for optimal UX across mobile, tablet, and desktop
 *
 * @example
 * ```tsx
 * <InterfaceStatsPanel
 *   routerId="router-1"
 *   interfaceId="ether1"
 *   interfaceName="ether1 - WAN"
 *   pollingInterval="5s"
 *   onClose={() => navigate('/interfaces')}
 * />
 * ```
 */
declare const InterfaceStatsPanel: React.NamedExoticComponent<InterfaceStatsPanelProps>;
export { InterfaceStatsPanelDesktop, InterfaceStatsPanelMobile };
export { InterfaceStatsPanel };
export type { InterfaceStatsPanelProps };
//# sourceMappingURL=interface-stats-panel.d.ts.map