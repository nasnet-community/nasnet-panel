/**
 * RouteForm Storybook Stories
 * NAS-6.5: Task 9.7 - Static Route Management
 *
 * Demonstrates the RouteForm component in create/edit modes with validation,
 * gateway reachability checking, and platform-specific presenters.
 */

import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { RouteForm } from './RouteForm';

import type { InterfaceOption } from './types';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * GraphQL query for gateway reachability checking
 */
const CHECK_GATEWAY_REACHABILITY = gql`
  query CheckGatewayReachability($routerId: ID!, $gateway: IPv4!) {
    checkGatewayReachability(routerId: $routerId, gateway: $gateway) {
      reachable
      latency
      interface
      message
    }
  }
`;

/**
 * Mock interface options for selector
 */
const mockInterfaces: InterfaceOption[] = [
  { id: 'ether1', name: 'ether1', type: 'ethernet', disabled: false },
  { id: 'ether2', name: 'ether2', type: 'ethernet', disabled: false },
  { id: 'ether3', name: 'ether3', type: 'ethernet', disabled: false },
  { id: 'ether4', name: 'ether4', type: 'ethernet', disabled: false },
  { id: 'bridge1', name: 'bridge1', type: 'bridge', disabled: false },
  { id: 'vlan10', name: 'vlan10', type: 'vlan', disabled: false },
  { id: 'pppoe-out1', name: 'pppoe-out1', type: 'pppoe-client', disabled: false },
  { id: 'wlan1', name: 'wlan1', type: 'wlan', disabled: true },
];

const availableTables = ['main', 'vpn', 'guest', 'iot'];

/**
 * Mock route data for edit mode
 */
const existingRouteData = {
  destination: '10.20.0.0/16',
  gateway: '192.168.1.1',
  interface: undefined,
  distance: 1,
  routingMark: undefined,
  routingTable: 'main',
  comment: 'Route to remote office network',
};

const defaultRouteData = {
  destination: '0.0.0.0/0',
  gateway: '192.168.1.1',
  interface: 'ether1',
  distance: 1,
  routingMark: undefined,
  routingTable: 'main',
  comment: 'Default internet gateway',
};

const vpnRouteData = {
  destination: '10.10.0.0/24',
  gateway: undefined,
  interface: 'pppoe-out1',
  distance: 10,
  routingMark: 'vpn-mark',
  routingTable: 'vpn',
  comment: 'VPN tunnel route',
};

/**
 * Apollo mock: Gateway reachable (2ms latency via ether1)
 */
const mockGatewayReachable = [
  {
    request: {
      query: CHECK_GATEWAY_REACHABILITY,
      variables: {
        routerId: 'router-1',
        gateway: '192.168.1.1',
      },
    },
    result: {
      data: {
        checkGatewayReachability: {
          reachable: true,
          latency: 2,
          interface: 'ether1',
          message: 'Gateway is reachable via ether1',
          __typename: 'GatewayReachabilityResult',
        },
      },
    },
    delay: 800, // Simulate network delay
  },
];

/**
 * Apollo mock: Gateway unreachable (timeout)
 */
const mockGatewayUnreachable = [
  {
    request: {
      query: CHECK_GATEWAY_REACHABILITY,
      variables: {
        routerId: 'router-1',
        gateway: '192.168.1.254',
      },
    },
    result: {
      data: {
        checkGatewayReachability: {
          reachable: false,
          latency: null,
          interface: null,
          message: 'Gateway did not respond to ping. The gateway may be down or unreachable.',
          __typename: 'GatewayReachabilityResult',
        },
      },
    },
    delay: 1500,
  },
];

/**
 * Apollo mock: Multiple gateways for testing different scenarios
 */
const mockMultipleGateways = [
  {
    request: {
      query: CHECK_GATEWAY_REACHABILITY,
      variables: { routerId: 'router-1', gateway: '192.168.1.1' },
    },
    result: {
      data: {
        checkGatewayReachability: {
          reachable: true,
          latency: 2,
          interface: 'ether1',
          message: 'Gateway is reachable',
          __typename: 'GatewayReachabilityResult',
        },
      },
    },
  },
  {
    request: {
      query: CHECK_GATEWAY_REACHABILITY,
      variables: { routerId: 'router-1', gateway: '192.168.1.254' },
    },
    result: {
      data: {
        checkGatewayReachability: {
          reachable: false,
          latency: null,
          interface: null,
          message: 'Gateway timeout after 3 attempts',
          __typename: 'GatewayReachabilityResult',
        },
      },
    },
  },
];

/**
 * Storybook Meta Configuration
 */
const meta: Meta<typeof RouteForm> = {
  title: 'Features/Network/Routes/RouteForm',
  component: RouteForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Static route creation and editing form with intelligent gateway reachability checking.

## Features
- **Zod Validation**: CIDR format, IPv4 format, distance range (1-255)
- **Gateway Reachability**: Debounced ping check (non-blocking warning)
- **Platform Variants**: Desktop (card layout) and Mobile (full-width, 44px targets)
- **Conditional Fields**: Gateway OR interface required (not both mandatory)
- **Policy Routing**: Routing marks and custom routing tables support

## Validation Rules
- Destination: Valid CIDR notation (e.g., 192.168.1.0/24 or 0.0.0.0/0)
- Gateway: Optional valid IPv4 (e.g., 192.168.1.1)
- Interface: Optional interface name
- At least one of gateway OR interface must be provided
- Distance: Integer 1-255 (default: 1)
- Comment: Optional, max 255 characters

## Gateway Reachability
- Checks gateway via ICMP ping after 500ms debounce
- Shows real-time status: Checking → Reachable/Unreachable
- Displays latency and egress interface when reachable
- Warning is non-blocking (user can still submit)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Form mode: create new or edit existing',
    },
    routerId: {
      control: 'text',
      description: 'Router ID for GraphQL queries',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state disables form during submission',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Callback when form is submitted with valid data',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when user cancels form',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RouteForm>;

/**
 * Create mode - empty form for adding new static route.
 * All fields start empty with default values (distance: 1, routing table: main).
 */
export const CreateMode: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockMultipleGateways} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Edit mode - form pre-populated with existing route data.
 * Gateway reachability is checked automatically on load.
 */
export const EditMode: Story = {
  args: {
    mode: 'edit',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: existingRouteData,
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockGatewayReachable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Create mode submitting - form in loading state during submission.
 * Submit button shows loading spinner, all fields disabled.
 */
export const CreateModeSubmitting: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: defaultRouteData,
    loading: true,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockGatewayReachable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Form submission in progress. Submit button shows loading spinner, all fields disabled.',
      },
    },
  },
};

/**
 * Edit mode submitting - edit form during save operation.
 */
export const EditModeSubmitting: Story = {
  args: {
    mode: 'edit',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: existingRouteData,
    loading: true,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockGatewayReachable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Edit mode during form submission. Save button shows loading state.',
      },
    },
  },
};

/**
 * Validation errors - demonstrates multiple validation failures.
 * Invalid CIDR, invalid IPv4, distance out of range, missing gateway+interface.
 */
export const ValidationErrors: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: {
      destination: '192.168.1.0', // Invalid CIDR (missing /24)
      gateway: '192.168.300.1', // Invalid IPv4 (300 out of range)
      interface: undefined,
      distance: 300, // Out of range (max 255)
      routingTable: 'main',
      routingMark: undefined,
      comment: undefined,
    },
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `Demonstrates multiple validation errors:
- Invalid CIDR format (missing prefix length)
- Invalid IPv4 address (out of range octet)
- Distance out of range (max 255)
- Missing gateway AND interface (at least one required)`,
      },
    },
  },
};

/**
 * Gateway reachable - shows green success badge with latency info.
 * Gateway responds successfully with 2ms latency via ether1.
 */
export const GatewayReachable: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: {
      destination: '0.0.0.0/0',
      gateway: '192.168.1.1',
      interface: undefined,
      distance: 1,
      routingTable: 'main',
      routingMark: undefined,
      comment: 'Default route via primary gateway',
    },
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockGatewayReachable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Gateway reachability check returns success (2ms latency via ether1). Green badge shows "Gateway reachable".',
      },
    },
  },
};

/**
 * Gateway unreachable - shows amber warning (non-blocking).
 * Gateway does not respond, but user can still save the route.
 */
export const GatewayUnreachable: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: {
      destination: '172.16.0.0/12',
      gateway: '192.168.1.254',
      interface: undefined,
      distance: 1,
      routingTable: 'main',
      routingMark: undefined,
      comment: 'Route to private network segment',
    },
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockGatewayUnreachable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `Gateway reachability check returns failure. Shows amber warning badge and alert box:
- "Gateway may not be reachable" badge
- Warning message explaining the issue
- User can still submit (non-blocking warning)`,
      },
    },
  },
};

/**
 * Mobile presenter - mobile viewport with full-width layout.
 * 44px touch targets, vertical stacking, full-width buttons.
 */
export const MobilePresenter: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockMultipleGateways} addTypename={false}>
        <div className="min-h-screen p-4 bg-background">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile presenter with 44px touch targets, full-width buttons, and vertical layout.',
      },
    },
  },
};

/**
 * VPN route example - demonstrates routing mark and custom table.
 * Shows policy-based routing configuration.
 */
export const VpnRoute: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: vpnRouteData,
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'VPN route using custom routing table and routing mark for policy-based routing.',
      },
    },
  },
};

/**
 * Interface-only route - no gateway specified.
 * Valid for directly connected networks.
 */
export const InterfaceOnlyRoute: Story = {
  args: {
    mode: 'create',
    routerId: 'router-1',
    interfaces: mockInterfaces,
    availableTables,
    initialValues: {
      destination: '192.168.200.0/24',
      gateway: undefined,
      interface: 'ether3',
      distance: 1,
      routingTable: 'main',
      routingMark: undefined,
      comment: 'Direct interface route',
    },
    loading: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Route with only interface specified (no gateway). Valid for directly connected networks.',
      },
    },
  },
};
