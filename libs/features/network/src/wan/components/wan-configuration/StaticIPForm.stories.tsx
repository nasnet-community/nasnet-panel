/**
 * Static IP Form Storybook Stories
 *
 * Interactive documentation and visual testing for the Static IP WAN
 * configuration form. Covers all states, presets, and safety flows.
 */

import { StaticIPForm } from './StaticIPForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StaticIPForm> = {
  title: 'Features/Network/WAN/StaticIPForm',
  component: StaticIPForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Form for configuring a WAN interface with a static IP address. Validates CIDR
notation, gateway reachability (subnet membership), and DNS server addresses.

## Features
- **Interface selection** - Filters to Ethernet-only adapters
- **IP address (CIDR)** - e.g. \`203.0.113.10/30\` with quick subnet presets
- **Gateway** - IPv4 address of the upstream router or ISP
- **DNS presets** - One-click Cloudflare, Google, Quad9, and OpenDNS settings
- **Comment** - Optional 255-character annotation
- **Safety pipeline** - Confirmation dialog before applying to warn of potential connectivity loss

## Safety
A warning dialog always appears before submission to alert the operator that
incorrect IP/gateway values can cause loss of access to the router.
        `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID used for interface discovery',
    },
    isLoading: {
      control: 'boolean',
      description: 'Put the form into a submitting / loading state',
    },
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof StaticIPForm>;

/**
 * Default - empty form ready for a new static IP WAN connection.
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-123',
    onSubmit: async (values) => {
      console.log('Submitted:', values);
    },
    onCancel: () => {},
  },
};

/**
 * PrefilledConfiguration - editing an existing static IP WAN entry.
 */
export const PrefilledConfiguration: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether1',
      address: '203.0.113.10/30',
      gateway: '203.0.113.9',
      primaryDNS: '1.1.1.1',
      secondaryDNS: '1.0.0.1',
      comment: 'Primary WAN - ISP Fiber',
    },
    onSubmit: async (values) => {
      console.log('Submitted:', values);
    },
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form pre-populated from an existing static IP entry. All fields show the current configuration so the operator can review before making changes.',
      },
    },
  },
};

/**
 * WithCloudflareDNS - form pre-filled with Cloudflare DNS servers.
 */
export const WithCloudflareDNS: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether1',
      address: '198.51.100.5/29',
      gateway: '198.51.100.1',
      primaryDNS: '1.1.1.1',
      secondaryDNS: '1.0.0.1',
      comment: 'ISP static block, Cloudflare DNS',
    },
    onSubmit: async (values) => {
      console.log('Submitted:', values);
    },
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration using Cloudflare DNS (1.1.1.1 / 1.0.0.1). Demonstrates the DNS preset result with a /29 subnet.',
      },
    },
  },
};

/**
 * Loading - form locked while a submit is in progress.
 */
export const Loading: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether1',
      address: '203.0.113.10/30',
      gateway: '203.0.113.9',
      primaryDNS: '8.8.8.8',
      secondaryDNS: '8.8.4.4',
    },
    isLoading: true,
    onSubmit: async () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'All fields and buttons are disabled while the mutation is in-flight. The submit label changes to "Configuring…".',
      },
    },
  },
};

/**
 * NoDNS - configuration without DNS servers (relying on router-level DNS).
 */
export const NoDNS: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether2',
      address: '10.100.1.2/30',
      gateway: '10.100.1.1',
      comment: 'Point-to-point link, no DNS',
    },
    onSubmit: async (values) => {
      console.log('Submitted:', values);
    },
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Static IP without DNS servers specified. Useful for point-to-point links where DNS is managed at the router level.',
      },
    },
  },
};

/**
 * NoCancelButton - embedded in a multi-step wizard.
 */
export const NoCancelButton: Story = {
  args: {
    routerId: 'router-demo-123',
    onSubmit: async (values) => {
      console.log('Submitted:', values);
    },
    // onCancel intentionally omitted
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onCancel is not provided the Cancel button is hidden. Suitable for multi-step configuration wizards.',
      },
    },
  },
};
