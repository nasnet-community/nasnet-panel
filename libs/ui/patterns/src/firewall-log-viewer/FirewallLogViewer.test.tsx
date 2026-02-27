/**
 * FirewallLogViewer Component Tests
 *
 * Comprehensive tests for both Desktop and Mobile presenters.
 * Includes RTL tests, accessibility checks, and interaction tests.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import type { FirewallLogEntry } from '@nasnet/core/types';
import { usePlatform } from '@nasnet/ui/layouts';

import { FirewallLogViewer } from './FirewallLogViewer';
import { useFirewallLogViewer } from './use-firewall-log-viewer';

// Mock dependencies
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

vi.mock('../firewall-log-filters', () => ({
  FirewallLogFilters: ({ onFiltersChange }: any) => (
    <div data-testid="firewall-log-filters">
      <button
        onClick={() =>
          onFiltersChange({
            timeRangePreset: 'last1h',
            actions: ['drop'],
            srcIp: '192.168.1.100',
          })
        }
      >
        Apply Filters
      </button>
    </div>
  ),
}));

vi.mock('../firewall-log-stats', () => ({
  FirewallLogStats: ({ onAddToBlocklist }: any) => (
    <div data-testid="firewall-log-stats">
      <button onClick={() => onAddToBlocklist('192.168.1.100')}>Add to Blocklist</button>
    </div>
  ),
}));

vi.mock('./use-firewall-log-viewer', () => ({
  useFirewallLogViewer: vi.fn(),
}));

describe('FirewallLogViewer', () => {
  // Sample test data
  const mockLogs: FirewallLogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      topic: 'firewall',
      severity: 'info',
      message: 'drop all from 192.168.1.100:45678 to 10.0.0.5:80',
      parsed: {
        action: 'drop',
        chain: 'forward',
        srcIp: '192.168.1.100',
        srcPort: 45678,
        dstIp: '10.0.0.5',
        dstPort: 80,
        protocol: 'TCP',
        prefix: 'BLOCKED',
        interfaceIn: 'ether1',
        interfaceOut: 'ether2',
      },
    },
    {
      id: 'log-2',
      timestamp: new Date('2024-01-15T10:31:00Z'),
      topic: 'firewall',
      severity: 'info',
      message: 'accept established from 10.0.0.5:443 to 192.168.1.200:54321',
      parsed: {
        action: 'accept',
        chain: 'input',
        srcIp: '10.0.0.5',
        srcPort: 443,
        dstIp: '192.168.1.200',
        dstPort: 54321,
        protocol: 'TCP',
        prefix: 'ALLOWED',
      },
    },
    {
      id: 'log-3',
      timestamp: new Date('2024-01-15T10:32:00Z'),
      topic: 'firewall',
      severity: 'info',
      message: 'reject icmp from 8.8.8.8 to 192.168.1.1',
      parsed: {
        action: 'reject',
        chain: 'input',
        srcIp: '8.8.8.8',
        dstIp: '192.168.1.1',
        protocol: 'ICMP',
      },
    },
  ];

  const mockViewerState = {
    logs: mockLogs,
    isLoading: false,
    error: null,
    selectedLog: null,
    totalCount: 3,
    visibleCount: 3,
    activeFilterCount: 0,
    state: {
      filters: {
        timeRangePreset: 'last24h' as const,
        actions: [],
      },
      isAutoRefreshEnabled: false,
      refreshInterval: 5000 as const,
      selectedLog: null,
      expandedStats: false,
      sortBy: 'timestamp' as const,
      sortOrder: 'desc' as const,
      searchQuery: '',
    },
    setFilters: vi.fn(),
    setSearchQuery: vi.fn(),
    setSortBy: vi.fn(),
    toggleSortOrder: vi.fn(),
    selectLog: vi.fn(),
    toggleAutoRefresh: vi.fn(),
    setRefreshInterval: vi.fn(),
    toggleStats: vi.fn(),
    exportToCSV: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useFirewallLogViewer as any).mockReturnValue(mockViewerState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Desktop Presenter', () => {
    beforeEach(() => {
      (usePlatform as any).mockReturnValue('desktop');
    });

    it('should render desktop layout with filters sidebar', () => {
      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByTestId('firewall-log-filters')).toBeInTheDocument();
      expect(screen.getByText('Firewall Logs')).toBeInTheDocument();
    });

    it('should render log table with all columns', () => {
      render(<FirewallLogViewer routerId="router-1" />);

      // Check table headers
      expect(screen.getByText(/Time/)).toBeInTheDocument();
      expect(screen.getByText(/Action/)).toBeInTheDocument();
      expect(screen.getByText(/Chain/)).toBeInTheDocument();
      expect(screen.getByText(/Source/)).toBeInTheDocument();
      expect(screen.getByText(/Destination/)).toBeInTheDocument();
      expect(screen.getByText(/Protocol/)).toBeInTheDocument();
      expect(screen.getByText(/Prefix/)).toBeInTheDocument();
    });

    it('should render log entries in table', () => {
      render(<FirewallLogViewer routerId="router-1" />);

      // Check log data
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
      expect(screen.getByText('drop')).toBeInTheDocument();
      expect(screen.getByText('accept')).toBeInTheDocument();
      expect(screen.getByText('reject')).toBeInTheDocument();
    });

    it('should handle search input', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const searchInput = screen.getByPlaceholderText(/Search logs/i);
      await user.type(searchInput, '192.168');

      expect(mockViewerState.setSearchQuery).toHaveBeenCalledWith('192.168');
    });

    it('should toggle auto-refresh', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const playButton = screen.getByRole('button', { name: /Play/i });
      await user.click(playButton);

      expect(mockViewerState.toggleAutoRefresh).toHaveBeenCalled();
    });

    it('should change refresh interval', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      // Find and click the select trigger
      const selectTrigger = screen.getAllByRole('combobox')[0];
      await user.click(selectTrigger);

      // Wait for options to appear and click one
      await waitFor(() => {
        const option = screen.getByRole('option', { name: '3s' });
        return user.click(option);
      });

      expect(mockViewerState.setRefreshInterval).toHaveBeenCalledWith(3000);
    });

    it('should export to CSV', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportButton);

      expect(mockViewerState.exportToCSV).toHaveBeenCalled();
    });

    it('should disable export when no logs', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        logs: [],
        visibleCount: 0,
        totalCount: 0,
      });

      render(<FirewallLogViewer routerId="router-1" />);

      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      expect(exportButton).toBeDisabled();
    });

    it('should toggle stats panel', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const statsButton = screen.getByRole('button', { name: /Show Stats/i });
      await user.click(statsButton);

      expect(mockViewerState.toggleStats).toHaveBeenCalled();
    });

    it('should show stats panel when expanded', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        state: { ...mockViewerState.state, expandedStats: true },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByTestId('firewall-log-stats')).toBeInTheDocument();
    });

    it('should sort by column when header clicked', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const actionHeader = screen.getByText(/Action/);
      await user.click(actionHeader);

      expect(mockViewerState.setSortBy).toHaveBeenCalledWith('action');
    });

    it('should toggle sort order when same column clicked', async () => {
      const user = userEvent.setup();
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        state: { ...mockViewerState.state, sortBy: 'action' },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      const actionHeader = screen.getByText(/Action/);
      await user.click(actionHeader);

      expect(mockViewerState.toggleSortOrder).toHaveBeenCalled();
    });

    it('should select log when row clicked', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      await user.click(firstDataRow);

      expect(mockViewerState.selectLog).toHaveBeenCalledWith(mockLogs[0]);
    });

    it('should show log details when selected', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        selectedLog: mockLogs[0],
        state: { ...mockViewerState.state, selectedLog: mockLogs[0] },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText('Log Details')).toBeInTheDocument();
      expect(screen.getByText(mockLogs[0].message)).toBeInTheDocument();
    });

    it('should close detail panel when Close clicked', async () => {
      const user = userEvent.setup();
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        selectedLog: mockLogs[0],
        state: { ...mockViewerState.state, selectedLog: mockLogs[0] },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      expect(mockViewerState.selectLog).toHaveBeenCalledWith(null);
    });

    it('should handle prefix click', async () => {
      const user = userEvent.setup();
      const onPrefixClick = vi.fn();

      render(
        <FirewallLogViewer
          routerId="router-1"
          onPrefixClick={onPrefixClick}
        />
      );

      const prefixLink = screen.getByText('BLOCKED').closest('button');
      expect(prefixLink).toBeInTheDocument();
      await user.click(prefixLink!);

      expect(onPrefixClick).toHaveBeenCalledWith('BLOCKED');
    });

    it('should show loading state', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        isLoading: true,
        logs: [],
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        error: new Error('Failed to load logs'),
        logs: [],
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText(/Error loading logs: Failed to load logs/i)).toBeInTheDocument();
    });

    it('should show empty state', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        logs: [],
        visibleCount: 0,
        totalCount: 0,
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText(/No logs found. Try adjusting your filters./i)).toBeInTheDocument();
    });

    it('should show log counts', () => {
      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText(/Showing 3 of 3 logs/i)).toBeInTheDocument();
    });

    it('should pass accessibility checks', async () => {
      const { container } = render(<FirewallLogViewer routerId="router-1" />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Mobile Presenter', () => {
    beforeEach(() => {
      (usePlatform as any).mockReturnValue('mobile');
    });

    it('should render mobile layout with card-based logs', () => {
      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText('Firewall Logs')).toBeInTheDocument();
      // Cards should show action badges
      expect(screen.getByText('drop')).toBeInTheDocument();
      expect(screen.getByText('accept')).toBeInTheDocument();
    });

    it('should render filter button with badge', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        activeFilterCount: 2,
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Badge count
    });

    it('should have 44px minimum touch targets', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      // Check play/pause button
      const playButton = screen.getByRole('button', { name: /Play/i });
      const playButtonStyles = window.getComputedStyle(playButton);
      const minHeight = parseInt(playButtonStyles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);

      // Check filter button
      const filterButton = screen.getByRole('button', { name: /Filters/i });
      const filterButtonStyles = window.getComputedStyle(filterButton);
      const filterMinHeight = parseInt(filterButtonStyles.minHeight);
      expect(filterMinHeight).toBeGreaterThanOrEqual(44);
    });

    it('should open filter sheet', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const filterButton = screen.getByRole('button', { name: /Filters/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Filter Logs')).toBeInTheDocument();
      });
    });

    it('should handle search input on mobile', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const searchInput = screen.getByPlaceholderText(/Search logs/i);
      await user.type(searchInput, '192.168');

      expect(mockViewerState.setSearchQuery).toHaveBeenCalledWith('192.168');
    });

    it('should toggle auto-refresh on mobile', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      const playButton = screen.getByRole('button', { name: /Play/i });
      await user.click(playButton);

      expect(mockViewerState.toggleAutoRefresh).toHaveBeenCalled();
    });

    it('should select log when card clicked', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      // Find first log card by action badge
      const dropBadge = screen.getByText('drop');
      const logCard = dropBadge.closest('[class*="cursor-pointer"]');
      expect(logCard).toBeInTheDocument();
      await user.click(logCard!);

      expect(mockViewerState.selectLog).toHaveBeenCalledWith(mockLogs[0]);
    });

    it('should show expanded details when log selected', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        selectedLog: mockLogs[0],
        state: { ...mockViewerState.state, selectedLog: mockLogs[0] },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      // Check expanded details are shown
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Interface In')).toBeInTheDocument();
      expect(screen.getByText('Interface Out')).toBeInTheDocument();
    });

    it('should close detail when X button clicked', async () => {
      const user = userEvent.setup();
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        selectedLog: mockLogs[0],
        state: { ...mockViewerState.state, selectedLog: mockLogs[0] },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      // Find X button in selected card
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find((btn) => btn.querySelector('[class*="lucide-x"]'));
      expect(xButton).toBeInTheDocument();
      await user.click(xButton!);

      expect(mockViewerState.selectLog).toHaveBeenCalledWith(null);
    });

    it('should show stats panel when expanded on mobile', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        state: { ...mockViewerState.state, expandedStats: true },
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByTestId('firewall-log-stats')).toBeInTheDocument();
    });

    it('should toggle stats panel on mobile', async () => {
      const user = userEvent.setup();
      render(<FirewallLogViewer routerId="router-1" />);

      // Find stats button (icon only on mobile)
      const buttons = screen.getAllByRole('button');
      const statsButton = buttons.find((btn) => btn.querySelector('[class*="lucide-bar-chart"]'));
      expect(statsButton).toBeInTheDocument();
      await user.click(statsButton!);

      expect(mockViewerState.toggleStats).toHaveBeenCalled();
    });

    it('should show loading state on mobile', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        isLoading: true,
        logs: [],
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });

    it('should show error state on mobile', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        error: new Error('Network error'),
        logs: [],
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText(/Error loading logs: Network error/i)).toBeInTheDocument();
    });

    it('should show empty state on mobile', () => {
      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        logs: [],
        visibleCount: 0,
        totalCount: 0,
      });

      render(<FirewallLogViewer routerId="router-1" />);

      expect(screen.getByText(/No logs found. Try adjusting your filters./i)).toBeInTheDocument();
    });

    it('should pass accessibility checks on mobile', async () => {
      const { container } = render(<FirewallLogViewer routerId="router-1" />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Callbacks', () => {
    beforeEach(() => {
      (usePlatform as any).mockReturnValue('desktop');
    });

    it('should call onPrefixClick with correct arguments', async () => {
      const user = userEvent.setup();
      const onPrefixClick = vi.fn();

      render(
        <FirewallLogViewer
          routerId="router-1"
          onPrefixClick={onPrefixClick}
        />
      );

      const prefixLink = screen.getByText('BLOCKED').closest('button');
      await user.click(prefixLink!);

      expect(onPrefixClick).toHaveBeenCalledWith('BLOCKED');
    });

    it('should call onAddToBlocklist from stats panel', async () => {
      const user = userEvent.setup();
      const onAddToBlocklist = vi.fn();

      (useFirewallLogViewer as any).mockReturnValue({
        ...mockViewerState,
        state: { ...mockViewerState.state, expandedStats: true },
      });

      render(
        <FirewallLogViewer
          routerId="router-1"
          onAddToBlocklist={onAddToBlocklist}
        />
      );

      const blocklistButton = screen.getByText('Add to Blocklist');
      await user.click(blocklistButton);

      expect(onAddToBlocklist).toHaveBeenCalledWith('192.168.1.100');
    });
  });

  describe('Platform Detection', () => {
    it('should render mobile presenter on mobile platform', () => {
      (usePlatform as any).mockReturnValue('mobile');

      render(<FirewallLogViewer routerId="router-1" />);

      // Mobile has card-based layout, not table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render desktop presenter on tablet platform', () => {
      (usePlatform as any).mockReturnValue('tablet');

      render(<FirewallLogViewer routerId="router-1" />);

      // Desktop layout has table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render desktop presenter on desktop platform', () => {
      (usePlatform as any).mockReturnValue('desktop');

      render(<FirewallLogViewer routerId="router-1" />);

      // Desktop layout has table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
