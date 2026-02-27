/**
 * NotificationBell Component Tests
 *
 * Unit tests for the NotificationBell pattern component.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import type { InAppNotification } from '@nasnet/state/stores';

import { NotificationBellDesktop } from './NotificationBell.Desktop';
import { NotificationBellMobile } from './NotificationBell.Mobile';

// Mock notifications
const mockNotifications: InAppNotification[] = [
  {
    id: 'notif_1',
    alertId: 'alert_1',
    title: 'High CPU Usage',
    message: 'CPU usage exceeded 90%',
    severity: 'CRITICAL',
    read: false,
    receivedAt: new Date().toISOString(),
  },
  {
    id: 'notif_2',
    alertId: 'alert_2',
    title: 'Traffic Warning',
    message: 'Unusual traffic detected',
    severity: 'WARNING',
    read: false,
    receivedAt: new Date().toISOString(),
  },
];

describe('NotificationBell', () => {
  describe('Desktop Presenter', () => {
    it('should render bell icon', () => {
      render(
        <NotificationBellDesktop
          unreadCount={0}
          notifications={[]}
        />
      );

      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toBeInTheDocument();
    });

    it('should display unread count badge when unread > 0', () => {
      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
        />
      );

      const badge = screen.getByText('2');
      expect(badge).toBeInTheDocument();
    });

    it('should display "9+" for counts >= 10', () => {
      render(
        <NotificationBellDesktop
          unreadCount={15}
          notifications={mockNotifications}
        />
      );

      const badge = screen.getByText('9+');
      expect(badge).toBeInTheDocument();
    });

    it('should not display badge when unread = 0', () => {
      render(
        <NotificationBellDesktop
          unreadCount={0}
          notifications={[]}
        />
      );

      const badge = screen.queryByText('0');
      expect(badge).not.toBeInTheDocument();
    });

    it('should have proper ARIA label with count', () => {
      render(
        <NotificationBellDesktop
          unreadCount={3}
          notifications={mockNotifications}
        />
      );

      const button = screen.getByRole('button', { name: /notifications \(3 unread\)/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onNotificationClick when notification is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
          onNotificationClick={handleClick}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Click first notification
      const notification = screen.getByText('High CPU Usage');
      await user.click(notification);

      expect(handleClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('should call onMarkAllRead when mark all read is clicked', async () => {
      const user = userEvent.setup();
      const handleMarkAllRead = vi.fn();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
          onMarkAllRead={handleMarkAllRead}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Click mark all read
      const markAllReadButton = screen.getByRole('button', { name: /mark all read/i });
      await user.click(markAllReadButton);

      expect(handleMarkAllRead).toHaveBeenCalled();
    });

    it('should call onViewAll when view all is clicked', async () => {
      const user = userEvent.setup();
      const handleViewAll = vi.fn();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
          onViewAll={handleViewAll}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Click view all
      const viewAllButton = screen.getByRole('button', { name: /view all notifications/i });
      await user.click(viewAllButton);

      expect(handleViewAll).toHaveBeenCalled();
    });

    it('should show loading skeleton when loading', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={[]}
          loading={true}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Check for skeleton elements (multiple will exist)
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show empty state when no notifications', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellDesktop
          unreadCount={0}
          notifications={[]}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    });

    it('should highlight unread notifications', async () => {
      const user = userEvent.setup();

      const mixedNotifications = [
        { ...mockNotifications[0], read: false },
        { ...mockNotifications[1], read: true },
      ];

      render(
        <NotificationBellDesktop
          unreadCount={1}
          notifications={mixedNotifications}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Find notification containers
      const notifications = screen.getAllByRole('button');
      const unreadNotification = notifications.find((n) =>
        n.textContent?.includes('High CPU Usage')
      );

      // Unread should have bg-primary/5 class
      expect(unreadNotification?.className).toContain('bg-primary/5');
    });
  });

  describe('Mobile Presenter', () => {
    it('should render bell icon with larger touch target', () => {
      render(
        <NotificationBellMobile
          unreadCount={0}
          notifications={[]}
        />
      );

      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('min-w-[44px]');
      expect(button.className).toContain('min-h-[44px]');
    });

    it('should display unread count badge', () => {
      render(
        <NotificationBellMobile
          unreadCount={3}
          notifications={mockNotifications}
        />
      );

      const badge = screen.getByText('3');
      expect(badge).toBeInTheDocument();
    });

    it('should open sheet when clicked', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellMobile
          unreadCount={2}
          notifications={mockNotifications}
        />
      );

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Sheet should open and show notifications title
      expect(screen.getByRole('dialog', { name: /notifications/i })).toBeInTheDocument();
    });

    it('should show larger notification cards for mobile', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellMobile
          unreadCount={2}
          notifications={mockNotifications}
        />
      );

      // Open sheet
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      // Mobile notifications should have min-h-[88px]
      const notifications = screen
        .getAllByRole('button')
        .filter((b) => b.textContent?.includes('High CPU Usage'));
      expect(notifications[0]?.className).toContain('min-h-[88px]');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA live region for unread count', () => {
      render(
        <NotificationBellDesktop
          unreadCount={5}
          notifications={mockNotifications}
        />
      );

      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveAttribute('aria-live', 'polite');
      expect(button).toHaveAttribute('aria-atomic', 'true');
    });

    it('should hide badge from screen readers', () => {
      const { container } = render(
        <NotificationBellDesktop
          unreadCount={3}
          notifications={mockNotifications}
        />
      );

      const badge = container.querySelector('[aria-hidden="true"]');
      expect(badge).toHaveTextContent('3');
    });

    it('should announce notification details to screen readers', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
        />
      );

      // Open popover
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await user.click(bellButton);

      const notification = screen.getByRole('button', {
        name: /high cpu usage.*cpu usage exceeded 90%/i,
      });
      expect(notification).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <NotificationBellDesktop
          unreadCount={2}
          notifications={mockNotifications}
        />
      );

      const bellButton = screen.getByRole('button', { name: /notifications/i });

      // Focus bell button
      await user.tab();
      expect(bellButton).toHaveFocus();

      // Open with Enter key
      await user.keyboard('{Enter}');

      // Popover should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
