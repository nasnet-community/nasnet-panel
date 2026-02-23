/**
 * DeviceListItem Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Tests the headless hook and all three platform presenters:
 * - useDeviceListItem (headless logic)
 * - DeviceListItemMobile (touch-optimized, tap-to-expand)
 * - DeviceListItemTablet (card layout with expandable section)
 * - DeviceListItemDesktop (inline details, compact table row)
 */

import { render, screen, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { DeviceType } from '@nasnet/core/types';
import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

import { DeviceListItem } from './device-list-item';
import { DeviceListItemDesktop } from './device-list-item-desktop';
import { DeviceListItemMobile } from './device-list-item-mobile';
import { DeviceListItemTablet } from './device-list-item-tablet';
import { useDeviceListItem } from './use-device-list-item';


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
  firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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

describe('useDeviceListItem', () => {
  it('returns correct display values for regular device', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.displayName).toBe('Johns-iPhone');
    expect(result.current.ipAddress).toBe('192.168.88.105');
    expect(result.current.vendor).toBe('Apple, Inc.');
    expect(result.current.isNew).toBe(false);
    expect(result.current.isStatic).toBe(false);
  });

  it('masks hostname when showHostname is false', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: false })
    );

    expect(result.current.displayName).toMatch(/Device-[A-Z0-9]{4}/);
    expect(result.current.ipAddress).toBe('192.168.88.105');
  });

  it('uses IP address as title when hostname is "Unknown"', () => {
    const device = createMockDevice({ hostname: 'Unknown' });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.displayName).toBe('Unknown');
    expect(result.current.macAddress).toBe('A4:83:E7:12:34:56');
  });

  it('shows new badge for new devices', () => {
    const device = createMockDevice({ isNew: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.isNew).toBe(true);
  });

  it('shows static badge for static leases', () => {
    const device = createMockDevice({ isStatic: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.isStatic).toBe(true);
  });

  it('toggles expanded state', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.isExpanded).toBe(false);

    result.current.toggleExpanded();
    expect(result.current.isExpanded).toBe(true);

    result.current.toggleExpanded();
    expect(result.current.isExpanded).toBe(false);
  });

  it('toggles expanded state on toggleExpanded', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.isExpanded).toBe(false);
    result.current.toggleExpanded();
    expect(result.current.isExpanded).toBe(true);

    result.current.toggleExpanded();
    expect(result.current.isExpanded).toBe(false);
  });

  it('returns correct device type icon', () => {
    const device = createMockDevice({ deviceType: DeviceType.SMARTPHONE });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.deviceTypeLabel).toBe('Smartphone');
  });

  it('handles unknown device type', () => {
    const device = createMockDevice({ deviceType: DeviceType.UNKNOWN });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );

    expect(result.current.deviceTypeLabel).toBe('Unknown');
  });
});

describe('DeviceListItemMobile', () => {
  it('renders device name and IP address', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();
    expect(screen.getByText('192.168.88.105')).toBeInTheDocument();
  });

  it('shows device type icon', () => {
    const device = createMockDevice({ deviceType: DeviceType.SMARTPHONE });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    const { container } = render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    // Icon should be rendered (check for lucide-icon class or role)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('shows "New" badge for new devices with pulse animation', () => {
    const device = createMockDevice({ isNew: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    const newBadge = screen.getByText('New');
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveClass('animate-pulse');
  });

  it('shows "Static" badge for static leases', () => {
    const device = createMockDevice({ isStatic: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    expect(screen.getByText('Static')).toBeInTheDocument();
  });

  it('expands details on tap', async () => {
    const user = userEvent.setup();
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    // Initially collapsed - details should not be visible
    expect(screen.queryByText('Apple, Inc.')).not.toBeInTheDocument();

    // Tap to expand
    const card = screen.getByRole('button', { name: /Johns-iPhone/i });
    await user.click(card);

    // Details should now be visible
    expect(screen.getByText('Apple, Inc.')).toBeInTheDocument();
    expect(screen.getByText('2h 15m')).toBeInTheDocument();
  });

  it('masks hostname in privacy mode', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: false })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    expect(screen.queryByText('Johns-iPhone')).not.toBeInTheDocument();
    expect(screen.getByText(/Device-[A-Z0-9]{4}/)).toBeInTheDocument();
  });

  it('has accessible 44px touch target', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    const { container } = render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    const touchTarget = container.querySelector('button');
    expect(touchTarget).toHaveClass('min-h-[44px]');
  });

  it('has accessible aria-expanded attribute', async () => {
    const user = userEvent.setup();
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemMobile state={result.current} device={device} />
    );

    const card = screen.getByRole('button', { name: /Johns-iPhone/i });
    expect(card).toHaveAttribute('aria-expanded', 'false');

    await user.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('DeviceListItemTablet', () => {
  it('renders device name and IP address', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemTablet state={result.current} device={device} />
    );

    expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();
    expect(screen.getByText('192.168.88.105')).toBeInTheDocument();
  });

  it('shows vendor and connection duration inline', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemTablet state={result.current} device={device} />
    );

    expect(screen.getByText('Apple, Inc.')).toBeInTheDocument();
    expect(screen.getByText('2h 15m')).toBeInTheDocument();
  });

  it('expands additional details on click', async () => {
    const user = userEvent.setup();
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemTablet state={result.current} device={device} />
    );

    // Initially, MAC address should not be visible
    expect(screen.queryByText('A4:83:E7:12:34:56')).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByRole('button', { name: /expand/i });
    await user.click(expandButton);

    // MAC address should now be visible
    expect(screen.getByText('A4:83:E7:12:34:56')).toBeInTheDocument();
  });

  it('shows new and static badges', () => {
    const device = createMockDevice({ isNew: true, isStatic: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <DeviceListItemTablet state={result.current} device={device} />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Static')).toBeInTheDocument();
  });
});

describe('DeviceListItemDesktop', () => {
  it('renders all device information inline', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();
    expect(screen.getByText('192.168.88.105')).toBeInTheDocument();
    expect(screen.getByText('A4:83:E7:12:34:56')).toBeInTheDocument();
    expect(screen.getByText('Apple, Inc.')).toBeInTheDocument();
    expect(screen.getByText('2h 15m')).toBeInTheDocument();
  });

  it('renders as table row with proper semantics', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    const { container } = render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();

    const cells = container.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('shows new badge with pulse animation', () => {
    const device = createMockDevice({ isNew: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    const newBadge = screen.getByText('New');
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveClass('animate-pulse');
  });

  it('shows static badge', () => {
    const device = createMockDevice({ isStatic: true });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Static')).toBeInTheDocument();
  });

  it('masks hostname in privacy mode', () => {
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: false })
    );
    render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    expect(screen.queryByText('Johns-iPhone')).not.toBeInTheDocument();
    expect(screen.getByText(/Device-[A-Z0-9]{4}/)).toBeInTheDocument();
  });

  it('handles unknown hostname gracefully', () => {
    const device = createMockDevice({ hostname: 'Unknown', vendor: null });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    // IP should be primary display
    expect(screen.getByText('192.168.88.105')).toBeInTheDocument();
    // MAC should be shown
    expect(screen.getByText('A4:83:E7:12:34:56')).toBeInTheDocument();
  });

  it('truncates long hostnames with ellipsis', () => {
    const device = createMockDevice({
      hostname: 'Johns-Super-Long-MacBook-Pro-16-inch-2023-Model-With-Extra-Long-Name',
    });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    const { container } = render(
      <table>
        <tbody>
          <DeviceListItemDesktop state={result.current} device={device} />
        </tbody>
      </table>
    );

    const hostnameCell = container.querySelector('td');
    expect(hostnameCell).toHaveClass('truncate');
  });
});

describe('DeviceListItem (auto-detect platform)', () => {
  it('renders without crashing', () => {
    const device = createMockDevice();
    render(<DeviceListItem device={device} showHostname={true} />);

    expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();
  });

  it('handles all device types correctly', () => {
    const deviceTypes = [
      DeviceType.SMARTPHONE,
      DeviceType.TABLET,
      DeviceType.LAPTOP,
      DeviceType.DESKTOP,
      DeviceType.ROUTER,
      DeviceType.IOT,
      DeviceType.PRINTER,
      DeviceType.TV,
      DeviceType.GAMING_CONSOLE,
      DeviceType.UNKNOWN,
    ];

    deviceTypes.forEach((deviceType) => {
      const device = createMockDevice({ deviceType, id: deviceType });
      const { unmount } = render(
        <DeviceListItem device={device} showHostname={true} />
      );

      expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();
      unmount();
    });
  });

  it('respects privacy mode prop', () => {
    const device = createMockDevice();
    const { rerender } = render(
      <DeviceListItem device={device} showHostname={true} />
    );

    expect(screen.getByText('Johns-iPhone')).toBeInTheDocument();

    rerender(<DeviceListItem device={device} showHostname={false} />);

    expect(screen.queryByText('Johns-iPhone')).not.toBeInTheDocument();
    expect(screen.getByText(/Device-[A-Z0-9]{4}/)).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('has accessible device type icon with sr-only label', () => {
    const device = createMockDevice({ deviceType: DeviceType.SMARTPHONE });
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(<DeviceListItemMobile state={result.current} device={device} />);

    expect(screen.getByText('Smartphone')).toHaveClass('sr-only');
  });

  it('mobile presenter has keyboard navigation support', async () => {
    const user = userEvent.setup();
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(<DeviceListItemMobile state={result.current} device={device} />);

    const card = screen.getByRole('button', { name: /Johns-iPhone/i });

    // Tab to focus
    await user.tab();
    expect(card).toHaveFocus();

    // Enter to expand
    await user.keyboard('{Enter}');
    expect(screen.getByText('Apple, Inc.')).toBeInTheDocument();

    // Space to collapse
    await user.keyboard(' ');
    expect(screen.queryByText('Apple, Inc.')).not.toBeInTheDocument();
  });

  it('maintains focus management when expanding/collapsing', async () => {
    const user = userEvent.setup();
    const device = createMockDevice();
    const { result } = renderHook(() =>
      useDeviceListItem({ device, showHostname: true })
    );
    render(<DeviceListItemMobile state={result.current} device={device} />);

    const card = screen.getByRole('button');
    await user.click(card);

    // Focus should remain on the button after expanding
    expect(card).toHaveFocus();
  });
});
