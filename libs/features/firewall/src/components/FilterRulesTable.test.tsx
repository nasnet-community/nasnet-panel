/**
 * FilterRulesTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterRulesTable } from './FilterRulesTable';
import * as queries from '@nasnet/api-client/queries';
import * as routerModule from '@tanstack/react-router';
import type { FirewallRule } from '@nasnet/core/types/router/firewall';

// Mock the API query hook
vi.mock('@nasnet/api-client/queries', () => ({
  useFilterRules: vi.fn(),
  useDeleteFilterRule: vi.fn(),
  useToggleFilterRule: vi.fn(),
  useMoveFilterRule: vi.fn(),
  useCreateFilterRule: vi.fn(),
  useUpdateFilterRule: vi.fn(),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useSearch: vi.fn(),
}));

// Mock media query hook
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false), // Default to desktop
  };
});

// Mock connection store
vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn(() => '192.168.1.1'),
}));

// Mock firewall hooks
vi.mock('@nasnet/features/firewall', () => ({
  useCounterSettingsStore: vi.fn(() => ({
    pollingInterval: false,
    showRelativeBar: false,
    showRate: false,
  })),
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

describe('FilterRulesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(routerModule, 'useSearch').mockReturnValue({});
  });

  it('renders loading state', () => {
    vi.mocked(queries.useFilterRules).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<FilterRulesTable />, { wrapper: createWrapper() });

    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(queries.useFilterRules).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    render(<FilterRulesTable />, { wrapper: createWrapper() });

    expect(screen.getByText(/Error loading firewall rules/)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    vi.mocked(queries.useFilterRules).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<FilterRulesTable />, { wrapper: createWrapper() });

    expect(screen.getByText('No firewall filter rules found')).toBeInTheDocument();
  });

  it('renders firewall rules table', () => {
    const mockRules: FirewallRule[] = [
      {
        id: '1',
        chain: 'input',
        action: 'accept',
        protocol: 'tcp',
        srcAddress: '192.168.1.0/24',
        dstAddress: undefined,
        srcPort: undefined,
        dstPort: '22',
        inInterface: undefined,
        outInterface: undefined,
        disabled: false,
        order: 0,
        comment: 'Allow SSH',
      },
      {
        id: '2',
        chain: 'forward',
        action: 'drop',
        protocol: 'udp',
        srcAddress: undefined,
        dstAddress: undefined,
        srcPort: undefined,
        dstPort: undefined,
        inInterface: undefined,
        outInterface: undefined,
        disabled: true,
        order: 1,
        comment: 'Block all UDP',
      },
    ];

    vi.mocked(queries.useFilterRules).mockReturnValue({
      data: mockRules,
      isLoading: false,
      error: null,
    } as any);

    render(<FilterRulesTable />, { wrapper: createWrapper() });

    // Check table headers
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText(/Chain/)).toBeInTheDocument();
    expect(screen.getByText(/Action/)).toBeInTheDocument();

    // Check rule data
    expect(screen.getByText('input')).toBeInTheDocument();
    expect(screen.getByText('accept')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
    expect(screen.getByText('Allow SSH')).toBeInTheDocument();

    // Check second rule
    expect(screen.getByText('forward')).toBeInTheDocument();
    expect(screen.getByText('drop')).toBeInTheDocument();
    expect(screen.getByText('Block all UDP')).toBeInTheDocument();
  });

  it('shows disabled rules with visual distinction', () => {
    const mockRules: FirewallRule[] = [
      {
        id: '1',
        chain: 'input',
        action: 'drop',
        protocol: undefined,
        srcAddress: undefined,
        dstAddress: undefined,
        srcPort: undefined,
        dstPort: undefined,
        inInterface: undefined,
        outInterface: undefined,
        disabled: true,
        order: 0,
        comment: 'Disabled rule',
      },
    ];

    vi.mocked(queries.useFilterRules).mockReturnValue({
      data: mockRules,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<FilterRulesTable />, { wrapper: createWrapper() });

    // Check that disabled row has opacity-50 class
    const disabledRow = container.querySelector('.opacity-50');
    expect(disabledRow).toBeInTheDocument();
  });

  describe('Rule Highlighting', () => {
    const mockRules: FirewallRule[] = [
      {
        id: '*1',
        chain: 'input',
        action: 'drop',
        protocol: 'tcp',
        srcAddress: undefined,
        dstAddress: undefined,
        srcPort: undefined,
        dstPort: '22',
        inInterface: undefined,
        outInterface: undefined,
        disabled: false,
        order: 0,
        comment: 'SSH Block',
        log: true,
        logPrefix: 'SSH-DROP',
      },
      {
        id: '*2',
        chain: 'forward',
        action: 'accept',
        protocol: 'tcp',
        srcAddress: undefined,
        dstAddress: undefined,
        srcPort: undefined,
        dstPort: '80,443',
        inInterface: undefined,
        outInterface: undefined,
        disabled: false,
        order: 1,
        comment: 'Web Traffic',
        log: true,
        logPrefix: 'WEB-ALLOW',
      },
    ];

    it('highlights rule when highlight param is in URL', () => {
      vi.spyOn(routerModule, 'useSearch').mockReturnValue({ highlight: '*1' });

      vi.mocked(queries.useFilterRules).mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FilterRulesTable />, { wrapper: createWrapper() });

      // Check that highlighted row has animate-highlight class
      const highlightedRow = container.querySelector('.animate-highlight');
      expect(highlightedRow).toBeInTheDocument();
    });

    it('does not highlight any rule when no highlight param in URL', () => {
      vi.spyOn(routerModule, 'useSearch').mockReturnValue({});

      vi.mocked(queries.useFilterRules).mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FilterRulesTable />, { wrapper: createWrapper() });

      // Check that no row has animate-highlight class
      const highlightedRow = container.querySelector('.animate-highlight');
      expect(highlightedRow).not.toBeInTheDocument();
    });

    it('applies bg-warning/20 class to highlighted rule', () => {
      vi.spyOn(routerModule, 'useSearch').mockReturnValue({ highlight: '*2' });

      vi.mocked(queries.useFilterRules).mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<FilterRulesTable />, { wrapper: createWrapper() });

      // Check that highlighted row has bg-warning class
      const highlightedRow = container.querySelector('.bg-warning\\/20');
      expect(highlightedRow).toBeInTheDocument();
    });

    it('scrollIntoView is called for highlighted rule', async () => {
      vi.spyOn(routerModule, 'useSearch').mockReturnValue({ highlight: '*1' });

      vi.mocked(queries.useFilterRules).mockReturnValue({
        data: mockRules,
        isLoading: false,
        error: null,
      } as any);

      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<FilterRulesTable />, { wrapper: createWrapper() });

      // Wait for the useEffect scroll to trigger (100ms timeout in component)
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      }, { timeout: 200 });
    });
  });
});
