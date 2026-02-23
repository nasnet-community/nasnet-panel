import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaseFilters } from './LeaseFilters';

// Mock Zustand store
vi.mock('@nasnet/state/stores', () => ({
  useDHCPUIStore: vi.fn(),
}));

import { useDHCPUIStore } from '@nasnet/state/stores';

describe('LeaseFilters', () => {
  const mockStore = {
    leaseStatusFilter: 'all' as const,
    setLeaseStatusFilter: vi.fn(),
    leaseServerFilter: 'all',
    setLeaseServerFilter: vi.fn(),
  };

  const servers = [
    { id: 'server-1', name: 'LAN DHCP' },
    { id: 'server-2', name: 'Guest DHCP' },
    { id: 'server-3', name: 'IoT DHCP' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useDHCPUIStore as any).mockReturnValue(mockStore);
  });

  describe('Rendering', () => {
    it('should render status filter dropdown', () => {
      render(<LeaseFilters servers={servers} />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should render server filter dropdown', () => {
      render(<LeaseFilters servers={servers} />);

      expect(screen.getByText('Server')).toBeInTheDocument();
    });

    it('should not render server filter when no servers provided', () => {
      render(<LeaseFilters servers={[]} />);

      expect(screen.queryByText('Server')).not.toBeInTheDocument();
    });
  });

  describe('Status filter', () => {
    it('should display current status filter', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStore,
        leaseStatusFilter: 'bound',
      });

      render(<LeaseFilters servers={servers} />);

      expect(screen.getByText('Bound')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const statusButton = screen.getByText('Status').closest('button');
      await user.click(statusButton!);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should show all status options', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const statusButton = screen.getByText('Status').closest('button');
      await user.click(statusButton!);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Bound')).toBeInTheDocument();
        expect(screen.getByText('Waiting')).toBeInTheDocument();
        expect(screen.getByText('Static')).toBeInTheDocument();
      });
    });

    it('should call setLeaseStatusFilter when option is selected', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const statusButton = screen.getByText('Status').closest('button');
      await user.click(statusButton!);

      const boundOption = await screen.findByText('Bound');
      await user.click(boundOption);

      expect(mockStore.setLeaseStatusFilter).toHaveBeenCalledWith('bound');
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const statusButton = screen.getByText('Status').closest('button');
      await user.click(statusButton!);

      const boundOption = await screen.findByText('Bound');
      await user.click(boundOption);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Server filter', () => {
    it('should display current server filter', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStore,
        leaseServerFilter: 'server-1',
      });

      render(<LeaseFilters servers={servers} />);

      expect(screen.getByText('LAN DHCP')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const serverButton = screen.getByText('Server').closest('button');
      await user.click(serverButton!);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should show all server options including "All"', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const serverButton = screen.getByText('Server').closest('button');
      await user.click(serverButton!);

      await waitFor(() => {
        expect(screen.getByText('All Servers')).toBeInTheDocument();
        expect(screen.getByText('LAN DHCP')).toBeInTheDocument();
        expect(screen.getByText('Guest DHCP')).toBeInTheDocument();
        expect(screen.getByText('IoT DHCP')).toBeInTheDocument();
      });
    });

    it('should call setLeaseServerFilter when option is selected', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const serverButton = screen.getByText('Server').closest('button');
      await user.click(serverButton!);

      const lanOption = await screen.findByText('LAN DHCP');
      await user.click(lanOption);

      expect(mockStore.setLeaseServerFilter).toHaveBeenCalledWith('server-1');
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const serverButton = screen.getByText('Server').closest('button');
      await user.click(serverButton!);

      const lanOption = await screen.findByText('LAN DHCP');
      await user.click(lanOption);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter badges', () => {
    it('should show badge when status filter is active', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStore,
        leaseStatusFilter: 'bound',
      });

      render(<LeaseFilters servers={servers} />);

      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('span')).toHaveClass('badge-primary');
    });

    it('should show badge when server filter is active', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStore,
        leaseServerFilter: 'LAN DHCP',
      });

      render(<LeaseFilters servers={servers} />);

      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
    });

    it('should show count of active filters', () => {
      (useDHCPUIStore as any).mockReturnValue({
        ...mockStore,
        leaseStatusFilter: 'bound',
        leaseServerFilter: 'LAN DHCP',
      });

      render(<LeaseFilters servers={servers} />);

      const badges = screen.getAllByText('1');
      expect(badges).toHaveLength(2); // One for status, one for server
    });

    it('should not show badge when filter is "all"', () => {
      render(<LeaseFilters servers={servers} />);

      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for dropdowns', () => {
      render(<LeaseFilters servers={servers} />);

      expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by server')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LeaseFilters servers={servers} />);

      const statusButton = screen.getByText('Status').closest('button');
      statusButton!.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockStore.setLeaseStatusFilter).toHaveBeenCalled();
    });
  });
});
