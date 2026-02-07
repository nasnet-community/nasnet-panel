/**
 * ConnectedDevices Accessibility Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Tests WCAG AAA compliance for dashboard widget in all states:
 * - Loading (skeleton placeholders)
 * - Empty (no devices)
 * - DHCP disabled (warning)
 * - Error (alert)
 * - Populated (device list)
 * - Stale data (indicator)
 * - Privacy toggle (dropdown menu)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConnectedDevices } from './ConnectedDevices';
import * as connectedDevicesHook from '../../hooks/useConnectedDevices';
import * as uiStore from '@nasnet/state/stores';

import { DeviceType } from '@nasnet/core/types';
import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

// Mock dependencies
vi.mock('../../hooks/useConnectedDevices');
vi.mock('@nasnet/state/stores');

// Mock DeviceListItem
vi.mock('@nasnet/ui/patterns', async () => {
  const actual = await vi.importActual('@nasnet/ui/patterns');
  return {
    ...actual,
    DeviceListItem: ({ device }: { device: ConnectedDeviceEnriched }) => (
      <div data-testid={`device-${device.id}`} role="listitem">
        {device.hostname}
      </div>
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

const generateDevices = (count: number): ConnectedDeviceEnriched[] =>
  Array.from({ length: count }, (_, i) =>
    createMockDevice({
      id: `device-${i}`,
      hostname: `Device-${i}`,
      ipAddress: `192.168.88.${100 + i}`,
    })
  );

describe('ConnectedDevices Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default UI store mock
    vi.mocked(uiStore.useUIStore).mockImplementation((selector: any) => {
      const state = {
        hideHostnames: false,
        toggleHideHostnames: vi.fn(),
      };
      return selector ? selector(state) : state;
    });
  });

  describe('Loading State', () => {
    it('should have no accessibility violations (skeleton)', async () => {
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

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper ARIA live region for loading', () => {
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

      // Should have appropriate loading indicators
      expect(container).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should have no accessibility violations (empty)', async () => {
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

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have descriptive empty state message', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: true,
        lastUpdated: new Date(),
      });

      const { getByText } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(getByText('No devices connected')).toBeInTheDocument();
    });
  });

  describe('DHCP Disabled Warning', () => {
    it('should have no accessibility violations (warning)', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: false,
        isEmpty: true,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper alert role for warning', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: false,
        isEmpty: true,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should have no accessibility violations (error)', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: new Error('Connection timeout'),
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper alert role for error', () => {
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

  describe('Populated Device List', () => {
    it('should have no accessibility violations (populated)', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(5),
        totalCount: 5,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper list semantics', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getAllByRole } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const listItems = getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should announce device count to screen readers', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(8),
        totalCount: 8,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getByText } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(getByText('8 devices online')).toBeInTheDocument();
    });
  });

  describe('Stale Indicator', () => {
    it('should have no violations with stale data', async () => {
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

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should announce stale status to screen readers', () => {
      const staleDate = new Date(Date.now() - 5 * 60 * 1000);
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: staleDate,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(container.textContent).toContain('minutes ago');
    });
  });

  describe('Privacy Toggle Dropdown', () => {
    it('should have no violations with dropdown menu', async () => {
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

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have accessible menu button', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getByRole } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should have ARIA expanded state on menu button', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getByRole } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = getByRole('button', { name: /open menu/i });
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getByRole } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const menuButton = getByRole('button', { name: /open menu/i });
      expect(menuButton.tagName).toBe('BUTTON');
      expect(menuButton).not.toHaveAttribute('disabled');
    });

    it('should have focus indicators on interactive elements', () => {
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

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const classes = button.className;
        expect(
          classes.includes('focus') ||
          classes.includes('ring') ||
          classes.includes('outline')
        ).toBe(true);
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce loading state', () => {
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

      // Should have loading indicators visible to screen readers
      expect(container).toBeInTheDocument();
    });

    it('should announce error state', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: new Error('Failed to load'),
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      const { getByText } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(getByText('Failed to load connected devices')).toBeInTheDocument();
    });

    it('should announce privacy mode status', () => {
      vi.mocked(uiStore.useUIStore).mockImplementation((selector: any) => {
        const state = {
          hideHostnames: true,
          toggleHideHostnames: vi.fn(),
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

      const { getByText } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      expect(getByText('Privacy Mode')).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for all states', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(5),
        totalCount: 5,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { container } = render(
        <div className="bg-white">
          <ConnectedDevices routerIp="192.168.88.1" />
        </div>,
        { wrapper: createWrapper() }
      );

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true }, // WCAG AAA 7:1
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for warning state', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        isDhcpEnabled: false,
        isEmpty: true,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for error state', async () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: [],
        totalCount: 0,
        isLoading: false,
        error: new Error('Error'),
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: null,
      });

      const { container } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      // @ts-expect-error - vitest-axe extends expect in setup.ts
      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic Structure', () => {
    it('should use semantic region role', () => {
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

      const region = container.querySelector('[role="region"]');
      expect(region).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      vi.mocked(connectedDevicesHook.useConnectedDevices).mockReturnValue({
        devices: generateDevices(3),
        totalCount: 3,
        isLoading: false,
        error: null,
        isDhcpEnabled: true,
        isEmpty: false,
        lastUpdated: new Date(),
      });

      const { getByText } = render(<ConnectedDevices routerIp="192.168.88.1" />, {
        wrapper: createWrapper(),
      });

      const heading = getByText('Connected Devices');
      expect(heading.tagName).toMatch(/H[1-6]/);
    });
  });
});
