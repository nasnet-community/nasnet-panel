/**
 * VPNClientCard Storybook Stories
 *
 * Demonstrates the VPNClientCard pattern showing VPN client status,
 * configuration, and actions. Covers multiple protocols, connection states,
 * and traffic information.
 *
 * @module @nasnet/ui/patterns/vpn-client-card
 */
import { VPNClientCard } from './VPNClientCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VPNClientCard>;
export default meta;
type Story = StoryObj<typeof VPNClientCard>;
/**
 * Connected WireGuard client with full statistics.
 */
export declare const WireGuardConnected: Story;
/**
 * Disconnected OpenVPN client.
 */
export declare const OpenVPNDisconnected: Story;
/**
 * Disabled L2TP client.
 */
export declare const L2TPDisabled: Story;
/**
 * Connected IKEv2 with minimal info (no traffic stats).
 */
export declare const IKEv2MinimalInfo: Story;
/**
 * Toggle switch is in loading state.
 */
export declare const TogglingState: Story;
/**
 * PPTP with large traffic numbers.
 */
export declare const PPTPWithHighTraffic: Story;
/**
 * Connected client without actions (read-only view).
 */
export declare const ReadOnlyView: Story;
/**
 * Client with very long name and comment (tests truncation).
 */
export declare const LongTextContent: Story;
//# sourceMappingURL=VPNClientCard.stories.d.ts.map