/**
 * WAN Card Storybook Stories
 *
 * Interactive documentation and visual testing for the WANCard and WANCardCompact
 * components. Covers all connection types, health states, and status combinations.
 */
import { WANCard } from './WANCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WANCard>;
export default meta;
type Story = StoryObj<typeof WANCard>;
/**
 * ConnectedDHCP - healthy DHCP connection with health check active.
 */
export declare const ConnectedDHCP: Story;
/**
 * ConnectedPPPoE - PPPoE connection with degraded health (high latency).
 */
export declare const ConnectedPPPoE: Story;
/**
 * ConnectedStaticIP - static IP WAN without health monitoring enabled.
 */
export declare const ConnectedStaticIP: Story;
/**
 * ConnectedLTE - LTE backup WAN with health check active.
 */
export declare const ConnectedLTE: Story;
/**
 * Disconnected - WAN link down with last-connected timestamp.
 */
export declare const Disconnected: Story;
/**
 * Connecting - WAN dial-up in progress (intermediate state).
 */
export declare const Connecting: Story;
/**
 * ErrorState - WAN in error state (e.g. authentication failure).
 */
export declare const ErrorState: Story;
/**
 * ReadOnly - card without action buttons (display-only).
 */
export declare const ReadOnly: Story;
export declare const CompactConnected: Story;
export declare const CompactDisconnected: Story;
//# sourceMappingURL=WANCard.stories.d.ts.map