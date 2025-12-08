/**
 * FilterRulesTable Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterRulesTable } from './FilterRulesTable';
import * as queries from '@nasnet/api-client/queries';
import type { FirewallRule } from '@nasnet/core/types/router/firewall';

// Mock the API query hook
vi.mock('@nasnet/api-client/queries', () => ({
  useFilterRules: vi.fn(),
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
});
