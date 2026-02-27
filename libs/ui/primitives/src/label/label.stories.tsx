import * as React from 'react';

import { Label } from './label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An accessible label component built on Radix UI Label primitive. Automatically associates with form controls via the `htmlFor` prop, and applies disabled styling when paired with a disabled peer input. Uses semantic color tokens and supports both light and dark themes.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Label text content.',
    },
    htmlFor: {
      control: 'text',
      description: 'The id of the associated form control.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the label.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

/**
 * Default label story showing basic usage
 */
export const Default: Story = {
  args: {
    children: 'Router Hostname',
  },
};

/**
 * Label associated with a text input field
 */
export const AssociatedWithInput: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="hostname">Router Hostname</Label>
      <input
        id="hostname"
        type="text"
        placeholder="192.168.88.1"
        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
      />
    </div>
  ),
};

/**
 * Label paired with a disabled input field
 * Demonstrates peer-disabled styling (reduced opacity, not-allowed cursor)
 */
export const DisabledState: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="disabled-field">API Secret (read-only)</Label>
      <input
        id="disabled-field"
        type="text"
        defaultValue="sk_live_••••••••"
        disabled
        className="border-input bg-card text-foreground flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
};

/**
 * Label with required field indicator
 * Shows how to mark fields as required with the error color accent
 */
export const RequiredField: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="required-ip">
        IP Address <span className="text-error">*</span>
      </Label>
      <input
        id="required-ip"
        type="text"
        placeholder="10.0.0.1"
        required
        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
      />
    </div>
  ),
};

/**
 * Group of labels with associated form fields
 */
export const FormGroup: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <input
          id="username"
          type="text"
          placeholder="admin"
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="port">Port</Label>
        <input
          id="port"
          type="number"
          defaultValue={8728}
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </div>
  ),
};

/**
 * Long label text (tests text wrapping and typography)
 */
export const LongLabelText: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="long-input">
        Enter the fully qualified domain name (FQDN) of your router for certificate validation
      </Label>
      <input
        id="long-input"
        type="text"
        placeholder="router.example.com"
        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
      />
    </div>
  ),
};

/**
 * Dark mode - Default label in dark theme
 * Tests 7:1 contrast ratio in dark mode
 */
export const DarkModeDefault: Story = {
  args: {
    children: 'Router Hostname',
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        className="rounded-lg bg-slate-950 p-8"
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * Dark mode - With associated input
 */
export const DarkModeWithInput: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="dark-hostname">Router Hostname</Label>
      <input
        id="dark-hostname"
        type="text"
        placeholder="192.168.88.1"
        className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-xl border-2 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        className="rounded-lg bg-slate-950 p-8"
      >
        <Story />
      </div>
    ),
  ],
};
