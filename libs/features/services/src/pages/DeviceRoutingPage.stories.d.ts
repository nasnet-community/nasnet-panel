/**
 * DeviceRoutingPage Storybook Stories
 *
 * Interactive stories for the Device Routing page domain component (NAS-8.3).
 * Demonstrates the device-to-service routing matrix, bulk assignment progress,
 * real-time subscription event handling, and error states.
 *
 * @module @nasnet/features/services/pages
 */
import { DeviceRoutingPage } from './DeviceRoutingPage';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * DeviceRoutingPage — device-to-service routing management
 *
 * Allows network administrators to route specific LAN devices through a
 * service instance (e.g. route a laptop through Tor, route an IoT device
 * through a transparent proxy). Provides:
 *
 * - **Page header**: Title "Device Routing" and description.
 * - **Bulk assignment progress bar**: Shown only when a bulk operation is in
 *   flight, displaying percentage and success/total count.
 * - **DeviceRoutingMatrix**: Pattern component that renders the device list
 *   (sourced from DHCP leases + ARP table) alongside available service
 *   virtual interfaces. Supports:
 *   - Single device assignment (click on a matrix cell).
 *   - Bulk assignment (select multiple devices, then pick a service).
 *   - Routing removal (unassign a device).
 * - **Real-time updates**: `useDeviceRoutingSubscription` fires toast
 *   notifications on `assigned`, `removed`, and `updated` events.
 * - **Loading/Error states**: Loading spinner while matrix is being fetched;
 *   error toast on fetch failure.
 *
 * ## Props
 *
 * | Prop | Type | Description |
 * |------|------|-------------|
 * | `routerId` | `string` | Router ID for all device + routing queries |
 *
 * ## Routing modes
 *
 * All assignments use `MAC`-based routing (the default mode). IP-based
 * routing is planned for a future milestone.
 */
declare const meta: Meta<typeof DeviceRoutingPage>;
export default meta;
type Story = StoryObj<typeof DeviceRoutingPage>;
/**
 * Default — populated routing matrix
 *
 * Renders with a typical router ID. The DeviceRoutingMatrix shows devices
 * discovered from DHCP + ARP, and the available service interfaces. Some
 * devices may already be routed. Actual data depends on the MSW / Apollo
 * mock environment.
 */
export declare const Default: Story;
/**
 * Empty Matrix — no devices discovered
 *
 * The DHCP/ARP scan returned no devices. The DeviceRoutingMatrix shows its
 * empty state, prompting the admin to check that DHCP is configured on the
 * router or to wait for devices to connect.
 */
export declare const EmptyMatrix: Story;
/**
 * Bulk Assignment In Progress
 *
 * A bulk assignment operation is running. The progress bar below the page
 * header shows the percentage (65%) and "13/20 completed". The matrix is
 * rendered with `loading={true}` to disable further interactions.
 */
export declare const BulkAssignmentProgress: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The DeviceRoutingMatrix collapses to its mobile
 * presentation with scrollable horizontal device/service columns and 44px
 * touch targets on each assignment cell.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=DeviceRoutingPage.stories.d.ts.map