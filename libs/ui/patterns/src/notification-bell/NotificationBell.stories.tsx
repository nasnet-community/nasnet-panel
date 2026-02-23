/**
 * NotificationBell Storybook Stories
 *
 * Visual testing for all platform presenters and states.
 */

import type { Meta, StoryObj } from '@storybook/react';

import { fn } from 'storybook/test';

import type { InAppNotification } from '@nasnet/state/stores';

import { NotificationBell } from './NotificationBell';
import { NotificationBellDesktop } from './NotificationBell.Desktop';
import { NotificationBellMobile } from './NotificationBell.Mobile';

// Mock notifications
const mockNotifications: InAppNotification[] = [
  {
    id: 'notif_1',
    alertId: 'alert_1',
    title: 'High CPU Usage Detected',
    message: 'Router CPU usage has exceeded 90% for the last 5 minutes',
    severity: 'CRITICAL',
    deviceId: 'router_1',
    ruleId: 'rule_cpu',
    read: false,
    receivedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  },
  {
    id: 'notif_2',
    alertId: 'alert_2',
    title: 'Unusual Traffic Pattern',
    message: 'Detected 50% increase in outbound traffic on WAN interface',
    severity: 'WARNING',
    deviceId: 'router_1',
    ruleId: 'rule_traffic',
    read: false,
    receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  },
  {
    id: 'notif_3',
    alertId: 'alert_3',
    title: 'Firmware Update Available',
    message: 'RouterOS 7.14.1 is available for download',
    severity: 'INFO',
    deviceId: 'router_1',
    read: true,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'notif_4',
    alertId: 'alert_4',
    title: 'VPN Connection Established',
    message: 'WireGuard peer "Office-1" connected successfully',
    severity: 'INFO',
    deviceId: 'router_1',
    ruleId: 'rule_vpn',
    read: true,
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'notif_5',
    alertId: 'alert_5',
    title: 'DHCP Pool Nearly Full',
    message: 'DHCP pool 192.168.1.0/24 has only 5 addresses remaining',
    severity: 'WARNING',
    deviceId: 'router_1',
    ruleId: 'rule_dhcp',
    read: true,
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
];

const meta: Meta<typeof NotificationBell> = {
  title: 'Patterns/NotificationBell',
  component: NotificationBell,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'In-app notification bell with platform presenters. Auto-detects platform and renders optimal UI (Popover for desktop, Sheet for mobile).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    unreadCount: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Number of unread notifications',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
  args: {
    onNotificationClick: fn(),
    onMarkAllRead: fn(),
    onViewAll: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

/**
 * Default state with unread notifications
 */
export const Default: Story = {
  args: {
    unreadCount: 2,
    notifications: mockNotifications,
  },
};

/**
 * No notifications
 */
export const Empty: Story = {
  args: {
    unreadCount: 0,
    notifications: [],
  },
};

/**
 * High unread count (9+)
 */
export const HighUnreadCount: Story = {
  args: {
    unreadCount: 15,
    notifications: mockNotifications,
  },
};

/**
 * Single unread notification
 */
export const SingleNotification: Story = {
  args: {
    unreadCount: 1,
    notifications: [mockNotifications[0]],
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    unreadCount: 3,
    notifications: [],
    loading: true,
  },
};

/**
 * All read notifications
 */
export const AllRead: Story = {
  args: {
    unreadCount: 0,
    notifications: mockNotifications.map((n) => ({ ...n, read: true })),
  },
};

/**
 * Mixed severities
 */
export const MixedSeverities: Story = {
  args: {
    unreadCount: 3,
    notifications: mockNotifications.slice(0, 3),
  },
};

/**
 * Desktop presenter (forced)
 */
export const DesktopPresenter: Story = {
  render: (args) => <NotificationBellDesktop {...args} />,
  args: {
    unreadCount: 2,
    notifications: mockNotifications,
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop presenter using Popover for compact notification preview.',
      },
    },
  },
};

/**
 * Mobile presenter (forced)
 */
export const MobilePresenter: Story = {
  render: (args) => <NotificationBellMobile {...args} />,
  args: {
    unreadCount: 2,
    notifications: mockNotifications,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile presenter using Sheet (bottom drawer) with large touch targets.',
      },
    },
  },
};

/**
 * Desktop - Empty state
 */
export const DesktopEmpty: Story = {
  render: (args) => <NotificationBellDesktop {...args} />,
  args: {
    unreadCount: 0,
    notifications: [],
  },
};

/**
 * Desktop - Loading state
 */
export const DesktopLoading: Story = {
  render: (args) => <NotificationBellDesktop {...args} />,
  args: {
    unreadCount: 3,
    notifications: [],
    loading: true,
  },
};

/**
 * Mobile - Empty state
 */
export const MobileEmpty: Story = {
  render: (args) => <NotificationBellMobile {...args} />,
  args: {
    unreadCount: 0,
    notifications: [],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile - Loading state
 */
export const MobileLoading: Story = {
  render: (args) => <NotificationBellMobile {...args} />,
  args: {
    unreadCount: 3,
    notifications: [],
    loading: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Accessibility: High contrast mode
 */
export const HighContrast: Story = {
  args: {
    unreadCount: 5,
    notifications: mockNotifications,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Component in high contrast mode for accessibility testing.',
      },
    },
  },
};

/**
 * Keyboard Navigation Test
 */
export const KeyboardNavigation: Story = {
  args: {
    unreadCount: 3,
    notifications: mockNotifications.slice(0, 3),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Test keyboard navigation: Tab to bell button, Enter to open, Arrow keys to navigate notifications, Enter to select.',
      },
    },
  },
};
