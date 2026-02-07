/**
 * DHCP Server List Page Tests
 * Integration tests for list page with mobile/desktop views
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import type { DHCPServer } from '@nasnet/core/types';

// Mock data
const mockServers: DHCPServer[] = [
  {
    id: 'server-1',
    name: 'dhcp-lan',
    interface: 'ether1',
    addressPool: 'pool-lan',
    gateway: '192.168.1.1',
    dnsServers: ['8.8.8.8', '8.8.4.4'],
    leaseTime: '1d',
    activeLeases: 15,
    disabled: false,
  },
  {
    id: 'server-2',
    name: 'dhcp-guest',
    interface: 'ether2',
    addressPool: 'pool-guest',
    gateway: '192.168.10.1',
    dnsServers: ['1.1.1.1'],
    leaseTime: '12h',
    activeLeases: 3,
    disabled: true,
  },
];

// Mock dependencies
vi.mock('@nasnet/core/utils', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn((selector) => {
    const state = { currentRouterIp: '192.168.1.1' };
    return selector(state);
  }),
}));

vi.mock('@nasnet/api-client/queries', () => ({
  useDHCPServers: vi.fn(() => ({
    data: mockServers,
    isLoading: false,
  })),
  useEnableDHCPServer: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
  useDisableDHCPServer: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
  useDeleteDHCPServer: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
}));

// Import after mocks
import { DHCPServerList } from './dhcp-server-list';
import { usePlatform } from '@nasnet/core/utils';
import { useDHCPServers } from '@nasnet/api-client/queries';

// Test wrapper
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/network/dhcp',
    component: DHCPServerList,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/network/dhcp'] }),
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe('DHCPServerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('desktop view', () => {
    beforeEach(() => {
      vi.mocked(usePlatform).mockReturnValue('desktop');
    });

    it('should render page title and description', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      expect(screen.getByText('DHCP Servers')).toBeInTheDocument();
      expect(
        screen.getByText('Manage DHCP servers for automatic IP address assignment.')
      ).toBeInTheDocument();
    });

    it('should render create button', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      const createButton = screen.getByRole('button', { name: /create dhcp server/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should render all servers in DataTable', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('dhcp-lan')).toBeInTheDocument();
        expect(screen.getByText('dhcp-guest')).toBeInTheDocument();
      });
    });

    it('should display server details in table', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        // Check for server 1 details
        expect(screen.getByText('ether1')).toBeInTheDocument();
        expect(screen.getByText('pool-lan')).toBeInTheDocument();
        expect(screen.getByText(/192\.168\.1\.1/)).toBeInTheDocument();

        // Check for server 2 details
        expect(screen.getByText('ether2')).toBeInTheDocument();
        expect(screen.getByText('pool-guest')).toBeInTheDocument();
      });
    });

    it('should display active lease counts', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should render action dropdown for each server', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const dropdownButtons = screen.getAllByRole('button', { name: /open menu/i });
        expect(dropdownButtons).toHaveLength(2);
      });
    });

    it('should open action dropdown and show options', async () => {
      const user = userEvent.setup();
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('dhcp-lan')).toBeInTheDocument();
      });

      const dropdownButtons = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(dropdownButtons[0]);

      // Check dropdown menu items
      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Disable')).toBeInTheDocument(); // Server 1 is enabled
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show Enable option for disabled server', async () => {
      const user = userEvent.setup();
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('dhcp-guest')).toBeInTheDocument();
      });

      const dropdownButtons = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(dropdownButtons[1]);

      // Server 2 is disabled, so should show Enable option
      expect(screen.getByText('Enable')).toBeInTheDocument();
    });
  });

  describe('mobile view', () => {
    beforeEach(() => {
      vi.mocked(usePlatform).mockReturnValue('mobile');
    });

    it('should render servers as cards on mobile', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        // Check that DHCPServerCard components are rendered
        expect(screen.getByText('dhcp-lan')).toBeInTheDocument();
        expect(screen.getByText('dhcp-guest')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      vi.mocked(useDHCPServers).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);
    });

    it('should render empty state when no servers exist', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No DHCP servers configured')).toBeInTheDocument();
        expect(
          screen.getByText(/create your first dhcp server/i)
        ).toBeInTheDocument();
      });
    });

    it('should render create button in empty state', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const createButtons = screen.getAllByRole('button', { name: /create dhcp server/i });
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      vi.mocked(useDHCPServers).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);
    });

    it('should render loading indicator', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      expect(screen.getByText('Loading DHCP servers...')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      vi.mocked(usePlatform).mockReturnValue('desktop');
    });

    it('should render search input in DataTable', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search dhcp servers/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should filter servers by name when searching', async () => {
      const user = userEvent.setup();
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('dhcp-lan')).toBeInTheDocument();
        expect(screen.getByText('dhcp-guest')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search dhcp servers/i);
      await user.type(searchInput, 'guest');

      // After filtering, only dhcp-guest should be visible
      await waitFor(() => {
        expect(screen.queryByText('dhcp-lan')).not.toBeInTheDocument();
        expect(screen.getByText('dhcp-guest')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for action buttons', async () => {
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const dropdownButtons = screen.getAllByRole('button', { name: /open menu/i });
        expect(dropdownButtons).toHaveLength(2);
      });
    });

    it('should have accessible table structure', async () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');
      render(<DHCPServerList />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        // Check for column headers
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Interface')).toBeInTheDocument();
        expect(screen.getByText('Pool')).toBeInTheDocument();
      });
    });
  });
});
