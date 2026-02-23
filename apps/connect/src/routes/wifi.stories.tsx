import { WifiPage } from '@/app/pages/wifi/WifiPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WifiPage> = {
  title: 'App/WiFi/WifiPage',
  component: WifiPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'WiFi management route at "/wifi". Dashboard Pro style layout showing ' +
          'WiFi status hero metrics, wireless interface list, connected clients table, ' +
          'and security summary. Implements FR0-14 for viewing wireless interfaces with status.',
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
type Story = StoryObj<typeof WifiPage>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default WiFi dashboard. Shows loading skeleton initially while fetching ' +
          'wireless interfaces and clients data from the connected router.',
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
          'WiFi dashboard at mobile viewport. Status hero, interface list, and clients table ' +
          'stack vertically with touch-friendly 44px targets.',
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
          'WiFi dashboard at tablet viewport. Hybrid layout with collapsible sections ' +
          'and balanced information density.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
