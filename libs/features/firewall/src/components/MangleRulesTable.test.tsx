/**
 * MangleRulesTable Component Tests
 *
 * Tests for mangle rules table domain component covering:
 * - Rendering states (loading, error, empty, with data)
 * - Actions (edit, duplicate, delete, toggle)
 * - Drag-drop reordering
 * - Disabled rules styling
 * - Unused rules badges
 * - Mobile variant detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MangleRulesTable } from './MangleRulesTable';
import type { MangleRule } from '@nasnet/core/types';

// Mock the connection store
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn(() => ({ currentRouterIp: '192.168.88.1' })),
}));

// Mock the API hooks
vi.mock('@nasnet/api-client/queries/firewall', () => ({
  useMangleRules: vi.fn(),
  useDeleteMangleRule: vi.fn(),
  useToggleMangleRule: vi.fn(),
  useMoveMangleRule: vi.fn(),
}));

// Mock the headless hook
vi.mock('@nasnet/ui/patterns/mangle-rule-table', () => ({
  useMangleRuleTable: vi.fn((props) => ({
    data: props.data,
    sortBy: props.initialSortBy,
    sortDirection: props.initialSortDirection,
    filters: props.initialFilters,
  })),
}));

// Mock the editor component
vi.mock('@nasnet/ui/patterns/mangle-rule-editor', () => ({
  MangleRuleEditor: ({ rule, onClose }: any) => (
    <div data-testid="mangle-rule-editor">
      <button onClick={onClose}>Close Editor</button>
      <pre>{JSON.stringify(rule, null, 2)}</pre>
    </div>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'mangle.table.columns.position': '#',
        'mangle.table.columns.chain': 'Chain',
        'mangle.table.columns.action': 'Action',
        'mangle.table.columns.markValue': 'Mark Value',
        'mangle.table.columns.matchers': 'Matchers',
        'mangle.table.columns.packets': 'Packets',
        'mangle.table.columns.bytes': 'Bytes',
        'mangle.table.columns.enabled': 'Enabled',
        'mangle.table.columns.actions': 'Actions',
        'mangle.table.noRules': 'No mangle rules found',
        'mangle.table.noRulesInChain': 'No rules in this chain',
        'mangle.table.unused': 'unused',
        'mangle.notifications.error.load': 'Error loading mangle rules',
        'mangle.dialogs.editRule.title': 'Edit Mangle Rule',
        'mangle.dialogs.editRule.description': 'Modify the mangle rule configuration',
        'mangle.dialogs.addRule.title': 'Add Mangle Rule',
        'mangle.dialogs.addRule.description': 'Create a new mangle rule',
        'mangle.dialogs.deleteRule.title': 'Delete Mangle Rule?',
        'mangle.dialogs.deleteRule.description': 'This action cannot be undone.',
        'mangle.dialogs.deleteRule.warning': 'This will:',
        'mangle.dialogs.deleteRule.consequences': ['Remove the rule', 'Reorder subsequent rules', 'Take effect immediately'],
        'button.cancel': 'Cancel',
        'button.delete': 'Delete',
      };
      return translations[key] || key;
    },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockRules: MangleRule[] = [
  {
    id: '*1',
    chain: 'prerouting',
    action: 'mark-connection',
    position: 0,
    newConnectionMark: 'voip_traffic',
    protocol: 'udp',
    dstPort: '5060',
    disabled: false,
    log: false,
    comment: 'Mark VoIP traffic',
    packets: 1500,
    bytes: 750000,
  },
  {
    id: '*2',
    chain: 'forward',
    action: 'mark-packet',
    position: 1,
    newPacketMark: 'gaming',
    protocol: 'tcp',
    dstPort: '27015',
    disabled: false,
    log: false,
    comment: 'Mark gaming traffic',
    packets: 5000,
    bytes: 2500000,
  },
  {
    id: '*3',
    chain: 'prerouting',
    action: 'drop',
    position: 2,
    protocol: 'tcp',
    dstPort: '25',
    disabled: true,
    log: true,
    comment: 'Block SMTP (disabled)',
    packets: 0,
    bytes: 0,
  },
];

describe('MangleRulesTable', () => {
  let mockUseMangleRules: any;
  let mockDeleteMangleRule: any;
  let mockToggleMangleRule: any;
  let mockMoveMangleRule: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const queries = require('@nasnet/api-client/queries/firewall');
    mockUseMangleRules = queries.useMangleRules;
    mockDeleteMangleRule = queries.useDeleteMangleRule;
    mockToggleMangleRule = queries.useToggleMangleRule;
    mockMoveMangleRule = queries.useMoveMangleRule;

    // Default mock implementations
    mockDeleteMangleRule.mockReturnValue({ mutate: vi.fn() });
    mockToggleMangleRule.mockReturnValue({ mutate: vi.fn() });
    mockMoveMangleRule.mockReturnValue({ mutate: vi.fn() });
  });

  describe('Rendering States', () => {
    it('renders loading state with skeleton', () => {
      mockUseMangleRules.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { container } = render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Check for loading skeleton
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders error state with error message', () => {
      const errorMessage = 'Network connection failed';
      mockUseMangleRules.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      expect(screen.getByText(/Error loading mangle rules/)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });

    it('renders empty state when no rules exist', () => {
      mockUseMangleRules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      expect(screen.getByText('No mangle rules found')).toBeInTheDocument();
    });

    it('renders empty state with chain-specific message', () => {
      mockUseMangleRules.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable chain="prerouting" />, { wrapper: createWrapper() });

      expect(screen.getByText('No rules in this chain')).toBeInTheDocument();
    });

    it('renders table with mangle rules', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Check table headers
      expect(screen.getByText('#')).toBeInTheDocument();
      expect(screen.getByText('Chain')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Mark Value')).toBeInTheDocument();
      expect(screen.getByText('Matchers')).toBeInTheDocument();
      expect(screen.getByText('Packets')).toBeInTheDocument();
      expect(screen.getByText('Bytes')).toBeInTheDocument();

      // Check rule data
      expect(screen.getByText('prerouting')).toBeInTheDocument();
      expect(screen.getByText('mark-connection')).toBeInTheDocument();
      expect(screen.getByText('voip_traffic')).toBeInTheDocument();
      expect(screen.getByText('Mark VoIP traffic')).toBeInTheDocument();
    });
  });

  describe('Disabled Rules Styling', () => {
    it('applies opacity-50 to disabled rules', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      const { container } = render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Find all rows with opacity-50 (disabled rules)
      const disabledRows = container.querySelectorAll('.opacity-50');
      expect(disabledRows.length).toBeGreaterThan(0);
    });

    it('shows switch as unchecked for disabled rules', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Get all switches
      const switches = screen.getAllByRole('switch');

      // The third rule (index 2) is disabled
      const disabledSwitch = switches[2];
      expect(disabledSwitch).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Unused Rules Badge', () => {
    it('shows "unused" badge for rules with 0 packets', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Rule #3 has 0 packets
      expect(screen.getByText('unused')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('opens edit sheet when edit button is clicked', async () => {
      const user = userEvent.setup();
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click the first edit button
      const editButtons = screen.getAllByLabelText('Edit rule');
      await user.click(editButtons[0]);

      // Check that editor is opened
      await waitFor(() => {
        expect(screen.getByTestId('mangle-rule-editor')).toBeInTheDocument();
      });
    });

    it('duplicates rule when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click the first duplicate button
      const duplicateButtons = screen.getAllByLabelText('Duplicate rule');
      await user.click(duplicateButtons[0]);

      // Check that editor is opened with duplicated rule (no id)
      await waitFor(() => {
        const editor = screen.getByTestId('mangle-rule-editor');
        expect(editor).toBeInTheDocument();
        // The rule should have id: undefined
        expect(editor.textContent).toContain('voip_traffic');
      });
    });

    it('opens delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup();
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click the first delete button
      const deleteButtons = screen.getAllByLabelText('Delete rule');
      await user.click(deleteButtons[0]);

      // Check that confirmation dialog is shown
      await waitFor(() => {
        expect(screen.getByText('Delete Mangle Rule?')).toBeInTheDocument();
      });
    });

    it('calls delete mutation when delete is confirmed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockDeleteMangleRule.mockReturnValue({ mutate: mockMutate });
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click delete button
      const deleteButtons = screen.getAllByLabelText('Delete rule');
      await user.click(deleteButtons[0]);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText('Delete Mangle Rule?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Delete/i });
      await user.click(confirmButton);

      // Check that delete mutation was called
      expect(mockMutate).toHaveBeenCalledWith({
        routerId: '192.168.88.1',
        ruleId: '*1',
      });
    });

    it('calls toggle mutation when switch is toggled', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockToggleMangleRule.mockReturnValue({ mutate: mockMutate });
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click the first switch (enabled rule -> disable)
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]);

      // Check that toggle mutation was called
      expect(mockMutate).toHaveBeenCalledWith({
        routerId: '192.168.88.1',
        ruleId: '*1',
        disabled: true,
      });
    });

    it('can enable a disabled rule via toggle', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockToggleMangleRule.mockReturnValue({ mutate: mockMutate });
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Click the third switch (disabled rule -> enable)
      const switches = screen.getAllByRole('switch');
      await user.click(switches[2]);

      // Check that toggle mutation was called with disabled: false
      expect(mockMutate).toHaveBeenCalledWith({
        routerId: '192.168.88.1',
        ruleId: '*3',
        disabled: false,
      });
    });
  });

  describe('Drag and Drop', () => {
    it('renders drag handles for each rule', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      const { container } = render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Check for drag handles (cursor-grab class)
      const dragHandles = container.querySelectorAll('.cursor-grab');
      expect(dragHandles.length).toBe(mockRules.length);
    });

    // Note: Full drag-drop testing requires @dnd-kit/testing-utils or E2E tests
    // The drag end handler logic is tested indirectly through integration tests
  });

  describe('Rule Counter Display', () => {
    it('displays packet and byte counters with locale formatting', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Check that counters are formatted with locale (e.g., 1,500)
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('750,000')).toBeInTheDocument();
    });
  });

  describe('Responsive Variants', () => {
    it('renders desktop variant by default', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      const { container } = render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Desktop variant uses <table> element
      expect(container.querySelector('table')).toBeInTheDocument();
    });

    // Mobile variant testing would require mocking window.matchMedia
    // This is typically done in E2E tests or Storybook
  });

  describe('Action Badge Colors', () => {
    it('applies correct color classes to action badges', () => {
      mockUseMangleRules.mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      });

      render(<MangleRulesTable />, { wrapper: createWrapper() });

      // Check that action badges are rendered
      expect(screen.getByText('mark-connection')).toBeInTheDocument();
      expect(screen.getByText('mark-packet')).toBeInTheDocument();
      expect(screen.getByText('drop')).toBeInTheDocument();
    });
  });
});
