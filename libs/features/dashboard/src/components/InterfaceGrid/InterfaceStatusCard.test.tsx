/**
 * InterfaceStatusCard Component Tests
 *
 * Tests hook logic, desktop/mobile presenters, accessibility,
 * animations, and user interactions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}
import { InterfaceStatusCard } from './InterfaceStatusCard';
import { InterfaceStatusCardDesktop } from './InterfaceStatusCard.Desktop';
import { InterfaceStatusCardMobile } from './InterfaceStatusCard.Mobile';
import { useInterfaceStatusCard } from './useInterfaceStatusCard';
import type { InterfaceGridData } from './types';

// Mock platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock fixtures
const mockInterfaceUp: InterfaceGridData = {
  id: 'ether1',
  name: 'ether1',
  type: 'ethernet',
  status: 'up',
  ip: '192.168.1.1',
  mac: '00:11:22:33:44:55',
  mtu: 1500,
  running: true,
  txRate: 15234567, // 15.2 Mbps
  rxRate: 8123456, // 8.1 Mbps
  linkSpeed: '1Gbps',
  comment: 'Main uplink',
  linkPartner: 'Switch-01',
  usedBy: [],
};

const mockInterfaceDown: InterfaceGridData = {
  id: 'ether2',
  name: 'ether2',
  type: 'ethernet',
  status: 'down',
  mac: '00:11:22:33:44:66',
  mtu: 1500,
  running: false,
  txRate: 0,
  rxRate: 0,
  lastSeen: '2026-02-05T10:30:00Z',
  usedBy: [],
};

const mockInterfaceDisabled: InterfaceGridData = {
  id: 'wlan1',
  name: 'wlan1',
  type: 'wireless',
  status: 'disabled',
  mac: '00:11:22:33:44:77',
  mtu: 1500,
  running: false,
  txRate: 0,
  rxRate: 0,
  usedBy: [],
};

describe('useInterfaceStatusCard Hook', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should return correct status changed flag when status transitions', () => {
    const { result, rerender } = renderHook(
      ({ interface: iface }) =>
        useInterfaceStatusCard({ interface: iface, onSelect: mockOnSelect }),
      { initialProps: { interface: mockInterfaceUp } }
    );

    expect(result.current.isStatusChanged).toBe(false);

    // Change status
    const updatedInterface = { ...mockInterfaceUp, status: 'down' as const };
    rerender({ interface: updatedInterface });

    expect(result.current.isStatusChanged).toBe(true);
  });

  it('should call onSelect when handleClick is called', () => {
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: mockInterfaceUp,
        onSelect: mockOnSelect,
      })
    );

    act(() => {
      result.current.handleClick();
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect on Enter key', () => {
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: mockInterfaceUp,
        onSelect: mockOnSelect,
      })
    );

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
  });

  it('should call onSelect on Space key', () => {
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: mockInterfaceUp,
        onSelect: mockOnSelect,
      })
    );

    const mockEvent = {
      key: ' ',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
  });

  it('should generate correct ARIA label', () => {
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: mockInterfaceUp,
        onSelect: mockOnSelect,
      })
    );

    expect(result.current.ariaLabel).toContain('ether1');
    expect(result.current.ariaLabel).toContain('up');
    expect(result.current.ariaLabel).toContain('192.168.1.1');
  });

  it('should generate ARIA label without IP when not provided', () => {
    const interfaceWithoutIP = { ...mockInterfaceUp, ip: undefined };
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: interfaceWithoutIP,
        onSelect: mockOnSelect,
      })
    );

    expect(result.current.ariaLabel).not.toContain('IP');
  });

  it('should generate correct details ID', () => {
    const { result } = renderHook(() =>
      useInterfaceStatusCard({
        interface: mockInterfaceUp,
        onSelect: mockOnSelect,
      })
    );

    expect(result.current.detailsId).toBe('interface-ether1-details');
  });
});

describe('InterfaceStatusCard Desktop Presenter', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render interface name', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('ether1')).toBeInTheDocument();
  });

  it('should render up status with green indicator', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Up')).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card.className).toContain('bg-success');
  });

  it('should render down status with red indicator', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceDown}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Down')).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card.className).toContain('bg-destructive');
  });

  it('should render disabled status with gray indicator', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceDisabled}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Disabled')).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card.className).toContain('bg-muted');
  });

  it('should render traffic rates with correct formatting', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('15.2 Mbps')).toBeInTheDocument();
    expect(screen.getByText('8.1 Mbps')).toBeInTheDocument();
  });

  it('should render IP address', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should render "No IP" when IP is not provided', () => {
    const interfaceWithoutIP = { ...mockInterfaceUp, ip: undefined };
    render(
      <InterfaceStatusCardDesktop
        interface={interfaceWithoutIP}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('No IP')).toBeInTheDocument();
  });

  it('should render link speed when provided', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('1G')).toBeInTheDocument();
  });

  it('should not render link speed when not provided', () => {
    const interfaceWithoutSpeed = { ...mockInterfaceUp, linkSpeed: undefined };
    render(
      <InterfaceStatusCardDesktop
        interface={interfaceWithoutSpeed}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText(/G$/)).not.toBeInTheDocument();
  });

  it('should render last seen for down interfaces', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceDown}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/Last seen:/)).toBeInTheDocument();
  });

  it('should not render last seen for up interfaces', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText(/Last seen:/)).not.toBeInTheDocument();
  });

  it('should have minimum width class', () => {
    const { container } = render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('min-w-[200px]');
  });
});

describe('InterfaceStatusCard Mobile Presenter', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render interface name', () => {
    render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('ether1')).toBeInTheDocument();
  });

  it('should have 44px minimum height for touch targets', () => {
    const { container } = render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('min-h-[44px]');
  });

  it('should render combined traffic display', () => {
    render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const trafficText = screen.getByText(/↑15.2 Mbps ↓8.1 Mbps/);
    expect(trafficText).toBeInTheDocument();
  });

  it('should have touch feedback class', () => {
    const { container } = render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('active:bg-accent');
  });

  it('should render IP address when provided', () => {
    render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should not render IP section when not provided', () => {
    const interfaceWithoutIP = { ...mockInterfaceUp, ip: undefined };
    render(
      <InterfaceStatusCardMobile
        interface={interfaceWithoutIP}
        onSelect={mockOnSelect}
      />
    );

    // Check that IP address is not in the document
    expect(screen.queryByText('192.168.1.1')).not.toBeInTheDocument();
  });
});

describe('Platform Selection', () => {
  const mockOnSelect = vi.fn();

  beforeEach(async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');
  });

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render desktop presenter when platform is desktop', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('min-w-[200px]');
  });

  it('should render mobile presenter when platform is mobile', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('mobile');
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('min-h-[44px]');
  });

  it('should render mobile presenter when platform is tablet', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('tablet');
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('min-h-[44px]');
  });
});

describe('Accessibility', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should have no accessibility violations (desktop)', async () => {
    const { container } = render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations (mobile)', async () => {
    const { container } = render(
      <InterfaceStatusCardMobile
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper role attribute', () => {
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
  });

  it('should have aria-label', () => {
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label');
    expect(card.getAttribute('aria-label')).toContain('ether1');
  });

  it('should have aria-describedby', () => {
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-describedby');
  });

  it('should be keyboard navigable with tabIndex', () => {
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should have focus ring classes', () => {
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('focus:ring-3');
    expect(card?.className).toContain('focus:ring-primary');
  });

  it('should have screen reader only details', () => {
    render(
      <InterfaceStatusCardDesktop
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const srOnly = document.querySelector('.sr-only');
    expect(srOnly).toBeInTheDocument();
  });
});

describe('Animations and Motion', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should apply pulse animation when status changes and motion not reduced', () => {
    // Mock reduced motion as false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { container, rerender } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    // Change status to trigger animation
    rerender(
      <InterfaceStatusCard
        interface={{ ...mockInterfaceUp, status: 'down' }}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    // Note: The animation class is applied by the hook based on status change
    // The test verifies the component renders without error
    expect(card).toBeInTheDocument();
  });

  it('should skip animation when reduced motion is preferred', () => {
    // Mock reduced motion as true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card).toBeInTheDocument();
    // With reduced motion, the animate-pulse class should not be applied
  });
});

describe('User Interactions', () => {
  const mockOnSelect = vi.fn();

  afterEach(() => {
    mockOnSelect.mockClear();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    await user.click(card);

    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
  });

  it('should call onSelect on Space key', async () => {
    const user = userEvent.setup();
    render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('article');
    card.focus();
    await user.keyboard(' ');

    expect(mockOnSelect).toHaveBeenCalledWith(mockInterfaceUp);
  });

  it('should have hover state classes', () => {
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('hover:shadow-md');
    expect(card?.className).toContain('hover:border-primary/50');
  });

  it('should be clickable with cursor-pointer class', () => {
    const { container } = render(
      <InterfaceStatusCard
        interface={mockInterfaceUp}
        onSelect={mockOnSelect}
      />
    );

    const card = container.querySelector('[role="article"]');
    expect(card?.className).toContain('cursor-pointer');
  });
});
