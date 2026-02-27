/**
 * RecentLogs Component Tests
 * Tests for the dashboard log widget with filtering
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { LogEntry } from '@nasnet/core/types';

import { RecentLogs } from './RecentLogs';
import * as logStreamHook from './useLogStream';
import * as logFilterStore from '../../stores/log-filter-preferences.store';

// Mock the dependencies
vi.mock('./useLogStream');
vi.mock('../../stores/log-filter-preferences.store');
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, search }: any) => (
    <a
      href={to}
      data-search={JSON.stringify(search)}
    >
      {children}
    </a>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('RecentLogs', () => {
  const mockLogs: LogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date('2026-02-05T10:00:00Z'),
      topic: 'system',
      severity: 'info',
      message: 'System started successfully',
    },
    {
      id: 'log-2',
      timestamp: new Date('2026-02-05T10:05:00Z'),
      topic: 'firewall',
      severity: 'warning',
      message: 'Connection rejected from 192.168.1.100',
    },
    {
      id: 'log-3',
      timestamp: new Date('2026-02-05T10:10:00Z'),
      topic: 'wireless',
      severity: 'info',
      message: 'Client connected: AA:BB:CC:DD:EE:FF',
    },
  ];

  const mockSetSelectedTopics = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: mockSetSelectedTopics,
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
        totalCount: 0,
        hasMore: false,
      });

      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Recent Logs')).toBeInTheDocument();
      // Should show skeleton rows
      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className.includes('h-5 w-5'));
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should render error message with retry button', async () => {
      const mockRefetch = vi.fn();
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: [],
        loading: false,
        error: new Error('Failed to fetch logs'),
        refetch: mockRefetch,
        totalCount: 0,
        hasMore: false,
      });

      const user = userEvent.setup();
      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Failed to load logs')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch logs')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Successful Render', () => {
    it('should render log entries with correct data', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 3,
        hasMore: false,
      });

      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('System started successfully')).toBeInTheDocument();
      expect(screen.getByText('Connection rejected from 192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('Client connected: AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
    });

    it('should render with ARIA log role and live region', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 3,
        hasMore: false,
      });

      const { container } = render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const logContainer = container.querySelector<HTMLElement>('[role="log"]');
      expect(logContainer).toBeInTheDocument();
      expect(logContainer).toHaveAttribute('aria-live', 'polite');
      expect(logContainer).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no logs', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 0,
        hasMore: false,
      });

      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No logs found for selected topics')).toBeInTheDocument();
      expect(screen.getByText(/Try selecting different topics/i)).toBeInTheDocument();
    });

    it('should show clear filters button in empty state when filters are active', async () => {
      vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
        selectedTopics: ['firewall'],
        setSelectedTopics: mockSetSelectedTopics,
        toggleTopic: vi.fn(),
        clearFilters: vi.fn(),
      } as any);

      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 0,
        hasMore: false,
      });

      const user = userEvent.setup();
      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);
      expect(mockSetSelectedTopics).toHaveBeenCalledWith([]);
    });
  });

  describe('View All Link', () => {
    it('should render View All link without search params when no topics selected', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 3,
        hasMore: false,
      });

      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveAttribute('href', '/logs');
      expect(viewAllLink).toHaveAttribute('data-search', 'null');
    });

    it('should preserve filter params in View All link', () => {
      vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
        selectedTopics: ['firewall', 'dhcp'],
        setSelectedTopics: mockSetSelectedTopics,
        toggleTopic: vi.fn(),
        clearFilters: vi.fn(),
      } as any);

      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 3,
        hasMore: false,
      });

      render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toHaveAttribute('href', '/logs');
      const searchData = JSON.parse(viewAllLink.getAttribute('data-search') || '{}');
      expect(searchData.topics).toBe('firewall,dhcp');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button touch targets (44px minimum)', () => {
      vi.mocked(logStreamHook.useLogStream).mockReturnValue({
        logs: mockLogs,
        loading: false,
        error: null,
        refetch: vi.fn(),
        totalCount: 3,
        hasMore: false,
      });

      const { container } = render(<RecentLogs deviceId="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const viewAllButton = screen.getByRole('link', { name: /view all/i });
      expect(viewAllButton).toHaveClass('min-h-[44px]');
    });
  });
});
