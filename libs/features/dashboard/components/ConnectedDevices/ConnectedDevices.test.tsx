/**
 * ConnectedDevices Component Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Tests all UI states:
 * - Loading (skeleton placeholders)
 * - Error (alert with retry)
 * - Empty (empty state)
 * - DHCP disabled (warning)
 * - Stale data (indicator)
 * - Success (device list)
 * - Privacy mode (hostname masking)
 * - Refresh functionality
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConnectedDevices } from './ConnectedDevices';
import * as connectedDevicesHook from '../../hooks/useConnectedDevices';
import * as uiStore from '@nasnet/state/stores';

import { DeviceType } from '@nasnet/core/types';
import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

// Mock dependencies
vi.mock('../../hooks/useConnectedDevices');
vi.mock('@nasnet/state/stores');

// Mock DeviceListItem to simplify tests
vi.mock('@nasnet/ui/patterns', async () => {
  const actual = await vi.importActual('@nasnet/ui/patterns');
  return {
    ...actual,
    DeviceListItem: ({ device }: { device: ConnectedDeviceEnriched }) => (
      <div data-testid={`device-${device.id}`}>{device.hostname}</div>
    ),
  };
});

// Create React Query wrapper
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

// Mock device factory
const createMockDevice = (
  overrides?: Partial<ConnectedDeviceEnriched>
): ConnectedDeviceEnriched => ({
  id: '1',
  ipAddress: '192.168.88.105',
  macAddress: 'A4:83:E7:12:34:56',
  hostname: 'Johns-iPhone',
  status: 'bound',
  statusLabel: 'Connected',
  expiration: 'in 23h',
  isStatic: false,
  vendor: 'Apple, Inc.',
  deviceType: DeviceType.SMARTPHONE,
  isNew: false,
  connectionDuration: '2h 15m',
  firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
  _lease: {
    id: '1',
    address: '192.168.88.105',
    macAddress: 'A4:83:E7:12:34:56',
    hostname: 'Johns-iPhone',
    status: 'bound',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  ...overrides,
});

// Generate N devices
const generateDevices = (count: number): ConnectedDeviceEnriched[] =>
  Array.from({ length: count }, (_, i) =>
    createMockDevice({
      id: `device-${i}`,
      hostname: `Device-${i}`,
      ipAddress: `192.168.88.${100 + i}`,
      macAddress: `A4:83:E7:12:34:${i.toString(16).padStart(2, '0').toUpperCase()}`,
    })
  );

describe('ConnectedDevices', () => {
  const mockToggleHideHostnames = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default UI store mock
    vi.mocked(uiStore.useUIStore).mockImplementation((selector: any) => {
      const state = {
        hideHostnames: false,
        toggleHideHostnames: mockToggleHideHostnames,
      };
      return selector ? selector(state) : state;
    });
  });

  describe('Loading State', () => {
    it('should render skeleton placeholders while loading', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: true,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // Should show multiple skeleton rows
      const skeletons = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('h-10 w-10')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show 5 skeleton items', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: true,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const skeletonRows = container.querySelectorAll('.space-y-3 > div');
      expect(skeletonRows.length).toBe(5);
    });
  });

  describe('Error State', () => {
    it('should render error alert with message', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: new Error('Connection timeout'),
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Failed to load connected devices')).toBeInTheDocument();
      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });

    it('should render error with destructive variant', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: new Error('Network error'),
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('DHCP Disabled State', () => {
    it('should show warning when DHCP is disabled', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: false,
        isEmpty: true,
        lastUpdated: null,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('DHCP server is disabled')).toBeInTheDocument();
      expect(
        screen.getByText('Enable DHCP server to see connected devices.')
      ).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no devices', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: true,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No devices connected')).toBeInTheDocument();
      expect(
        screen.getByText('Devices will appear here when they connect to your network')
      ).toBeInTheDocument();
    });

    it('should render empty state with Laptop icon', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: true,
        lastUpdated: new Date(),
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Success State - Device List', () => {
    it('should render device list with correct count', () => {
      const devices = generateDevices(8);
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices,
        totalCount: 8,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('8 devices online')).toBeInTheDocument();
      expect(screen.getByText('Connected Devices')).toBeInTheDocument();
    });

    it('should render all devices', () => {
      const devices = generateDevices(5);
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices,
        totalCount: 5,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      devices.forEach((device) => {
        expect(screen.getByTestId(`device-${device.id}`)).toBeInTheDocument();
      });
    });

    it('should use singular "device" for count of 1', () => {
      const devices = generateDevices(1);
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices,
        totalCount: 1,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('1 device online')).toBeInTheDocument();
    });
  });

  describe('Privacy Mode', () => {
    it('should show "Privacy Mode" badge when hideHostnames is true', () => {
      vi.mocked(uiStore.useUIStore).mockImplementation((selector: any) => {
        const state = {
          hideHostnames: true,
          toggleHideHostnames: mockToggleHideHostnames,
        };
        return selector ? selector(state) : state;
      });

      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Privacy Mode')).toBeInTheDocument();
    });

    it('should toggle privacy mode when menu item is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Click privacy toggle
      const privacyToggle = screen.getByRole('menuitem', { name: /hide hostnames/i });
      await user.click(privacyToggle);

      expect(mockToggleHideHostnames).toHaveBeenCalled();
    });

    it('should show "Show Hostnames" when privacy mode is active', async () => {
      const user = userEvent.setup();
      vi.mocked(uiStore.useUIStore).mockImplementation((selector: any) => {
        const state = {
          hideHostnames: true,
          toggleHideHostnames: mockToggleHideHostnames,
        };
        return selector ? selector(state) : state;
      });

      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /show hostnames/i })).toBeInTheDocument();
    });
  });

  describe('Stale Data Indicator', () => {
    it('should show stale indicator when data is >2 minutes old', () => {
      const staleDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: staleDate,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // StaleIndicator should be rendered
      const staleText = screen.getByText(/minutes ago/i);
      expect(staleText).toBeInTheDocument();
    });

    it('should not show stale indicator when data is fresh', () => {
      const freshDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: freshDate,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText(/minutes ago/i)).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button in dropdown menu', async () => {
      const user = userEvent.setup();
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should show loading state when refreshing', async () => {
      const user = userEvent.setup();
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      const refreshButton = screen.getByRole('menuitem', { name: /refresh/i });
      await user.click(refreshButton);

      // Refresh icon should have spin animation
      const refreshIcon = within(refreshButton).getByRole('img', { hidden: true });
      expect(refreshIcon).toHaveClass('animate-spin');
    });
  });

  describe('Sort Functionality', () => {
    it('should pass sortBy prop to hook', () => {
      const hookSpy = vi.mocked(connectedDevicesHook.useConnectedDevices);
      hookSpy.mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" sortBy="hostname" />, {
        wrapper: createWrapper(),
      });

      expect(hookSpy).toHaveBeenCalledWith('192.168.88.1', { sortBy: 'hostname' });
    });

    it('should default to "recent" sort', () => {
      const hookSpy = vi.mocked(connectedDevicesHook.useConnectedDevices);
      hookSpy.mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(hookSpy).toHaveBeenCalledWith('192.168.88.1', { sortBy: 'recent' });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic card structure', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const card = container.querySelector('[role="region"]');
      expect(card).toBeInTheDocument();
    });

    it('should have accessible menu button with sr-only label', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should have keyboard navigable dropdown menu', async () => {
      const user = userEvent.setup();
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // Tab to menu button
      await user.tab();
      await user.tab();
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveFocus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null lastUpdated gracefully', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // Should not crash
      expect(screen.getByText('Connected Devices')).toBeInTheDocument();
    });

    it('should handle large device counts', () => {
      const devices = generateDevices(100);
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices,
        totalCount: 100,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('100 devices online')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { container } = render(
        <ConnectedDevices routerIp="192.168.88.1" className="custom-class" />,
        { wrapper: createWrapper() }
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});
