/**
 * ServiceGroupDialog Storybook Stories
 *
 * Interactive stories demonstrating:
 * - Create mode (empty form)
 * - Edit mode (pre-populated with existing group)
 * - Validation errors
 * - Conflict errors
 * - Large groups (10+ services)
 *
 * @module @nasnet/features/firewall/components
 */

import { useState } from 'react';

import { fn, within, waitFor, userEvent } from 'storybook/test';
import { vi } from 'vitest';

import type { ServiceGroup, ServicePortDefinition } from '@nasnet/core/types';

import { ServiceGroupDialog } from './ServiceGroupDialog';
import * as useCustomServicesModule from '../hooks/useCustomServices';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_SERVICES: ServicePortDefinition[] = [
  // Web services
  {
    port: 80,
    service: 'HTTP',
    protocol: 'tcp',
    category: 'web',
    description: 'Hypertext Transfer Protocol',
    isBuiltIn: true,
  },
  {
    port: 443,
    service: 'HTTPS',
    protocol: 'tcp',
    category: 'secure',
    description: 'HTTP over TLS/SSL',
    isBuiltIn: true,
  },
  {
    port: 8080,
    service: 'HTTP-Alt',
    protocol: 'tcp',
    category: 'web',
    description: 'HTTP Alternate',
    isBuiltIn: true,
  },
  {
    port: 8443,
    service: 'HTTPS-Alt',
    protocol: 'tcp',
    category: 'secure',
    description: 'HTTPS Alternate',
    isBuiltIn: true,
  },
  // Database services
  {
    port: 3306,
    service: 'MySQL',
    protocol: 'tcp',
    category: 'database',
    description: 'MySQL Database',
    isBuiltIn: true,
  },
  {
    port: 5432,
    service: 'PostgreSQL',
    protocol: 'tcp',
    category: 'database',
    description: 'PostgreSQL Database',
    isBuiltIn: true,
  },
  {
    port: 6379,
    service: 'Redis',
    protocol: 'tcp',
    category: 'database',
    description: 'Redis In-Memory Database',
    isBuiltIn: true,
  },
  {
    port: 27017,
    service: 'MongoDB',
    protocol: 'tcp',
    category: 'database',
    description: 'MongoDB Database',
    isBuiltIn: true,
  },
  // Network services
  {
    port: 53,
    service: 'DNS',
    protocol: 'both',
    category: 'network',
    description: 'Domain Name System',
    isBuiltIn: true,
  },
  {
    port: 123,
    service: 'NTP',
    protocol: 'udp',
    category: 'network',
    description: 'Network Time Protocol',
    isBuiltIn: true,
  },
  {
    port: 161,
    service: 'SNMP',
    protocol: 'udp',
    category: 'network',
    description: 'Simple Network Management Protocol',
    isBuiltIn: true,
  },
  // Mail services
  {
    port: 25,
    service: 'SMTP',
    protocol: 'tcp',
    category: 'mail',
    description: 'Simple Mail Transfer Protocol',
    isBuiltIn: true,
  },
  {
    port: 143,
    service: 'IMAP',
    protocol: 'tcp',
    category: 'mail',
    description: 'Internet Message Access Protocol',
    isBuiltIn: true,
  },
  {
    port: 993,
    service: 'IMAPS',
    protocol: 'tcp',
    category: 'mail',
    description: 'IMAP over TLS/SSL',
    isBuiltIn: true,
  },
  // Custom services
  {
    port: 9999,
    service: 'my-app',
    protocol: 'tcp',
    category: 'custom',
    description: 'My custom application',
    isBuiltIn: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    port: 8888,
    service: 'dev-server',
    protocol: 'tcp',
    category: 'custom',
    description: 'Development server',
    isBuiltIn: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const MOCK_GROUPS: ServiceGroup[] = [
  {
    id: 'group-1',
    name: 'web-services',
    description: 'Common web services',
    ports: [80, 443, 8080],
    protocol: 'tcp',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'group-2',
    name: 'database-tier',
    description: 'All database services',
    ports: [3306, 5432, 6379, 27017],
    protocol: 'tcp',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const LARGE_GROUP: ServiceGroup = {
  id: 'group-large',
  name: 'all-services',
  description: 'Large group with many services',
  ports: [80, 443, 8080, 8443, 3306, 5432, 6379, 27017, 25, 143, 993, 9999, 8888],
  protocol: 'tcp',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ============================================================================
// Mock Hook
// ============================================================================

const mockCreateGroup = fn();
const mockUpdateGroup = fn();

const mockUseCustomServices = {
  services: MOCK_SERVICES,
  customServices: MOCK_SERVICES.filter((s) => !s.isBuiltIn),
  serviceGroups: MOCK_GROUPS,
  addService: fn(),
  updateService: fn(),
  deleteService: fn(),
  createGroup: mockCreateGroup,
  updateGroup: mockUpdateGroup,
  deleteGroup: fn(),
};

// Setup mock
vi.spyOn(useCustomServicesModule, 'useCustomServices').mockReturnValue(mockUseCustomServices);

// ============================================================================
// Story Wrapper
// ============================================================================

function ServiceGroupDialogWrapper(
  props: Partial<typeof ServiceGroupDialog & { editGroup?: ServiceGroup }>
) {
  const [open, setOpen] = useState(true);
  const { editGroup, ...restProps } = props as any;

  return (
    <div className="bg-background min-h-screen p-8">
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2"
      >
        Open Dialog
      </button>
      <ServiceGroupDialog
        open={open}
        onOpenChange={setOpen}
        editGroup={editGroup}
        {...restProps}
      />
    </div>
  );
}

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof ServiceGroupDialog> = {
  title: 'Features/Firewall/ServiceGroupDialog',
  component: ServiceGroupDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dialog for creating and editing service groups. Supports multi-select, protocol filtering, and conflict detection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls dialog visibility',
    },
    onOpenChange: {
      action: 'onOpenChange',
      description: 'Callback when dialog open state changes',
    },
    editGroup: {
      control: 'object',
      description: 'Service group to edit (undefined for create mode)',
    },
  } satisfies Meta<typeof ServiceGroupDialog>['argTypes'],
};

export default meta;
type Story = StoryObj<typeof ServiceGroupDialog>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Create Mode
 *
 * Empty form for creating a new service group.
 * User can select multiple services, set protocol, and add description.
 */
export const CreateMode: Story = {
  render: () => <ServiceGroupDialogWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Create a new service group from scratch. The form starts empty and validates required fields.',
      },
    },
  },
};

/**
 * Edit Mode - Small Group
 *
 * Editing an existing service group with 3 services.
 * Form is pre-populated with group data.
 */
export const EditModeSmallGroup: Story = {
  render: () => <ServiceGroupDialogWrapper editGroup={MOCK_GROUPS[0]} />,
  parameters: {
    docs: {
      description: {
        story:
          "Edit an existing service group. The form is pre-populated with the group's current configuration.",
      },
    },
  },
};

/**
 * Edit Mode - Database Group
 *
 * Editing a service group containing database services.
 * Shows 4 selected services.
 */
export const EditModeDatabaseGroup: Story = {
  render: () => <ServiceGroupDialogWrapper editGroup={MOCK_GROUPS[1]} />,
  parameters: {
    docs: {
      description: {
        story:
          'Edit a database service group with multiple services. Demonstrates preview functionality.',
      },
    },
  },
};

/**
 * Large Group
 *
 * Editing a large group with 13 services.
 * Tests UI with many selected chips.
 */
export const LargeGroup: Story = {
  render: () => <ServiceGroupDialogWrapper editGroup={LARGE_GROUP} />,
  parameters: {
    docs: {
      description: {
        story: 'Edit a large service group with 13 services. Tests UI scalability with many chips.',
      },
    },
  },
};

/**
 * With UDP Protocol
 *
 * Create mode with UDP protocol selected.
 * Filters services to show only UDP-compatible services.
 */
export const WithUDPProtocol: Story = {
  render: () => {
    const udpGroup: ServiceGroup = {
      id: 'group-udp',
      name: 'network-services',
      description: 'UDP network services',
      ports: [53, 123, 161],
      protocol: 'udp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    return <ServiceGroupDialogWrapper editGroup={udpGroup} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Group with UDP protocol. Only UDP and "both" services are available for selection.',
      },
    },
  },
};

/**
 * With "Both" Protocol
 *
 * Create mode with "both" protocol selected.
 * Shows all available services regardless of protocol.
 */
export const WithBothProtocol: Story = {
  render: () => {
    const bothGroup: ServiceGroup = {
      id: 'group-both',
      name: 'mixed-services',
      description: 'Mixed TCP/UDP services',
      ports: [53, 80, 123],
      protocol: 'both',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    return <ServiceGroupDialogWrapper editGroup={bothGroup} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group with "both" protocol. All services (TCP, UDP, both) are available for selection.',
      },
    },
  },
};

/**
 * Validation Error - Empty Fields
 *
 * Shows validation errors when required fields are empty.
 * Demonstrates form validation feedback.
 */
export const ValidationErrorEmptyFields: Story = {
  render: () => <ServiceGroupDialogWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Click "Create Group" without filling the form to see validation errors for required fields.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for dialog to open
    await waitFor(() => canvas.getByRole('dialog'));

    // Click submit without filling form
    const submitButton = canvas.getByRole('button', { name: /create group/i });
    await userEvent.click(submitButton);
  },
};

/**
 * Conflict Error
 *
 * Shows error when group name already exists.
 * Demonstrates conflict detection.
 */
export const ConflictError: Story = {
  render: () => {
    // Mock createGroup to throw conflict error
    mockCreateGroup.mockRejectedValueOnce(
      new Error('Service group "web-services" already exists. Please choose a different name.')
    );

    return <ServiceGroupDialogWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try to create a group with an existing name (e.g., "web-services") to see conflict error.',
      },
    },
  },
};

/**
 * Loading State
 *
 * Shows loading state during form submission.
 * Demonstrates disabled buttons and loading text.
 */
export const LoadingState: Story = {
  render: () => {
    // Mock createGroup with delayed promise
    mockCreateGroup.mockReturnValueOnce(new Promise((resolve) => setTimeout(resolve, 3000)));

    return <ServiceGroupDialogWrapper />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fill the form and submit to see loading state with disabled buttons and "Saving..." text.',
      },
    },
  },
};

/**
 * Interactive Playground
 *
 * Fully interactive story for testing all features.
 */
export const Playground: Story = {
  render: () => <ServiceGroupDialogWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test all features: search, multi-select, protocol filtering, validation, etc.',
      },
    },
  },
};
