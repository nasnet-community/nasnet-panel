import { NetworkTab } from '@/app/pages/network/NetworkTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NetworkTab> = {
  title: 'App/Network/NetworkTab',
  component: NetworkTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Network monitoring route at "/network". Renders the Card-Heavy Network Dashboard ' +
          '(Direction 2 design) with interface cards, traffic stats, ARP table, ' +
          'DHCP pool summary, and VPN status. Information-dense, Home Assistant inspired layout.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NetworkTab>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default network dashboard view. Displays the full card-heavy layout ' +
          'with network status hero, interface list, traffic overview, and related cards.',
      },
    },
  },
};

export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Network dashboard at mobile viewport. Cards stack vertically ' +
          'for touch-friendly navigation in server rooms.',
      },
    },
  },
};

export const TabletViewport: Story = {
  name: 'Tablet Viewport',
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story:
          'Network dashboard at tablet viewport. Cards use a hybrid grid layout ' +
          'balancing density and readability.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
