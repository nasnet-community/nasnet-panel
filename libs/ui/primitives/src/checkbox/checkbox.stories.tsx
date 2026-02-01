import { Checkbox } from './checkbox';
import { Label } from '../label/label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">Checked by default</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="text-muted-foreground">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="text-muted-foreground">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="items-top flex space-x-2">
      <Checkbox id="terms-desc" />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="terms-desc">Accept terms and conditions</Label>
        <p className="text-sm text-muted-foreground">
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  ),
};

export const FormGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">Select features</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="firewall" defaultChecked />
          <Label htmlFor="firewall">Firewall Rules</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="vpn" defaultChecked />
          <Label htmlFor="vpn">VPN Configuration</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="dhcp" />
          <Label htmlFor="dhcp">DHCP Server</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="wifi" />
          <Label htmlFor="wifi">WiFi Settings</Label>
        </div>
      </div>
    </div>
  ),
};
