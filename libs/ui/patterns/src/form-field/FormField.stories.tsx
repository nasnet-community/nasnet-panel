import * as React from 'react';

import { Input, Button } from '@nasnet/ui/primitives';

import { FormField } from './form-field';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof FormField> = {
  title: 'Patterns/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A form field wrapper component that handles labels, descriptions, and error messages with proper accessibility attributes. Automatically connects labels to inputs via generated IDs.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the field',
    },
    description: {
      control: 'text',
      description: 'Helper text below the label',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Router Name',
    children: <Input placeholder="Enter router name" />,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'IP Address',
    description: 'Enter the static IP address for this device',
    children: <Input placeholder="192.168.1.100" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    required: true,
    children: <Input placeholder="admin" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    required: true,
    error: 'Password must be at least 8 characters',
    children: <Input type="password" placeholder="Enter password" />,
  },
};

export const WithDescriptionAndError: Story = {
  args: {
    label: 'DHCP Pool Range',
    description: 'Enter IP range (e.g., 192.168.1.100-192.168.1.200)',
    error: 'Invalid IP range format',
    required: true,
    children: <Input placeholder="192.168.1.100-192.168.1.200" />,
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="w-80 space-y-4">
      <FormField
        label="Router Name"
        description="A friendly name for your router"
        required
      >
        <Input placeholder="e.g., Home Router" />
      </FormField>

      <FormField
        label="IP Address"
        required
      >
        <Input placeholder="192.168.1.1" />
      </FormField>

      <FormField
        label="Username"
        required
      >
        <Input placeholder="admin" />
      </FormField>

      <FormField
        label="Password"
        required
      >
        <Input type="password" placeholder="••••••••" />
      </FormField>

      <FormField
        label="Notes"
        description="Optional notes about this router"
      >
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add any notes..."
        />
      </FormField>

      <Button type="submit" className="w-full">
        Add Router
      </Button>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete form example showing multiple FormField components working together.',
      },
    },
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <FormField label="Valid Field">
        <Input defaultValue="192.168.1.1" className="border-green-500 focus-visible:ring-green-500" />
      </FormField>

      <FormField
        label="Invalid Field"
        error="IP address is already in use"
      >
        <Input defaultValue="192.168.1.1" />
      </FormField>

      <FormField
        label="Warning State"
        description="This IP may conflict with another device"
      >
        <Input
          defaultValue="192.168.1.50"
          className="border-yellow-500 focus-visible:ring-yellow-500"
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different validation states for form fields.',
      },
    },
  },
};

export const DisabledState: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <FormField
        label="Router Name"
        description="Cannot be changed after creation"
      >
        <Input defaultValue="MikroTik-Home" disabled />
      </FormField>

      <FormField
        label="MAC Address"
        description="Hardware identifier"
      >
        <Input defaultValue="AA:BB:CC:DD:EE:FF" disabled className="font-mono" />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled form fields for read-only information.',
      },
    },
  },
};
