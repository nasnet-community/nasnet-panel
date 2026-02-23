/**
 * DeviceDetailPanel Component Tests
 *
 * Tests for device detail display, formatting, and user interactions.
 * Verifies correct rendering of device information, DHCP lease data,
 * and accessibility compliance.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DeviceDetailPanel } from './DeviceDetailPanel';
import type { DiscoveredDevice } from './types';

// Mock device for testing
const mockDevice: DiscoveredDevice = {
  ip: '192.168.1.100',
  mac: '00:11:22:33:44:55',
  vendor: 'Apple Inc.',
  hostname: 'iPhone-User',
  interface: 'bridge1',
  responseTime: 2,
  firstSeen: '2026-02-21T10:30:00Z',
  dhcpLease: {
    expires: new Date(Date.now() + 86400000).toISOString(), // +1 day
    server: '192.168.1.1',
    status: 'active',
  },
};

describe('DeviceDetailPanel', () => {
  it('renders device information correctly', () => {
    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
      />
    );

    expect(screen.getByText('iPhone-User')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('bridge1')).toBeInTheDocument();
  });

  it('renders DHCP lease information when available', () => {
    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
      />
    );

    expect(screen.getByText('DHCP Lease')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('does not render DHCP lease section when no lease available', () => {
    const deviceWithoutLease: DiscoveredDevice = {
      ...mockDevice,
      dhcpLease: undefined,
    };

    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={deviceWithoutLease}
        onClose={onClose}
        routerId="router-1"
      />
    );

    expect(screen.queryByText('DHCP Lease')).not.toBeInTheDocument();
  });

  it('shows "Unknown Device" when hostname is null', () => {
    const deviceWithoutHostname: DiscoveredDevice = {
      ...mockDevice,
      hostname: null,
    };

    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={deviceWithoutHostname}
        onClose={onClose}
        routerId="router-1"
      />
    );

    expect(screen.getByText('Unknown Device')).toBeInTheDocument();
  });

  it('calls onClose callback when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
      />
    );

    const closeButton = screen.getByRole('button', {
      name: /close device details/i,
    });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables add button when no routerId provided', () => {
    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId={undefined}
      />
    );

    const addButton = screen.getByRole('button', {
      name: /add to known devices/i,
    });
    expect(addButton).toBeDisabled();
  });

  it('renders technical data with appropriate monospace font', () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
      />
    );

    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThan(0);
  });

  it('has proper accessibility labels', () => {
    const onClose = vi.fn();
    render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
      />
    );

    const closeButton = screen.getByRole('button', {
      name: /close device details/i,
    });
    expect(closeButton).toHaveAttribute('aria-label');
  });

  it('applies custom className correctly', () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeviceDetailPanel
        device={mockDevice}
        onClose={onClose}
        routerId="router-1"
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
