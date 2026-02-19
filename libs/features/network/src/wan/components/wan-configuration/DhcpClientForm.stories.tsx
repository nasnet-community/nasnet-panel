/**
 * DHCP Client Form Storybook Stories
 *
 * Interactive documentation and visual testing for the DHCP client WAN
 * configuration form. Covers the full range of props, states, and user flows.
 */

import { DhcpClientForm } from './DhcpClientForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DhcpClientForm> = {
  title: 'Features/Network/WAN/DhcpClientForm',
  component: DhcpClientForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Form for configuring a WAN interface as a DHCP client. Handles physical interface
selection, default route management, DNS/NTP peer settings, and an optional comment
field. Includes a safety confirmation dialog when adding a default route.

## Features
- **Interface selection** - Filters to Ethernet-only adapters
- **Add Default Route** - Toggle with warning dialog for routing conflicts
- **Use Peer DNS/NTP** - Accept DNS and NTP servers from the DHCP offer
- **Comment** - Optional 255-character annotation
- **Safety pipeline** - Confirmation dialog before applying a default route

## Safety
A warning dialog is shown when the user enables "Add Default Route" to prevent
routing conflicts with existing WAN connections.
        `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID used for interface discovery',
    },
    loading: {
      control: 'boolean',
      description: 'Put the form into a submitting / loading state',
    },
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof DhcpClientForm>;

/**
 * Default - empty form ready for a new DHCP WAN connection.
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
 * WithInitialValues - form pre-populated with an existing DHCP configuration.
 */
export const WithInitialValues: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether1',
      addDefaultRoute: true,
      usePeerDNS: true,
      usePeerNTP: false,
      comment: 'Primary ISP - DHCP',
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
          'Form pre-populated from an existing DHCP WAN entry. Useful when editing rather than creating a connection.',
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
      addDefaultRoute: false,
      usePeerDNS: true,
      usePeerNTP: true,
      comment: 'Applying…',
    },
    loading: true,
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
 * PeerDNSAndNTPDisabled - both peer DNS and NTP disabled for manual configuration.
 */
export const PeerDNSAndNTPDisabled: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether2',
      addDefaultRoute: true,
      usePeerDNS: false,
      usePeerNTP: false,
      comment: 'Custom DNS configuration',
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
          'Configuration where peer DNS and NTP are disabled. The admin will manually set DNS servers elsewhere.',
      },
    },
  },
};

/**
 * NoCancelButton - embedded in a wizard where cancellation is not applicable.
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
          'When onCancel is not provided the Cancel button is hidden. Useful when the form is embedded inside a multi-step wizard.',
      },
    },
  },
};

/**
 * BackupWAN - secondary WAN without a default route.
 */
export const BackupWAN: Story = {
  args: {
    routerId: 'router-demo-123',
    initialValues: {
      interface: 'ether3',
      addDefaultRoute: false,
      usePeerDNS: false,
      usePeerNTP: false,
      comment: 'Backup WAN - no default route',
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
          'A secondary DHCP WAN configured without adding a default route. Useful with policy-based routing or failover setups.',
      },
    },
  },
};
