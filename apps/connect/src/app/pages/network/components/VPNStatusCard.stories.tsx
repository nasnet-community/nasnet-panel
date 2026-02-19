/**
 * VPNStatusCard Stories
 *
 * Gradient-bordered card showing VPN connected / disconnected state.
 * Fully prop-driven — no stores or routing required.
 */

import { VPNStatusCard } from './VPNStatusCard';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof VPNStatusCard> = {
  title: 'App/Network/VPNStatusCard',
  component: VPNStatusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dashboard Pro-style card that communicates VPN protection status at a glance. ' +
          'When connected: emerald gradient border, Shield icon, "VPN Protected" heading, ' +
          'and "{connectionName} • {serverLocation}" sub-line. ' +
          'When disconnected: neutral card styling with a ShieldOff icon and a "Connect" CTA. ' +
          'Supports a skeleton loading state.',
      },
    },
  },
  argTypes: {
    isConnected: { control: 'boolean' },
    connectionName: { control: 'text' },
    serverLocation: { control: 'text' },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNStatusCard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Disconnected: Story = {
  args: {
    isConnected: false,
    connectionName: 'VPN',
    serverLocation: undefined,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default disconnected state. Card uses neutral styling and shows a "Connect" action button.',
      },
    },
  },
};

export const ConnectedWithLocation: Story = {
  args: {
    isConnected: true,
    connectionName: 'WireGuard-Home',
    serverLocation: 'Amsterdam, NL',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Connected state with a named tunnel and server location. Emerald gradient border and Shield icon are visible.',
      },
    },
  },
};

export const ConnectedNoLocation: Story = {
  args: {
    isConnected: true,
    connectionName: 'OpenVPN-Work',
    serverLocation: undefined,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Connected state when the server location is unknown. The sub-line shows only the connection name.',
      },
    },
  },
};

export const ConnectedLongName: Story = {
  args: {
    isConnected: true,
    connectionName: 'corporate-vpn-headquarters-tunnel-primary',
    serverLocation: 'Frankfurt, Germany (EU-Central)',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Connected with a long connection name and location string — verifies text truncation and layout.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pulse state rendered while VPN status data is being fetched.',
      },
    },
  },
};

export const DefaultProps: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Rendered with no props — all values fall back to defaults (isConnected=false, connectionName="VPN").',
      },
    },
  },
};
