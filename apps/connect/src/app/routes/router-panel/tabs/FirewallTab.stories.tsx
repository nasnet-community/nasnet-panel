import { FirewallTab } from './FirewallTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FirewallTab> = {
  title: 'App/RouterPanel/FirewallTab',
  component: FirewallTab,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FirewallTab>;

/**
 * Default FirewallTab state with full dashboard layout
 */
export const Default: Story = {
  render: () => <FirewallTab />,
};

/**
 * FirewallTab showing the efficiency report dialog
 */
export const WithEfficiencyReport: Story = {
  render: () => <FirewallTab />,
  parameters: {
    docs: {
      description: {
        story: 'FirewallTab with efficiency report modal opened. Shows rule analysis and optimization suggestions.',
      },
    },
  },
};

/**
 * FirewallTab in a compact mobile view
 */
export const MobileView: Story = {
  render: () => <FirewallTab />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive layout optimized for mobile devices with stacked layout and bottom padding for navigation.',
      },
    },
  },
};

/**
 * FirewallTab on desktop with full-width layout
 */
export const Desktop: Story = {
  render: () => <FirewallTab />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
