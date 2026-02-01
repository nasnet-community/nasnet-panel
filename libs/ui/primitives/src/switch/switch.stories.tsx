import { Switch } from './switch';
import { Label } from '../label/label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
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
