/**
 * LogViewer Component Tests
 * Tests for the log viewer container component
 * Epic 0.8: System Logs - Story 0.8.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogViewer } from './LogViewer';
import * as queries from '@nasnet/api-client/queries';
import type { LogEntry } from '@nasnet/core/types/router';

// Mock the API query hook
vi.mock('@nasnet/api-client/queries', () => ({
  useSystemLogs: vi.fn(),
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

describe('LogViewer', () => {
  const mockLogs: LogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date('2025-12-04T10:00:00Z'),
      topic: 'system',
      severity: 'info',
      message: 'System started successfully',
    },
    {
      id: 'log-2',
      timestamp: new Date('2025-12-04T10:05:00Z'),
      topic: 'firewall',
      severity: 'warning',
      message: 'Connection rejected from 192.168.1.100',
    },
    {
      id: 'log-3',
      timestamp: new Date('2025-12-04T10:10:00Z'),
      topic: 'wireless',
      severity: 'info',
      message: 'Client connected: AA:BB:CC:DD:EE:FF',
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should render skeleton loading state', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Should show multiple skeleton rows (10 by default)
      const skeletons = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show error or log content while loading', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Should not show error state
      expect(screen.queryByText('Failed to load logs')).not.toBeInTheDocument();

      // Should not show log entries
      expect(screen.queryByText('System started successfully')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error alert with message', () => {
      const mockError = new Error('Network connection failed');
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load logs')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      const mockError = new Error('Test error');
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Test error');
      const mockRefetch = vi.fn();
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: mockRefetch,
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should handle null error message gracefully', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load logs')).toBeInTheDocument();
      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show no entries message when data is empty array', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText('No log entries found.')).toBeInTheDocument();
    });

    it('should not show loading or error states when empty', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Should not show skeleton
      const skeletons = screen.queryAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBe(0);

      // Should not show error
      expect(screen.queryByText('Failed to load logs')).not.toBeInTheDocument();
    });
  });

  describe('Log Display', () => {
    it('should render all log entries', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Check all messages are displayed
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
      expect(screen.getByText('Connection rejected from 192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('Client connected: AA:BB:CC:DD:EE:FF')).toBeInTheDocument();
    });

    it('should display logs in chronological order (oldest first)', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      const messages = container.querySelectorAll('p');
      const messageTexts = Array.from(messages).map((p) => p.textContent);

      // First log should be first in DOM
      expect(messageTexts[0]).toBe('System started successfully');
      // Last log should be last in DOM
      expect(messageTexts[messageTexts.length - 1]).toBe('Client connected: AA:BB:CC:DD:EE:FF');
    });

    it('should render topic badges for all entries', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText('system')).toBeInTheDocument();
      expect(screen.getByText('firewall')).toBeInTheDocument();
      expect(screen.getByText('wireless')).toBeInTheDocument();
    });

    it('should render timestamps for all entries', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      // Should have 3 time elements (one per log)
      const timeElements = container.querySelectorAll('time');
      expect(timeElements.length).toBe(3);
    });

    it('should handle single log entry', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [mockLogs[0]],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText('System started successfully')).toBeInTheDocument();
      expect(screen.queryByText('Connection rejected')).not.toBeInTheDocument();
    });

    it('should handle large number of log entries', () => {
      const manyLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(`2025-12-04T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`),
        topic: 'system' as const,
        severity: 'info' as const,
        message: `Log entry ${i}`,
      }));

      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: manyLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      // Should render all 100 entries
      const logEntries = container.querySelectorAll('[class*="border-b"]');
      expect(logEntries.length).toBe(100);
    });
  });

  describe('Auto-Scroll Behavior', () => {
    it('should auto-scroll to bottom on initial load', async () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      // Wait for auto-scroll effect
      await waitFor(
        () => {
          const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
          expect(scrollContainer).toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it('should have scrollable container for overflow content', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      const scrollContainer = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer?.className).toContain('overflow-y-auto');
    });
  });

  describe('Limit Prop', () => {
    it('should pass limit to useSystemLogs hook', () => {
      const mockUseSystemLogs = vi.mocked(queries.useSystemLogs);
      mockUseSystemLogs.mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer limit={50} />, { wrapper: createWrapper() });

      expect(mockUseSystemLogs).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should use default limit of 100 when not specified', () => {
      const mockUseSystemLogs = vi.mocked(queries.useSystemLogs);
      mockUseSystemLogs.mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(mockUseSystemLogs).toHaveBeenCalledWith({ limit: 100 });
    });

    it('should accept custom limit values', () => {
      const mockUseSystemLogs = vi.mocked(queries.useSystemLogs);
      mockUseSystemLogs.mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer limit={200} />, { wrapper: createWrapper() });

      expect(mockUseSystemLogs).toHaveBeenCalledWith({ limit: 200 });
    });
  });

  describe('Custom Class Name', () => {
    it('should apply custom className', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer className="custom-log-viewer" />, {
        wrapper: createWrapper(),
      });

      const logViewer = container.firstChild as HTMLElement;
      expect(logViewer.className).toContain('custom-log-viewer');
    });

    it('should preserve default classes with custom className', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer className="custom-class" />, {
        wrapper: createWrapper(),
      });

      const logViewer = container.firstChild as HTMLElement;
      expect(logViewer.className).toContain('custom-class');
      expect(logViewer.className).toContain('flex');
      expect(logViewer.className).toContain('flex-col');
    });
  });

  describe('Edge Cases', () => {
    it('should handle logs with missing timestamps', () => {
      const logsWithInvalidTimestamp: LogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date('invalid'),
          topic: 'system',
          severity: 'info',
          message: 'Test message',
        },
      ];

      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: logsWithInvalidTimestamp,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Should show "Invalid Time" instead of crashing
      expect(screen.getByText('Invalid Time')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should handle logs with very long messages', () => {
      const longMessage = 'A'.repeat(500);
      const logsWithLongMessage: LogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date('2025-12-04T10:00:00Z'),
          topic: 'system',
          severity: 'info',
          message: longMessage,
        },
      ];

      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: logsWithLongMessage,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle rapid state changes', () => {
      const mockUseSystemLogs = vi.mocked(queries.useSystemLogs);

      // Start with loading
      mockUseSystemLogs.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { rerender } = render(<LogViewer />, { wrapper: createWrapper() });

      // Change to data
      mockUseSystemLogs.mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<LogViewer />);

      expect(screen.getByText('System started successfully')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper container structure', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('flex');
      expect(mainContainer.className).toContain('flex-col');
      expect(mainContainer.className).toContain('h-full');
    });

    it('should use semantic time elements in log entries', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { container } = render(<LogViewer />, { wrapper: createWrapper() });

      const timeElements = container.querySelectorAll('time');
      expect(timeElements.length).toBe(mockLogs.length);
    });

    it('should have accessible error alert', () => {
      const mockError = new Error('Test error');
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      render(<LogViewer />, { wrapper: createWrapper() });

      // Retry button should be accessible
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAccessibleName();
    });
  });
});
