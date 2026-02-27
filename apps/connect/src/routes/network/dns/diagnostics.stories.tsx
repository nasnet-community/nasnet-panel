import { DnsDiagnosticsPage } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DnsDiagnosticsPage> = {
  title: 'App/Network/DNS/DnsDiagnosticsPage',
  component: DnsDiagnosticsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DNS cache and diagnostics page for inspecting DNS resolution, cache entries, and running diagnostic queries against the router DNS service.',
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
type Story = StoryObj<typeof DnsDiagnosticsPage>;

export const Default: Story = {
  render: () => <DnsDiagnosticsPage />,
};

export const NoRouterSelected: Story = {
  render: () => <DnsDiagnosticsPage />,
  parameters: {
    docs: {
      description: {
        story:
          'State when no router is selected. The diagnostics page should indicate that a router must be selected first.',
      },
    },
  },
};

export const WithCacheView: Story = {
  render: () => <DnsDiagnosticsPage />,
  parameters: {
    docs: {
      description: {
        story: 'DNS diagnostics page focused on viewing cached DNS entries and cache statistics.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <DnsDiagnosticsPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'DNS diagnostics page rendered on mobile viewport with adapted layout for smaller screens.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <DnsDiagnosticsPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'DNS diagnostics page rendered on desktop viewport with full diagnostic tools and cache display.',
      },
    },
  },
};
