/**
 * NetworkTopology Storybook Stories
 *
 * Documentation and visual testing for the NetworkTopology component.
 * Includes stories for various states and configurations.
 */
import { NetworkTopology } from './NetworkTopology';
import { NetworkTopologyDesktop } from './NetworkTopology.Desktop';
import { NetworkTopologyMobile } from './NetworkTopology.Mobile';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Network Topology Visualization
 *
 * A visual diagram showing network configuration with:
 * - Router at center
 * - WAN interfaces on the left
 * - LAN networks on the right
 * - Connected devices (optional)
 *
 * The component automatically switches between desktop (SVG) and
 * mobile (card-based) presentations based on screen size.
 */
declare const meta: Meta<typeof NetworkTopology>;
export default meta;
type Story = StoryObj<typeof NetworkTopology>;
/**
 * Default topology with typical home network setup
 */
export declare const Default: Story;
/**
 * Topology showing connected devices
 */
export declare const WithDevices: Story;
/**
 * Simple setup with single WAN and LAN
 */
export declare const SimpleNetwork: Story;
/**
 * Router is offline
 */
export declare const RouterOffline: Story;
/**
 * WAN connection pending (e.g., during reconnection)
 */
export declare const PendingConnection: Story;
/**
 * Empty state - no WAN or LAN configured
 */
export declare const EmptyState: Story;
/**
 * Forced desktop presenter view
 */
export declare const DesktopView: Story;
/**
 * Forced mobile presenter view
 */
export declare const MobileView: Story;
/**
 * Dark mode theme
 */
export declare const DarkMode: Story;
/**
 * Multiple WAN interfaces (Multi-WAN setup)
 */
export declare const MultiWan: Story;
export declare const DesktopComponent: StoryObj<typeof NetworkTopologyDesktop>;
export declare const MobileComponent: StoryObj<typeof NetworkTopologyMobile>;
//# sourceMappingURL=NetworkTopology.stories.d.ts.map