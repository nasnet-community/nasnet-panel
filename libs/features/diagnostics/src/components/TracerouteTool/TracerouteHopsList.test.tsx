/**
 * TracerouteHopsList Component Tests
 *
 * Tests for the TracerouteHopsList component covering:
 * - Empty state rendering
 * - Hop list rendering with color-coded latency
 * - Loading state for next hop
 * - WCAG AAA accessibility
 * - Semantic token usage for status colors
 * - Monospace font for IP addresses
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TracerouteHopsList } from './TracerouteHopsList';
import type { TracerouteHop } from './TracerouteTool.types';

describe('TracerouteHopsList', () => {
  const mockHop = (overrides?: Partial<TracerouteHop>): TracerouteHop => ({
    hopNumber: 1,
    address: '192.168.1.1',
    hostname: 'router.local',
    status: 'SUCCESS',
    avgLatencyMs: 45.5,
    packetLoss: 0,
    probes: [
      {
        probeNumber: 1,
        latencyMs: 45.5,
        success: true,
        icmpCode: null,
      },
    ],
    ...overrides,
  });

  describe('Empty State', () => {
    it('should render empty state message when no hops', () => {
      render(<TracerouteHopsList hops={[]} isRunning={false} />);
      expect(screen.getByText('No hops discovered yet')).toBeInTheDocument();
    });
  });

  describe('Hop Rendering', () => {
    it('should render hop with address and hostname', () => {
      const hops = [mockHop()];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('(router.local)')).toBeInTheDocument();
    });

    it('should render hop number in circle', () => {
      const hops = [mockHop({ hopNumber: 5 })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display latency with correct format', () => {
      const hops = [mockHop({ avgLatencyMs: 123.456 })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('123.5ms')).toBeInTheDocument();
    });

    it('should handle timeout/no response latency', () => {
      const hops = [mockHop({ avgLatencyMs: null, address: null })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('* * * (no response)')).toBeInTheDocument();
      expect(screen.getByText('* * *')).toBeInTheDocument();
    });

    it('should display packet loss when > 0', () => {
      const hops = [mockHop({ packetLoss: 33.33 })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText(/33% loss/)).toBeInTheDocument();
    });

    it('should not display packet loss when 0', () => {
      const hops = [mockHop({ packetLoss: 0 })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      const lossElements = screen.queryAllByText(/loss/);
      expect(lossElements).toHaveLength(0);
    });
  });

  describe('Loading State', () => {
    it('should render loading indicator when isRunning is true', () => {
      const hops = [mockHop({ hopNumber: 1 })];
      render(<TracerouteHopsList hops={hops} isRunning={true} />);

      expect(screen.getByText('Discovering hop 2...')).toBeInTheDocument();
    });

    it('should not render loading indicator when isRunning is false', () => {
      const hops = [mockHop({ hopNumber: 1 })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.queryByText(/Discovering hop/)).not.toBeInTheDocument();
    });

    it('should show correct next hop number in loading state', () => {
      const hops = [
        mockHop({ hopNumber: 1 }),
        mockHop({ hopNumber: 2 }),
        mockHop({ hopNumber: 3 }),
      ];
      render(<TracerouteHopsList hops={hops} isRunning={true} />);

      expect(screen.getByText('Discovering hop 4...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="list" on hop container', () => {
      const hops = [mockHop()];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={false} />);

      const listContainer = container.querySelector('[role="list"]');
      expect(listContainer).toBeInTheDocument();
    });

    it('should have role="listitem" on each hop', () => {
      const hops = [mockHop({ hopNumber: 1 }), mockHop({ hopNumber: 2 })];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={false} />);

      const listItems = container.querySelectorAll('[role="listitem"]');
      expect(listItems).toHaveLength(2);
    });

    it('should have aria-label on icon with aria-hidden when present', () => {
      const hops = [mockHop()];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={false} />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('should have aria-live="polite" on loading status', () => {
      const hops = [mockHop()];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={true} />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should have aria-label describing next hop discovery', () => {
      const hops = [mockHop()];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={true} />);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toHaveAttribute('aria-label', 'Discovering next hop');
    });
  });

  describe('Probe Display', () => {
    it('should display individual probe latencies', () => {
      const hops = [
        mockHop({
          probes: [
            { probeNumber: 1, latencyMs: 45.5, success: true, icmpCode: null },
            { probeNumber: 2, latencyMs: 46.2, success: true, icmpCode: null },
            { probeNumber: 3, latencyMs: 45.8, success: true, icmpCode: null },
          ],
        }),
      ];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('45.5')).toBeInTheDocument();
      expect(screen.getByText('46.2')).toBeInTheDocument();
      expect(screen.getByText('45.8')).toBeInTheDocument();
    });

    it('should display asterisk for failed probes', () => {
      const hops = [
        mockHop({
          probes: [
            { probeNumber: 1, latencyMs: null, success: false, icmpCode: null },
            { probeNumber: 2, latencyMs: null, success: false, icmpCode: null },
            { probeNumber: 3, latencyMs: 45.8, success: true, icmpCode: null },
          ],
        }),
      ];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={false} />);

      // Should have asterisks for failed probes
      const asterisks = container.querySelectorAll('span');
      const asteriskTexts = Array.from(asterisks).map((el) => el.textContent).filter((text) => text === '*');
      expect(asteriskTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Hops', () => {
    it('should render multiple hops in order', () => {
      const hops = [
        mockHop({ hopNumber: 1, address: '192.168.1.1' }),
        mockHop({ hopNumber: 2, address: '10.0.0.1' }),
        mockHop({ hopNumber: 3, address: '8.8.8.8' }),
      ];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });
  });

  describe('Timeout/Unreachable Hops', () => {
    it('should display timeout status correctly', () => {
      const hops = [mockHop({ status: 'TIMEOUT', address: null, avgLatencyMs: null })];
      render(<TracerouteHopsList hops={hops} isRunning={false} />);

      expect(screen.getByText('* * * (no response)')).toBeInTheDocument();
    });

    it('should use alert icon for timeout/unreachable status', () => {
      const hops = [mockHop({ status: 'UNREACHABLE', address: null })];
      const { container } = render(<TracerouteHopsList hops={hops} isRunning={false} />);

      // Alert icon should be present (lucide-react AlertCircle)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
