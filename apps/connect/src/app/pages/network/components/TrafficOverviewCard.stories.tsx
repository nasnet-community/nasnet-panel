/**
 * TrafficOverviewCard Stories
 *
 * Shows a mini traffic bar-chart (last hour) plus download/upload stat cells
 * derived from the active NetworkInterface list.
 * Prop-driven — no stores or routing required.
 */


import type { NetworkInterface } from '@nasnet/core/types';

import { TrafficOverviewCard } from './TrafficOverviewCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const activeInterfaces: NetworkInterface[] = [
  { id: '1', name: 'ether1', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:01', linkStatus: 'up' },
  { id: '2', name: 'ether2', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:02', linkStatus: 'up' },
  { id: '3', name: 'bridge1', type: 'bridge', status: 'running', macAddress: 'AA:BB:CC:DD:EE:03', linkStatus: 'up' },
];

const mixedInterfaces: NetworkInterface[] = [
  { id: '1', name: 'ether1', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:01', linkStatus: 'up' },
  { id: '2', name: 'ether2', type: 'ether', status: 'disabled', macAddress: 'AA:BB:CC:DD:EE:02', linkStatus: 'down' },
  { id: '3', name: 'wlan1', type: 'wireless', status: 'running', macAddress: 'AA:BB:CC:DD:EE:03', linkStatus: 'up' },
  { id: '4', name: 'vpn0', type: 'vpn', status: 'disabled', macAddress: 'AA:BB:CC:DD:EE:04', linkStatus: 'down' },
];

const noInterfaces: NetworkInterface[] = [];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TrafficOverviewCard> = {
  title: 'App/Network/TrafficOverviewCard',
  component: TrafficOverviewCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Card that visualises last-hour traffic using a bar chart (12 static sample bars) ' +
          'and shows download / upload stat cells. The active interface count is derived from ' +
          'interfaces whose status is "running" and link is "up". ' +
          'Real-time byte values are noted as unavailable in the current implementation. ' +
          'Supports a full skeleton loading state.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrafficOverviewCard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AllActive: Story = {
  args: {
    interfaces: activeInterfaces,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Three fully active interfaces (running + link up). The download cell reads "3 active interfaces".',
      },
    },
  },
};

export const MixedLinkStatus: Story = {
  args: {
    interfaces: mixedInterfaces,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: '4 total interfaces but only 2 with both running status and link up. Shows "2 active interfaces".',
      },
    },
  },
};

export const SingleActiveInterface: Story = {
  args: {
    interfaces: [
      { id: '1', name: 'ether1', type: 'ether', status: 'running', macAddress: 'AA:BB:CC:DD:EE:01', linkStatus: 'up' },
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only one active interface — useful for verifying singular vs plural phrasing and minimal state.',
      },
    },
  },
};

export const NoActiveInterfaces: Story = {
  args: {
    interfaces: noInterfaces,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty interface list. The bar chart still renders; active count shows "0 active interfaces".',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    interfaces: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full skeleton pulse state while interface data is being fetched.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    interfaces: activeInterfaces,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    interfaces: activeInterfaces,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
