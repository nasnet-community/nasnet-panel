import { VPNTab } from './VPNTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNTab> = {
  title: 'App/RouterPanel/VPNTab',
  component: VPNTab,
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
type Story = StoryObj<typeof meta>;

/**
 * Default VPNTab state with empty VPN interfaces
 */
export const Default: Story = {
  render: () => <VPNTab />,
};

/**
 * VPNTab showing loading state for interface queries
 */
export const Loading: Story = {
  render: () => <VPNTab />,
  parameters: {
    docs: {
      description: {
        story: 'VPNTab in loading state while fetching WireGuard, L2TP, PPTP, and SSTP interfaces from the router.',
      },
    },
  },
};

/**
 * VPNTab showing error state when interface fetch fails
 */
export const ErrorState: Story = {
  render: () => <VPNTab />,
  parameters: {
    docs: {
      description: {
        story: 'VPNTab displaying error message when WireGuard interface query fails. Shows retry option.',
      },
    },
  },
};

/**
 * VPNTab in compact mobile view
 */
export const MobileView: Story = {
  render: () => <VPNTab />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive VPN configuration view optimized for mobile devices.',
      },
    },
  },
};

/**
 * VPNTab on desktop with full-width layout
 */
export const Desktop: Story = {
  render: () => <VPNTab />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
