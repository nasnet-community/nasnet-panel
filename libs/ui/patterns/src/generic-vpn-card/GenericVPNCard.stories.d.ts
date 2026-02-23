/**
 * GenericVPNCard Storybook Stories
 *
 * Demonstrates the GenericVPNCard pattern for L2TP, PPTP, and SSTP
 * VPN interface display. Covers connected, disconnected, disabled,
 * and clickable interactive states.
 *
 * @module @nasnet/ui/patterns/generic-vpn-card
 */
import { GenericVPNCard } from './GenericVPNCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof GenericVPNCard>;
export default meta;
type Story = StoryObj<typeof GenericVPNCard>;
/**
 * An active L2TP client that is currently connected.
 */
export declare const L2TPConnected: Story;
/**
 * An L2TP client that is configured but not currently running.
 */
export declare const L2TPDisconnected: Story;
/**
 * A disabled PPTP interface — no status indicator shows "Disabled".
 */
export declare const PPTPDisabled: Story;
/**
 * An active SSTP client with certificate verification enabled.
 * The card shows the "Verify Certificate" field when that property is present.
 */
export declare const SSTPWithCertVerification: Story;
/**
 * Minimal interface with only the required fields — no user, comment, or
 * certificate fields are shown.
 */
export declare const MinimalInterface: Story;
/**
 * Clickable card variant — the card receives hover, focus, and keyboard
 * interaction styles when an onClick handler is provided.
 */
export declare const ClickableCard: Story;
//# sourceMappingURL=GenericVPNCard.stories.d.ts.map