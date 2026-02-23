/**
 * RouterHealthSummaryCard Storybook Stories
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * 7 stories as specified in Dev Notes:
 * 1. Default (online, healthy, fresh, desktop)
 * 2. OfflineStale (offline, critical, 6min old, desktop)
 * 3. DegradedWarning (online, warning, 30sec old, desktop)
 * 4. CriticalHealth (online, critical, 1min old, desktop)
 * 5. LoadingSkeleton (loading state, desktop)
 * 6. MobileCompact (online, healthy, fresh, 375px)
 * 7. TabletGrid (online, healthy, fresh, 768px)
 */

import { fn } from 'storybook/test';

import { RouterHealthSummaryCard } from './RouterHealthSummaryCard';
import { RouterHealthSummaryCardDesktop } from './RouterHealthSummaryCard.Desktop';

import type { UseRouterHealthCardReturn } from './useRouterHealthCard';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Features/Dashboard/RouterHealthSummaryCard',
  component: RouterHealthSummaryCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Platform-adaptive router health summary card with real-time updates.

**Features:**
- Traffic-light health indicator (healthy/warning/critical)
- CPU and memory usage with progress bars
- Connection status with live pulse animation
- Cache age indicator for stale data
- Responsive: Mobile (compact) and Desktop (detailed) layouts

**Health Thresholds:**
- CPU: Warning ≥70%, Critical ≥90%
- Memory: Warning ≥80%, Critical ≥95%
- Temperature: Warning ≥60°C, Critical ≥75°C

**Architecture Pattern:** Headless + Platform Presenters (ADR-018)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'UUID of the router to display',
    },
    onRefresh: {
      description: 'Callback when refresh button is clicked',
      action: 'refreshed',
    },
    pollInterval: {
      control: 'number',
      description: 'Polling interval in ms (fallback when subscription drops)',
    },
    enableSubscription: {
      control: 'boolean',
      description: 'Enable real-time WebSocket subscription',
    },
    compact: {
      control: 'boolean',
      description: 'Force compact (mobile) layout',
    },
  },
  args: {
    routerId: 'router-uuid-1',
    onRefresh: fn(),
    pollInterval: 10000,
    enableSubscription: true,
  },
} satisfies Meta<typeof RouterHealthSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORY 1: Default - Online, Healthy, Fresh Data
// ============================================================================

export const Default: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: `
Default desktop layout showing healthy router:
- Status: Online (green badge with pulse)
- Health: Healthy (green indicator)
- CPU: 45% (normal range)
- Memory: 60% (normal range)
- Data: Fresh (<1 minute old)
        `,
      },
    },
  },
};

// ============================================================================
// STORY 2: Offline & Stale - Router Offline, 6 Minutes Old
// ============================================================================

const OfflineStaleState: UseRouterHealthCardReturn = {
  router: {
    uuid: 'router-uuid-offline',
    name: 'Edge Router',
    model: 'MikroTik hEX S',
    version: '7.11.2',
    uptime: 86400, // 1 day
    status: 'offline',
    health: 'critical',
    cpuUsage: 25,
    memoryUsage: 40,
    lastUpdate: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
  },
  isLoading: false,
  error: null,
  healthStatus: 'critical',
  healthColor: 'red',
  isOnline: false,
  isStale: true,
  cacheAgeMinutes: 6,
  cacheStatus: 'critical',
  mutationsDisabled: true,
  mutationDisabledReason: 'Data is too old (>5 minutes). Reconnect to router first.',
  refetch: fn(),
};

export const OfflineStale: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={OfflineStaleState}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: `
Router offline with stale cached data:
- Status: Offline (gray badge, no pulse)
- Health: Critical (red indicator) - offline triggers critical
- Cache: 6 minutes old (critical = red badge)
- Mutations: Disabled (data too old)
- Red banner: "Router unreachable"
        `,
      },
    },
  },
};

// ============================================================================
// STORY 3: Degraded Warning - High CPU Usage
// ============================================================================

const DegradedWarningState: UseRouterHealthCardReturn = {
  router: {
    uuid: 'router-uuid-warning',
    name: 'Core Router',
    model: 'MikroTik CCR1036',
    version: '7.12.1',
    uptime: 2592000, // 30 days
    status: 'online',
    health: 'warning',
    cpuUsage: 85, // Warning threshold (≥70%)
    memoryUsage: 65,
    lastUpdate: new Date(Date.now() - 30 * 1000), // 30 seconds ago
    temperature: 58,
  },
  isLoading: false,
  error: null,
  healthStatus: 'warning',
  healthColor: 'amber',
  isOnline: true,
  isStale: false,
  cacheAgeMinutes: 0,
  cacheStatus: 'fresh',
  mutationsDisabled: false,
  mutationDisabledReason: null,
  refetch: fn(),
};

export const DegradedWarning: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={DegradedWarningState}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: `
Router online with warning-level health:
- Status: Online (green badge with pulse)
- Health: Warning (amber indicator)
- CPU: 85% (warning threshold ≥70%)
- Memory: 65% (normal)
- Temperature: 58°C (normal)
- CPU bar: Amber color
        `,
      },
    },
  },
};

// ============================================================================
// STORY 4: Critical Health - CPU and Memory Critical
// ============================================================================

const CriticalHealthState: UseRouterHealthCardReturn = {
  router: {
    uuid: 'router-uuid-critical',
    name: 'Overloaded Router',
    model: 'MikroTik RB4011',
    version: '7.10.5',
    uptime: 172800, // 2 days
    status: 'online',
    health: 'critical',
    cpuUsage: 92, // Critical threshold (≥90%)
    memoryUsage: 96, // Critical threshold (≥95%)
    lastUpdate: new Date(Date.now() - 60 * 1000), // 1 minute ago
    temperature: 72,
  },
  isLoading: false,
  error: null,
  healthStatus: 'critical',
  healthColor: 'red',
  isOnline: true,
  isStale: true,
  cacheAgeMinutes: 1,
  cacheStatus: 'warning',
  mutationsDisabled: false,
  mutationDisabledReason: null,
  refetch: fn(),
};

export const CriticalHealth: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={CriticalHealthState}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: `
Router online but critical health metrics:
- Status: Online (green badge)
- Health: Critical (red indicator)
- CPU: 92% (critical threshold ≥90%)
- Memory: 96% (critical threshold ≥95%)
- Temperature: 72°C (warning)
- Both progress bars: Red color
- Requires immediate attention
        `,
      },
    },
  },
};

// ============================================================================
// STORY 5: Loading Skeleton
// ============================================================================

export const LoadingSkeleton: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={{
        router: null,
        isLoading: true,
        error: null,
        healthStatus: 'critical',
        healthColor: 'red',
        isOnline: false,
        isStale: false,
        cacheAgeMinutes: 0,
        cacheStatus: 'fresh',
        mutationsDisabled: false,
        mutationDisabledReason: null,
        refetch: fn(),
      }}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: `
Loading skeleton state while fetching router data:
- Animated pulse effect
- Placeholder blocks for all content
- Respects \`prefers-reduced-motion\` (no animation if user preference)
        `,
      },
    },
  },
};

// ============================================================================
// STORY 6: Mobile Compact - 375px Viewport
// ============================================================================

export const MobileCompact: Story = {
  args: {
    compact: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    chromatic: {
      viewports: [375],
    },
    docs: {
      description: {
        story: `
Mobile layout (375px viewport):
- Compact row design
- 44px touch targets (WCAG AAA)
- Essential info: name, status, health
- 2-column metrics grid
- Tap to expand (future enhancement)
        `,
      },
    },
  },
};

// ============================================================================
// STORY 7: Tablet Grid - 768px Viewport
// ============================================================================

export const TabletGrid: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    chromatic: {
      viewports: [768],
    },
    docs: {
      description: {
        story: `
Tablet layout (768px viewport):
- Desktop presenter with medium density
- 2-column dashboard grid (handled by DashboardLayout)
- Collapsible sidebar support
        `,
      },
    },
  },
};

// ============================================================================
// ADDITIONAL STORIES - Edge Cases
// ============================================================================

export const NoTemperatureSensor: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={{
        router: {
          uuid: 'router-uuid-no-temp',
          name: 'Budget Router',
          model: 'MikroTik hEX lite',
          version: '7.12.1',
          uptime: 604800, // 7 days
          status: 'online',
          health: 'healthy',
          cpuUsage: 35,
          memoryUsage: 45,
          lastUpdate: new Date(),
          temperature: undefined, // No sensor
        },
        isLoading: false,
        error: null,
        healthStatus: 'healthy',
        healthColor: 'green',
        isOnline: true,
        isStale: false,
        cacheAgeMinutes: 0,
        cacheStatus: 'fresh',
        mutationsDisabled: false,
        mutationDisabledReason: null,
        refetch: fn(),
      }}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Router without temperature sensor - temperature row is hidden.',
      },
    },
  },
};

export const VeryLongRouterName: Story = {
  render: (args) => (
    <RouterHealthSummaryCardDesktop
      state={{
        router: {
          uuid: 'router-uuid-long-name',
          name: 'Corporate Headquarters Main Branch Office Router - Building A',
          model: 'MikroTik CRS328-24P-4S+RM',
          version: '7.12.1',
          uptime: 1209600,
          status: 'online',
          health: 'healthy',
          cpuUsage: 40,
          memoryUsage: 55,
          lastUpdate: new Date(),
        },
        isLoading: false,
        error: null,
        healthStatus: 'healthy',
        healthColor: 'green',
        isOnline: true,
        isStale: false,
        cacheAgeMinutes: 0,
        cacheStatus: 'fresh',
        mutationsDisabled: false,
        mutationDisabledReason: null,
        refetch: fn(),
      }}
      onRefresh={args.onRefresh}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Router with very long name - text truncates with ellipsis.',
      },
    },
  },
};
