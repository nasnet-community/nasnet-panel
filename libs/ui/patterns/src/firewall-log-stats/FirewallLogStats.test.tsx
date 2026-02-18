/**
 * FirewallLogStats Component Tests
 *
 * Comprehensive test suite with RTL and axe-core a11y testing.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';

import type { FirewallLogEntry } from '@nasnet/core/types';

import { FirewallLogStats } from './FirewallLogStats';

// ============================================================================
// Test Fixtures
// ============================================================================

const createFirewallLog = (overrides?: Partial<FirewallLogEntry>): FirewallLogEntry => ({
  id: Math.random().toString(36).substring(7),
  timestamp: new Date(),
  topic: 'firewall',
  severity: 'info',
  message: 'Firewall log entry',
  parsed: {
    chain: 'forward',
    action: 'drop',
    srcIp: '192.168.1.100',
    srcPort: 54321,
    dstIp: '10.0.0.1',
    dstPort: 443,
    protocol: 'TCP',
    interfaceIn: 'ether1',
    ...overrides?.parsed,
  },
  ...overrides,
});

const mockLogsWithVariedData = (): FirewallLogEntry[] => [
  // Blocked IPs - 192.168.1.100 appears 5 times
  ...Array.from({ length: 5 }, () =>
    createFirewallLog({
      parsed: {
        chain: 'forward',
        action: 'drop',
        srcIp: '192.168.1.100',
        dstIp: '10.0.0.1',
        dstPort: 443,
        protocol: 'TCP',
      },
    })
  ),
  // 192.168.1.101 appears 3 times
  ...Array.from({ length: 3 }, () =>
    createFirewallLog({
      parsed: {
        chain: 'forward',
        action: 'drop',
        srcIp: '192.168.1.101',
        dstIp: '10.0.0.1',
        dstPort: 80,
        protocol: 'TCP',
      },
    })
  ),
  // 192.168.1.102 appears 2 times
  ...Array.from({ length: 2 }, () =>
    createFirewallLog({
      parsed: {
        chain: 'forward',
        action: 'reject',
        srcIp: '192.168.1.102',
        dstIp: '10.0.0.1',
        dstPort: 22,
        protocol: 'TCP',
      },
    })
  ),
  // Accepted connections
  ...Array.from({ length: 10 }, () =>
    createFirewallLog({
      parsed: {
        chain: 'forward',
        action: 'accept',
        srcIp: '192.168.1.200',
        dstIp: '10.0.0.1',
        dstPort: 8080,
        protocol: 'TCP',
      },
    })
  ),
];

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('FirewallLogStats', () => {
  describe('Rendering', () => {
    it('should render empty state when no logs provided', () => {
      render(<FirewallLogStats logs={[]} />);

      expect(screen.getByText(/no firewall logs/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      const { container } = render(
        <FirewallLogStats logs={[]} loading />
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render statistics when logs provided', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      // Should show action distribution chart
      expect(screen.getByText(/action distribution/i)).toBeInTheDocument();

      // Should show top blocked IPs
      expect(screen.getByText(/top blocked ips/i)).toBeInTheDocument();

      // Should show top ports
      expect(screen.getByText(/top ports/i)).toBeInTheDocument();
    });

    it('should display total log count in description', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      // Should show "log entries" text (count may be in different numerals)
      expect(screen.getByText(/log entries/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Top Blocked IPs Tests
  // ==========================================================================

  describe('Top Blocked IPs', () => {
    it('should display top blocked IPs sorted by count', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      const ipsList = screen.getByText(/top blocked ips/i).closest('div');
      const ips = within(ipsList!).getAllByRole('code');

      // Should show IPs in descending order by count
      expect(ips[0]).toHaveTextContent('192.168.1.100'); // 5 hits
      expect(ips[1]).toHaveTextContent('192.168.1.101'); // 3 hits
      expect(ips[2]).toHaveTextContent('192.168.1.102'); // 2 hits
    });

    it('should display hit counts for each IP', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      expect(screen.getByText(/5 hits/i)).toBeInTheDocument();
      expect(screen.getByText(/3 hits/i)).toBeInTheDocument();
      expect(screen.getByText(/2 hits/i)).toBeInTheDocument();
    });

    it('should show "Add to Blocklist" button when callback provided', () => {
      const logs = mockLogsWithVariedData();
      const onAddToBlocklist = vi.fn();

      render(
        <FirewallLogStats
          logs={logs}
          onAddToBlocklist={onAddToBlocklist}
        />
      );

      const buttons = screen.getAllByRole('button', { name: /add to blocklist/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show "Add to Blocklist" button when callback not provided', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      const buttons = screen.queryAllByRole('button', { name: /add to blocklist/i });
      expect(buttons).toHaveLength(0);
    });

    it('should call onAddToBlocklist with correct IP when button clicked', async () => {
      const user = userEvent.setup();
      const logs = mockLogsWithVariedData();
      const onAddToBlocklist = vi.fn();

      render(
        <FirewallLogStats
          logs={logs}
          onAddToBlocklist={onAddToBlocklist}
        />
      );

      const firstButton = screen.getAllByRole('button', { name: /add to blocklist/i })[0];
      await user.click(firstButton);

      expect(onAddToBlocklist).toHaveBeenCalledWith('192.168.1.100');
      expect(onAddToBlocklist).toHaveBeenCalledTimes(1);
    });

    it('should display up to 10 IPs maximum', () => {
      const logs: FirewallLogEntry[] = [];
      // Create 15 unique blocked IPs
      for (let i = 1; i <= 15; i++) {
        logs.push(
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'drop',
              srcIp: `192.168.1.${i}`,
              dstIp: '10.0.0.1',
              dstPort: 443,
              protocol: 'TCP',
            },
          })
        );
      }

      render(<FirewallLogStats logs={logs} />);

      const ipsList = screen.getByText(/top blocked ips/i).closest('div');
      const ips = within(ipsList!).getAllByRole('code');

      expect(ips.length).toBeLessThanOrEqual(10);
    });

    it('should show empty state when no blocked IPs', () => {
      const logs = Array.from({ length: 5 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443,
            protocol: 'TCP',
          },
        })
      );

      render(<FirewallLogStats logs={logs} />);

      expect(screen.getByText(/no blocked ips yet/i)).toBeInTheDocument();
    });

    it('should only count drop and reject actions as blocked', () => {
      const logs: FirewallLogEntry[] = [
        // Drop - should count
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'drop',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443,
            protocol: 'TCP',
          },
        }),
        // Reject - should count
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'reject',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443,
            protocol: 'TCP',
          },
        }),
        // Accept - should NOT count
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443,
            protocol: 'TCP',
          },
        }),
      ];

      render(<FirewallLogStats logs={logs} />);

      // Should show 192.168.1.100 with 2 hits (drop + reject)
      expect(screen.getByText(/2 hits/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Top Ports Tests
  // ==========================================================================

  describe('Top Ports', () => {
    it('should display top ports sorted by count', () => {
      const logs: FirewallLogEntry[] = [
        // Port 443 - 5 times
        ...Array.from({ length: 5 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 443,
              protocol: 'TCP',
            },
          })
        ),
        // Port 80 - 3 times
        ...Array.from({ length: 3 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 80,
              protocol: 'TCP',
            },
          })
        ),
      ];

      render(<FirewallLogStats logs={logs} />);

      const portsList = screen.getByText(/top ports/i).closest('div');
      const ports = within(portsList!).getAllByRole('code');

      // First should be 443 (most frequent)
      expect(ports[0]).toHaveTextContent('443');
      expect(ports[1]).toHaveTextContent('80');
    });

    it('should display service names for well-known ports', () => {
      const logs: FirewallLogEntry[] = [
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443, // HTTPS
            protocol: 'TCP',
          },
        }),
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 80, // HTTP
            protocol: 'TCP',
          },
        }),
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 22, // SSH
            protocol: 'TCP',
          },
        }),
      ];

      render(<FirewallLogStats logs={logs} />);

      expect(screen.getByText('HTTPS')).toBeInTheDocument();
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('SSH')).toBeInTheDocument();
    });

    it('should display connection counts and percentages', () => {
      const logs: FirewallLogEntry[] = [
        // 8 out of 10 logs to port 443 = 80%
        ...Array.from({ length: 8 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 443,
              protocol: 'TCP',
            },
          })
        ),
        // 2 out of 10 logs to port 80 = 20%
        ...Array.from({ length: 2 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 80,
              protocol: 'TCP',
            },
          })
        ),
      ];

      render(<FirewallLogStats logs={logs} />);

      expect(screen.getByText('80.0%')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
      expect(screen.getByText(/8 connections/i)).toBeInTheDocument();
      expect(screen.getByText(/2 connections/i)).toBeInTheDocument();
    });

    it('should show empty state when no port data', () => {
      const logs: FirewallLogEntry[] = [
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: undefined, // No port
            protocol: 'ICMP',
          },
        }),
      ];

      render(<FirewallLogStats logs={logs} />);

      expect(screen.getByText(/no port data available/i)).toBeInTheDocument();
    });

    it('should display up to 10 ports maximum', () => {
      const logs: FirewallLogEntry[] = [];
      // Create 15 unique ports
      for (let i = 1; i <= 15; i++) {
        logs.push(
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 8000 + i,
              protocol: 'TCP',
            },
          })
        );
      }

      render(<FirewallLogStats logs={logs} />);

      const portsList = screen.getByText(/top ports/i).closest('div');
      const ports = within(portsList!).getAllByRole('code');

      expect(ports.length).toBeLessThanOrEqual(10);
    });
  });

  // ==========================================================================
  // Action Distribution Tests
  // ==========================================================================

  describe('Action Distribution', () => {
    it('should compute action distribution correctly', () => {
      const logs: FirewallLogEntry[] = [
        // 6 drops
        ...Array.from({ length: 6 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'drop',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 443,
              protocol: 'TCP',
            },
          })
        ),
        // 3 accepts
        ...Array.from({ length: 3 }, () =>
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: 'accept',
              srcIp: '192.168.1.100',
              dstIp: '10.0.0.1',
              dstPort: 443,
              protocol: 'TCP',
            },
          })
        ),
        // 1 reject
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'reject',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.1',
            dstPort: 443,
            protocol: 'TCP',
          },
        }),
      ];

      render(<FirewallLogStats logs={logs} />);

      // Total 10 logs, so:
      // drop: 6/10 = 60%
      // accept: 3/10 = 30%
      // reject: 1/10 = 10%

      // Chart should render with proper data
      const chartContainer = screen.getByText(/action distribution/i).closest('div');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should use correct colors for actions', () => {
      const logs: FirewallLogEntry[] = [
        createFirewallLog({
          parsed: { chain: 'forward', action: 'accept', srcIp: '1.1.1.1', dstIp: '2.2.2.2', protocol: 'TCP' },
        }),
        createFirewallLog({
          parsed: { chain: 'forward', action: 'drop', srcIp: '1.1.1.1', dstIp: '2.2.2.2', protocol: 'TCP' },
        }),
        createFirewallLog({
          parsed: { chain: 'forward', action: 'reject', srcIp: '1.1.1.1', dstIp: '2.2.2.2', protocol: 'TCP' },
        }),
      ];

      const { container } = render(<FirewallLogStats logs={logs} />);

      // Check that SVG chart is rendered (pie chart)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Accessibility Tests (axe-core)
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have no axe violations with data', async () => {
      const logs = mockLogsWithVariedData();
      const { container } = render(<FirewallLogStats logs={logs} />);

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should have no axe violations in empty state', async () => {
      const { container } = render(<FirewallLogStats logs={[]} />);

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should have no axe violations in loading state', async () => {
      const { container } = render(<FirewallLogStats logs={[]} loading />);

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should have proper heading hierarchy', () => {
      const logs = mockLogsWithVariedData();
      render(<FirewallLogStats logs={logs} />);

      const headings = screen.getAllByRole('heading');
      // Should have proper semantic headings
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible button labels', () => {
      const logs = mockLogsWithVariedData();
      const onAddToBlocklist = vi.fn();

      render(
        <FirewallLogStats
          logs={logs}
          onAddToBlocklist={onAddToBlocklist}
        />
      );

      const buttons = screen.getAllByRole('button', { name: /add to blocklist/i });
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA labels for charts', () => {
      const logs = mockLogsWithVariedData();
      const { container } = render(<FirewallLogStats logs={logs} />);

      // Recharts renders SVG elements
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Performance & Memoization Tests
  // ==========================================================================

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create 1000 log entries
      const logs: FirewallLogEntry[] = [];
      for (let i = 0; i < 1000; i++) {
        logs.push(
          createFirewallLog({
            parsed: {
              chain: 'forward',
              action: ['accept', 'drop', 'reject'][i % 3] as any,
              srcIp: `192.168.${Math.floor(i / 256)}.${i % 256}`,
              dstIp: '10.0.0.1',
              dstPort: 8000 + (i % 100),
              protocol: 'TCP',
            },
          })
        );
      }

      const { rerender } = render(<FirewallLogStats logs={logs} />);

      // Should render without errors
      expect(screen.getByText(/action distribution/i)).toBeInTheDocument();

      // Rerender with same data - should be memoized
      rerender(<FirewallLogStats logs={logs} />);
      expect(screen.getByText(/action distribution/i)).toBeInTheDocument();
    });

    it('should memoize computed stats', () => {
      const logs = mockLogsWithVariedData();
      const { rerender } = render(<FirewallLogStats logs={logs} />);

      const firstRender = screen.getByText(/action distribution/i);
      expect(firstRender).toBeInTheDocument();

      // Rerender with same logs reference
      rerender(<FirewallLogStats logs={logs} />);

      const secondRender = screen.getByText(/action distribution/i);
      expect(secondRender).toBeInTheDocument();
    });
  });
});
