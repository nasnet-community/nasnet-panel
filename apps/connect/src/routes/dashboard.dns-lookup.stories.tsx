import { DnsLookupPage } from './dashboard.dns-lookup';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DnsLookupPage> = {
  title: 'App/Dashboard/DnsLookupPage',
  component: DnsLookupPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DNS lookup tool page for querying DNS records (A, AAAA, MX, TXT, CNAME, NS, PTR, SOA, SRV) and comparing responses from multiple DNS servers. Router context is mocked — navigation callbacks use Storybook actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DnsLookupPage>;

export const Default: Story = {
  render: () => <DnsLookupPage />,
};

export const FullHeight: Story = {
  render: () => <DnsLookupPage />,
  parameters: {
    docs: {
      description: {
        story: 'Full-height layout showing the DNS lookup tool with title and description.',
      },
    },
  },
};

export const WithContainer: Story = {
  render: () => <DnsLookupPage />,
  parameters: {
    docs: {
      description: {
        story: 'Standard container layout with proper spacing and typography.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '800px',
          padding: '24px',
          background: 'var(--color-background)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
