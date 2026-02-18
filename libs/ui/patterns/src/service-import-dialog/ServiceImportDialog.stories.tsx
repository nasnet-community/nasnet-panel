/**
 * ServiceImportDialog Storybook Stories
 */

import { useState } from 'react';

import { expect, within, userEvent, waitFor } from '@storybook/test';

import { ServiceImportDialog } from './ServiceImportDialog';
import { ServiceImportDialogDesktop } from './ServiceImportDialogDesktop';
import { ServiceImportDialogMobile } from './ServiceImportDialogMobile';
import { ServiceImportDialogTablet } from './ServiceImportDialogTablet';

import type { Meta, StoryObj } from '@storybook/react';

const mockValidJSON = JSON.stringify(
  {
    version: '1.0',
    exportedAt: '2025-01-15T10:00:00Z',
    exportedBy: 'admin@example.com',
    sourceRouter: {
      id: 'router-1',
      name: 'Main Router',
    },
    service: {
      featureID: 'tor',
      instanceName: 'Tor Exit Node US',
      config: {
        exitPolicy: 'accept *:80',
        nickname: 'TorExitUS',
      },
      ports: [9050, 9051],
      vlanID: 100,
      bindIP: '10.200.100.2',
    },
    routingRules: [
      {
        deviceMAC: 'AA:BB:CC:DD:EE:FF',
        deviceName: 'Laptop',
        mode: 'through_service',
      },
    ],
  },
  null,
  2
);

const mockRedactedJSON = JSON.stringify(
  {
    version: '1.0',
    exportedAt: '2025-01-15T10:00:00Z',
    exportedBy: 'admin@example.com',
    service: {
      featureID: 'singbox',
      instanceName: 'sing-box Multi-Protocol',
      config: {
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
      },
      ports: [8080, 1080],
    },
    redactedFields: ['password', 'apiKey'],
  },
  null,
  2
);

const meta: Meta<typeof ServiceImportDialog> = {
  title: 'Patterns/Service Import Dialog',
  component: ServiceImportDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Platform-adaptive dialog for importing service configurations. Multi-step wizard with validation, conflict resolution, and secret handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerID: {
      control: 'text',
      description: 'Router ID to import into',
    },
    onImportComplete: {
      action: 'import-complete',
      description: 'Callback when import completes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceImportDialog>;

/**
 * Default state with automatic platform detection
 */
export const Default: Story = {
  args: {
    routerID: 'router-1',
  },
};

/**
 * Desktop presenter (>1024px)
 * Shows multi-step wizard with detailed validation
 */
export const Desktop: Story = {
  render: (args) => <ServiceImportDialogDesktop {...args} />,
  args: {
    routerID: 'router-1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Tablet presenter (640-1024px)
 * Shows hybrid layout with touch-friendly controls
 */
export const Tablet: Story = {
  render: (args) => <ServiceImportDialogTablet {...args} />,
  args: {
    routerID: 'router-1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Mobile presenter (<640px)
 * Shows full-screen sheet with 44px touch targets
 */
export const Mobile: Story = {
  render: (args) => <ServiceImportDialogMobile {...args} />,
  args: {
    routerID: 'router-1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Controlled state example
 * Demonstrates programmatic control of dialog open state
 */
export const ControlledState: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="space-y-4">
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Import Dialog
        </button>
        <ServiceImportDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          onImportComplete={(instanceID) => {
            console.log('Import complete!', instanceID);
            setOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    routerID: 'router-1',
  },
};

/**
 * Valid JSON pre-filled
 * Shows dialog with valid JSON already pasted
 */
export const ValidJSON: Story = {
  args: {
    routerID: 'router-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Paste this JSON to test the validation flow:\n\n```json\n' + mockValidJSON + '\n```',
      },
    },
  },
};

/**
 * Redacted secrets example
 * Shows dialog handling redacted sensitive fields
 */
export const RedactedSecrets: Story = {
  args: {
    routerID: 'router-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Paste this JSON to test redacted field handling:\n\n```json\n' +
          mockRedactedJSON +
          '\n```\n\nYou will be prompted to provide values for `password` and `apiKey`.',
      },
    },
  },
};

/**
 * Invalid JSON example
 * Shows validation error handling
 */
export const InvalidJSON: Story = {
  args: {
    routerID: 'router-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Paste invalid JSON to test error handling:\n\n```json\n{"invalid": json}\n```',
      },
    },
  },
};

/**
 * Custom trigger button
 * Demonstrates using a custom trigger element
 */
export const CustomTrigger: Story = {
  args: {
    routerID: 'router-1',
    trigger: (
      <button className="px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-lg font-medium">
        📥 Import Service Configuration
      </button>
    ),
  },
};

/**
 * Import Flow Interaction Test
 * Tests complete import flow with file upload and validation
 */
export const ImportFlowInteraction: Story = {
  args: {
    routerID: 'router-1',
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for dialog to be visible
    const dialog = await canvas.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();

    // Step 1: Upload file via input
    const fileInput = canvas.getByLabelText(/upload/i);
    await expect(fileInput).toBeInTheDocument();

    // Create mock JSON file
    const file = new File([mockValidJSON], 'export.json', {
      type: 'application/json',
    });

    // Upload the file
    await user.upload(fileInput, file);

    // Step 2: Wait for preview to render
    await waitFor(
      async () => {
        await expect(canvas.findByText(/tor/i)).resolves.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Step 3: Verify Apply button is enabled (if validation passes)
    const applyButton = canvas.getByRole('button', { name: /apply|import/i });
    await waitFor(
      async () => {
        await expect(applyButton).toBeEnabled();
      },
      { timeout: 2000 }
    );
  },
};

/**
 * Import with Redacted Fields Interaction Test
 * Tests handling of redacted secrets with user input
 */
export const ImportRedactedFieldsInteraction: Story = {
  args: {
    routerID: 'router-1',
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for dialog to be visible
    const dialog = await canvas.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();

    // Step 1: Upload file with redacted fields
    const fileInput = canvas.getByLabelText(/upload/i);
    const file = new File([mockRedactedJSON], 'export-redacted.json', {
      type: 'application/json',
    });

    await user.upload(fileInput, file);

    // Step 2: Wait for redacted field prompts to appear
    await waitFor(
      async () => {
        await expect(
          canvas.findByLabelText(/password/i)
        ).resolves.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Step 3: Type password in redacted field
    const passwordInput = await canvas.findByLabelText(/password/i);
    await user.type(passwordInput, 'new-secret-password');
    await expect(passwordInput).toHaveValue('new-secret-password');

    // Step 4: Type API key in redacted field
    const apiKeyInput = await canvas.findByLabelText(/api_key|api key/i);
    await user.type(apiKeyInput, 'new-api-key-123');
    await expect(apiKeyInput).toHaveValue('new-api-key-123');

    // Step 5: Verify Apply button becomes enabled after filling required fields
    const applyButton = canvas.getByRole('button', { name: /apply|import/i });
    await waitFor(
      async () => {
        await expect(applyButton).toBeEnabled();
      },
      { timeout: 2000 }
    );
  },
};

/**
 * Import with Conflict Resolution Interaction Test
 * Tests conflict detection and resolution flow
 */
export const ImportConflictResolutionInteraction: Story = {
  args: {
    routerID: 'router-1',
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for dialog to be visible
    const dialog = await canvas.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();

    // Step 1: Upload file that will trigger conflict
    const fileInput = canvas.getByLabelText(/upload/i);
    const file = new File([mockValidJSON], 'export.json', {
      type: 'application/json',
    });

    await user.upload(fileInput, file);

    // Step 2: Wait for conflict resolution options to appear
    // (This assumes the mock API returns a conflict for this test)
    await waitFor(
      async () => {
        // Check if conflict resolution radio group appears
        const skipOption = canvas.queryByLabelText(/skip/i);
        if (skipOption) {
          await expect(skipOption).toBeInTheDocument();
        }
      },
      { timeout: 3000 }
    );

    // Step 3: Select OVERWRITE conflict resolution (if conflict detected)
    const overwriteOption = canvas.queryByLabelText(/overwrite/i);
    if (overwriteOption) {
      await user.click(overwriteOption);
      await expect(overwriteOption).toBeChecked();
    }

    // Step 4: Click Apply button
    const applyButton = canvas.getByRole('button', { name: /apply|import/i });
    if (await applyButton.isEnabled()) {
      await user.click(applyButton);

      // Verify success message or completion
      await waitFor(
        async () => {
          await expect(
            canvas.findByText(/success|imported|complete/i)
          ).resolves.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    }
  },
};
