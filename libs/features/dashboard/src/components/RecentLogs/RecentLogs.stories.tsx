/**
 * Storybook Stories for RecentLogs Component
 * Demonstrates all states: default, filtered, loading, error, empty
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 5,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: firewallLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 3,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: ['firewall'],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: errorLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 3,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: [],
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 0,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: ['firewall'],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: [],
      loading: true,
      error: null,
      refetch: fn(),
      totalCount: 0,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
  },
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: {
    deviceId: '192.168.88.1',
  },
  beforeEach: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: [],
      loading: false,
      error: new Error('Failed to connect to router'),
      refetch: fn(),
      totalCount: 0,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 5,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      topic: ['system', 'firewall', 'dhcp', 'wireless'][i % 4] as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      severity: ['info', 'warning', 'error'][i % 3] as any,
      message: `Log entry ${i}: Various system events and notifications`,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: manyLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 50,
      hasMore: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
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
    window.matchMedia = fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: fn(),
      removeEventListener: fn(),
      dispatchEvent: fn(),
    })) as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logStreamHook.useLogStream as any) = fn().mockReturnValue({
      logs: mockLogs,
      loading: false,
      error: null,
      refetch: fn(),
      totalCount: 5,
      hasMore: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logFilterStore.useLogFilterPreferencesStore as any) = fn().mockReturnValue({
      selectedTopics: [],
      setSelectedTopics: fn(),
      toggleTopic: fn(),
      clearFilters: fn(),
    });
  },
};
