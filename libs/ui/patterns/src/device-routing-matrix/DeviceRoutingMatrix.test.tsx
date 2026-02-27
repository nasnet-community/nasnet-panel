/**
 * DeviceRoutingMatrix Component Tests
 *
 * Tests for the DeviceRoutingMatrix pattern component with platform presenter pattern.
 * Validates Desktop, Tablet, and Mobile rendering with proper platform detection.
 *
 * @see NAS-8.3: Device-to-Service Routing
 * @see ADR-018: Headless + Platform Presenters Pattern
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { usePlatform } from '@nasnet/ui/layouts';

import { DeviceRoutingMatrix } from './DeviceRoutingMatrix';

import type {
  DeviceRoutingMatrixData,
  DeviceRoutingActions,
  NetworkDevice,
  VirtualInterfaceInfo,
} from './types';

// Mock dependencies
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(),
}));

vi.mock('./DeviceRoutingMatrixDesktop', () => ({
  DeviceRoutingMatrixDesktop: vi.fn(({ routerId, matrix }) => (
    <div data-testid="device-routing-matrix-desktop">
      <div data-testid="router-id">{routerId}</div>
      <table role="table">
        <thead>
          <tr>
            <th>Device</th>
            <th>MAC Address</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {matrix.devices.map((device: NetworkDevice) => (
            <tr
              key={device.deviceID}
              data-testid={`device-row-${device.deviceID}`}
            >
              <td>{device.hostname || device.deviceID}</td>
              <td>{device.macAddress}</td>
              <td>{device.ipAddress || 'N/A'}</td>
              <td>{device.isRouted ? 'Routed' : 'Unrouted'}</td>
              <td>
                <button>Assign</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="summary-stats">
        Total: {matrix.summary.totalDevices}, Routed: {matrix.summary.routedDevices}
      </div>
    </div>
  )),
}));

vi.mock('./DeviceRoutingMatrixMobile', () => ({
  DeviceRoutingMatrixMobile: vi.fn(({ routerId, matrix }) => (
    <div data-testid="device-routing-matrix-mobile">
      <div data-testid="router-id">{routerId}</div>
      {matrix.devices.map((device: NetworkDevice) => (
        <div
          key={device.deviceID}
          data-testid={`device-card-${device.deviceID}`}
          role="article"
        >
          <div data-testid="device-name">{device.hostname || device.deviceID}</div>
          <div data-testid="device-mac">{device.macAddress}</div>
          <div data-testid="device-ip">{device.ipAddress || 'N/A'}</div>
          <span data-testid="routing-badge">{device.isRouted ? 'Routed' : 'Unrouted'}</span>
          <button data-testid="assign-button">Assign</button>
        </div>
      ))}
      <div data-testid="summary-cards">
        <span>Total: {matrix.summary.totalDevices}</span>
        <span>Routed: {matrix.summary.routedDevices}</span>
      </div>
    </div>
  )),
}));

// Mock data
const mockDevices: NetworkDevice[] = [
  {
    deviceID: 'dev-1',
    macAddress: 'aa:bb:cc:dd:ee:01',
    ipAddress: '192.168.1.100',
    hostname: 'laptop',
    active: true,
    isRouted: false,
    source: 'dhcp',
    dhcpLease: true,
    arpEntry: false,
  },
  {
    deviceID: 'dev-2',
    macAddress: 'aa:bb:cc:dd:ee:02',
    ipAddress: '192.168.1.101',
    hostname: 'phone',
    active: true,
    isRouted: true,
    routingMark: 'tor-mark',
    source: 'both',
    dhcpLease: true,
    arpEntry: true,
  },
];

const mockInterfaces: VirtualInterfaceInfo[] = [
  {
    id: 'iface-1',
    instanceID: 'instance-tor',
    instanceName: 'Tor Exit',
    interfaceName: 'vlan100',
    ipAddress: '10.100.0.1',
    routingMark: 'tor-mark',
    gatewayType: 'socks5',
    gatewayStatus: 'active',
  },
];

const mockMatrix: DeviceRoutingMatrixData = {
  devices: mockDevices,
  interfaces: mockInterfaces,
  routings: [],
  summary: {
    totalDevices: 2,
    dhcpDevices: 2,
    arpOnlyDevices: 0,
    routedDevices: 1,
    unroutedDevices: 1,
    activeRoutings: 1,
    activeInterfaces: 1,
  },
};

const mockActions: DeviceRoutingActions = {
  onAssign: vi.fn().mockResolvedValue(undefined),
  onRemove: vi.fn().mockResolvedValue(undefined),
  onBulkAssign: vi.fn().mockResolvedValue(undefined),
};

describe('DeviceRoutingMatrix', () => {
  const mockRouterId = 'router-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Rendering', () => {
    it('should render desktop presenter when platform is desktop', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify desktop presenter is rendered
      const desktopView = screen.getByTestId('device-routing-matrix-desktop');
      expect(desktopView).toBeInTheDocument();

      // Verify router ID is passed correctly
      const routerIdElement = screen.getByTestId('router-id');
      expect(routerIdElement).toHaveTextContent(mockRouterId);

      // Verify table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify table headers
      expect(screen.getByText('Device')).toBeInTheDocument();
      expect(screen.getByText('MAC Address')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Verify device rows
      const laptopRow = screen.getByTestId('device-row-dev-1');
      expect(laptopRow).toBeInTheDocument();
      expect(laptopRow).toHaveTextContent('laptop');
      expect(laptopRow).toHaveTextContent('aa:bb:cc:dd:ee:01');
      expect(laptopRow).toHaveTextContent('192.168.1.100');
      expect(laptopRow).toHaveTextContent('Unrouted');

      const phoneRow = screen.getByTestId('device-row-dev-2');
      expect(phoneRow).toBeInTheDocument();
      expect(phoneRow).toHaveTextContent('phone');
      expect(phoneRow).toHaveTextContent('Routed');

      // Verify summary stats
      const summary = screen.getByTestId('summary-stats');
      expect(summary).toHaveTextContent('Total: 2');
      expect(summary).toHaveTextContent('Routed: 1');

      // Verify mobile view is NOT rendered
      expect(screen.queryByTestId('device-routing-matrix-mobile')).not.toBeInTheDocument();
    });

    it('should render desktop presenter when platform is tablet', () => {
      vi.mocked(usePlatform).mockReturnValue('tablet');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify desktop presenter is used for tablet as well
      const desktopView = screen.getByTestId('device-routing-matrix-desktop');
      expect(desktopView).toBeInTheDocument();

      // Verify table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Verify mobile view is NOT rendered
      expect(screen.queryByTestId('device-routing-matrix-mobile')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Rendering', () => {
    it('should render mobile presenter when platform is mobile', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify mobile presenter is rendered
      const mobileView = screen.getByTestId('device-routing-matrix-mobile');
      expect(mobileView).toBeInTheDocument();

      // Verify router ID is passed correctly
      const routerIdElement = screen.getByTestId('router-id');
      expect(routerIdElement).toHaveTextContent(mockRouterId);

      // Verify card-based layout
      const laptopCard = screen.getByTestId('device-card-dev-1');
      expect(laptopCard).toBeInTheDocument();
      expect(laptopCard).toHaveAttribute('role', 'article');

      const phoneCard = screen.getByTestId('device-card-dev-2');
      expect(phoneCard).toBeInTheDocument();
      expect(phoneCard).toHaveAttribute('role', 'article');

      // Verify device details in cards
      const deviceNames = screen.getAllByTestId('device-name');
      expect(deviceNames).toHaveLength(2);
      expect(deviceNames[0]).toHaveTextContent('laptop');
      expect(deviceNames[1]).toHaveTextContent('phone');

      const deviceMacs = screen.getAllByTestId('device-mac');
      expect(deviceMacs).toHaveLength(2);
      expect(deviceMacs[0]).toHaveTextContent('aa:bb:cc:dd:ee:01');
      expect(deviceMacs[1]).toHaveTextContent('aa:bb:cc:dd:ee:02');

      // Verify routing badges
      const routingBadges = screen.getAllByTestId('routing-badge');
      expect(routingBadges).toHaveLength(2);
      expect(routingBadges[0]).toHaveTextContent('Unrouted');
      expect(routingBadges[1]).toHaveTextContent('Routed');

      // Verify assign buttons
      const assignButtons = screen.getAllByTestId('assign-button');
      expect(assignButtons).toHaveLength(2);

      // Verify summary cards
      const summaryCards = screen.getByTestId('summary-cards');
      expect(summaryCards).toHaveTextContent('Total: 2');
      expect(summaryCards).toHaveTextContent('Routed: 1');

      // Verify desktop view is NOT rendered
      expect(screen.queryByTestId('device-routing-matrix-desktop')).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should render touch-optimized cards on mobile', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify cards use article role for semantic HTML
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(2);

      // Each card should have all device info
      cards.forEach((card) => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Component Props', () => {
    it('should pass routerId to both presenters', () => {
      const testRouterId = 'test-router-456';

      // Test desktop
      vi.mocked(usePlatform).mockReturnValue('desktop');
      const { unmount } = render(
        <DeviceRoutingMatrix
          routerId={testRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );
      expect(screen.getByTestId('router-id')).toHaveTextContent(testRouterId);
      unmount();

      // Test mobile
      vi.mocked(usePlatform).mockReturnValue('mobile');
      render(
        <DeviceRoutingMatrix
          routerId={testRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );
      expect(screen.getByTestId('router-id')).toHaveTextContent(testRouterId);
    });

    it('should pass matrix data to presenters', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify all devices are rendered
      expect(screen.getByTestId('device-row-dev-1')).toBeInTheDocument();
      expect(screen.getByTestId('device-row-dev-2')).toBeInTheDocument();

      // Verify summary stats
      expect(screen.getByText(/Total: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Routed: 1/)).toBeInTheDocument();
    });

    it('should pass actions to presenters', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      // Verify action buttons are rendered (mocked presenters have assign buttons)
      const assignButtons = screen.getAllByTestId('assign-button');
      expect(assignButtons.length).toBeGreaterThan(0);
    });

    it('should handle optional className prop', () => {
      const customClass = 'custom-matrix-class';

      vi.mocked(usePlatform).mockReturnValue('desktop');
      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
          className={customClass}
        />
      );

      // Desktop presenter should be rendered (className tested in presenter-specific tests)
      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
          loading={true}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      const testError = new Error('Failed to load matrix');

      vi.mocked(usePlatform).mockReturnValue('desktop');
      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
          error={testError}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
    });
  });

  describe('Presenter Selection Logic', () => {
    it('should use desktop presenter for desktop platform', () => {
      vi.mocked(usePlatform).mockReturnValue('desktop');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('device-routing-matrix-mobile')).not.toBeInTheDocument();
    });

    it('should use mobile presenter for mobile platform', () => {
      vi.mocked(usePlatform).mockReturnValue('mobile');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-mobile')).toBeInTheDocument();
      expect(screen.queryByTestId('device-routing-matrix-desktop')).not.toBeInTheDocument();
    });

    it('should use desktop presenter for tablet platform', () => {
      vi.mocked(usePlatform).mockReturnValue('tablet');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={mockMatrix}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('device-routing-matrix-mobile')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty device list', () => {
      const emptyMatrix: DeviceRoutingMatrixData = {
        devices: [],
        interfaces: mockInterfaces,
        routings: [],
        summary: {
          totalDevices: 0,
          dhcpDevices: 0,
          arpOnlyDevices: 0,
          routedDevices: 0,
          unroutedDevices: 0,
          activeRoutings: 0,
          activeInterfaces: 1,
        },
      };

      vi.mocked(usePlatform).mockReturnValue('desktop');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={emptyMatrix}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('device-routing-matrix-desktop')).toBeInTheDocument();
      expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
    });

    it('should handle devices with missing optional fields', () => {
      const minimalDevice: NetworkDevice = {
        deviceID: 'dev-minimal',
        macAddress: 'aa:bb:cc:dd:ee:ff',
        active: true,
        isRouted: false,
        source: 'arp',
        dhcpLease: false,
        arpEntry: true,
        // Missing: ipAddress, hostname, routingMark
      };

      const minimalMatrix: DeviceRoutingMatrixData = {
        devices: [minimalDevice],
        interfaces: mockInterfaces,
        routings: [],
        summary: {
          totalDevices: 1,
          dhcpDevices: 0,
          arpOnlyDevices: 1,
          routedDevices: 0,
          unroutedDevices: 1,
          activeRoutings: 0,
          activeInterfaces: 1,
        },
      };

      vi.mocked(usePlatform).mockReturnValue('mobile');

      render(
        <DeviceRoutingMatrix
          routerId={mockRouterId}
          matrix={minimalMatrix}
          actions={mockActions}
        />
      );

      const deviceCard = screen.getByTestId('device-card-dev-minimal');
      expect(deviceCard).toBeInTheDocument();
      expect(deviceCard).toHaveTextContent('dev-minimal'); // Falls back to deviceID
      expect(deviceCard).toHaveTextContent('N/A'); // No IP address
    });
  });
});
