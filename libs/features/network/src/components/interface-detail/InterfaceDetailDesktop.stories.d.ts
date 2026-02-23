/**
 * InterfaceDetailDesktop Stories
 *
 * InterfaceDetailDesktop renders a right-side Sheet panel for a single
 * network interface. It accepts pre-fetched data directly as props so these
 * stories require no GraphQL mocking.
 *
 * Three display modes are exercised:
 *  - Loading (skeleton placeholders)
 *  - Error (query failure message)
 *  - Loaded (Status / Traffic / Configuration tabs)
 */
import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceDetailDesktop>;
export default meta;
type Story = StoryObj<typeof InterfaceDetailDesktop>;
/** Ethernet WAN interface — UP, enabled, with IPs, traffic rates and "Used By" badges. */
export declare const EthernetWAN: Story;
/** LAN bridge interface — UP, DHCP server consumer, low traffic. */
export declare const BridgeLAN: Story;
/** Disabled VLAN — DOWN status, no traffic, no IPs. */
export declare const DisabledVLAN: Story;
/** Wireless interface — active with MAC, link speed and TX/RX rates. */
export declare const WirelessInterface: Story;
/** Loading state — skeletons are shown while the query is in flight. */
export declare const Loading: Story;
/** Error state — query failed, destructive message is displayed. */
export declare const ErrorState: Story;
//# sourceMappingURL=InterfaceDetailDesktop.stories.d.ts.map