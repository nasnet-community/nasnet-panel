import { fn } from 'storybook/test';

import { NotificationSettingsPage } from '@nasnet/features/alerts';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NotificationSettingsPage> = {
  title: 'App/Settings/Notifications',
  component: NotificationSettingsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Notification settings page for configuring alert channels (Email, Telegram, Pushover, Webhook) with test functionality and quiet hours configuration.',
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
type Story = StoryObj<typeof NotificationSettingsPage>;

export const Default: Story = {
  render: () => <NotificationSettingsPage />,
};

export const WithMockedRouter: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('192.168.1.1');
    return <NotificationSettingsPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Notification settings with a mocked router IP in localStorage, simulating a connected state.',
      },
    },
  },
};

export const NoRouterConnected: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);
    return <NotificationSettingsPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Notification settings when no router is connected. Channel test buttons may be unavailable.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('192.168.1.1');
    return <NotificationSettingsPage />;
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Notification settings on mobile viewport with adapted layout for channel configuration forms.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('192.168.1.1');
    return <NotificationSettingsPage />;
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Notification settings on desktop viewport with full channel configuration options and quiet hours settings.',
      },
    },
  },
};
