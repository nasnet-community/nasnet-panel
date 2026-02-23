/**
 * AddServiceDialog Storybook Stories
 *
 * Visual documentation and interactive testing for the AddServiceDialog component.
 *
 * Stories:
 * - Add mode (empty form)
 * - Edit mode (pre-filled values)
 * - With validation errors
 * - With conflict error
 * - Submitting state (loading)
 * - All protocol options
 */

import { useState } from 'react';

import { within, userEvent, expect } from 'storybook/test';

import type { CustomServicePortInput } from '@nasnet/core/types';

import { AddServiceDialog } from './AddServiceDialog';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof AddServiceDialog> = {
  title: 'Features/Firewall/AddServiceDialog',
  component: AddServiceDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog for adding or editing custom service port definitions. Features form validation, conflict detection, and i18n support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Control dialog open state',
    },
    onOpenChange: {
      action: 'onOpenChange',
      description: 'Handler for dialog open state changes',
    },
    editService: {
      control: 'object',
      description: 'Service to edit (undefined = add mode, defined = edit mode)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddServiceDialog>;

// ============================================================================
// Interactive Wrapper (for controlled open state)
// ============================================================================

function AddServiceDialogInteractive({
  editService,
}: {
  editService?: CustomServicePortInput;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setOpen(true)} className="px-4 py-2 bg-primary text-white rounded">
        Open Dialog
      </button>
      <AddServiceDialog open={open} onOpenChange={setOpen} editService={editService} />
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default story: Add mode with empty form
 */
export const AddMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  parameters: {
    docs: {
      description: {
        story: 'Add mode shows an empty form for creating a new custom service. Default port is 8080, default protocol is TCP.',
      },
    },
  },
};

/**
 * Edit mode with pre-filled values
 */
export const EditMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    editService: {
      port: 9999,
      service: 'my-app',
      protocol: 'tcp',
      description: 'My custom application',
    },
  },
  render: (_args) => (
    <AddServiceDialogInteractive
      editService={{
        port: 9999,
        service: 'my-app',
        protocol: 'tcp',
        description: 'My custom application',
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Edit mode pre-fills the form with existing service values. Title changes to "Edit Service" and submit button shows "Update Service".',
      },
    },
  },
};

/**
 * With validation errors (demonstrates form validation)
 */
export const WithValidationErrors: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Clear required fields
    const serviceInput = canvas.getByLabelText(/Service Name/i) as HTMLInputElement;
    await userEvent.clear(serviceInput);

    // Set invalid port
    const portInput = canvas.getByLabelText(/Port/i) as HTMLInputElement;
    await userEvent.clear(portInput);
    await userEvent.type(portInput, '99999');

    // Submit form to trigger validation
    const submitButton = canvas.getByRole('button', { name: /Add Service/i });
    await userEvent.click(submitButton);

    // Validation errors should appear
    await expect(canvas.getByText(/Service name is required/i)).toBeInTheDocument();
    await expect(canvas.getByText(/Port must be between 1 and 65535/i)).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates form validation errors. Submit the form without filling required fields or with invalid port values to see error messages.',
      },
    },
  },
};

/**
 * With conflict error (service name already exists)
 */
export const WithConflictError: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Fill form with conflicting service name
    const serviceInput = canvas.getByLabelText(/Service Name/i) as HTMLInputElement;
    await userEvent.clear(serviceInput);
    await userEvent.type(serviceInput, 'HTTP');

    const portInput = canvas.getByLabelText(/Port/i) as HTMLInputElement;
    await userEvent.clear(portInput);
    await userEvent.type(portInput, '8080');

    // Note: This will trigger actual validation, which may show conflict error
    // In real scenario, conflict would be detected by the hook
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates conflict detection when service name matches a built-in service (e.g., "HTTP") or existing custom service.',
      },
    },
  },
};

/**
 * UDP protocol selected
 */
export const UDPProtocol: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    editService: {
      port: 53,
      service: 'custom-dns',
      protocol: 'udp',
      description: 'Custom DNS server',
    },
  },
  render: (_args) => (
    <AddServiceDialogInteractive
      editService={{
        port: 53,
        service: 'custom-dns',
        protocol: 'udp',
        description: 'Custom DNS server',
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows UDP protocol selected. UDP is commonly used for DNS, DHCP, and streaming protocols.',
      },
    },
  },
};

/**
 * Both (TCP & UDP) protocol selected
 */
export const BothProtocols: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    editService: {
      port: 500,
      service: 'ipsec',
      protocol: 'both',
      description: 'IPsec VPN',
    },
  },
  render: (_args) => (
    <AddServiceDialogInteractive
      editService={{
        port: 500,
        service: 'ipsec',
        protocol: 'both',
        description: 'IPsec VPN',
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows "TCP & UDP" protocol option. Useful for services that use both protocols on the same port (e.g., IPsec, some VPN protocols).',
      },
    },
  },
};

/**
 * Long description (max length test)
 */
export const LongDescription: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    editService: {
      port: 8080,
      service: 'web-app',
      protocol: 'tcp',
      description:
        'This is a very long description for testing the maximum character limit. The description field accepts up to 500 characters to provide detailed information about the custom service. This helps administrators understand the purpose of each service, especially in complex network environments with many custom applications. You can describe the service purpose, usage, dependencies, and any special considerations here.',
    },
  },
  render: (_args) => (
    <AddServiceDialogInteractive
      editService={{
        port: 8080,
        service: 'web-app',
        protocol: 'tcp',
        description:
          'This is a very long description for testing the maximum character limit. The description field accepts up to 500 characters to provide detailed information about the custom service. This helps administrators understand the purpose of each service, especially in complex network environments with many custom applications. You can describe the service purpose, usage, dependencies, and any special considerations here.',
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the description field with maximum length (500 characters). The textarea expands to accommodate longer text.',
      },
    },
  },
};

/**
 * Closed state (for testing open/close behavior)
 */
export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog in closed state. Use the "Open Dialog" button to open it.',
      },
    },
  },
  render: (_args) => <AddServiceDialogInteractive />,
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Dialog on mobile viewport. Form fields stack vertically and buttons adjust for smaller screens.',
      },
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Dialog on tablet viewport. Layout adapts to medium screen sizes.',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dialog in dark mode. All colors adapt to dark theme using semantic design tokens.',
      },
    },
  },
};

/**
 * Interaction test (keyboard navigation)
 */
export const KeyboardNavigation: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  render: (_args) => <AddServiceDialogInteractive />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Tab through form fields
    await userEvent.tab(); // Service Name
    await userEvent.tab(); // TCP radio
    await userEvent.tab(); // UDP radio
    await userEvent.tab(); // Both radio
    await userEvent.tab(); // Port
    await userEvent.tab(); // Description
    await userEvent.tab(); // Cancel button
    await userEvent.tab(); // Add Service button

    // Verify focus is on submit button
    const submitButton = canvas.getByRole('button', { name: /Add Service|Update/i });
    await expect(submitButton).toHaveFocus();
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests keyboard navigation through form fields. All fields are accessible via Tab key, and form can be submitted with Enter.',
      },
    },
  },
};
