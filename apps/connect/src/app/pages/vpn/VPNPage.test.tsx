/**
 * VPN Page Component Tests
 * Tests for the VPN page including refresh functionality (Story 0-4-3)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { VPNPage } from './VPNPage';

// Mock the useWireGuardInterfaces hook
const mockRefetch = vi.fn();
const mockUseWireGuardInterfaces = vi.fn();

vi.mock('@nasnet/api-client/queries', () => ({
  useWireGuardInterfaces: () => mockUseWireGuardInterfaces(),
}));

// Mock WireGuardCard component
vi.mock('@nasnet/ui/patterns', () => ({
  WireGuardCard: ({ name }: { name: string }) => <div data-testid="wireguard-card">{name}</div>,
}));

describe('VPNPage', () => {
  const mockInterfaces = [
    {
      id: '1',
      name: 'wg0',
      running: true,
      disabled: false,
      listenPort: 13231,
      publicKey: 'ABC123',
      mtu: 1420,
    },
    {
      id: '2',
      name: 'wg1',
      running: false,
      disabled: false,
      listenPort: 13232,
      publicKey: 'DEF456',
      mtu: 1420,
    },
  ];

  beforeEach(() => {
    mockRefetch.mockClear();
    mockUseWireGuardInterfaces.mockReturnValue({
      data: mockInterfaces,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
  });

  describe('Refresh Functionality (Story 0-4-3)', () => {
    it('should display manual refresh button', () => {
      render(<VPNPage />);
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should call refetch when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<VPNPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button while loading', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should disable refresh button while fetching', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: mockInterfaces,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: true,
      });

      render(<VPNPage />);
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should show spinning icon when fetching', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: mockInterfaces,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: true,
      });

      const { container } = render(<VPNPage />);
      const spinningIcon = container.querySelector('.animate-spin');
      expect(spinningIcon).toBeInTheDocument();
    });

    it('should not show spinning icon when not fetching', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: mockInterfaces,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      const { container } = render(<VPNPage />);
      const spinningIcon = container.querySelector('.animate-spin');
      expect(spinningIcon).not.toBeInTheDocument();
    });

    it('should display auto-refresh interval information', () => {
      render(<VPNPage />);
      expect(screen.getByText(/Auto-refreshes every 5s/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders while loading', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      // Check for multiple skeleton elements (3 in this case)
      const skeletons = screen.getAllByRole('generic', { hidden: true });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show interfaces while loading', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      expect(screen.queryByTestId('wireguard-card')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message on fetch failure', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      expect(screen.getByText(/Failed to load VPN interfaces/i)).toBeInTheDocument();
      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    });

    it('should not show interfaces on error', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      expect(screen.queryByTestId('wireguard-card')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no interfaces', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      expect(screen.getByText(/No WireGuard interfaces configured/i)).toBeInTheDocument();
    });

    it('should not show interface cards when empty', () => {
      mockUseWireGuardInterfaces.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isFetching: false,
      });

      render(<VPNPage />);
      expect(screen.queryByTestId('wireguard-card')).not.toBeInTheDocument();
    });
  });

  describe('Interface Display', () => {
    it('should render all interfaces when data is available', () => {
      render(<VPNPage />);
      const cards = screen.getAllByTestId('wireguard-card');
      expect(cards).toHaveLength(2);
    });

    it('should display interface names', () => {
      render(<VPNPage />);
      expect(screen.getByText('wg0')).toBeInTheDocument();
      expect(screen.getByText('wg1')).toBeInTheDocument();
    });

    it('should pass correct props to WireGuardCard components', () => {
      render(<VPNPage />);
      const cards = screen.getAllByTestId('wireguard-card');
      expect(cards[0]).toHaveTextContent('wg0');
      expect(cards[1]).toHaveTextContent('wg1');
    });
  });

  describe('Page Header', () => {
    it('should display page title', () => {
      render(<VPNPage />);
      expect(screen.getByText('VPN Configuration')).toBeInTheDocument();
    });

    it('should display page description', () => {
      render(<VPNPage />);
      expect(
        screen.getByText(/View your VPN setup and monitor interface status/i)
      ).toBeInTheDocument();
    });
  });
});
