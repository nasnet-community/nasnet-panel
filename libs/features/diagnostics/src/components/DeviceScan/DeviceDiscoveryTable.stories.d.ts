/**
 * Storybook stories for DeviceDiscoveryTable
 *
 * Covers: empty state, small list, selected row, mixed vendors/hostnames,
 * and a single-device result.
 */
import { DeviceDiscoveryTable } from './DeviceDiscoveryTable';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DeviceDiscoveryTable>;
export default meta;
type Story = StoryObj<typeof DeviceDiscoveryTable>;
export declare const Empty: Story;
export declare const SingleDevice: Story;
export declare const MultipleDevices: Story;
export declare const WithSelectedRow: Story;
export declare const UnknownVendors: Story;
//# sourceMappingURL=DeviceDiscoveryTable.stories.d.ts.map