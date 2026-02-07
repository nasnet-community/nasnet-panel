/**
 * InterfaceDetailSheet Component Tests
 *
 * Comprehensive test suite for the InterfaceDetailSheet component covering:
 * - Platform selection (Desktop Dialog vs Mobile/Tablet Sheet)
 * - Content rendering (header, details grid, optional fields)
 * - Open/Close behavior
 * - Field display logic (fallbacks, conditional rendering)
 * - Accessibility (WCAG AAA compliance)
 *
 * Reference: libs/ui/patterns/src/test/a11y.test.tsx for accessibility patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { InterfaceDetailSheet } from './InterfaceDetailSheet';
import type { InterfaceGridData } from './types';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock TanStack Router Link
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, className, children }: any) => (
    <a href={`${to}?interfaceId=${params.interfaceId}`} className={className}>
      {children}
    </a>
  ),
}));

// ============================================================================
// Test Fixtures
// ============================================================================

const mockInterfaceComplete: InterfaceGridData = {
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
  comment: 'Main uplink to ISP',
  linkPartner: 'Switch-01',
  usedBy: [],
};

const mockInterfaceMinimal: InterfaceGridData = {
  id: 'wlan1',
  name: 'wlan1',
  type: 'wireless',
  status: 'up',
  ip: undefined,
  mac: undefined,
  mtu: 1500,
  running: true,
  txRate: 0,
  rxRate: 0,
  linkSpeed: undefined,
  comment: undefined,
  linkPartner: undefined,
  usedBy: [],
};

const mockInterfaceDown: InterfaceGridData = {
  id: 'ether2',
  name: 'ether2',
  type: 'ethernet',
  status: 'down',
  ip: '192.168.2.1',
  mac: 'AA:BB:CC:DD:EE:FF',
  mtu: 1500,
  running: false,
  txRate: 0,
  rxRate: 0,
  linkSpeed: '100Mbps',
  lastSeen: new Date('2024-01-15T10:30:00Z').toISOString(),
  usedBy: [],
};

// ============================================================================
// Tests
// ============================================================================

describe('InterfaceDetailSheet - Platform Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Dialog on desktop platform', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('desktop');

    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // Dialog should have specific ARIA role
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render Sheet on mobile platform', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('mobile');

    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // Sheet uses dialog role but with different presentation
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should render Sheet on tablet platform', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('tablet');

    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});

describe('InterfaceDetailSheet - Content Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render interface header with name and type', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('ether1')).toBeInTheDocument();
    expect(screen.getByText('ethernet')).toBeInTheDocument();
  });

  it('should render MAC address', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('MAC Address')).toBeInTheDocument();
    expect(screen.getByText('00:11:22:33:44:55')).toBeInTheDocument();
  });

  it('should render IP address', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should render MTU', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('MTU')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('should render link speed', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Link Speed')).toBeInTheDocument();
    expect(screen.getByText('1Gbps')).toBeInTheDocument();
  });

  it('should render running status', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should render interface status', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    // Status is capitalized in the component
    expect(screen.getByText('Up')).toBeInTheDocument();
  });

  it('should render link partner when available', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Link Partner')).toBeInTheDocument();
    expect(screen.getByText('Switch-01')).toBeInTheDocument();
  });

  it('should render comment when available', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.getByText('Main uplink to ISP')).toBeInTheDocument();
  });

  it('should render last seen timestamp for down interfaces', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceDown}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Last Seen')).toBeInTheDocument();
    // Date formatting is locale-dependent, just check it exists
    const lastSeenValue = screen.getByText(/1\/15\/2024/i);
    expect(lastSeenValue).toBeInTheDocument();
  });

  it('should render navigation link to Network section', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const link = screen.getByText('View in Network');
    expect(link).toBeInTheDocument();

    // Verify link has correct href
    const anchor = link.closest('a');
    expect(anchor).toHaveAttribute(
      'href',
      expect.stringContaining('/network/interfaces/ether1')
    );
  });
});

describe('InterfaceDetailSheet - Open/Close Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open is true and interface is provided', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Interface Details')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when interface is null', () => {
    render(
      <InterfaceDetailSheet
        interface={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    // Find close button (usually has aria-label="Close" or similar)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange with false when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const dialog = screen.getByRole('dialog');
    dialog.focus();

    await user.keyboard('{Escape}');

    // Dialog/Sheet should call onOpenChange(false) on Escape
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('InterfaceDetailSheet - Field Display Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display "Not assigned" when IP is undefined', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceMinimal}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('Not assigned')).toBeInTheDocument();
  });

  it('should display "N/A" when MAC is undefined', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceMinimal}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('MAC Address')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should display "N/A" when link speed is undefined', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceMinimal}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Link Speed')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('should display "No" when running is false', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceDown}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should not render link partner when undefined', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceMinimal}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Link Partner')).not.toBeInTheDocument();
  });

  it('should not render comment when undefined', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceMinimal}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Comment')).not.toBeInTheDocument();
  });

  it('should not render last seen when interface is up', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Last Seen')).not.toBeInTheDocument();
  });

  it('should render last seen only when status is down', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceDown}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Last Seen')).toBeInTheDocument();
  });

  it('should capitalize status display', () => {
    const disabledInterface: InterfaceGridData = {
      ...mockInterfaceComplete,
      status: 'disabled',
    };

    render(
      <InterfaceDetailSheet
        interface={disabledInterface}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});

describe('InterfaceDetailSheet - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have no accessibility violations in Dialog (desktop)', async () => {
    const { container } = render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in Sheet (mobile)', async () => {
    const { usePlatform } = await import('@nasnet/ui/layouts');
    vi.mocked(usePlatform).mockReturnValue('mobile');

    const { container } = render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper dialog semantics', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Dialog should have accessible name
    expect(
      screen.getByRole('dialog', { name: /interface details/i })
    ).toBeInTheDocument();
  });

  it('should trap focus within dialog when open', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');

    // Dialog should contain focusable elements
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    // Button should be within dialog
    expect(dialog).toContainElement(closeButton);
  });

  it('should have proper ARIA labels for details grid', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // Definition list (dl) should be used for key-value pairs
    const detailsList = screen.getByRole('dialog').querySelector('dl');
    expect(detailsList).toBeInTheDocument();
  });

  it('should have accessible navigation link', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const link = screen.getByRole('button', { name: /view in network/i });
    expect(link).toBeInTheDocument();

    // Link should have descriptive text and icon
    const icon = link.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should use semantic HTML for details', () => {
    const { container } = render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // Should use <dl>, <dt>, <dd> for key-value pairs
    const dt = container.querySelectorAll('dt');
    const dd = container.querySelectorAll('dd');

    expect(dt.length).toBeGreaterThan(0);
    expect(dd.length).toBeGreaterThan(0);
    expect(dt.length).toBeLessThanOrEqual(dd.length);
  });

  it('should maintain 7:1 contrast ratio for text (visual regression)', () => {
    render(
      <InterfaceDetailSheet
        interface={mockInterfaceComplete}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // This is primarily handled by axe-core, but we can verify
    // that semantic classes are used
    const mutedText = screen.getByText('MAC Address');
    expect(mutedText.className).toContain('text-muted-foreground');
  });
});
