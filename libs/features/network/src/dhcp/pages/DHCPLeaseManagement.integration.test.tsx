import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DHCPLeaseManagementPage } from './DHCPLeaseManagementPage';
import { mockLeases } from '../__mocks__/lease-data';

// Mock all dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useDHCPLeases: vi.fn(),
  useMakeLeaseStatic: vi.fn(),
  useDeleteLease: vi.fn(),
  useDHCPServers: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useDHCPUIStore: vi.fn(),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  useToast: vi.fn(),
}));

vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

import {
  useDHCPLeases,
  useMakeLeaseStatic,
  useDeleteLease,
  useDHCPServers,
} from '@nasnet/api-client/queries';
import { useDHCPUIStore } from '@nasnet/state/stores';
import { useToast } from '@nasnet/ui/primitives';
import { usePlatform } from '@nasnet/ui/layouts';

describe('DHCP Lease Management Integration', () => {
  const mockToast = vi.fn();
  const mockMakeStatic = vi.fn();
  const mockDeleteLease = vi.fn();
  const mockSetLeaseSearch = vi.fn();
  const mockSetLeaseStatusFilter = vi.fn();
  const mockSetLeaseServerFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as any).mockReturnValue({ toast: mockToast });
    (usePlatform as any).mockReturnValue('desktop');
    (useMakeLeaseStatic as any).mockReturnValue({ mutate: mockMakeStatic, isLoading: false });
    (useDeleteLease as any).mockReturnValue({ mutate: mockDeleteLease, isLoading: false });
    (useDHCPLeases as any).mockReturnValue({
      data: mockLeases,
      isLoading: false,
      isError: false,
      error: null,
    });
    (useDHCPServers as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    (useDHCPUIStore as any).mockReturnValue({
      leaseSearch: '',
      setLeaseSearch: mockSetLeaseSearch,
      leaseStatusFilter: 'all',
      setLeaseStatusFilter: mockSetLeaseStatusFilter,
      leaseServerFilter: 'all',
      setLeaseServerFilter: mockSetLeaseServerFilter,
      selectedLeases: [],
      toggleLeaseSelection: vi.fn(),
      clearLeaseSelection: vi.fn(),
      selectAllLeases: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete user flow: search → filter → select → bulk action', () => {
    it('should complete full workflow successfully', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      });

      // Step 1: Search for specific IP
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, '192.168.1');

      expect(mockSetLeaseSearch).toHaveBeenCalledWith('192.168.1');

      // Step 2: Apply status filter
      const statusFilter = screen.getByText('Status').closest('button');
      await user.click(statusFilter!);

      const boundOption = await screen.findByText('Bound');
      await user.click(boundOption);

      expect(mockSetLeaseStatusFilter).toHaveBeenCalledWith('bound');

      // Step 3: Select leases
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first lease
      await user.click(checkboxes[2]); // Select second lease

      // Step 4: Perform bulk action (Make All Static)
      const bulkActionButton = screen.getByText('Make All Static');
      await user.click(bulkActionButton);

      const confirmButton = await screen.findByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockMakeStatic).toHaveBeenCalled();
      });
    });

    it('should handle search with no results', async () => {
      const user = userEvent.setup();
      (useDHCPUIStore as any).mockReturnValue({
        leaseSearch: '10.0.0.1',
        setLeaseSearch: mockSetLeaseSearch,
        leaseStatusFilter: 'all',
        setLeaseStatusFilter: mockSetLeaseStatusFilter,
        leaseServerFilter: 'all',
        setLeaseServerFilter: mockSetLeaseServerFilter,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        expect(screen.getByText(/no leases found/i)).toBeInTheDocument();
      });
    });

    it('should combine multiple filters correctly', async () => {
      const user = userEvent.setup();
      (useDHCPUIStore as any).mockReturnValue({
        leaseSearch: '192.168.1',
        setLeaseSearch: mockSetLeaseSearch,
        leaseStatusFilter: 'bound',
        setLeaseStatusFilter: mockSetLeaseStatusFilter,
        leaseServerFilter: 'LAN DHCP',
        setLeaseServerFilter: mockSetLeaseServerFilter,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        const displayedLeases = screen.getAllByRole('row').slice(1); // Exclude header
        expect(displayedLeases.length).toBeGreaterThan(0);

        // All displayed leases should match filters
        displayedLeases.forEach((row) => {
          expect(row).toHaveTextContent(/192\.168\.1/);
          expect(row).toHaveTextContent('bound');
          expect(row).toHaveTextContent('LAN DHCP');
        });
      });
    });
  });

  describe('CSV export with active filters', () => {
    it('should export filtered leases to CSV', async () => {
      const user = userEvent.setup();
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockClick = vi.fn();

      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any);

      (useDHCPUIStore as any).mockReturnValue({
        leaseSearch: '192.168.1',
        setLeaseSearch: mockSetLeaseSearch,
        leaseStatusFilter: 'bound',
        setLeaseStatusFilter: mockSetLeaseStatusFilter,
        leaseServerFilter: 'all',
        setLeaseServerFilter: mockSetLeaseServerFilter,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const exportButton = screen.getByText(/export/i);
      await user.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should include all leases when no filters applied', async () => {
      const user = userEvent.setup();
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockClick = vi.fn();

      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as any);

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const exportButton = screen.getByText(/export/i);
      await user.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Error handling and retry', () => {
    it('should display error message when API call fails', async () => {
      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const mockRefetch = vi.fn();

      (useDHCPLeases as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: mockRefetch,
      });

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      const retryButton = await screen.findByText(/retry/i);
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle partial bulk operation failures', async () => {
      const user = userEvent.setup();

      mockMakeStatic
        .mockResolvedValueOnce({ data: { makeStatic: true } })
        .mockRejectedValueOnce(new Error('Failed'));

      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Select two leases
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Trigger bulk action
      const bulkActionButton = screen.getByText('Make All Static');
      await user.click(bulkActionButton);

      const confirmButton = await screen.findByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Partial Success',
            variant: 'warning',
          })
        );
      });
    });
  });

  describe('Real-time updates (polling simulation)', () => {
    it('should update lease list when new data arrives', async () => {
      const { rerender } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      });

      // Simulate new data from polling
      const newLeases = [
        ...mockLeases,
        {
          id: 'new-lease',
          address: '192.168.1.200',
          macAddress: '00:AA:BB:CC:DD:EE',
          server: 'LAN DHCP',
          status: 'bound' as const,
          hostname: 'new-device',
          expiresAfter: '1h',
          lastSeen: new Date().toISOString(),
          dynamic: true,
        },
      ];

      (useDHCPLeases as any).mockReturnValue({
        data: newLeases,
        isLoading: false,
        isError: false,
        error: null,
      });

      rerender(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        expect(screen.getByText('192.168.1.200')).toBeInTheDocument();
        expect(screen.getByText('new-device')).toBeInTheDocument();
      });
    });

    it('should show "New" badge for newly detected leases', async () => {
      const { rerender } = render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Initial render with original leases
      await waitFor(() => {
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      });

      // Add a new lease
      const newLeases = [
        ...mockLeases,
        {
          id: 'new-lease',
          address: '192.168.1.200',
          macAddress: '00:AA:BB:CC:DD:EE',
          server: 'LAN DHCP',
          status: 'bound' as const,
          hostname: 'new-device',
          expiresAfter: '1h',
          lastSeen: new Date().toISOString(),
          dynamic: true,
        },
      ];

      (useDHCPLeases as any).mockReturnValue({
        data: newLeases,
        isLoading: false,
        isError: false,
        error: null,
      });

      rerender(<DHCPLeaseManagementPage routerId="test-router-1" />);

      await waitFor(() => {
        const newBadges = screen.getAllByText('New');
        expect(newBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Selection persistence', () => {
    it('should maintain selection when filters change', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Select a lease
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      expect(checkboxes[1]).toBeChecked();

      // Change filter
      const statusFilter = screen.getByText('Status').closest('button');
      await user.click(statusFilter!);

      const boundOption = await screen.findByText('Bound');
      await user.click(boundOption);

      // Selection should persist if lease is still visible
      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const firstLeaseCheckbox = updatedCheckboxes.find((cb) =>
          cb.getAttribute('aria-label')?.includes('lease-1')
        );
        if (firstLeaseCheckbox) {
          expect(firstLeaseCheckbox).toBeChecked();
        }
      });
    });

    it('should clear selection when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<DHCPLeaseManagementPage routerId="test-router-1" />);

      // Select multiple leases
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Clear selection
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        updatedCheckboxes.slice(1).forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  });
});
