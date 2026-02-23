/**
 * DeviceListItem Storybook Stories
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 */
import { DeviceListItem } from './device-list-item';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DeviceListItem>;
export default meta;
type Story = StoryObj<typeof DeviceListItem>;
/**
 * Story 1: Default - Standard device with hostname
 */
export declare const Default: Story;
/**
 * Story 2: New Device - With "New" badge and pulse animation
 */
export declare const NewDevice: Story;
/**
 * Story 3: No Hostname - Fallback to IP display
 */
export declare const NoHostname: Story;
/**
 * Story 4: Long Hostname - Truncation with tooltip
 */
export declare const LongHostname: Story;
/**
 * Story 5: Privacy Mode - Masked hostname (Device-XXXX)
 */
export declare const PrivacyMode: Story;
/**
 * Story 6: Static Lease - Shows static badge
 */
export declare const StaticLease: Story;
/**
 * Story 7: All Device Types - Grid showing all 10 device types
 */
export declare const AllDeviceTypes: Story;
/**
 * Story 8: Long Duration - Device connected for days
 */
export declare const LongDuration: Story;
//# sourceMappingURL=device-list-item.stories.d.ts.map