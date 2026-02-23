/**
 * ServiceExportDialog Storybook Stories
 */

import { useState } from 'react';

import { expect, within, userEvent } from 'storybook/test';

import type { ServiceInstance } from '@nasnet/api-client/queries/services';

import { ServiceExportDialog } from './ServiceExportDialog';
import { ServiceExportDialogDesktop } from './ServiceExportDialogDesktop';
import { ServiceExportDialogMobile } from './ServiceExportDialogMobile';
import { ServiceExportDialogTablet } from './ServiceExportDialogTablet';

import type { Meta, StoryObj } from '@storybook/react';

const mockInstance: ServiceInstance = {
  id: 'instance-123',
  featureID: 'tor',
  instanceName: 'Tor Exit Node US',
  routerID: 'router-1',
  status: 'RUNNING' as const,
  vlanID: 100,
  bindIP: '10.200.100.2',
  ports: [9050, 9051],
  config: {
    exitPolicy: 'accept *:80',
    nickname: 'TorExitUS',
    contactInfo: 'admin@example.com',
  },
  binaryPath: '/opt/tor/tor',
  binaryVersion: '0.4.7.13',
  binaryChecksum: 'sha256:abc123...',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
};

const meta: Meta<typeof ServiceExportDialog> = {
  title: 'Patterns/Service Export Dialog',
  component: ServiceExportDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Platform-adaptive dialog for exporting service configurations as JSON or QR code. Automatically adapts to Mobile, Tablet, and Desktop screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerID: {
      control: 'text',
      description: 'Router ID for the export operation',
    },
    instance: {
      control: 'object',
      description: 'Service instance to export',
    },
    onExportComplete: {
      action: 'export-complete',
      description: 'Callback when export completes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceExportDialog>;

/**
 * Default state with automatic platform detection
 */
export const Default: Story = {
  args: {
    routerID: 'router-1',
    instance: mockInstance,
  },
};

/**
 * Desktop presenter (>1024px)
 * Shows dense layout with horizontal actions
 */
export const Desktop: Story = {
  render: (args) => <ServiceExportDialogDesktop {...args} />,
  args: {
    routerID: 'router-1',
    instance: mockInstance,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Tablet presenter (640-1024px)
 * Shows hybrid layout with touch-friendly spacing
 */
export const Tablet: Story = {
  render: (args) => <ServiceExportDialogTablet {...args} />,
  args: {
    routerID: 'router-1',
    instance: mockInstance,
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
  render: (args) => <ServiceExportDialogMobile {...args} />,
  args: {
    routerID: 'router-1',
    instance: mockInstance,
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
          Open Export Dialog
        </button>
        <ServiceExportDialog
          {...args}
          open={open}
          onOpenChange={setOpen}
          onExportComplete={() => {
            console.log('Export complete!');
            setOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    routerID: 'router-1',
    instance: mockInstance,
  },
};

/**
 * Complex service configuration
 * Shows export dialog with a more complex service (sing-box)
 */
export const ComplexService: Story = {
  args: {
    routerID: 'router-1',
    instance: {
      ...mockInstance,
      id: 'instance-456',
      featureID: 'singbox',
      instanceName: 'sing-box Multi-Protocol',
      ports: [8080, 8081, 8443, 1080],
      config: {
        inbounds: [
          { type: 'http', listen: '0.0.0.0', port: 8080 },
          { type: 'socks', listen: '0.0.0.0', port: 1080 },
          { type: 'vmess', listen: '0.0.0.0', port: 8443 },
        ],
        outbounds: [
          { type: 'direct' },
          { type: 'block' },
        ],
        route: {
          rules: [
            { geoip: 'cn', outbound: 'direct' },
            { geosite: 'category-ads', outbound: 'block' },
          ],
        },
      },
    },
  },
};

/**
 * Service with routing rules
 * Demonstrates export with device routing assignments
 */
export const WithRoutingRules: Story = {
  args: {
    routerID: 'router-1',
    instance: {
      ...mockInstance,
      instanceName: 'Tor with Routing',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Export includes device-to-service routing rules when enabled',
      },
    },
  },
};

/**
 * QR Code export format
 * Shows QR code generation for mobile sharing
 */
export const QRCodeFormat: Story = {
  args: {
    routerID: 'router-1',
    instance: mockInstance,
  },
  parameters: {
    docs: {
      description: {
        story: 'Generate QR code for quick mobile-to-mobile sharing (2KB limit)',
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
    instance: mockInstance,
    trigger: (
      <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium">
        🚀 Share Service Configuration
      </button>
    ),
  },
};

/**
 * Export Flow Interaction Test
 * Tests complete export flow with user interactions
 */
export const ExportFlowInteraction: Story = {
  args: {
    routerID: 'router-1',
    instance: mockInstance,
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for dialog to be visible
    const dialog = await canvas.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();

    // Step 1: Select JSON format (should be default)
    const jsonRadio = canvas.getByLabelText(/json/i);
    await expect(jsonRadio).toBeChecked();

    // Step 2: Toggle "Redact secrets" OFF to include secrets
    const redactToggle = canvas.getByLabelText(/redact secrets/i) as HTMLInputElement;
    if (redactToggle.checked) {
      await user.click(redactToggle);
    }
    await expect(redactToggle).not.toBeChecked();

    // Step 3: Toggle "Include routing" ON
    const routingToggle = canvas.getByLabelText(/include routing/i);
    await user.click(routingToggle);
    await expect(routingToggle).toBeChecked();

    // Step 4: Click Export button
    const exportButton = canvas.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    // Verify download link or success message appears
    await expect(
      canvas.findByText(/download|success/i)
    ).resolves.toBeInTheDocument();
  },
};

/**
 * QR Code Generation Interaction Test
 * Tests QR code format selection and generation
 */
export const QRCodeGenerationInteraction: Story = {
  args: {
    routerID: 'router-1',
    instance: mockInstance,
    open: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for dialog to be visible
    const dialog = await canvas.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();

    // Step 1: Switch to QR Code format
    const qrRadio = canvas.getByLabelText(/qr code/i);
    await user.click(qrRadio);
    await expect(qrRadio).toBeChecked();

    // Step 2: Verify JSON format is unchecked
    const jsonRadio = canvas.getByLabelText(/json/i);
    await expect(jsonRadio).not.toBeChecked();

    // Step 3: Click Generate/Export button
    const exportButton = canvas.getByRole('button', { name: /export|generate/i });
    await user.click(exportButton);

    // Verify QR code preview or download link appears
    // (Implementation-dependent - adjust based on actual component)
    await expect(
      canvas.findByText(/qr|download|success/i)
    ).resolves.toBeInTheDocument();
  },
};
