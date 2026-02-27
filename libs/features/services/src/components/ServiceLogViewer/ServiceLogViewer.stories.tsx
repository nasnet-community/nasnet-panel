/**
 * ServiceLogViewer Storybook Stories
 *
 * Demonstrates all visual states of the ServiceLogViewer component.
 * The component depends on useServiceLogs (GraphQL query + subscription);
 * those hooks must be mocked via MSW in Storybook for full integration.
 * The stories below document the expected states and pass mockData parameters
 * that MSW handlers can intercept.
 *
 * Platform presenters:
 * - Desktop / Tablet (≥640px): Virtual-scrolled table with dropdown filters
 * - Mobile (<640px): Card-based rows with bottom-sheet filters/actions
 */

import { fn } from 'storybook/test';

import { ServiceLogViewer } from './ServiceLogViewer';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'UNKNOWN';

interface MockLogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  rawLine: string;
}

function makeEntry(
  level: LogLevel,
  source: string,
  message: string,
  offsetSeconds = 0
): MockLogEntry {
  const ts = new Date(Date.now() - offsetSeconds * 1000).toISOString();
  return {
    timestamp: ts,
    level,
    source,
    message,
    rawLine: `[${ts}] [${level}] [${source}] ${message}`,
  };
}

const mixedLogs: MockLogEntry[] = [
  makeEntry('INFO', 'tor-main', 'Tor daemon started successfully', 60),
  makeEntry('DEBUG', 'circuit-mgr', 'Building new circuit through entry guard relay-a', 55),
  makeEntry('INFO', 'tor-main', 'Bootstrapped 100%: Done', 50),
  makeEntry('DEBUG', 'circuit-mgr', 'Circuit 3 built in 1.2 s', 45),
  makeEntry('WARN', 'dns-proxy', 'DNS resolution slow: 3400 ms for example.com', 40),
  makeEntry('INFO', 'tor-main', 'New SOCKS listener on 127.0.0.1:9050', 35),
  makeEntry('ERROR', 'exit-node', 'Failed to connect to 93.184.216.34:443: timeout', 30),
  makeEntry('INFO', 'tor-main', 'Received NEWNYM signal; creating new identity', 25),
  makeEntry('DEBUG', 'circuit-mgr', 'Extending circuit 7 to relay-b', 20),
  makeEntry('WARN', 'bandwidth', 'Bandwidth cap 80% reached (40 MB / 50 MB)', 15),
  makeEntry('ERROR', 'dns-proxy', 'DNS upstream unreachable: 8.8.8.8:53', 10),
  makeEntry('INFO', 'tor-main', 'Heartbeat: Tor has been running 1 hour', 5),
  makeEntry('DEBUG', 'circuit-mgr', 'Circuit 12 extended successfully to guard node relay-c', 2),
  makeEntry('INFO', 'tor-main', 'New connection from 10.0.0.5 on port 9050', 1),
];

const errorOnlyLogs: MockLogEntry[] = [
  makeEntry('ERROR', 'dns-proxy', 'Upstream DNS 8.8.8.8 unreachable', 120),
  makeEntry('ERROR', 'exit-node', 'ECONNREFUSED connecting to 1.1.1.1:80', 90),
  makeEntry('ERROR', 'tor-main', 'Failed to open log file: permission denied', 60),
  makeEntry('ERROR', 'exit-node', 'Circuit 9 destroyed: timeout', 30),
  makeEntry('ERROR', 'dns-proxy', 'Max retries exceeded resolving api.ipify.org', 5),
];

function generateBulkLogs(count: number): MockLogEntry[] {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['tor-main', 'circuit-mgr', 'dns-proxy', 'exit-node', 'bandwidth'];
  return Array.from({ length: count }, (_, i) => {
    const level = levels[i % levels.length];
    const source = sources[i % sources.length];
    return makeEntry(level, source, `Log entry #${i + 1} from ${source}`, count - i);
  });
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ServiceLogViewer> = {
  title: 'Features/Services/ServiceLogViewer',
  component: ServiceLogViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays real-time service logs with a 1000-line ring buffer, level filtering ' +
          '(DEBUG / INFO / WARN / ERROR), full-text search, auto-scroll, copy-to-clipboard, ' +
          'and refresh. Uses JetBrains Mono for readability.\n\n' +
          '**Platform variants:**\n' +
          '- Desktop/Tablet (≥640px): virtual-scrolled table with inline filter dropdowns\n' +
          '- Mobile (<640px): card rows with bottom-sheet filter and actions panels\n\n' +
          '**GraphQL dependency:** `useServiceLogs` must be mocked via MSW for Storybook.',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID used to scope the log subscription',
    },
    instanceId: {
      control: 'text',
      description: 'Service instance ID',
    },
    maxHistoricalLines: {
      control: { type: 'number', min: 10, max: 1000, step: 10 },
      description: 'Number of historical lines to load on mount',
    },
    autoScroll: {
      control: 'boolean',
      description: 'Enable auto-scroll to newest log entry',
    },
    onEntryClick: {
      action: 'entry-clicked',
      description: 'Fired when a log row is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceLogViewer>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default view with a realistic mix of DEBUG / INFO / WARN / ERROR entries.
 * Mock the useServiceLogs hook to return `mixedLogs` via MSW.
 */
export const Default: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-1',
    maxHistoricalLines: 100,
    autoScroll: true,
    onEntryClick: fn(),
  },
  parameters: {
    mockData: {
      logs: mixedLogs,
      isLoading: false,
      error: null,
    },
  },
};

/**
 * Loading state while the initial log batch is being fetched.
 * The component should display a loading indicator and no rows.
 */
export const Loading: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-1',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: true,
      error: null,
    },
    docs: {
      description: {
        story: 'Initial loading state while fetching historical log entries from the router.',
      },
    },
  },
};

/**
 * Empty state — no logs in the buffer and no active filters.
 */
export const Empty: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-fresh',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: false,
      error: null,
    },
    docs: {
      description: {
        story: 'Shown when the service has not produced any log output yet.',
      },
    },
  },
};

/**
 * Error state when the log subscription cannot be established.
 */
export const ErrorState: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-1',
  },
  parameters: {
    mockData: {
      logs: [],
      isLoading: false,
      error: new Error('WebSocket connection to router-001 refused'),
    },
    docs: {
      description: {
        story: 'Displayed when the real-time log subscription fails to connect.',
      },
    },
  },
};

/**
 * Only ERROR-level entries visible — simulates the user selecting the ERROR
 * level filter from the dropdown.
 */
export const FilteredByError: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-1',
    onEntryClick: fn(),
  },
  parameters: {
    mockData: {
      logs: errorOnlyLogs,
      isLoading: false,
      error: null,
      levelFilter: 'ERROR',
    },
    docs: {
      description: {
        story: 'Shows only ERROR-level entries after the user applies a level filter.',
      },
    },
  },
};

/**
 * Large ring buffer (500 entries) demonstrating virtual scrolling performance.
 * The desktop presenter uses @tanstack/react-virtual to maintain 60 fps.
 */
export const LargeBuffer: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-busy',
    maxHistoricalLines: 500,
    autoScroll: false,
    onEntryClick: fn(),
  },
  parameters: {
    mockData: {
      logs: generateBulkLogs(500),
      isLoading: false,
      error: null,
    },
    docs: {
      description: {
        story:
          '500 log entries rendered with virtual scrolling. Auto-scroll is disabled ' +
          'so the user can browse historical entries freely.',
      },
    },
  },
};

/**
 * Mobile viewport — forces the mobile presenter with touch-sized rows
 * and bottom-sheet filter / actions panels.
 */
export const MobileLayout: Story = {
  args: {
    routerId: 'router-001',
    instanceId: 'tor-instance-1',
    autoScroll: true,
    onEntryClick: fn(),
  },
  parameters: {
    mockData: {
      logs: mixedLogs.slice(0, 8),
      isLoading: false,
      error: null,
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile presenter with 44px minimum touch targets, card-style log rows, ' +
          'and bottom sheets for filters and actions.',
      },
    },
  },
};
