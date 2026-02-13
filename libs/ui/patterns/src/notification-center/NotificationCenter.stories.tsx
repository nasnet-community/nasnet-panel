/**
 * NotificationCenter Storybook Stories
 *
 * Interactive stories demonstrating notification center functionality.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { Button } from '@nasnet/ui/primitives';
import { NotificationCenter } from './NotificationCenter';
import { useAlertNotificationStore } from '@nasnet/state/stores';
import type { AlertSeverity } from '@nasnet/state/stores';

// Mock notifications generator
function generateMockNotifications(count: number) {
  const severities: AlertSeverity[] = ['CRITICAL', 'WARNING', 'INFO'];
  const titles = [
    'Router disconnected',
    'High CPU usage detected',
    'Backup completed successfully',
    'Firewall rule conflict',
    'DNS server unreachable',
    'VPN tunnel established',
    'DHCP pool exhausted',
    'Firmware update available',
    'Port scan detected',
    'SSL certificate expiring soon',
  ];

  const messages = [
    'Your router has lost connection to the network.',
    'CPU usage has exceeded 90% for the last 5 minutes.',
    'Automatic backup completed with no errors.',
    'Multiple firewall rules are conflicting. Please review.',
    'Primary DNS server is not responding to queries.',
    'VPN tunnel successfully established with remote gateway.',
    'DHCP address pool is running out of available addresses.',
    'A new firmware version is available for your device.',
    'Suspicious port scanning activity detected from external IP.',
    'SSL certificate will expire in 7 days. Renewal required.',
  ];

  const now = Date.now();
  const notifications = [];

  for (let i = 0; i < count; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const titleIndex = Math.floor(Math.random() * titles.length);

    notifications.push({
      alertId: `alert_${i}`,
      title: titles[titleIndex],
      message: messages[titleIndex],
      severity,
      deviceId: `router_${Math.floor(Math.random() * 5) + 1}`,
      ruleId: `rule_${Math.floor(Math.random() * 10) + 1}`,
      data: {},
    });
  }

  return notifications;
}

/**
 * Wrapper component to manage state and populate store
 */
function NotificationCenterWrapper({ notificationCount }: { notificationCount: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const addNotification = useAlertNotificationStore((state) => state.addNotification);
  const clearAll = useAlertNotificationStore((state) => state.clearAll);

  const handlePopulate = () => {
    clearAll();
    const mockNotifications = generateMockNotifications(notificationCount);
    mockNotifications.forEach((notification) => {
      addNotification(notification);
    });
  };

  const handleClear = () => {
    clearAll();
  };

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-4">
        <Button onClick={() => setIsOpen(true)}>Open Notification Center</Button>
        <Button onClick={handlePopulate} variant="outline">
          Populate {notificationCount} Notifications
        </Button>
        <Button onClick={handleClear} variant="outline">
          Clear All
        </Button>
      </div>

      <NotificationCenter open={isOpen} onClose={() => setIsOpen(false)} />

      <div className="mt-8 p-4 bg-surface-subtle rounded-lg">
        <h3 className="text-sm font-medium mb-2">Instructions:</h3>
        <ol className="text-sm text-content-secondary space-y-1 list-decimal list-inside">
          <li>Click "Populate N Notifications" to add mock notifications</li>
          <li>Click "Open Notification Center" to view the panel</li>
          <li>Test severity filtering by clicking filter chips</li>
          <li>Click a notification to mark it as read</li>
          <li>Use "Mark all read" or "Clear all" actions</li>
          <li>Test keyboard navigation (Desktop only): Escape, Arrow keys, Enter</li>
        </ol>
      </div>
    </div>
  );
}

const meta: Meta<typeof NotificationCenter> = {
  title: 'Patterns/NotificationCenter',
  component: NotificationCenter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
NotificationCenter displays alert notifications in a panel with platform-specific presenters.

**Features:**
- Auto-detects platform (Mobile: full-screen, Desktop: 400px side panel)
- Severity filtering (Critical, Warning, Info, All)
- Mark as read / Mark all read
- Clear all notifications
- Keyboard navigation (Desktop)
- Click to navigate and mark as read
- Empty state when no notifications

**Platform Variants:**
- **Mobile (<640px):** Full-screen Sheet, 44px touch targets, bottom action bar
- **Desktop (>=640px):** 400px side panel, scrollable list, keyboard navigation
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

/**
 * Default story with 10 notifications
 */
export const Default: Story = {
  render: () => <NotificationCenterWrapper notificationCount={10} />,
};

/**
 * Empty state (no notifications)
 */
export const Empty: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const clearAll = useAlertNotificationStore((state) => state.clearAll);

    // Clear notifications on mount
    React.useEffect(() => {
      clearAll();
    }, [clearAll]);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Notification Center</Button>
        <NotificationCenter open={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  },
};

/**
 * Large list (100+ notifications) to test scrolling and performance
 */
export const LargeList: Story = {
  render: () => <NotificationCenterWrapper notificationCount={150} />,
  parameters: {
    docs: {
      description: {
        story: 'Tests performance with 150 notifications and overflow scrolling.',
      },
    },
  },
};

/**
 * Only critical notifications
 */
export const OnlyCritical: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const addNotification = useAlertNotificationStore((state) => state.addNotification);
    const clearAll = useAlertNotificationStore((state) => state.clearAll);

    const handlePopulate = () => {
      clearAll();
      for (let i = 0; i < 10; i++) {
        addNotification({
          alertId: `critical_${i}`,
          title: 'Critical System Error',
          message: 'A critical error has occurred and requires immediate attention.',
          severity: 'CRITICAL',
          deviceId: `router_${i}`,
          ruleId: `rule_${i}`,
          data: {},
        });
      }
    };

    return (
      <div className="p-8">
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setIsOpen(true)}>Open Notification Center</Button>
          <Button onClick={handlePopulate} variant="outline">
            Populate Critical Notifications
          </Button>
          <Button onClick={clearAll} variant="outline">
            Clear All
          </Button>
        </div>

        <NotificationCenter open={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays only critical severity notifications.',
      },
    },
  },
};

/**
 * Mixed read/unread state
 */
export const MixedReadState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const addNotification = useAlertNotificationStore((state) => state.addNotification);
    const markAsRead = useAlertNotificationStore((state) => state.markAsRead);
    const clearAll = useAlertNotificationStore((state) => state.clearAll);
    const notifications = useAlertNotificationStore((state) => state.notifications);

    const handlePopulate = () => {
      clearAll();
      const mockNotifications = generateMockNotifications(10);
      mockNotifications.forEach((notification) => {
        addNotification(notification);
      });

      // Mark some as read
      setTimeout(() => {
        const currentNotifications = useAlertNotificationStore.getState().notifications;
        currentNotifications.slice(0, 5).forEach((n) => markAsRead(n.id));
      }, 100);
    };

    return (
      <div className="p-8">
        <div className="flex gap-4 mb-4">
          <Button onClick={() => setIsOpen(true)}>Open Notification Center</Button>
          <Button onClick={handlePopulate} variant="outline">
            Populate Mixed State
          </Button>
          <Button onClick={clearAll} variant="outline">
            Clear All
          </Button>
        </div>

        <NotificationCenter open={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays a mix of read and unread notifications.',
      },
    },
  },
};
