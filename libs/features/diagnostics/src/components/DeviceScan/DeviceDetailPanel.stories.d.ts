/**
 * Storybook stories for DeviceDetailPanel
 *
 * Covers: device with DHCP lease, static device (no lease), unknown vendor,
 * expiring lease, expired lease, and no router context.
 */
import { DeviceDetailPanel } from './DeviceDetailPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DeviceDetailPanel>;
export default meta;
type Story = StoryObj<typeof DeviceDetailPanel>;
export declare const WithDhcpLease: Story;
export declare const StaticDevice: Story;
export declare const UnknownVendorAndHostname: Story;
export declare const LeaseExpiringSoon: Story;
export declare const ExpiredLease: Story;
export declare const NoRouterContext: Story;
//# sourceMappingURL=DeviceDetailPanel.stories.d.ts.map