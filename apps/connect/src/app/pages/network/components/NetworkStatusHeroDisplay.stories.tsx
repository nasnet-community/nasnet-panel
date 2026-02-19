/**
 * NetworkStatusHeroDisplay Stories
 *
 * Display-only hero strip for network status in the Network Dashboard.
 * Shows router identity, status badge, uptime, and interface counts.
 * Prop-driven — no stores or routing required.
 */

import { NetworkStatusHeroDisplay } from './NetworkStatusHeroDisplay';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkStatusHeroDisplay> = {
  title: 'App/Network/NetworkStatusHeroDisplay',
  component: NetworkStatusHeroDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact display-only hero card for the Network Dashboard. ' +
          'Renders router identity, RouterOS version, a colour-coded status badge, ' +
          'uptime, and active/total interface count. ' +
          'Four status variants: online (green pulse), degraded (amber), ' +
          'offline (red), and connecting (slate pulse).',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'degraded', 'offline', 'connecting'],
      description: 'Network connection status variant',
    },
    routerName: { control: 'text' },
    uptime: { control: 'text' },
    version: { control: 'text' },
    activeInterfaces: { control: 'number' },
    totalInterfaces: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkStatusHeroDisplay>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Online: Story = {
  args: {
    routerName: 'MikroTik-HQ',
    status: 'online',
    uptime: '3d 4h 25m',
    version: '7.14.2',
    activeInterfaces: 6,
    totalInterfaces: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully connected router. Status badge shows pulsing green dot with "Online" label. ' +
          'Uptime and interface counters are populated.',
      },
    },
  },
};

export const Degraded: Story = {
  args: {
    routerName: 'MikroTik-Branch',
    status: 'degraded',
    uptime: '1d 2h 10m',
    version: '7.13.5',
    activeInterfaces: 3,
    totalInterfaces: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Partial connectivity. Amber badge indicates some interfaces or services are down. ' +
          'Only 3 of 8 interfaces are active.',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    routerName: 'MikroTik-Remote',
    status: 'offline',
    version: '7.12.0',
    activeInterfaces: 0,
    totalInterfaces: 4,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Router is unreachable. Red badge with "Offline" label. ' +
          'Uptime is omitted since the value is not available when disconnected.',
      },
    },
  },
};

export const Connecting: Story = {
  args: {
    routerName: 'MikroTik-Lab',
    status: 'connecting',
    version: '7.14.2',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial connection in progress. Pulsing slate badge with "Connecting…" label. ' +
          'Uptime and interface counts are omitted until the connection is established.',
      },
    },
  },
};

export const MinimalProps: Story = {
  args: {
    status: 'online',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only the required `status` prop is provided. ' +
          'Defaults to "Router" for the name and omits version, uptime, and interface rows.',
      },
    },
  },
};

export const LongRouterName: Story = {
  args: {
    routerName: 'VeryLong-RouterName-That-Tests-Layout-Overflow',
    status: 'online',
    uptime: '99d 23h 59m',
    version: '7.14.2',
    activeInterfaces: 12,
    totalInterfaces: 16,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress-tests the layout with an unusually long router hostname, ' +
          'high uptime, and a larger interface count to verify text truncation and alignment.',
      },
    },
  },
};
