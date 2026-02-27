/**
 * FirewallLogStats Storybook Stories
 *
 * Demonstrates FirewallLogStats component variants and use cases.
 */

import { fn } from 'storybook/test';

import type { FirewallLogEntry } from '@nasnet/core/types';

import { FirewallLogStats } from './FirewallLogStats';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Test Data Generators
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

/**
 * Generate realistic firewall logs with varied data
 */
function generateRealisticLogs(count: number): FirewallLogEntry[] {
  const logs: FirewallLogEntry[] = [];
  const actions = ['accept', 'drop', 'reject'] as const;
  const ips = [
    '203.0.113.42', // Most frequent blocked IP
    '198.51.100.88',
    '192.0.2.15',
    '172.217.14.206', // Google
    '151.101.1.140', // Fastly
    '104.244.42.129', // Twitter
  ];
  const ports = [443, 80, 22, 3389, 8080, 53, 8443, 3306, 5432, 27017];

  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const srcIp = ips[Math.floor(Math.random() * ips.length)];
    const dstPort = ports[Math.floor(Math.random() * ports.length)];

    logs.push(
      createFirewallLog({
        parsed: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chain: ['input', 'forward', 'output'][Math.floor(Math.random() * 3)] as any,
          action,
          srcIp,
          dstIp: '10.0.0.1',
          dstPort,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          protocol: ['TCP', 'UDP'][Math.floor(Math.random() * 2)] as any,
          interfaceIn: 'ether1',
        },
      })
    );
  }

  return logs;
}

/**
 * Generate logs heavily skewed toward blocked traffic
 */
function generateBlockedTrafficLogs(): FirewallLogEntry[] {
  const logs: FirewallLogEntry[] = [];

  // 203.0.113.42 - Most blocked (50 times)
  for (let i = 0; i < 50; i++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'input',
          action: 'drop',
          srcIp: '203.0.113.42',
          dstIp: '10.0.0.1',
          dstPort: [22, 3389, 23, 21][i % 4],
          protocol: 'TCP',
        },
      })
    );
  }

  // 198.51.100.88 - Second most blocked (30 times)
  for (let i = 0; i < 30; i++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'input',
          action: 'drop',
          srcIp: '198.51.100.88',
          dstIp: '10.0.0.1',
          dstPort: [80, 443, 8080][i % 3],
          protocol: 'TCP',
        },
      })
    );
  }

  // 192.0.2.15 - Third most blocked (20 times)
  for (let i = 0; i < 20; i++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'input',
          action: 'reject',
          srcIp: '192.0.2.15',
          dstIp: '10.0.0.1',
          dstPort: 22,
          protocol: 'TCP',
        },
      })
    );
  }

  // Add some accepted traffic
  for (let i = 0; i < 100; i++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'forward',
          action: 'accept',
          srcIp: '192.168.1.100',
          dstIp: '172.217.14.206',
          dstPort: [443, 80][i % 2],
          protocol: 'TCP',
        },
      })
    );
  }

  return logs;
}

/**
 * Generate logs with port scan pattern
 */
function generatePortScanLogs(): FirewallLogEntry[] {
  const logs: FirewallLogEntry[] = [];
  const attackerIP = '203.0.113.13';

  // Scan ports 1-100
  for (let port = 1; port <= 100; port++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'input',
          action: 'drop',
          srcIp: attackerIP,
          dstIp: '10.0.0.1',
          dstPort: port,
          protocol: 'TCP',
        },
      })
    );
  }

  // Add legitimate traffic
  for (let i = 0; i < 50; i++) {
    logs.push(
      createFirewallLog({
        parsed: {
          chain: 'forward',
          action: 'accept',
          srcIp: '192.168.1.100',
          dstIp: '8.8.8.8',
          dstPort: [443, 80, 53][i % 3],
          protocol: i % 3 === 2 ? 'UDP' : 'TCP',
        },
      })
    );
  }

  return logs;
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof FirewallLogStats> = {
  title: 'UI Patterns/Firewall/FirewallLogStats',
  component: FirewallLogStats,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
FirewallLogStats displays statistics for firewall logs with:

- **Action Distribution**: Pie chart showing accept/drop/reject breakdown
- **Top Blocked IPs**: List of most frequently blocked source IPs
- **Top Ports**: List of most accessed destination ports with service names

Implements Headless + Platform Presenters pattern:
- **Mobile (<640px)**: Compact cards, stacked layout, 44px touch targets
- **Desktop (>=640px)**: Side-by-side layout with detailed stats

Uses Recharts for the pie chart with Firewall category accent color (Orange #F97316).
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    logs: {
      description: 'Array of firewall log entries to compute statistics from',
      control: false,
    },
    onAddToBlocklist: {
      description: 'Callback when "Add to Blocklist" button is clicked',
      action: 'addToBlocklist',
    },
    loading: {
      description: 'Loading state',
      control: 'boolean',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FirewallLogStats>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state with realistic mixed traffic
 */
export const Default: Story = {
  args: {
    logs: generateRealisticLogs(200),
    onAddToBlocklist: fn(),
  },
};

/**
 * Empty state with no logs
 */
export const Empty: Story = {
  args: {
    logs: [],
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    logs: [],
    loading: true,
  },
};

/**
 * Heavily blocked traffic scenario (DDoS/attack pattern)
 */
export const HeavyBlockedTraffic: Story = {
  args: {
    logs: generateBlockedTrafficLogs(),
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Scenario with heavy blocked traffic from multiple attackers. Top Blocked IPs shows the most aggressive sources.',
      },
    },
  },
};

/**
 * Port scan attack pattern
 */
export const PortScanPattern: Story = {
  args: {
    logs: generatePortScanLogs(),
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Port scan attack pattern where single IP scans ports 1-100. Notice the attacker IP dominates Top Blocked IPs.',
      },
    },
  },
};

/**
 * Without blocklist callback (read-only mode)
 */
export const WithoutBlocklistAction: Story = {
  args: {
    logs: generateBlockedTrafficLogs(),
    onAddToBlocklist: undefined, // No callback
  },
  parameters: {
    docs: {
      description: {
        story:
          'Read-only mode without "Add to Blocklist" buttons. Useful for reporting dashboards.',
      },
    },
  },
};

/**
 * Mostly accepted traffic (healthy network)
 */
export const HealthyTraffic: Story = {
  args: {
    logs: [
      // 95% accepted
      ...Array.from({ length: 95 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '8.8.8.8',
            dstPort: [443, 80, 53][Math.floor(Math.random() * 3)],
            protocol: 'TCP',
          },
        })
      ),
      // 5% dropped
      ...Array.from({ length: 5 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'input',
            action: 'drop',
            srcIp: '203.0.113.42',
            dstIp: '10.0.0.1',
            dstPort: 22,
            protocol: 'TCP',
          },
        })
      ),
    ],
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Healthy network scenario with 95% accepted traffic and minimal blocks.',
      },
    },
  },
};

/**
 * Large dataset (1000+ logs)
 */
export const LargeDataset: Story = {
  args: {
    logs: generateRealisticLogs(1000),
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Performance test with 1000+ log entries. Component uses memoization for efficient re-renders.',
      },
    },
  },
};

/**
 * Single blocked IP dominating
 */
export const SingleAttacker: Story = {
  args: {
    logs: [
      // Single attacker - 150 attempts
      ...Array.from({ length: 150 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'input',
            action: 'drop',
            srcIp: '203.0.113.666',
            dstIp: '10.0.0.1',
            dstPort: [22, 3389, 23, 21, 445][Math.floor(Math.random() * 5)],
            protocol: 'TCP',
          },
        })
      ),
      // Background noise
      ...Array.from({ length: 50 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '8.8.8.8',
            dstPort: 443,
            protocol: 'TCP',
          },
        })
      ),
    ],
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single attacker IP dominates the blocked list with 150+ attempts on various services.',
      },
    },
  },
};

/**
 * Database server traffic pattern
 */
export const DatabaseServerTraffic: Story = {
  args: {
    logs: [
      // MySQL traffic - 100 connections
      ...Array.from({ length: 100 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.5',
            dstPort: 3306, // MySQL
            protocol: 'TCP',
          },
        })
      ),
      // PostgreSQL traffic - 80 connections
      ...Array.from({ length: 80 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.101',
            dstIp: '10.0.0.6',
            dstPort: 5432, // PostgreSQL
            protocol: 'TCP',
          },
        })
      ),
      // MongoDB traffic - 60 connections
      ...Array.from({ length: 60 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.102',
            dstIp: '10.0.0.7',
            dstPort: 27017, // MongoDB
            protocol: 'TCP',
          },
        })
      ),
      // Redis traffic - 40 connections
      ...Array.from({ length: 40 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.103',
            dstIp: '10.0.0.8',
            dstPort: 6379, // Redis
            protocol: 'TCP',
          },
        })
      ),
    ],
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Database server traffic pattern showing MySQL, PostgreSQL, MongoDB, and Redis connections with service name lookup.',
      },
    },
  },
};

/**
 * Web server traffic pattern
 */
export const WebServerTraffic: Story = {
  args: {
    logs: [
      // HTTPS traffic - 200 connections
      ...Array.from({ length: 200 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.10',
            dstPort: 443,
            protocol: 'TCP',
          },
        })
      ),
      // HTTP traffic - 50 connections
      ...Array.from({ length: 50 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.10',
            dstPort: 80,
            protocol: 'TCP',
          },
        })
      ),
      // Alternative ports
      ...Array.from({ length: 30 }, () =>
        createFirewallLog({
          parsed: {
            chain: 'forward',
            action: 'accept',
            srcIp: '192.168.1.100',
            dstIp: '10.0.0.10',
            dstPort: 8080,
            protocol: 'TCP',
          },
        })
      ),
    ],
    onAddToBlocklist: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Web server traffic pattern showing HTTPS, HTTP, and alternative port usage.',
      },
    },
  },
};
