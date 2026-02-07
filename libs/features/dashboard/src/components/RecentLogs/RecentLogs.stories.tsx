/**
 * Storybook Stories for RecentLogs Component
 * Demonstrates all states: default, filtered, loading, error, empty
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LogEntry } from '@nasnet/core/types';

import { RecentLogs } from './RecentLogs';
import * as logStreamHook from './useLogStream';
import * as logFilterStore from '../../stores/log-filter-preferences.store';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient();

const meta: Meta<typeof RecentLogs> = {
  title: 'Dashboard/RecentLogs',
  component: RecentLogs,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RecentLogs>;

// Mock log data
const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 120000), // 2 min ago
    topic: 'system',
    severity: 'info',
    message: 'System started successfully',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 300000), // 5 min ago
    topic: 'firewall',
    severity: 'warning',
    message: 'Connection rejected from 192.168.1.100',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 600000), // 10 min ago
    topic: 'wireless',
    severity: 'info',
    message: 'Client connected: AA:BB:CC:DD:EE:FF',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 900000), // 15 min ago
    topic: 'dhcp',
    severity: 'info',
    message: 'Lease assigned to 192.168.88.105',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 1200000), // 20 min ago
    topic: 'system',
    severity: 'error',
    message: 'Failed to connect to NTP server',
  },
];

const errorLogs: LogEntry[] = [
  {
    id: 'log-e1',
    timestamp: new Date(Date.now() - 30000),
    topic: 'system',
    severity: 'error',
    message: 'Database connection failed',
  },
  {
    id: 'log-e2',
    timestamp: new Date(Date.now() - 60000),
    topic: 'firewall',
    severity: 'critical',
    message: 'Port scan detected from 10.0.0.100',
  },
  {
    id: 'log-e3',
    timestamp: new Date(Date.now() - 120000),
    topic: 'wireless',
    severity: 'error',
    message: 'Authentication failed for client AA:BB:CC:DD:EE:FF',
  },
];

const firewallLogs: LogEntry[] = [
  {
    id: 'log-f1',
    timestamp: new Date(Date.now() - 60000),
    topic: 'firewall',
    severity: 'warning',
    message: 'Dropped TCP packet from 192.168.1.200',
  },
  {
    id: 'log-f2',
    timestamp: new Date(Date.now() - 120000),
    topic: 'firewall',
    severity: 'warning',
    message: 'Blocked UDP port scan attempt',
  },
  {
    id: 'log-f3',
    timestamp: new Date(Date.now() - 180000),
    topic: 'firewall',
    severity: 'info',
    message: 'Rule chain updated successfully',
  },
];

/**
 * Default state with mixed log entries
 */
export const Default: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 5,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Firewall topic filter applied
 */
export const FilteredFirewall: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: firewallLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 3,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: ['firewall'],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * All error and critical severity logs
 */
export const AllErrors: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: errorLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 3,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Empty state - no logs matching filter
 */
export const EmptyState: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 0,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: ['firewall'],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Loading skeleton state
 */
export const Loading: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      totalCount: 0,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Error state with retry button
 */
export const Error: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: [],
      loading: false,
      error: new Error('Failed to connect to router'),
      refetch: vi.fn(),
      totalCount: 0,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Mobile viewport (375px)
 */
export const Mobile: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  beforeEach: () => {
    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 5,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * High volume - rapid log updates (demonstrates limit to 10)
 */
export const HighVolume: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    const manyLogs: LogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 10000),
      topic: ['system', 'firewall', 'dhcp', 'wireless'][i % 4] as any,
      severity: ['info', 'warning', 'error'][i % 3] as any,
      message: `Log entry ${i}: Various system events and notifications`,
    }));

    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: manyLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 50,
      hasMore: true,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};

/**
 * Reduced motion mode (no animations)
 */
export const ReducedMotion: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  beforeEach: () => {
    // Simulate prefers-reduced-motion CSS media query
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.mocked(logStreamHook.useLogStream).mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: vi.fn(),
      totalCount: 5,
      hasMore: false,
    });
    vi.mocked(logFilterStore.useLogFilterPreferencesStore).mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: vi.fn(),
      toggleTopic: vi.fn(),
      clearFilters: vi.fn(),
    } as any);
  },
};
