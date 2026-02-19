import * as React from 'react';

import { Label } from './label';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An accessible label component built on Radix UI Label primitive. Automatically associates with form controls via the `htmlFor` prop, and applies disabled styling when paired with a disabled peer input.',
      },
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
      description: 'The id of the associated form control.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Router Hostname',
  },
};

export const AssociatedWithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="hostname">Router Hostname</Label>
      <input
        id="hostname"
        type="text"
        placeholder="192.168.88.1"
        className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="disabled-field">API Secret (read-only)</Label>
      <input
        id="disabled-field"
        type="text"
        defaultValue="sk_live_••••••••"
        disabled
        className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
};

export const RequiredField: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="required-ip">
        IP Address <span className="text-error">*</span>
      </Label>
      <input
        id="required-ip"
        type="text"
        placeholder="10.0.0.1"
        required
        className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  ),
};

export const FormGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <input
          id="username"
          type="text"
          placeholder="admin"
          className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="port">Port</Label>
        <input
          id="port"
          type="number"
          defaultValue={8728}
          className="flex h-10 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  ),
};
