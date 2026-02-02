/**
 * Device Card Tests
 *
 * Unit and component tests for the DeviceCard pattern component.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';

import { DeviceCard } from './device-card';
import { DeviceCardDesktop } from './device-card-desktop';
import { DeviceCardMobile } from './device-card-mobile';
import { DeviceCardCompact } from './device-card-compact';
import {
  useDeviceCard,
  formatMacAddress,
  DEVICE_ICON_MAP,
  DEVICE_TYPE_LABELS,
} from './use-device-card';
import type { DiscoveredDevice, DeviceType } from './device-card.types';

// Note: vitest-axe matchers are extended in setup.ts

/**
 * Create a mock device for tests
 */
function createMockDevice(overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice {
  return {
    id: 'test-device-1',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100',
    hostname: 'Test-Device',
    vendor: 'Test Vendor Inc.',
    deviceType: 'computer',
    deviceTypeConfidence: 95,
    connectionType: 'wired',
    online: true,
    firstSeen: new Date('2024-01-01'),
    lastSeen: new Date(),
    customName: undefined,
    staticIp: undefined,
    signalStrength: undefined,
    ...overrides,
  };
}

// ============================================================================
// useDeviceCard Hook Tests
// ============================================================================

describe('useDeviceCard Hook', () => {
  describe('Display Name Resolution', () => {
    it('should return customName when available', () => {
      const device = createMockDevice({ customName: 'My Custom Name' });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="name">{state.displayName}</span>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('name')).toHaveTextContent('My Custom Name');
    });

    it('should return hostname when customName is not available', () => {
      const device = createMockDevice({ customName: undefined, hostname: 'Test-Hostname' });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="name">{state.displayName}</span>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('name')).toHaveTextContent('Test-Hostname');
    });

    it('should return formatted MAC when both customName and hostname are unavailable', () => {
      const device = createMockDevice({
        customName: undefined,
        hostname: undefined,
        mac: 'aabbccddeeff',
      });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="name">{state.displayName}</span>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('name')).toHaveTextContent('AA:BB:CC:DD:EE:FF');
    });
  });

  describe('Device Type Icon Selection', () => {
    const deviceTypes: DeviceType[] = [
      'computer',
      'phone',
      'tablet',
      'iot',
      'printer',
      'gaming',
      'unknown',
    ];

    deviceTypes.forEach((type) => {
      it(`should select correct icon for ${type} device type`, () => {
        const device = createMockDevice({ deviceType: type });
        const TestComponent = () => {
          const state = useDeviceCard({ device });
          const Icon = state.deviceIcon;
          return <Icon data-testid="icon" />;
        };

        render(<TestComponent />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
      });
    });
  });

  describe('Status Color', () => {
    it('should return success for online devices', () => {
      const device = createMockDevice({ online: true });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="color">{state.statusColor}</span>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('success');
    });

    it('should return muted for offline devices', () => {
      const device = createMockDevice({ online: false });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="color">{state.statusColor}</span>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('color')).toHaveTextContent('muted');
    });
  });

  describe('Confidence Indicator', () => {
    it('should show confidence indicator when confidence < 90%', () => {
      const device = createMockDevice({ deviceTypeConfidence: 75 });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return (
          <span data-testid="show">
            {state.showConfidenceIndicator ? 'true' : 'false'}
          </span>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('show')).toHaveTextContent('true');
    });

    it('should hide confidence indicator when confidence >= 90%', () => {
      const device = createMockDevice({ deviceTypeConfidence: 95 });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return (
          <span data-testid="show">
            {state.showConfidenceIndicator ? 'true' : 'false'}
          </span>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('show')).toHaveTextContent('false');
    });

    it('should hide confidence indicator when confidence is undefined', () => {
      const device = createMockDevice({ deviceTypeConfidence: undefined });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return (
          <span data-testid="show">
            {state.showConfidenceIndicator ? 'true' : 'false'}
          </span>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('show')).toHaveTextContent('false');
    });
  });

  describe('ARIA Label', () => {
    it('should include device name, status, and connection type', () => {
      const device = createMockDevice({
        hostname: 'Test-PC',
        online: true,
        connectionType: 'wired',
      });
      const TestComponent = () => {
        const state = useDeviceCard({ device });
        return <span data-testid="aria">{state.ariaLabel}</span>;
      };

      render(<TestComponent />);
      const ariaLabel = screen.getByTestId('aria').textContent;
      expect(ariaLabel).toContain('Test-PC');
      expect(ariaLabel).toContain('online');
      expect(ariaLabel).toContain('wired');
    });
  });

  describe('Action Callbacks', () => {
    it('should call onConfigure when handleConfigure is invoked', () => {
      const onConfigure = vi.fn();
      const device = createMockDevice();
      const TestComponent = () => {
        const state = useDeviceCard({ device, onConfigure });
        return (
          <button data-testid="btn" onClick={state.handleConfigure}>
            Configure
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByTestId('btn'));
      expect(onConfigure).toHaveBeenCalledWith(device);
    });

    it('should call onBlock when handleBlock is invoked', () => {
      const onBlock = vi.fn();
      const device = createMockDevice();
      const TestComponent = () => {
        const state = useDeviceCard({ device, onBlock });
        return (
          <button data-testid="btn" onClick={state.handleBlock}>
            Block
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByTestId('btn'));
      expect(onBlock).toHaveBeenCalledWith(device);
    });

    it('should call onRename with device and new name', () => {
      const onRename = vi.fn();
      const device = createMockDevice();
      const TestComponent = () => {
        const state = useDeviceCard({ device, onRename });
        return (
          <button data-testid="btn" onClick={() => state.handleRename('New Name')}>
            Rename
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByTestId('btn'));
      expect(onRename).toHaveBeenCalledWith(device, 'New Name');
    });
  });
});

// ============================================================================
// formatMacAddress Utility Tests
// ============================================================================

describe('formatMacAddress', () => {
  it('should format MAC with colons from dashes', () => {
    expect(formatMacAddress('AA-BB-CC-DD-EE-FF')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('should format MAC with colons from no separators', () => {
    expect(formatMacAddress('aabbccddeeff')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('should preserve properly formatted MAC', () => {
    expect(formatMacAddress('AA:BB:CC:DD:EE:FF')).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('should handle lowercase input', () => {
    expect(formatMacAddress('aa:bb:cc:dd:ee:ff')).toBe('AA:BB:CC:DD:EE:FF');
  });
});

// ============================================================================
// DeviceCard Component Tests
// ============================================================================

describe('DeviceCard Component', () => {
  describe('Rendering', () => {
    it('should render device name', () => {
      render(<DeviceCard device={createMockDevice({ hostname: 'My-PC' })} />);
      // Uses getAllByText because both mobile and desktop presenters render
      const names = screen.getAllByText('My-PC');
      expect(names.length).toBeGreaterThan(0);
    });

    it('should render IP address', () => {
      render(<DeviceCard device={createMockDevice({ ip: '192.168.1.50' })} />);
      const ips = screen.getAllByText('192.168.1.50');
      expect(ips.length).toBeGreaterThan(0);
    });

    it('should render vendor name', () => {
      render(<DeviceCard device={createMockDevice({ vendor: 'Apple Inc.' })} />);
      const vendors = screen.getAllByText('Apple Inc.');
      expect(vendors.length).toBeGreaterThan(0);
    });

    it('should render online status', () => {
      render(<DeviceCard device={createMockDevice({ online: true })} />);
      const statuses = screen.getAllByText('Online');
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should render offline status', () => {
      render(<DeviceCard device={createMockDevice({ online: false })} />);
      const statuses = screen.getAllByText('Offline');
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  describe('Compact Mode', () => {
    it('should render compact card', () => {
      render(<DeviceCard device={createMockDevice()} compact />);
      // Compact mode should show minimal UI
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should apply selected styles when isSelected is true', () => {
      render(<DeviceCard device={createMockDevice()} isSelected />);
      // Get all article elements (mobile and desktop render both)
      const cards = screen.getAllByRole('article');
      expect(cards[0].className).toContain('border-primary');
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when card is clicked', async () => {
      const onClick = vi.fn();
      render(<DeviceCard device={createMockDevice()} onClick={onClick} />);

      // Get all article elements (mobile and desktop render both)
      const cards = screen.getAllByRole('article');
      fireEvent.click(cards[0]);

      expect(onClick).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Accessibility', () => {
  it('should have no accessibility violations for DeviceCard', async () => {
    const { container } = render(<DeviceCard device={createMockDevice()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA label', () => {
    render(<DeviceCard device={createMockDevice({ hostname: 'Test-PC' })} />);
    // Get all article elements (mobile and desktop render both)
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveAttribute('aria-label');
    expect(cards[0].getAttribute('aria-label')).toContain('Test-PC');
  });

  it('should be keyboard navigable when clickable', () => {
    const onClick = vi.fn();
    render(<DeviceCard device={createMockDevice()} onClick={onClick} />);

    // Get all article elements (mobile and desktop render both)
    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveAttribute('tabIndex', '0');
  });

  it('should handle Enter key for selection', () => {
    const onClick = vi.fn();
    render(<DeviceCard device={createMockDevice()} onClick={onClick} />);

    // Get all article elements (mobile and desktop render both)
    const cards = screen.getAllByRole('article');
    fireEvent.keyDown(cards[0], { key: 'Enter' });

    expect(onClick).toHaveBeenCalled();
  });

  it('should handle Space key for selection', () => {
    const onClick = vi.fn();
    render(<DeviceCard device={createMockDevice()} onClick={onClick} />);

    // Get all article elements (mobile and desktop render both)
    const cards = screen.getAllByRole('article');
    fireEvent.keyDown(cards[0], { key: ' ' });

    expect(onClick).toHaveBeenCalled();
  });

  it('should use color and icon for status (not color alone)', () => {
    render(<DeviceCard device={createMockDevice({ online: true })} />);
    // The status badge should contain text "Online" not just color
    const statuses = screen.getAllByText('Online');
    expect(statuses.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Platform Presenter Tests
// ============================================================================

describe('DeviceCardCompact', () => {
  it('should render minimal information', () => {
    const device = createMockDevice({ hostname: 'Compact-Test' });
    const state = {
      displayName: 'Compact-Test',
      deviceIcon: DEVICE_ICON_MAP.computer,
      statusColor: 'success' as const,
      isOnline: true,
      vendorName: undefined,
      deviceTypeConfidence: undefined,
      showConfidenceIndicator: false,
      connectionIcon: DEVICE_ICON_MAP.computer,
      handleConfigure: vi.fn(),
      handleBlock: vi.fn(),
      handleRename: vi.fn(),
      handleAssignStaticIp: vi.fn(),
      ariaLabel: 'Device Compact-Test, online, wired',
      formattedMac: 'AA:BB:CC:DD:EE:FF',
      statusText: 'Online',
      connectionText: 'Wired',
      deviceTypeLabel: 'Computer',
    };

    render(<DeviceCardCompact state={state} device={device} />);
    expect(screen.getByText('Compact-Test')).toBeInTheDocument();
  });
});

// ============================================================================
// Action Tests
// ============================================================================

describe('Device Actions', () => {
  it('should call onRename callback when rename action is triggered', async () => {
    const onRename = vi.fn();
    // Test the hook directly since UI actions are complex
    const device = createMockDevice();
    const TestComponent = () => {
      const state = useDeviceCard({ device, onRename });
      return (
        <button onClick={() => state.handleRename('New Name')}>Rename</button>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Rename'));
    expect(onRename).toHaveBeenCalledWith(device, 'New Name');
  });

  it('should call onAssignStaticIp callback', () => {
    const onAssignStaticIp = vi.fn();
    const device = createMockDevice();
    const TestComponent = () => {
      const state = useDeviceCard({ device, onAssignStaticIp });
      return (
        <button onClick={() => state.handleAssignStaticIp('192.168.1.200')}>
          Assign IP
        </button>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Assign IP'));
    expect(onAssignStaticIp).toHaveBeenCalledWith(device, '192.168.1.200');
  });
});
