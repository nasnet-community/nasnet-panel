import { NetworkTab as RouterNetworkTab } from '@/app/routes/router-panel/tabs/NetworkTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterNetworkTab> = {
  title: 'App/Router/NetworkRoute',
  component: RouterNetworkTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Network route page displaying the NetworkDashboard with Grafana-inspired data visualization. Shows interfaces, traffic stats, and network topology for the selected router.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RouterNetworkTab>;

export const Default: Story = {
  render: () => <RouterNetworkTab />,
};

export const CompactView: Story = {
  render: () => (
    <div style={{ maxWidth: '768px' }}>
      <RouterNetworkTab />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Network dashboard rendered within a tablet-width container to verify responsive layout.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <RouterNetworkTab />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Network dashboard at mobile viewport width, showing how data visualizations adapt to narrow screens.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <RouterNetworkTab />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <RouterNetworkTab />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
