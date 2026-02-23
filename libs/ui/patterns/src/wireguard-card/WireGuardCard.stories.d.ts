/**
 * WireGuardCard Storybook Stories
 *
 * Demonstrates the WireGuardCard pattern for WireGuard VPN interface display.
 * The real component integrates with Apollo (useWireGuardPeers) and Zustand
 * (useConnectionStore), so stories use a mock wrapper that isolates the
 * visual presentation without requiring live store/network bindings.
 *
 * @module @nasnet/ui/patterns/wireguard-card
 */
import type { WireGuardInterface, WireGuardPeer } from '@nasnet/core/types';
import type { Meta, StoryObj } from '@storybook/react';
interface MockWireGuardCardProps {
    /** WireGuard interface data */
    wgInterface: WireGuardInterface;
    /** Peer count badge value */
    peerCount?: number;
    /** Peers to display when expanded */
    peers?: WireGuardPeer[];
    /** Whether to start expanded */
    defaultExpanded?: boolean;
    /** Simulate peers loading */
    peersLoading?: boolean;
    /** Simulate peers error */
    peersError?: boolean;
}
declare function MockWireGuardCard({ wgInterface, peerCount, peers, defaultExpanded, peersLoading, peersError, }: MockWireGuardCardProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockWireGuardCard>;
export default meta;
type Story = StoryObj<typeof MockWireGuardCard>;
/**
 * An active WireGuard server interface with 2 peers.
 */
export declare const ActiveWithPeers: Story;
/**
 * Active server with the peer list pre-expanded.
 */
export declare const ExpandedWithPeers: Story;
/**
 * An inactive interface — configured but not currently running.
 */
export declare const Inactive: Story;
/**
 * A disabled interface — administratively shut down.
 */
export declare const Disabled: Story;
/**
 * Active interface showing all connection statistics.
 */
export declare const WithConnectionStats: Story;
/**
 * Expanded peer list in loading state — simulates lazy-fetch in progress.
 */
export declare const PeersLoading: Story;
/**
 * Expanded peer list in error state — simulates network failure.
 */
export declare const PeersError: Story;
//# sourceMappingURL=WireGuardCard.stories.d.ts.map