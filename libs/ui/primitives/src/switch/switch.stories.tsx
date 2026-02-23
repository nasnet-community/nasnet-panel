import { Switch } from './switch';
import { Label } from '../label/label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toggle switch for boolean input built on Radix UI. Uses semantic success color (green) when checked, muted color when unchecked. Supports disabled state and smooth transitions. Fully keyboard accessible with focus visible indicators. Respects prefers-reduced-motion for smooth animations.',
      },
    },
  },
  argTypes: {
    defaultChecked: {
      control: 'boolean',
      description: 'Initial checked state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the switch',
    },
    onCheckedChange: {
      action: 'checked changed',
      description: 'Callback when checked state changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => <Switch />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="enabled" defaultChecked />
      <Label htmlFor="enabled">Enabled</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="text-muted-foreground">
          Disabled Off
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="text-muted-foreground">
          Disabled On
        </Label>
      </div>
    </div>
  ),
};

export const SettingsForm: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-medium">Network Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dhcp">DHCP Server</Label>
            <p className="text-sm text-muted-foreground">
              Automatically assign IP addresses
            </p>
          </div>
          <Switch id="dhcp" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="firewall">Firewall</Label>
            <p className="text-sm text-muted-foreground">
              Block unauthorized access
            </p>
          </div>
          <Switch id="firewall" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="logging">Logging</Label>
            <p className="text-sm text-muted-foreground">
              Record system events
            </p>
          </div>
          <Switch id="logging" />
        </div>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="wifi-mobile">WiFi</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm">Enable wireless connection</span>
          <Switch id="wifi-mobile" defaultChecked />
        </div>
      </div>
    </div>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <div className="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-1">
            <Label htmlFor="nat-tablet">Network Address Translation</Label>
            <p className="text-xs text-muted-foreground">
              Translate internal addresses to external IP
            </p>
          </div>
          <Switch id="nat-tablet" defaultChecked />
        </div>
      </div>
    </div>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Advanced Settings</h2>
        <div className="grid gap-6 border-t border-border pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Label htmlFor="jumbo-desktop">Jumbo Frames</Label>
              <p className="text-sm text-muted-foreground max-w-xs">
                Enable support for frames larger than standard Ethernet (1500 bytes). Can improve throughput for high-speed networks.
              </p>
            </div>
            <Switch id="jumbo-desktop" defaultChecked />
          </div>
          <div className="flex items-start justify-between border-t border-border pt-6">
            <div className="space-y-2">
              <Label htmlFor="csum-desktop">Checksum Offload</Label>
              <p className="text-sm text-muted-foreground max-w-xs">
                Offload checksum calculation to hardware. Reduces CPU usage but may cause issues with some devices.
              </p>
            </div>
            <Switch id="csum-desktop" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const WithPlay: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="interactive" />
      <Label htmlFor="interactive">Click me or use keyboard (Space/Enter)</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // This story demonstrates interaction testing capability
    // In real tests, you'd use @storybook/test-runner or Playwright
    const switchElement = canvasElement.querySelector('[role="switch"]');
    if (switchElement) {
      // Placeholder for interaction testing
      // Example: await userEvent.click(switchElement);
    }
  },
};

export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium">Keyboard Navigation Test</h3>
        <p className="text-sm text-muted-foreground">
          Use Tab to focus, Space or Enter to toggle
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
          <Switch id="a11y-1" />
          <Label htmlFor="a11y-1">First Switch</Label>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
          <Switch id="a11y-2" defaultChecked />
          <Label htmlFor="a11y-2">Second Switch</Label>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
          <Switch id="a11y-3" disabled />
          <Label htmlFor="a11y-3" className="text-muted-foreground">
            Third Switch (disabled)
          </Label>
        </div>
      </div>
    </div>
  ),
};
