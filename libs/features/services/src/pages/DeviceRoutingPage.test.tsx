/**
 * DeviceRoutingPage Component Tests
 *
 * Integration tests for the DeviceRoutingPage component.
 * Tests device routing matrix display, assignment operations, bulk actions,
 * real-time subscription handling, and error states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { DeviceRoutingPage } from './DeviceRoutingPage';

// Mock dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useDeviceRoutingMatrix: vi.fn(),
  useAssignDeviceRouting: vi.fn(),
  useRemoveDeviceRouting: vi.fn(),
  useBulkAssignRouting: vi.fn(),
  useDeviceRoutingSubscription: vi.fn(),
}));

vi.mock('@nasnet/ui/primitives', () => ({
  useToast: vi.fn(),
}));

vi.mock('@nasnet/ui/patterns', () => ({
  DeviceRoutingMatrix: vi.fn(({ matrix, loading, error, showSummary }) => (
    <div data-testid="device-routing-matrix">
      {loading && <div>Loading matrix...</div>}
      {error && <div>Error: {error.message}</div>}
      {!loading && !error && matrix && (
        <div>
          <div>Devices: {matrix.devices.length}</div>
          <div>Interfaces: {matrix.interfaces.length}</div>
        </div>
      )}
    </div>
  )),
  RoutingChainViz: vi.fn(({ chain, onHopClick }) => (
    <div data-testid={`routing-chain-${chain.id}`}>
      <button onClick={() => onHopClick(chain.hops[0])}>
        {chain.deviceName}
      </button>
    </div>
  )),
  KillSwitchToggle: vi.fn(() => <div data-testid="kill-switch-toggle" />),
  ScheduleEditor: vi.fn(({ open, onClose, onSave }) =>
    open ? (
      <div data-testid="schedule-editor">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSave({})}>Save</button>
      </div>
    ) : null
  ),
}));

import {
  useDeviceRoutingMatrix,
  useAssignDeviceRouting,
  useRemoveDeviceRouting,
  useBulkAssignRouting,
  useDeviceRoutingSubscription,
} from '@nasnet/api-client/queries';
import { useToast } from '@nasnet/ui/primitives';

describe('DeviceRoutingPage', () => {
  const mockMatrix = {
    devices: [
      {
        deviceID: 'dev-001',
        macAddress: 'AA:BB:CC:DD:EE:01',
        ipAddress: '192.168.88.10',
        hostname: 'laptop-reza',
        deviceType: 'laptop',
      },
      {
        deviceID: 'dev-002',
        macAddress: 'AA:BB:CC:DD:EE:02',
        ipAddress: '192.168.88.11',
        hostname: 'iphone-reza',
        deviceType: 'mobile',
      },
    ],
    interfaces: [
      {
        id: 'vif-tor-001',
        instanceID: 'inst-tor-001',
        instanceName: 'tor-main',
        routingMark: 'tor_mark',
        gatewayType: 'proxy',
      },
    ],
    routings: [
      {
        id: 'routing-001',
        deviceID: 'dev-001',
        deviceName: 'laptop-reza',
        deviceIP: '192.168.88.10',
        macAddress: 'AA:BB:CC:DD:EE:01',
        instanceID: 'inst-tor-001',
        interfaceID: 'vif-tor-001',
        routingMode: 'MAC' as const,
        active: true,
      },
    ],
  };

  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useDeviceRoutingMatrix as any).mockReturnValue({
      matrix: mockMatrix,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useAssignDeviceRouting as any).mockReturnValue([
      vi.fn().mockResolvedValue({}),
      { loading: false, error: null },
    ]);

    (useRemoveDeviceRouting as any).mockReturnValue([
      vi.fn().mockResolvedValue({}),
      { loading: false, error: null },
    ]);

    (useBulkAssignRouting as any).mockReturnValue({
      bulkAssign: vi.fn().mockResolvedValue({
        successCount: 2,
        failureCount: 0,
      }),
      progress: null,
      loading: false,
      error: null,
    });

    (useDeviceRoutingSubscription as any).mockReturnValue({
      event: null,
    });

    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
  });

  describe('rendering', () => {
    it('should render page header with title', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText('Device Routing')).toBeInTheDocument();
      expect(
        screen.getByText(/Route network devices through service instances/)
      ).toBeInTheDocument();
    });

    it('should render global kill switch', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByTestId('kill-switch-toggle')).toBeInTheDocument();
    });

    it('should render device routing matrix', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByTestId('device-routing-matrix')).toBeInTheDocument();
    });

    it('should pass matrix data to component', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText('Devices: 2')).toBeInTheDocument();
      expect(screen.getByText('Interfaces: 1')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message when fetching matrix', () => {
      (useDeviceRoutingMatrix as any).mockReturnValue({
        matrix: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText('Loading devices...')).toBeInTheDocument();
    });

    it('should set aria-live and aria-label on loading state', () => {
      (useDeviceRoutingMatrix as any).mockReturnValue({
        matrix: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      const loadingDiv = screen.getByRole('status');
      expect(loadingDiv).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('error state', () => {
    it('should show error toast when matrix fetch fails', () => {
      const error = new Error('Failed to fetch devices');
      (useDeviceRoutingMatrix as any).mockReturnValue({
        matrix: null,
        loading: false,
        error,
        refetch: vi.fn(),
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to Load Devices',
          variant: 'destructive',
        })
      );
    });
  });

  describe('routing chains visualization', () => {
    it('should render active routing chains section when routings exist', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText('Active Routing Chains')).toBeInTheDocument();
    });

    it('should display individual routing chains', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByTestId('routing-chain-chain-dev-001')).toBeInTheDocument();
    });

    it('should show "more chains" message when exceeding limit', () => {
      // Add more routings to exceed 5 limit
      const extendedMatrix = {
        ...mockMatrix,
        routings: Array.from({ length: 8 }, (_, i) => ({
          ...mockMatrix.routings[0],
          id: `routing-${i}`,
          deviceID: `dev-${i}`,
        })),
      };

      (useDeviceRoutingMatrix as any).mockReturnValue({
        matrix: extendedMatrix,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText(/and 3 more chains/)).toBeInTheDocument();
    });
  });

  describe('bulk assignment progress', () => {
    it('should display progress bar during bulk assignment', () => {
      (useBulkAssignRouting as any).mockReturnValue({
        bulkAssign: vi.fn(),
        progress: {
          percentage: 50,
          successful: 5,
          total: 10,
        },
        loading: false,
        error: null,
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.getByText(/Bulk Assignment Progress: 50%/)).toBeInTheDocument();
      expect(screen.getByText(/5\/10 completed/)).toBeInTheDocument();
    });

    it('should set aria-live and aria-label on progress bar', () => {
      (useBulkAssignRouting as any).mockReturnValue({
        bulkAssign: vi.fn(),
        progress: {
          percentage: 50,
          successful: 5,
          total: 10,
        },
        loading: false,
        error: null,
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      const progressDiv = screen.getByRole('status', {
        hidden: false,
      });
      expect(progressDiv).toHaveAttribute('aria-live', 'polite');
      expect(progressDiv).toHaveAttribute(
        'aria-label',
        expect.stringContaining('50%')
      );
    });
  });

  describe('schedule editor', () => {
    it('should not render schedule editor initially', () => {
      render(<DeviceRoutingPage routerId="router-001" />);

      expect(screen.queryByTestId('schedule-editor')).not.toBeInTheDocument();
    });

    it('should open schedule editor when hop is clicked', async () => {
      const user = userEvent.setup();
      render(<DeviceRoutingPage routerId="router-001" />);

      const hopButton = screen.getByText('laptop-reza');
      await user.click(hopButton);

      await waitFor(() => {
        expect(screen.getByTestId('schedule-editor')).toBeInTheDocument();
      });
    });

    it('should show toast when hop is clicked', async () => {
      const user = userEvent.setup();
      render(<DeviceRoutingPage routerId="router-001" />);

      const hopButton = screen.getByText('laptop-reza');
      await user.click(hopButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Service:'),
          })
        );
      });
    });

    it('should close schedule editor when close is clicked', async () => {
      const user = userEvent.setup();
      render(<DeviceRoutingPage routerId="router-001" />);

      const hopButton = screen.getByText('laptop-reza');
      await user.click(hopButton);

      await waitFor(() => {
        expect(screen.getByTestId('schedule-editor')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('schedule-editor')).not.toBeInTheDocument();
      });
    });
  });

  describe('real-time subscription events', () => {
    it('should show toast on device assigned event', () => {
      (useDeviceRoutingSubscription as any).mockReturnValue({
        event: {
          eventType: 'assigned',
          routing: {
            deviceName: 'laptop-reza',
            deviceIP: '192.168.88.10',
            macAddress: 'AA:BB:CC:DD:EE:01',
          },
        },
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Device Assigned',
          description: expect.stringContaining('laptop-reza'),
        })
      );
    });

    it('should show toast on device removed event', () => {
      (useDeviceRoutingSubscription as any).mockReturnValue({
        event: {
          eventType: 'removed',
          routing: {
            deviceName: 'laptop-reza',
            deviceIP: '192.168.88.10',
            macAddress: 'AA:BB:CC:DD:EE:01',
          },
        },
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Device Routing Removed',
        })
      );
    });

    it('should show toast on device updated event', () => {
      (useDeviceRoutingSubscription as any).mockReturnValue({
        event: {
          eventType: 'updated',
          routing: {
            deviceName: 'laptop-reza',
            deviceIP: '192.168.88.10',
            macAddress: 'AA:BB:CC:DD:EE:01',
          },
        },
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Device Routing Updated',
        })
      );
    });
  });

  describe('component stability', () => {
    it('should have displayName for debugging', () => {
      expect(DeviceRoutingPage.displayName).toBe('DeviceRoutingPage');
    });

    it('should accept className prop', () => {
      const { container } = render(
        <DeviceRoutingPage routerId="router-001" className="custom-class" />
      );

      const containerDiv = container.querySelector('.custom-class');
      expect(containerDiv).toBeInTheDocument();
    });

    it('should handle missing device identifier gracefully', () => {
      (useDeviceRoutingSubscription as any).mockReturnValue({
        event: {
          eventType: 'assigned',
          routing: {
            deviceName: null,
            deviceIP: null,
            macAddress: null,
          },
        },
      });

      render(<DeviceRoutingPage routerId="router-001" />);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Unknown device'),
        })
      );
    });
  });
});
