import * as React from 'react';

import { Checkbox } from './checkbox';
import { Label } from '../label/label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A checkable input control built on Radix UI. Can be checked or unchecked. Provides semantic styling, focus indicators, disabled states, and full keyboard navigation support. WCAG AAA compliant with 7:1 contrast ratio.',
      },
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the checkbox and prevents interaction',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked by default (uncontrolled)',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    onCheckedChange: {
      action: 'onCheckedChange triggered',
      description: 'Callback fired when checkbox state changes',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to merge with default styles',
    },
  },
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

/**
 * Mobile viewport story (375px - touch-first design)
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="space-y-4 w-full">
      <Label className="text-base font-medium">Preferences</Label>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2">
          <Checkbox id="mobile-notif" defaultChecked />
          <Label htmlFor="mobile-notif" className="text-base">
            Enable notifications
          </Label>
        </div>
        <div className="flex items-center gap-3 p-2">
          <Checkbox id="mobile-analytics" />
          <Label htmlFor="mobile-analytics" className="text-base">
            Share analytics
          </Label>
        </div>
      </div>
    </div>
  ),
};

/**
 * Tablet viewport story (768px - balanced design)
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Label className="text-base font-medium">System Settings</Label>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="tablet-auto" defaultChecked />
          <Label htmlFor="tablet-auto">Auto-update</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="tablet-dark" />
          <Label htmlFor="tablet-dark">Dark mode</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="tablet-backup" defaultChecked />
          <Label htmlFor="tablet-backup">Automatic backups</Label>
        </div>
      </div>
    </div>
  ),
};

/**
 * Desktop viewport story (1280px - full detail)
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <div className="space-y-4 w-full max-w-lg">
      <Label className="text-base font-medium">Advanced Options</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 p-1">
          <Checkbox id="desktop-compression" defaultChecked />
          <Label htmlFor="desktop-compression">Enable compression</Label>
        </div>
        <div className="flex items-center space-x-2 p-1">
          <Checkbox id="desktop-encryption" defaultChecked />
          <Label htmlFor="desktop-encryption">Enable encryption</Label>
        </div>
        <div className="flex items-center space-x-2 p-1">
          <Checkbox id="desktop-logging" />
          <Label htmlFor="desktop-logging">Verbose logging</Label>
        </div>
      </div>
    </div>
  ),
};

/**
 * Controlled state story with play function for interaction testing
 */
export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = React.useState(false);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="controlled"
            checked={checked}
            onCheckedChange={(newChecked) => setChecked(newChecked === true)}
          />
          <Label htmlFor="controlled">Accept terms</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Checkbox is currently: <strong>{checked ? 'checked' : 'unchecked'}</strong>
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox) {
      checkbox.click();
      await new Promise(r => setTimeout(r, 100));
      checkbox.click();
    }
  },
};
