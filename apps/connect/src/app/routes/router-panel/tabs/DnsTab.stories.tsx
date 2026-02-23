import { DnsTab } from './DnsTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DnsTab> = {
  title: 'App/RouterPanel/DnsTab',
  component: DnsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DNS Tab displays DNS configuration interface including DNS server management (static and dynamic), cache settings and usage, static DNS entries (hostname-to-IP mappings), and remote requests security settings. Router navigation is mocked in this story.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '16px', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DnsTab>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '16px', background: 'var(--background)' }}>
        <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '16px', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'DNS tab on mobile viewport. DNS server list, cache settings, and static entries adapt to mobile-friendly layout.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'DNS tab on desktop viewport. Full-width layout with dense data tables and comprehensive DNS configuration controls.',
      },
    },
  },
};
