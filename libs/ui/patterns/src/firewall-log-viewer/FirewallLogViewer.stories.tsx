/**
 * FirewallLogViewer Storybook Stories
 *
 * Comprehensive stories covering various states and scenarios.
 * Includes both Desktop and Mobile presenters.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import type { FirewallLogEntry } from '@nasnet/core/types';

import { FirewallLogViewer } from './FirewallLogViewer';

import type { Meta, StoryObj } from '@storybook/react';

// Mock data generators
const createMockLog = (
  id: string,
  action: 'accept' | 'drop' | 'reject',
  timestamp: Date,
  srcIp: string,
  dstIp: string,
  protocol: 'TCP' | 'UDP' | 'ICMP',
  prefix?: string
): FirewallLogEntry => ({
  id,
  timestamp,
  topic: 'firewall',
  severity: 'info',
  message: `${action} ${protocol} from ${srcIp} to ${dstIp}`,
  parsed: {
    action,
    chain: action === 'accept' ? 'input' : 'forward',
    srcIp,
    srcPort: protocol !== 'ICMP' ? Math.floor(Math.random() * 60000) + 1024 : undefined,
    dstIp,
    dstPort: protocol !== 'ICMP' ? Math.floor(Math.random() * 60000) + 1024 : undefined,
    protocol,
    prefix,
    interfaceIn: 'ether1',
    interfaceOut: action === 'accept' ? undefined : 'ether2',
  },
});

// Generate sample logs
const generateSampleLogs = (count: number): FirewallLogEntry[] => {
  const now = new Date();
  const actions: Array<'accept' | 'drop' | 'reject'> = ['accept', 'drop', 'reject'];
  const protocols: Array<'TCP' | 'UDP' | 'ICMP'> = ['TCP', 'UDP', 'ICMP'];
  const prefixes = ['BLOCKED', 'ALLOWED', 'SUSPICIOUS', undefined];

  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute apart
    const action = actions[i % actions.length];
    const protocol = protocols[i % protocols.length];
    const prefix = prefixes[i % prefixes.length];

    return createMockLog(
      `log-${i + 1}`,
      action,
      timestamp,
      `192.168.${Math.floor(i / 256)}.${i % 256}`,
      `10.0.${Math.floor(i / 256)}.${i % 256}`,
      protocol,
      prefix
    );
  });
};

// Sample logs for stories
const sampleLogs = generateSampleLogs(25);

const meta: Meta<typeof FirewallLogViewer> = {
  title: 'Patterns/FirewallLogViewer',
  component: FirewallLogViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
FirewallLogViewer displays firewall logs with filtering, sorting, and real-time updates.

**Features:**
- Real-time log viewing with auto-refresh
- Filtering by time, action, IP, port, prefix
- Log statistics with top blocked IPs and ports
- Virtualized rendering for 100+ logs
- Clickable prefixes for rule navigation
- CSV export
- Responsive layouts (Mobile/Desktop)

**Platform Variants:**
- **Mobile (<640px):** Card-based layout with bottom sheet filters
- **Desktop (≥640px):** Split view with sidebar filters and table

**Accessibility:**
- WCAG AAA compliant
- 44px minimum touch targets on mobile
- Full keyboard navigation
- Screen reader support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID to fetch logs for',
    },
    onPrefixClick: {
      action: 'prefix-clicked',
      description: 'Callback when log prefix is clicked for navigation',
    },
    onAddToBlocklist: {
      action: 'add-to-blocklist',
      description: 'Callback when "Add to Blocklist" is clicked from stats',
    },
    className: {
      control: 'text',
      description: 'Container className',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FirewallLogViewer>;

/**
 * Default state with sample logs.
 * Shows typical log viewer with mix of accept/drop/reject actions.
 */
export const Default: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
    onAddToBlocklist: (ip) => {
      console.log('Add to blocklist:', ip);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs,
      isLoading: false,
      error: null,
    },
  },
};

/**
 * Loading state while fetching logs.
 * Shows skeleton or loading indicator.
 */
export const Loading: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: true,
      error: null,
    },
    docs: {
      description: {
        story: 'Loading state displayed while fetching logs from the router.',
      },
    },
  },
};

/**
 * Error state when log fetch fails.
 * Shows error message with retry option.
 */
export const ErrorState: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: false,
      error: new Error('Failed to connect to router: Connection timeout'),
    },
    docs: {
      description: {
        story: 'Error state when log fetching fails. Displays user-friendly error message.',
      },
    },
  },
};

/**
 * Empty state with no logs found.
 * Shows when filters return no results or no logs exist.
 */
export const Empty: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: false,
      error: null,
    },
    docs: {
      description: {
        story: 'Empty state when no logs match the current filters or no logs exist.',
      },
    },
  },
};

/**
 * With active filters applied.
 * Shows filtered logs with filter badge count.
 */
export const WithFilters: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs.filter((log) => log.parsed.action === 'drop'),
      isLoading: false,
      error: null,
      activeFilterCount: 2,
      filters: {
        timeRangePreset: 'last1h',
        actions: ['drop'],
        srcIp: '192.168.1.*',
      },
    },
    docs: {
      description: {
        story: 'Filtered view showing only dropped packets from 192.168.1.* subnet in the last hour.',
      },
    },
  },
};

/**
 * With stats panel expanded.
 * Shows log statistics with top blocked IPs and ports.
 */
export const WithStats: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
    onAddToBlocklist: (ip) => {
      console.log('Add to blocklist:', ip);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs,
      isLoading: false,
      error: null,
      expandedStats: true,
    },
    docs: {
      description: {
        story: 'Log viewer with statistics panel expanded, showing top blocked IPs and ports.',
      },
    },
  },
};

/**
 * With log selected showing details.
 * Shows expanded detail panel for selected log entry.
 */
export const WithSelectedLog: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs,
      isLoading: false,
      error: null,
      selectedLog: sampleLogs[0],
    },
    docs: {
      description: {
        story: 'Log viewer with a log entry selected, showing full details in the detail panel.',
      },
    },
  },
};

/**
 * With auto-refresh enabled.
 * Shows active auto-refresh with interval selector.
 */
export const WithAutoRefresh: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: sampleLogs,
      isLoading: false,
      error: null,
      isAutoRefreshEnabled: true,
      refreshInterval: 3000,
    },
    docs: {
      description: {
        story: 'Log viewer with auto-refresh enabled at 3-second intervals. Useful for monitoring live traffic.',
      },
    },
  },
};

/**
 * Large dataset (100+ logs).
 * Demonstrates virtualization performance with many logs.
 */
export const LargeDataset: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
  },
  parameters: {
    mockData: {
      logs: generateSampleLogs(150),
      isLoading: false,
      error: null,
      totalCount: 150,
      visibleCount: 150,
    },
    docs: {
      description: {
        story: 'Log viewer with 150+ entries demonstrating virtualized rendering performance.',
      },
    },
  },
};

/**
 * Mobile layout variant.
 * Forces mobile presenter for demonstration.
 */
export const MobileLayout: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
    onAddToBlocklist: (ip) => {
      console.log('Add to blocklist:', ip);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs.slice(0, 10),
      isLoading: false,
      error: null,
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile layout with card-based log entries, bottom sheet filters, and 44px touch targets.',
      },
    },
  },
};

/**
 * Sorted by source IP ascending.
 * Shows logs sorted by different criteria.
 */
export const SortedBySourceIP: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: [...sampleLogs].sort((a, b) =>
        (a.parsed.srcIp || '').localeCompare(b.parsed.srcIp || '')
      ),
      isLoading: false,
      error: null,
      sortBy: 'srcIp',
      sortOrder: 'asc',
    },
    docs: {
      description: {
        story: 'Logs sorted by source IP address in ascending order.',
      },
    },
  },
};

/**
 * With search query applied.
 * Shows logs filtered by search term.
 */
export const WithSearch: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: sampleLogs.filter((log) =>
        log.message.toLowerCase().includes('192.168.1')
      ),
      isLoading: false,
      error: null,
      searchQuery: '192.168.1',
    },
    docs: {
      description: {
        story: 'Logs filtered by search query "192.168.1", showing only matching entries.',
      },
    },
  },
};

/**
 * Only drop actions (security monitoring).
 * Focused view for security analysis.
 */
export const SecurityMonitoring: Story = {
  args: {
    routerId: 'router-1',
    onPrefixClick: (prefix) => {
      console.log('Navigate to prefix:', prefix);
    },
    onAddToBlocklist: (ip) => {
      console.log('Add to blocklist:', ip);
    },
  },
  parameters: {
    mockData: {
      logs: sampleLogs.filter((log) => log.parsed.action === 'drop'),
      isLoading: false,
      error: null,
      activeFilterCount: 1,
      expandedStats: true,
      filters: {
        timeRangePreset: 'last24h',
        actions: ['drop'],
      },
    },
    docs: {
      description: {
        story: 'Security monitoring view showing only dropped packets with statistics panel for threat analysis.',
      },
    },
  },
};

/**
 * Refreshing state.
 * Shows refresh indicator while data updates.
 */
export const Refreshing: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    mockData: {
      logs: sampleLogs,
      isLoading: true, // Shows "Refreshing..." indicator
      error: null,
    },
    docs: {
      description: {
        story: 'Active refresh state showing "Refreshing..." indicator while keeping current logs visible.',
      },
    },
  },
};
