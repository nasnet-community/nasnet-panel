/**
 * NetworkTopology Component Tests
 *
 * Tests for rendering, accessibility, and interactions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

import { NetworkTopologyDesktop } from './NetworkTopology.Desktop';
import { NetworkTopologyMobile } from './NetworkTopology.Mobile';

// Mock ResizeObserver for JSDOM
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', mockResizeObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

// Mock useReducedMotion hook
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

// Test fixtures
const mockRouter = {
  id: 'router-1',
  name: 'Main Router',
  model: 'RB5009UG+S+IN',
  status: 'online' as const,
};

const mockWanInterfaces = [
  { id: 'wan-1', name: 'WAN1', ip: '203.0.113.1', status: 'connected' as const, provider: 'ISP A' },
  { id: 'wan-2', name: 'WAN2', ip: '203.0.113.2', status: 'disconnected' as const },
];

const mockLanNetworks = [
  { id: 'lan-1', name: 'Main LAN', cidr: '192.168.1.0/24', gateway: '192.168.1.1', deviceCount: 10 },
];

const mockDevices = [
  { id: 'dev-1', name: 'Desktop PC', ip: '192.168.1.10', type: 'computer' as const, status: 'online' as const },
];

const defaultProps = {
  router: mockRouter,
  wanInterfaces: mockWanInterfaces,
  lanNetworks: mockLanNetworks,
};

describe('NetworkTopologyDesktop', () => {
  describe('rendering', () => {
    it('renders the SVG topology diagram', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      const svg = screen.getByRole('img', { name: /network topology/i });
      expect(svg).toBeInTheDocument();
    });

    it('renders the router node with correct label', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('Main Router')).toBeInTheDocument();
    });

    it('renders all WAN interface nodes', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('WAN1')).toBeInTheDocument();
      expect(screen.getByText('WAN2')).toBeInTheDocument();
    });

    it('renders all LAN network nodes', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('Main LAN')).toBeInTheDocument();
    });

    it('renders device nodes when showDevices is true', () => {
      render(
        <NetworkTopologyDesktop
          {...defaultProps}
          devices={mockDevices}
          showDevices={true}
        />
      );

      expect(screen.getByText('Desktop PC')).toBeInTheDocument();
    });

    it('hides device nodes when showDevices is false', () => {
      render(
        <NetworkTopologyDesktop
          {...defaultProps}
          devices={mockDevices}
          showDevices={false}
        />
      );

      expect(screen.queryByText('Desktop PC')).not.toBeInTheDocument();
    });

    it('displays the legend', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders IP addresses as sublabels', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    });

    it('renders CIDR notation for LAN networks', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper SVG accessibility attributes', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      const svg = screen.getByRole('img', { name: /network topology diagram/i });
      expect(svg).toHaveAttribute('aria-label');
    });

    it('includes SVG title and description', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      // Title element should be present for screen readers
      expect(screen.getByText('Network Topology')).toBeInTheDocument();
    });

    it('nodes are focusable via keyboard', async () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      const user = userEvent.setup();

      // Tab into the topology
      await user.tab();

      // Should be able to navigate through nodes
      const focusableElements = screen.getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('nodes have accessible labels', () => {
      render(<NetworkTopologyDesktop {...defaultProps} />);

      // Router should have aria-label
      const routerNode = screen.getByRole('button', { name: /Main Router.*online/i });
      expect(routerNode).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('renders with no WAN interfaces', () => {
      render(
        <NetworkTopologyDesktop
          router={mockRouter}
          wanInterfaces={[]}
          lanNetworks={mockLanNetworks}
        />
      );

      const svg = screen.getByRole('img', { name: /network topology diagram/i });
      expect(svg).toBeInTheDocument();
      expect(screen.getByText('Main Router')).toBeInTheDocument();
    });

    it('renders with no LAN networks', () => {
      render(
        <NetworkTopologyDesktop
          router={mockRouter}
          wanInterfaces={mockWanInterfaces}
          lanNetworks={[]}
        />
      );

      const svg = screen.getByRole('img', { name: /network topology diagram/i });
      expect(svg).toBeInTheDocument();
    });
  });
});

describe('NetworkTopologyMobile', () => {
  describe('rendering', () => {
    it('renders the router card', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      expect(screen.getByText('Main Router')).toBeInTheDocument();
      expect(screen.getByText('RB5009UG+S+IN')).toBeInTheDocument();
    });

    it('renders collapsible WAN section', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      expect(screen.getByText('WAN Interfaces')).toBeInTheDocument();
    });

    it('renders collapsible LAN section', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      expect(screen.getByText('LAN Networks')).toBeInTheDocument();
    });

    it('renders device section when devices provided', () => {
      render(<NetworkTopologyMobile {...defaultProps} devices={mockDevices} />);

      expect(screen.getByText('Devices')).toBeInTheDocument();
    });

    it('shows correct item counts in section headers', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      // Should show "2" for WAN interfaces
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('expands sections when clicked', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyMobile {...defaultProps} defaultExpanded={false} />);

      const wanButton = screen.getByRole('button', { name: /WAN Interfaces/i });
      await user.click(wanButton);

      expect(screen.getByText('WAN1')).toBeInTheDocument();
    });

    it('collapses sections when clicked again', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyMobile {...defaultProps} defaultExpanded={true} />);

      const wanButton = screen.getByRole('button', { name: /WAN Interfaces/i });

      // Section should be expanded
      expect(screen.getByText('WAN1')).toBeInTheDocument();

      // Click to collapse
      await user.click(wanButton);

      // WAN1 should no longer be visible
      expect(screen.queryByText('WAN1')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper region aria-label', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Network topology overview');
    });

    it('section buttons have aria-expanded', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      const wanButton = screen.getByRole('button', { name: /WAN Interfaces/i });
      expect(wanButton).toHaveAttribute('aria-expanded');
    });

    it('section buttons have aria-controls', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      const wanButton = screen.getByRole('button', { name: /WAN Interfaces/i });
      expect(wanButton).toHaveAttribute('aria-controls');
    });
  });

  describe('status badges', () => {
    it('shows Online badge for online router', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('shows Connected badge for connected WAN', () => {
      render(<NetworkTopologyMobile {...defaultProps} defaultExpanded={true} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('shows Disconnected badge for disconnected WAN', () => {
      render(<NetworkTopologyMobile {...defaultProps} defaultExpanded={true} />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('connection summary', () => {
    it('shows connection counts', () => {
      render(<NetworkTopologyMobile {...defaultProps} />);

      expect(screen.getByText(/1 Connected/i)).toBeInTheDocument();
      expect(screen.getByText(/1 Disconnected/i)).toBeInTheDocument();
    });
  });
});
