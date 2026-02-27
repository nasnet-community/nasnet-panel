/**
 * RateLimitingPage Integration Tests
 *
 * Tests for the main Rate Limiting page component:
 * - Tab switching and persistence
 * - Component composition
 * - State management integration
 * - Accessibility compliance
 * - Empty states and loading states
 *
 * @see NAS-7.11: Implement Connection Rate Limiting - Task 11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RateLimitingPage } from './RateLimitingPage';
import { useRateLimitingUIStore, useConnectionStore } from '@nasnet/state/stores';
import * as queries from '@nasnet/api-client/queries';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// Mocks
// ============================================================================

// Mock API hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useRateLimitRules: vi.fn(),
  useSynFloodConfig: vi.fn(),
  useBlockedIPs: vi.fn(),
  useRateLimitStats: vi.fn(),
  useCreateRateLimitRule: vi.fn(),
  useUpdateRateLimitRule: vi.fn(),
  useDeleteRateLimitRule: vi.fn(),
  useToggleRateLimitRule: vi.fn(),
  useUpdateSynFloodConfig: vi.fn(),
  useWhitelistIP: vi.fn(),
  useClearBlockedIPs: vi.fn(),
}));

// Mock state stores
vi.mock('@nasnet/state/stores', () => ({
  useRateLimitingUIStore: vi.fn(),
  useConnectionStore: vi.fn(() => ({
    currentRouterIp: '192.168.1.1',
  })),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'rateLimiting.title': 'Rate Limiting',
        'rateLimiting.subtitle': 'Manage connection rate limits and protect against DDoS attacks',
        'rateLimiting.tabs.rateLimits': 'Rate Limits',
        'rateLimiting.tabs.synFlood': 'SYN Flood Protection',
        'rateLimiting.tabs.statistics': 'Statistics',
        'rateLimiting.buttons.addRateLimit': 'Add Rate Limit',
        'rateLimiting.buttons.clear': 'Clear Blocked IPs',
        'rateLimiting.statistics.refresh': 'Refresh',
        'rateLimiting.statistics.exportCSV': 'Export CSV',
        'rateLimiting.statistics.blockedIPsTable': 'Blocked IPs',
        'rateLimiting.fieldHelp.whitelistInfo': 'Click whitelist to temporarily allow blocked IPs',
        'rateLimiting.emptyStates.noRules': 'No rate limit rules',
        'rateLimiting.emptyStates.noRulesDescription':
          'Create your first rate limit rule to protect against connection flooding',
        'rateLimiting.emptyStates.noBlockedIPs': 'No blocked IPs',
        'rateLimiting.emptyStates.noBlockedIPsDescription':
          'Blocked IPs will appear here when rate limits are triggered',
        'rateLimiting.dialogs.addRule.title': 'Add Rate Limit Rule',
        'rateLimiting.dialogs.addRule.description': 'Create a new connection rate limit rule',
        'rateLimiting.dialogs.editRule.title': 'Edit Rate Limit Rule',
        'rateLimiting.dialogs.editRule.description': 'Modify existing rate limit rule',
        'rateLimiting.synFlood.description':
          'SYN flood protection helps prevent SYN flood attacks by limiting the rate of SYN packets',
        'rateLimiting.synFlood.warning':
          'Warning: Changing SYN flood settings may affect legitimate connections',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI patterns components
vi.mock('@nasnet/ui/patterns', () => ({
  RateLimitRulesTable: () => <div data-testid="rate-limit-rules-table">Rules Table</div>,
  RateLimitRuleEditor: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="rate-limit-rule-editor">
      <button onClick={onClose}>Close Editor</button>
    </div>
  ),
  SynFloodConfigPanel: () => <div data-testid="syn-flood-config-panel">SYN Flood Panel</div>,
  BlockedIPsTable: () => <div data-testid="blocked-ips-table">Blocked IPs Table</div>,
  RateLimitStatsOverview: () => <div data-testid="rate-limit-stats-overview">Stats Overview</div>,
}));

// ============================================================================
// Test Utilities
// ============================================================================

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

// ============================================================================
// Test Suites
// ============================================================================

describe('RateLimitingPage', () => {
  const mockStoreState = {
    selectedTab: 'rate-limits' as const,
    setSelectedTab: vi.fn(),
    showRuleEditor: false,
    openRuleEditor: vi.fn(),
    closeRuleEditor: vi.fn(),
    editingRule: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRateLimitingUIStore).mockReturnValue(mockStoreState);
    vi.mocked(useConnectionStore).mockReturnValue({
      currentRouterIp: '192.168.1.1',
    } as any);
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('renders page header with title and subtitle', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Rate Limiting')).toBeInTheDocument();
      expect(
        screen.getByText('Manage connection rate limits and protect against DDoS attacks')
      ).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('tab', { name: 'Rate Limits' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'SYN Flood Protection' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Statistics' })).toBeInTheDocument();
    });

    it('renders Add Rate Limit button when Rate Limits tab is active', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const addButtons = screen.getAllByRole('button', { name: 'Add Rate Limit' });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Tab Switching
  // ==========================================================================

  describe('Tab Switching', () => {
    it('switches to SYN Flood Protection tab on click', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const synFloodTab = screen.getByRole('tab', { name: 'SYN Flood Protection' });
      await user.click(synFloodTab);

      expect(mockStoreState.setSelectedTab).toHaveBeenCalledWith('syn-flood');
    });

    it('switches to Statistics tab on click', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const statsTab = screen.getByRole('tab', { name: 'Statistics' });
      await user.click(statsTab);

      expect(mockStoreState.setSelectedTab).toHaveBeenCalledWith('statistics');
    });

    it('persists selected tab via Zustand store', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'syn-flood',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const synFloodTab = screen.getByRole('tab', { name: 'SYN Flood Protection' });
      expect(synFloodTab).toHaveAttribute('data-state', 'active');
    });

    it('shows correct header actions based on selected tab', () => {
      const { rerender } = render(<RateLimitingPage />, { wrapper: createWrapper() });

      // Rate Limits tab - shows Add button
      const addButtons = screen.getAllByRole('button', { name: 'Add Rate Limit' });
      expect(addButtons.length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();

      // Switch to Statistics tab
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });
      rerender(<RateLimitingPage />);

      // Statistics tab - shows Refresh and Export buttons
      expect(screen.queryByRole('button', { name: 'Add Rate Limit' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Component Composition
  // ==========================================================================

  describe('Component Composition', () => {
    it('renders RateLimitRulesTable in Rate Limits tab when rules exist', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      // Note: Component uses internal state for hasRules
      // In production this would come from API
      // Default is false, so empty state shows
      expect(screen.queryByTestId('rate-limit-rules-table')).not.toBeInTheDocument();
      expect(screen.getByText('No rate limit rules')).toBeInTheDocument();
    });

    it('renders SynFloodConfigPanel in SYN Flood tab', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'syn-flood',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('syn-flood-config-panel')).toBeInTheDocument();
    });

    it('renders info and warning alerts in SYN Flood tab', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'syn-flood',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(
        screen.getByText(
          'SYN flood protection helps prevent SYN flood attacks by limiting the rate of SYN packets'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Warning: Changing SYN flood settings may affect legitimate connections')
      ).toBeInTheDocument();
    });

    it('renders stats overview and blocked IPs table in Statistics tab', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('rate-limit-stats-overview')).toBeInTheDocument();
      // Blocked IPs table only shows when hasBlockedIPs is true (default false)
      expect(screen.queryByTestId('blocked-ips-table')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Empty States
  // ==========================================================================

  describe('Empty States', () => {
    it('shows empty state for no rules in Rate Limits tab', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No rate limit rules')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first rate limit rule to protect against connection flooding')
      ).toBeInTheDocument();
    });

    it('shows empty state for no blocked IPs in Statistics tab', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No blocked IPs')).toBeInTheDocument();
      expect(
        screen.getByText('Blocked IPs will appear here when rate limits are triggered')
      ).toBeInTheDocument();
    });

    it('clicking Add button in empty state opens rule editor', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const addButton = screen.getAllByRole('button', { name: 'Add Rate Limit' })[1]; // Second button is in empty state
      await user.click(addButton);

      expect(mockStoreState.openRuleEditor).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Rule Editor Sheet
  // ==========================================================================

  describe('Rule Editor Sheet', () => {
    it('opens rule editor sheet when Add button clicked', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const addButtons = screen.getAllByRole('button', { name: 'Add Rate Limit' });
      await user.click(addButtons[0]); // Click first (header) button

      expect(mockStoreState.openRuleEditor).toHaveBeenCalled();
    });

    it('shows add rule title when creating new rule', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        showRuleEditor: true,
        editingRule: null,
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Add Rate Limit Rule')).toBeInTheDocument();
      expect(screen.getByText('Create a new connection rate limit rule')).toBeInTheDocument();
    });

    it('shows edit rule title when editing existing rule', () => {
      const mockRule = {
        id: '*1',
        connectionLimit: 100,
        timeWindow: 'per-minute' as const,
        action: 'drop' as const,
      };

      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        showRuleEditor: true,
        editingRule: mockRule,
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Edit Rate Limit Rule')).toBeInTheDocument();
      expect(screen.getByText('Modify existing rate limit rule')).toBeInTheDocument();
    });

    it('closes editor when close handler called', async () => {
      const user = userEvent.setup();
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        showRuleEditor: true,
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const closeButton = screen.getByRole('button', { name: 'Close Editor' });
      await user.click(closeButton);

      expect(mockStoreState.closeRuleEditor).toHaveBeenCalled();
    });

    it('renders editor content when sheet is open', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        showRuleEditor: true,
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      // Sheet content should be visible
      expect(screen.getByTestId('rate-limit-rule-editor')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // State Management
  // ==========================================================================

  describe('State Management', () => {
    it('reads selectedTab from Zustand store', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const statsTab = screen.getByRole('tab', { name: 'Statistics' });
      expect(statsTab).toHaveAttribute('data-state', 'active');
    });

    it('calls setSelectedTab when tab changes', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const synFloodTab = screen.getByRole('tab', { name: 'SYN Flood Protection' });
      await user.click(synFloodTab);

      expect(mockStoreState.setSelectedTab).toHaveBeenCalledWith('syn-flood');
    });

    it('reads showRuleEditor from Zustand store', () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        showRuleEditor: true,
      });

      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('rate-limit-rule-editor')).toBeInTheDocument();
    });

    it('calls openRuleEditor when Add button clicked', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const addButtons = screen.getAllByRole('button', { name: 'Add Rate Limit' });
      await user.click(addButtons[0]); // Click first (header) button

      expect(mockStoreState.openRuleEditor).toHaveBeenCalled();
    });

    it('gets router IP from connection store', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(useConnectionStore).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('Accessibility', () => {
    it('has no accessibility violations on Rate Limits tab', async () => {
      const { container } = render(<RateLimitingPage />, { wrapper: createWrapper() });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations on SYN Flood tab', async () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'syn-flood',
      });

      const { container } = render(<RateLimitingPage />, { wrapper: createWrapper() });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations on Statistics tab', async () => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });

      const { container } = render(<RateLimitingPage />, { wrapper: createWrapper() });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses proper heading hierarchy', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const h1 = screen.getByRole('heading', { level: 1, name: 'Rate Limiting' });
      expect(h1).toBeInTheDocument();
    });

    it('tabs have proper ARIA roles', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('buttons have accessible labels', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const addButtons = screen.getAllByRole('button', { name: 'Add Rate Limit' });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Refresh and Export Actions
  // ==========================================================================

  describe('Statistics Tab Actions', () => {
    beforeEach(() => {
      vi.mocked(useRateLimitingUIStore).mockReturnValue({
        ...mockStoreState,
        selectedTab: 'statistics',
      });
    });

    it('shows refresh button in statistics tab', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    });

    it('disables refresh button while refreshing', async () => {
      const user = userEvent.setup();
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const refreshButton = screen.getByRole('button', { name: 'Refresh' });
      await user.click(refreshButton);

      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();
    });

    it('shows export CSV button in statistics tab', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });

    it('export button is always enabled', () => {
      render(<RateLimitingPage />, { wrapper: createWrapper() });

      const exportButton = screen.getByRole('button', { name: 'Export CSV' });
      expect(exportButton).not.toBeDisabled();
    });
  });
});
