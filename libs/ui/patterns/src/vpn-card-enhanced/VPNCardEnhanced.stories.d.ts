/**
 * VPNCardEnhanced Storybook Stories
 *
 * Demonstrates the VPNCardEnhanced pattern for quick VPN toggle
 * with status display. Covers connected, connecting, disconnected,
 * and error states.
 *
 * @module @nasnet/ui/patterns/vpn-card-enhanced
 */
import { VPNCardEnhanced } from './VPNCardEnhanced';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VPNCardEnhanced>;
export default meta;
type Story = StoryObj<typeof VPNCardEnhanced>;
/**
 * VPN is currently connected to the office location.
 */
export declare const Connected: Story;
/**
 * VPN connection is in progress.
 */
export declare const Connecting: Story;
/**
 * VPN is disconnected.
 */
export declare const Disconnected: Story;
/**
 * VPN connection failed with error state.
 */
export declare const Error: Story;
/**
 * Minimal variant without profile information.
 */
export declare const NoProfile: Story;
/**
 * Toggle switch is disabled (e.g., during connection or due to permissions).
 */
export declare const Disabled: Story;
/**
 * Connected with US flag.
 */
export declare const ConnectedUS: Story;
//# sourceMappingURL=VPNCardEnhanced.stories.d.ts.map