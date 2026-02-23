/**
 * NetworkTopology.Mobile
 *
 * Mobile presenter for the Network Topology visualization.
 * Renders a simplified card-based list view instead of SVG.
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import type { NetworkTopologyProps } from './types';
export interface NetworkTopologyMobileProps extends NetworkTopologyProps {
    /** Whether to initially expand sections */
    defaultExpanded?: boolean;
}
/**
 * NetworkTopologyMobile
 *
 * Simplified list-based view of the network topology for mobile screens.
 * Features:
 * - Router info card at top
 * - Collapsible sections for WAN, LAN, and Devices
 * - Touch-optimized list items with 44px+ touch targets
 * - Status badges for quick visual reference
 */
export declare const NetworkTopologyMobile: import("react").NamedExoticComponent<NetworkTopologyMobileProps>;
//# sourceMappingURL=NetworkTopology.Mobile.d.ts.map