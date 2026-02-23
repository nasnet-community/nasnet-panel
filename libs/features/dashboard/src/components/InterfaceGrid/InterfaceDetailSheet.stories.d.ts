/**
 * Storybook stories for InterfaceDetailSheet
 *
 * Displays expanded interface details in a sheet (mobile/tablet)
 * or dialog (desktop), showing MAC, IP, MTU, link speed, running
 * status, comment, link partner, and last-seen timestamp.
 */
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceDetailSheet>;
export default meta;
type Story = StoryObj<typeof InterfaceDetailSheet>;
/** Fully connected Ethernet interface with all optional fields populated. */
export declare const EthernetUp: Story;
/** Bridge interface: no MAC, no link speed, shows IP on the LAN side. */
export declare const BridgeInterface: Story;
/** VPN / WireGuard tunnel with no MAC address and a custom MTU. */
export declare const VpnTunnel: Story;
/**
 * Down interface: shows "Last Seen" timestamp because status is 'down'.
 * No IP or link speed is available.
 */
export declare const InterfaceDown: Story;
/** Administratively disabled interface with a comment but no traffic data. */
export declare const InterfaceDisabled: Story;
/** Sheet is closed — nothing should be visible. */
export declare const Closed: Story;
//# sourceMappingURL=InterfaceDetailSheet.stories.d.ts.map