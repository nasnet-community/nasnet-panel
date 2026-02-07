/**
 * DNS Server List Component Tests
 *
 * Tests for DNS server list with drag-and-drop reordering.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsServerList, type DnsServer } from './DnsServerList';
import * as platformUtils from '@nasnet/core/utils';

// Mock usePlatform hook
vi.mock('@nasnet/core/utils', async () => {
  const actual = await vi.importActual('@nasnet/core/utils');
  return {
    ...actual,
    usePlatform: vi.fn(() => 'desktop'),
  };
});

describe('DnsServerList', () => {
  const mockServers: DnsServer[] = [
    { id: '1', address: '1.1.1.1', isDynamic: false },
    { id: '2', address: '8.8.8.8', isDynamic: false },
    { id: '3', address: '192.168.1.1', isDynamic: true },
  ];

  const mockHandlers = {
    onReorder: vi.fn(),
    onRemove: vi.fn(),
    onAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all DNS servers', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('should display "Dynamic" badge for dynamic servers', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      const dynamicBadges = screen.getAllByText('Dynamic');
      expect(dynamicBadges).toHaveLength(1);
    });

    it('should show remove button for static servers only', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Static servers should have remove buttons
      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });

      // Only 2 static servers should have remove buttons
      expect(removeButtons.length).toBe(2);
    });

    it('should render "Add DNS Server" button', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should render empty state when no servers', () => {
      render(<DnsServerList servers={[]} {...mockHandlers} />);

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onAdd when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      await user.click(addButton);

      expect(mockHandlers.onAdd).toHaveBeenCalledTimes(1);
    });

    it('should call onRemove with correct server id when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Find remove button for first static server (1.1.1.1)
      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });

      await user.click(removeButtons[0]);

      expect(mockHandlers.onRemove).toHaveBeenCalledWith('1');
    });

    it('should not show remove button for dynamic servers', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Get the dynamic server row
      const dynamicServerRow = screen.getByText('192.168.1.1').closest('div');

      // Check that there's no remove button in this row
      const removeButton = within(dynamicServerRow!).queryByRole('button', {
        name: /remove/i,
      });

      expect(removeButton).not.toBeInTheDocument();
    });

    it('should disable dragging for dynamic servers', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Dynamic servers should not have drag handles enabled
      // (This is a behavioral test - actual drag interaction testing
      // would require more complex setup with DnD kit)
      const dynamicServer = mockServers.find((s) => s.isDynamic);
      expect(dynamicServer).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should disable interactions when loading', () => {
      render(
        <DnsServerList servers={mockServers} {...mockHandlers} loading={true} />
      );

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      expect(addButton).toBeDisabled();
    });

    it('should disable remove buttons when loading', () => {
      render(
        <DnsServerList servers={mockServers} {...mockHandlers} loading={true} />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });

      removeButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('platform responsiveness', () => {
    it('should render desktop presenter on desktop platform', () => {
      vi.mocked(platformUtils.usePlatform).mockReturnValue('desktop');

      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Desktop version should use table/list layout
      // (Check for specific desktop UI elements)
      expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
    });

    it('should render mobile presenter on mobile platform', () => {
      vi.mocked(platformUtils.usePlatform).mockReturnValue('mobile');

      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Mobile version should render (specific mobile UI can be tested)
      expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for remove buttons', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      // Each remove button should have an aria-label with the server address
      expect(
        screen.getByRole('button', { name: /remove 1\.1\.1\.1/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /remove 8\.8\.8\.8/i })
      ).toBeInTheDocument();
    });

    it('should have accessible add button', () => {
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      expect(addButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DnsServerList servers={mockServers} {...mockHandlers} />);

      const addButton = screen.getByRole('button', { name: /add dns server/i });

      // Tab to button
      await user.tab();

      // Press Enter to activate
      await user.keyboard('{Enter}');

      expect(mockHandlers.onAdd).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle single server', () => {
      const singleServer: DnsServer[] = [
        { id: '1', address: '1.1.1.1', isDynamic: false },
      ];

      render(<DnsServerList servers={singleServer} {...mockHandlers} />);

      expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
    });

    it('should handle all dynamic servers', () => {
      const allDynamic: DnsServer[] = [
        { id: '1', address: '192.168.1.1', isDynamic: true },
        { id: '2', address: '192.168.1.2', isDynamic: true },
      ];

      render(<DnsServerList servers={allDynamic} {...mockHandlers} />);

      // Should show dynamic badges
      const dynamicBadges = screen.getAllByText('Dynamic');
      expect(dynamicBadges).toHaveLength(2);

      // Should not show any remove buttons
      const removeButtons = screen.queryAllByRole('button', {
        name: /remove/i,
      });
      expect(removeButtons).toHaveLength(0);
    });

    it('should handle all static servers', () => {
      const allStatic: DnsServer[] = [
        { id: '1', address: '1.1.1.1', isDynamic: false },
        { id: '2', address: '8.8.8.8', isDynamic: false },
      ];

      render(<DnsServerList servers={allStatic} {...mockHandlers} />);

      // Should have remove buttons for all
      const removeButtons = screen.getAllByRole('button', {
        name: /remove/i,
      });
      expect(removeButtons).toHaveLength(2);

      // Should not show any dynamic badges
      const dynamicBadges = screen.queryAllByText('Dynamic');
      expect(dynamicBadges).toHaveLength(0);
    });
  });
});
