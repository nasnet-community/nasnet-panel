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
const meta: Meta<typeof DeviceRoutingPage> = {
  title: 'Pages/Services/DeviceRoutingPage',
  component: DeviceRoutingPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Device-to-service routing management page (NAS-8.3). Renders the ' +
          'DeviceRoutingMatrix pattern component populated from DHCP leases and ' +
          'ARP table entries. Supports single and bulk device assignment to ' +
          'service virtual interfaces (Tor, sing-box, Xray, etc.). Real-time ' +
          'toast notifications are emitted via GraphQL subscription on routing ' +
          'changes. All assignments default to MAC-based routing mode.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    routerId: {
      description: 'Router ID used to scope device discovery and routing queries',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeviceRoutingPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — populated routing matrix
 *
 * Renders with a typical router ID. The DeviceRoutingMatrix shows devices
 * discovered from DHCP + ARP, and the available service interfaces. Some
 * devices may already be routed. Actual data depends on the MSW / Apollo
 * mock environment.
 */
export const Default: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default populated view. DeviceRoutingMatrix lists network devices ' +
          'alongside service interfaces (Tor, sing-box). Some devices are ' +
          'already assigned; others are unrouted. The summary badge in the ' +
          'matrix header shows assigned/total counts.',
      },
    },
    mockData: {
      matrix: {
        devices: [
          {
            deviceID: 'dev-001',
            macAddress: 'AA:BB:CC:DD:EE:01',
            ipAddress: '192.168.88.10',
            hostname: 'laptop-reza',
            deviceType: 'laptop',
          },
          {
            deviceID: 'dev-002',
            macAddress: 'AA:BB:CC:DD:EE:02',
            ipAddress: '192.168.88.11',
            hostname: 'iphone-reza',
            deviceType: 'mobile',
          },
          {
            deviceID: 'dev-003',
            macAddress: 'AA:BB:CC:DD:EE:03',
            ipAddress: '192.168.88.20',
            hostname: null,
            deviceType: 'unknown',
          },
        ],
        interfaces: [
          {
            id: 'vif-tor-001',
            instanceID: 'inst-tor-001',
            instanceName: 'tor-main',
            routingMark: 'tor_mark',
          },
          {
            id: 'vif-singbox-001',
            instanceID: 'inst-singbox-001',
            instanceName: 'singbox-proxy',
            routingMark: 'singbox_mark',
          },
        ],
        routings: [
          {
            id: 'routing-001',
            deviceID: 'dev-001',
            deviceName: 'laptop-reza',
            deviceIP: '192.168.88.10',
            macAddress: 'AA:BB:CC:DD:EE:01',
            instanceID: 'inst-tor-001',
            interfaceID: 'vif-tor-001',
            routingMode: 'MAC',
          },
        ],
      },
      loading: false,
    },
  },
};

/**
 * Empty Matrix — no devices discovered
 *
 * The DHCP/ARP scan returned no devices. The DeviceRoutingMatrix shows its
 * empty state, prompting the admin to check that DHCP is configured on the
 * router or to wait for devices to connect.
 */
export const EmptyMatrix: Story = {
  args: {
    routerId: 'router-002',
  },
  parameters: {
    docs: {
      description: {
        story:
          'No devices discovered from DHCP leases or ARP table. The matrix ' +
          'empty state is shown, guiding the admin to verify DHCP configuration ' +
          'or wait for devices to join the network.',
      },
    },
    mockData: {
      matrix: {
        devices: [],
        interfaces: [
          {
            id: 'vif-tor-001',
            instanceID: 'inst-tor-001',
            instanceName: 'tor-main',
            routingMark: 'tor_mark',
          },
        ],
        routings: [],
      },
      loading: false,
    },
  },
};

/**
 * Bulk Assignment In Progress
 *
 * A bulk assignment operation is running. The progress bar below the page
 * header shows the percentage (65%) and "13/20 completed". The matrix is
 * rendered with `loading={true}` to disable further interactions.
 */
export const BulkAssignmentProgress: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bulk assignment operation in progress. The progress bar shows ' +
          '"65%" and "13/20 completed". The DeviceRoutingMatrix is rendered ' +
          'in loading mode to prevent concurrent mutations.',
      },
    },
    mockData: {
      bulkProgress: {
        percentage: 65,
        successful: 13,
        total: 20,
      },
      loading: true,
    },
  },
};

/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The DeviceRoutingMatrix collapses to its mobile
 * presentation with scrollable horizontal device/service columns and 44px
 * touch targets on each assignment cell.
 */
export const MobileViewport: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile view (<640px). The DeviceRoutingMatrix adapts to a scrollable ' +
          'layout. Assignment cells have 44px minimum touch targets. The page ' +
          'header stacks vertically to accommodate the narrow viewport.',
      },
    },
  },
};
