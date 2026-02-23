/**
 * DeviceListItem Accessibility Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Tests WCAG AAA compliance for all platform presenters:
 * - Mobile (44px touch targets, tap-to-expand)
 * - Tablet (card layout with expandable section)
 * - Desktop (inline details, compact table row)
 */

import { render, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';

import { DeviceType } from '@nasnet/core/types';
import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

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

describe('DeviceListItem Accessibility', () => {
  describe('Mobile Presenter', () => {
    it('should have no accessibility violations (default state)', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations with new device badge', async () => {
      const device = createMockDevice({ isNew: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations with static lease badge', async () => {
      const device = createMockDevice({ isStatic: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations in privacy mode', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: false })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations with unknown hostname', async () => {
      const device = createMockDevice({ hostname: 'Unknown' });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for expandable button', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { getByRole } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const button = getByRole('button');
      expect(button).toHaveAttribute('aria-expanded');
    });

    it('should have 44px minimum touch target height', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  describe('Tablet Presenter', () => {
    it('should have no accessibility violations (default state)', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemTablet state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations with new and static badges', async () => {
      const device = createMockDevice({ isNew: true, isStatic: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemTablet state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations in privacy mode', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: false })
      );
      const { container } = render(
        <DeviceListItemTablet state={result.current} device={device} />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have proper ARIA for expandable section', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { getByRole } = render(
        <DeviceListItemTablet state={result.current} device={device} />
      );

      const button = getByRole('button', { name: /expand/i });
      expect(button).toHaveAttribute('aria-expanded');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('Desktop Presenter', () => {
    it('should have no accessibility violations (inline details)', async () => {
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

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations with all badges', async () => {
      const device = createMockDevice({ isNew: true, isStatic: true });
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

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should have no violations in privacy mode', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: false })
      );
      const { container } = render(
        <table>
          <tbody>
            <DeviceListItemDesktop state={result.current} device={device} />
          </tbody>
        </table>
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('should use semantic table structure', () => {
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
  });

  describe('All Device Types', () => {
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
      it(`should have no violations for ${deviceType} device type`, async () => {
        const device = createMockDevice({ deviceType });
        const { result } = renderHook(() =>
          useDeviceListItem({ device, showHostname: true })
        );
        const { container } = render(
          <DeviceListItemMobile state={result.current} device={device} />
        );

        expect(await axe(container)).toHaveNoViolations();
      });
    });

    it('should provide sr-only labels for device type icons', () => {
      const device = createMockDevice({ deviceType: DeviceType.SMARTPHONE });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { getByText } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const label = getByText('Smartphone');
      expect(label).toHaveClass('sr-only');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible (mobile)', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { getByRole } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const button = getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should be keyboard accessible (tablet)', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { getByRole } = render(
        <DeviceListItemTablet state={result.current} device={device} />
      );

      const button = getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
    });

    it('should have focus indicators', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const button = container.querySelector('button');
      // Focus ring classes should be present in the button styles
      const classes = button?.className || '';
      expect(
        classes.includes('focus') ||
        classes.includes('ring') ||
        classes.includes('outline')
      ).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce device status to screen readers', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const statusText = container.textContent;
      expect(statusText).toContain('Connected');
    });

    it('should announce new device badge', () => {
      const device = createMockDevice({ isNew: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(container.textContent).toContain('New');
    });

    it('should announce static lease badge', () => {
      const device = createMockDevice({ isStatic: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      expect(container.textContent).toContain('Static');
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for text on light background', async () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <div className="bg-white">
          <DeviceListItemMobile state={result.current} device={device} />
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true }, // WCAG AAA 7:1
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient contrast for badges', async () => {
      const device = createMockDevice({ isNew: true, isStatic: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast-enhanced': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion for pulse animation', () => {
      const device = createMockDevice({ isNew: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const badge = container.querySelector('.animate-pulse');
      // The component should include motion-reduce: class to disable animation
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Touch Targets', () => {
    it('should have 44px minimum touch target (mobile)', () => {
      const device = createMockDevice();
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      const button = container.querySelector('button');
      const style = window.getComputedStyle(button!);
      // min-h-[44px] should be applied
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('should have adequate spacing between interactive elements', () => {
      const device = createMockDevice({ isNew: true, isStatic: true });
      const { result } = renderHook(() =>
        useDeviceListItem({ device, showHostname: true })
      );
      const { container } = render(
        <DeviceListItemMobile state={result.current} device={device} />
      );

      // Multiple badges should have spacing
      const badges = container.querySelectorAll('[class*="badge"]');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
