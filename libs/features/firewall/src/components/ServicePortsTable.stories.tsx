/**
 * Service Ports Table Storybook Stories
 *
 * Visual documentation and testing for ServicePortsTable component.
 *
 * Stories:
 * - Default (with built-in services)
 * - With custom services
 * - With search applied
 * - Empty state
 * - Loading state
 *
 * @see NAS-7.8: Implement Service Ports Management - Task 5
 */

import { fn, within, userEvent } from '@storybook/test';

import type { ServicePortDefinition } from '@nasnet/core/types';
import type { Meta, StoryObj } from '@storybook/react';

import { ServicePortsTable } from './ServicePortsTable';
import { useCustomServices } from '../hooks/useCustomServices';

// Mock the hook
const mockUseCustomServices = useCustomServices as ReturnType<typeof fn>;

// Test fixtures
const builtInServices: ServicePortDefinition[] = [
  {
    port: 80,
    service: 'HTTP',
    protocol: 'tcp',
    category: 'web',
    description: 'HyperText Transfer Protocol',
    builtIn: true,
  },
  {
    port: 443,
    service: 'HTTPS',
    protocol: 'tcp',
    category: 'secure',
    description: 'HTTP over TLS/SSL',
    builtIn: true,
  },
  {
    port: 22,
    service: 'SSH',
    protocol: 'tcp',
    category: 'secure',
    description: 'Secure Shell',
    builtIn: true,
  },
  {
    port: 53,
    service: 'DNS',
    protocol: 'both',
    category: 'network',
    description: 'Domain Name System',
    builtIn: true,
  },
  {
    port: 3306,
    service: 'MySQL',
    protocol: 'tcp',
    category: 'database',
    description: 'MySQL Database Server',
    builtIn: true,
  },
];

const customServices: ServicePortDefinition[] = [
  {
    port: 9999,
    service: 'my-app',
    protocol: 'tcp',
    category: 'custom',
    description: 'My custom application',
    builtIn: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    port: 8888,
    service: 'dev-server',
    protocol: 'tcp',
    category: 'custom',
    description: 'Development server',
    builtIn: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    port: 7777,
    service: 'game-server',
    protocol: 'udp',
    category: 'custom',
    description: 'Gaming server',
    builtIn: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const meta: Meta<typeof ServicePortsTable> = {
  title: 'Features/Firewall/ServicePortsTable',
  component: ServicePortsTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Table component for managing service port definitions. Supports built-in (read-only) and custom (editable) services with search, filter, and sort functionality.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServicePortsTable>;

/**
 * Default state with built-in services
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view showing only built-in services. Actions are disabled for read-only services.',
      },
    },
    mockData: [
      {
        url: '/api/custom-services',
        method: 'GET',
        status: 200,
        response: {
          services: builtInServices,
          customServices: [],
          serviceGroups: [],
        },
      },
    ],
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: builtInServices,
      customServices: [],
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
};

/**
 * With custom services
 */
export const WithCustomServices: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'View with both built-in and custom services. Custom services have enabled edit/delete actions.',
      },
    },
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: [...builtInServices, ...customServices],
      customServices: customServices,
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
};

/**
 * Empty state
 */
export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no services are defined.',
      },
    },
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: [],
      customServices: [],
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
};

/**
 * With search applied
 */
export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Table with search functionality. Users can filter by service name, port number, or description.',
      },
    },
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: [...builtInServices, ...customServices],
      customServices: customServices,
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'my-app', { delay: 100 });
  },
};

/**
 * Loading state
 */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Loading state while services are being fetched.',
      },
    },
  },
  render: () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full rounded-md border bg-background px-10 py-2"
              disabled
            />
          </div>
          <div className="h-10 w-[150px] rounded-md border bg-muted" />
          <div className="h-10 w-[150px] rounded-md border bg-muted" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile view with card-based layout and touch-friendly controls.',
      },
    },
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: [...builtInServices, ...customServices],
      customServices: customServices,
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
};

/**
 * Desktop view with filters
 */
export const DesktopWithFilters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Desktop view with protocol and category filters applied.',
      },
    },
  },
  beforeEach: () => {
    mockUseCustomServices.mockReturnValue({
      services: [...builtInServices, ...customServices],
      customServices: customServices,
      serviceGroups: [],
      deleteService: fn(),
      addService: fn(),
      updateService: fn(),
      createGroup: fn(),
      updateGroup: fn(),
      deleteGroup: fn(),
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click protocol filter
    const protocolFilters = canvas.getAllByRole('combobox');
    await userEvent.click(protocolFilters[0]);

    // Select TCP
    const tcpOption = await canvas.findByText(/tcp/i);
    await userEvent.click(tcpOption);
  },
};

