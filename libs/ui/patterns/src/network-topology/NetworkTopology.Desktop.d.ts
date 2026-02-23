/**
 * NetworkTopology.Desktop
 *
 * Desktop presenter for the Network Topology visualization.
 * Renders a full SVG diagram with all nodes and connections.
 *
 * @see ADR-018: Headless + Platform Presenters
 */
import type { NetworkTopologyProps } from './types';
export interface NetworkTopologyDesktopProps extends NetworkTopologyProps {
    /** Show devices in the topology */
    showDevices?: boolean;
}
/**
 * NetworkTopologyDesktop
 *
 * Full SVG visualization of the network topology for desktop screens.
 * Features:
 * - Router at center with WAN on left, LAN on right
 * - Curved bezier connections between nodes
 * - Interactive tooltips on hover/focus
 * - Keyboard navigation support
 */
export declare const NetworkTopologyDesktop: import("react").NamedExoticComponent<NetworkTopologyDesktopProps>;
//# sourceMappingURL=NetworkTopology.Desktop.d.ts.map