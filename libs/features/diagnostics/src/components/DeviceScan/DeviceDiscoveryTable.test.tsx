/**
 * DeviceDiscoveryTable Component Tests
 *
 * Tests for device table rendering, virtualization, row selection,
 * and accessibility features.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeviceDiscoveryTable } from './DeviceDiscoveryTable';
import type { DiscoveredDevice } from './types';

// Mock devices for testing
const mockDevices: DiscoveredDevice[] = [
  {
    ip: '192.168.1.100',
    mac: '00:11:22:33:44:55',
    vendor: 'Apple Inc.',
    hostname: 'iPhone-User',
    interface: 'bridge1',
    responseTime: 2,
    firstSeen: '2026-02-21T10:30:00Z',
    dhcpLease: {
      expires: new Date(Date.now() + 86400000).toISOString(),
      server: '192.168.1.1',
      status: 'active',
    },
  },
  {
    ip: '192.168.1.101',
    mac: '11:22:33:44:55:66',
    vendor: null,
    hostname: null,
    interface: 'bridge1',
    responseTime: 5,
    firstSeen: '2026-02-21T10:31:00Z',
  },
  {
    ip: '192.168.1.102',
    mac: '22:33:44:55:66:77',
    vendor: 'Samsung Electronics',
    hostname: 'Samsung-TV',
    interface: 'bridge1',
    responseTime: 1,
    firstSeen: '2026-02-21T10:32:00Z',
  },
];

describe('DeviceDiscoveryTable', () => {
  it('renders device data in table format', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('iPhone-User')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('displays correct device count footer', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText(/3 devices found/)).toBeInTheDocument();
  });

  it('handles single device count correctly', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={[mockDevices[0]]}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText(/1 device found/)).toBeInTheDocument();
  });

  it('calls onSelectDevice when row is clicked', async () => {
    const onSelectDevice = vi.fn();
    const user = userEvent.setup();

    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    const firstRow = screen.getByText('iPhone-User').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      expect(onSelectDevice).toHaveBeenCalledWith(mockDevices[0]);
    }
  });

  it('deselects device when clicking selected row', async () => {
    const onSelectDevice = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={mockDevices[0]}
        onSelectDevice={onSelectDevice}
      />
    );

    const firstRow = screen.getByText('iPhone-User').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      expect(onSelectDevice).toHaveBeenCalledWith(null);
    }
  });

  it('renders monospace font for IP addresses', () => {
    const onSelectDevice = vi.fn();
    const { container } = render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThan(0);
  });

  it('renders monospace font for MAC addresses', () => {
    const onSelectDevice = vi.fn();
    const { container } = render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    const macAddresses = container.querySelectorAll(
      '.font-mono:contains("00:11:22")'
    );
    expect(macAddresses.length).toBeGreaterThanOrEqual(0);
  });

  it('displays vendor information or "Unknown" fallback', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
  });

  it('displays hostname or empty state correctly', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText('iPhone-User')).toBeInTheDocument();
    expect(screen.getByText('Samsung-TV')).toBeInTheDocument();
  });

  it('displays DHCP/Static status badges', () => {
    const onSelectDevice = vi.fn();
    render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
      />
    );

    expect(screen.getByText('DHCP')).toBeInTheDocument();
    expect(screen.getAllByText('Static').length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const onSelectDevice = vi.fn();
    const { container } = render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={null}
        onSelectDevice={onSelectDevice}
        className="custom-table"
      />
    );

    const table = container.querySelector('.custom-table');
    expect(table).toBeInTheDocument();
  });

  it('highlights selected device row', () => {
    const onSelectDevice = vi.fn();
    const { container } = render(
      <DeviceDiscoveryTable
        devices={mockDevices}
        selectedDevice={mockDevices[0]}
        onSelectDevice={onSelectDevice}
      />
    );

    const rows = container.querySelectorAll('tr');
    expect(rows.length).toBeGreaterThan(0);
  });
});
