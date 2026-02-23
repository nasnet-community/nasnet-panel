import { fn } from 'storybook/test';

import { TroubleshootPage } from './dashboard.troubleshoot';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof TroubleshootPage> = {
  title: 'App/Dashboard/TroubleshootPage',
  component: TroubleshootPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Troubleshooting wizard page that guides users through diagnostic procedures. Requires a selected router ID and can auto-start diagnostics. Router context is mocked — navigation callbacks use Storybook actions.',
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
type Story = StoryObj<typeof TroubleshootPage>;

export const Default: Story = {
  render: () => {
    // Mock localStorage with a router ID
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <TroubleshootPage />;
  },
};

export const NoRouterSelected: Story = {
  render: () => {
    // Mock localStorage without a router ID
    localStorage.getItem = fn().mockReturnValue(null);

    return <TroubleshootPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state when no router is selected. Shows message to user and button to return to dashboard.',
      },
    },
  },
};

export const WithAutoStart: Story = {
  render: () => {
    // Mock localStorage with a router ID
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <TroubleshootPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Troubleshoot wizard initialized with autoStart flag to automatically begin diagnostics.',
      },
    },
  },
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
