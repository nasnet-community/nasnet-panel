import { DHCPTab } from './DHCPTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPTab> = {
  title: 'App/RouterPanel/DHCPTab',
  component: DHCPTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete DHCP management tab displaying DHCP overview, address pools, servers, active leases, and WAN DHCP clients. Integrates multiple DHCP-related components in a unified dashboard.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DHCPTab>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Complete DHCP tab in default state. Note: This component uses router hooks (useConnectionStore, useDHCPServers, useDHCPLeases, useDHCPClients, useDHCPPools) which require proper context setup. In Storybook, data loading is mocked through Apollo Client and Zustand store setup.',
      },
    },
  },
};

export const MobileView: Story = {
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', maxWidth: '375px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
    docs: {
      description: {
        story: 'DHCP tab on mobile viewport. Stats grid compresses to mobile-friendly layout.',
      },
    },
  },
};

export const TabletView: Story = {
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', maxWidth: '768px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
    docs: {
      description: {
        story: 'DHCP tab on tablet viewport. Hybrid layout with collapsible sidebar considerations.',
      },
    },
  },
};

export const DesktopView: Story = {
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', maxWidth: '1400px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'DHCP tab on desktop viewport. Full-width layout with dense data presentation.',
      },
    },
  },
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'DHCP tab in dark mode. All components adapt to dark color scheme.',
      },
    },
  },
};
