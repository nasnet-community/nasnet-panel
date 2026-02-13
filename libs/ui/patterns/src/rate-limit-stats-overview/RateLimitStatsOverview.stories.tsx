/**
 * RateLimitStatsOverview Storybook Stories
 *
 * Visual documentation and testing for rate limit statistics overview component.
 *
 * Stories:
 * - Default (with activity)
 * - Empty state (no blocks)
 * - Recent activity only
 * - With chart
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/rate-limit-stats-overview
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { RateLimitStatsOverview } from './RateLimitStatsOverview';
import {
  mockStatsWithActivity,
  mockStatsEmpty,
  mockStatsRecent,
  generateTriggerEvents,
} from '../__test-utils__/rate-limit-fixtures';

/**
 * RateLimitStatsOverview - Rate limiting statistics and analytics
 *
 * The RateLimitStatsOverview component provides a comprehensive view of rate limiting
 * activity over time. It includes a 24-hour chart of trigger events, top blocked IPs,
 * and configurable polling intervals. Automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **24-hour activity chart**: Line chart showing trigger events over last 24 hours
 * - **Top blocked IPs**: List of most frequently blocked addresses
 * - **Total block count**: Aggregate count of all blocks
 * - **Auto-refresh**: Configurable polling (5s, 10s, 30s, 1m, 5m)
 * - **Export data**: Download stats as JSON or CSV
 * - **Time range selector**: View last 1h, 6h, 12h, or 24h
 * - **Platform adaptive**: Desktop grid vs mobile stack
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Polling Intervals
 *
 * - **5 seconds**: Real-time monitoring (during active attack)
 * - **10 seconds**: Near real-time (high activity)
 * - **30 seconds**: Normal monitoring (default)
 * - **1 minute**: Light monitoring (low activity)
 * - **5 minutes**: Periodic checks (stable environment)
 * - **Manual**: User-triggered refresh only
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitStatsOverview } from '@nasnet/ui/patterns/rate-limit-stats-overview';
 * import { useRateLimitStats } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: stats, isLoading } = useRateLimitStats(routerId, {
 *     pollingInterval: 30000, // 30 seconds
 *   });
 *
 *   return (
 *     <RateLimitStatsOverview
 *       stats={stats}
 *       loading={isLoading}
 *       pollingInterval={30000}
 *       onExport={(format) => exportStats(stats, format)}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/Rate Limiting/RateLimitStatsOverview',
  component: RateLimitStatsOverview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Rate limiting statistics overview with 24-hour chart, top blocked IPs, and auto-refresh.',
      },
    },
    // Enable accessibility testing
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    stats: {
      control: 'object',
      description: 'Rate limit statistics data',
    },
    loading: {
      control: 'boolean',
      description: 'Is stats panel loading',
    },
    pollingInterval: {
      control: 'select',
      options: [5000, 10000, 30000, 60000, 300000, 0],
      description: 'Auto-refresh interval in milliseconds (0 = manual)',
    },
    showChart: {
      control: 'boolean',
      description: 'Show 24-hour activity chart',
    },
    timeRange: {
      control: 'select',
      options: ['1h', '6h', '12h', '24h'],
      description: 'Time range for chart',
    },
    onExport: { action: 'exported' },
    onRefresh: { action: 'refreshed' },
    onPollingIntervalChange: { action: 'polling-interval-changed' },
  },
  args: {
    loading: false,
    pollingInterval: 30000,
    showChart: true,
    timeRange: '24h',
    onExport: fn(),
    onRefresh: fn(),
    onPollingIntervalChange: fn(),
  },
} satisfies Meta<typeof RateLimitStatsOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story: Default (With Activity)
// =============================================================================

/**
 * Default State - With Activity
 *
 * Shows statistics with normal activity levels.
 * 24-hour chart shows varying trigger events throughout the day.
 */
export const Default: Story = {
  args: {
    stats: mockStatsWithActivity,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view with activity. 24-hour chart shows trigger patterns, top 5 blocked IPs listed.',
      },
    },
  },
};

// =============================================================================
// Story: Empty State (No Blocks)
// =============================================================================

/**
 * Empty State - No Blocked IPs
 *
 * Shows empty state when no rate limiting has occurred.
 * Displays positive message that system is protected.
 */
export const Empty: Story = {
  args: {
    stats: mockStatsEmpty,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with no blocked IPs. Shows flat chart and positive message about protection.',
      },
    },
  },
};

// =============================================================================
// Story: Recent Activity Only
// =============================================================================

/**
 * Recent Activity Only
 *
 * Shows statistics with activity only in last few hours.
 * Demonstrates dynamic chart scaling.
 */
export const RecentActivity: Story = {
  args: {
    stats: mockStatsRecent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Activity only in last 3 hours. Chart shows recent spike, earlier hours are flat.',
      },
    },
  },
};

// =============================================================================
// Story: High Activity (Attack Pattern)
// =============================================================================

/**
 * High Activity - Attack Pattern
 *
 * Shows statistics during an active attack.
 * Chart shows sharp increase in trigger events.
 */
export const HighActivity: Story = {
  args: {
    stats: {
      totalBlocked: 5000,
      topBlockedIPs: [
        {
          address: '203.0.113.50',
          list: 'ddos-attackers',
          blockCount: 2500,
          firstBlocked: new Date('2025-01-10T12:00:00Z'),
          lastBlocked: new Date('2025-01-10T16:00:00Z'),
          timeout: '1w',
          dynamic: true,
        },
        {
          address: '198.51.100.25',
          list: 'rate-limited',
          blockCount: 1200,
          firstBlocked: new Date('2025-01-10T13:00:00Z'),
          lastBlocked: new Date('2025-01-10T16:00:00Z'),
          timeout: '1d',
          dynamic: true,
        },
        {
          address: '192.0.2.100',
          list: 'ddos-attackers',
          blockCount: 800,
          firstBlocked: new Date('2025-01-10T14:00:00Z'),
          lastBlocked: new Date('2025-01-10T16:00:00Z'),
          timeout: '1w',
          dynamic: true,
        },
      ],
      triggerEvents: generateTriggerEvents(24, 'peak'),
      lastUpdated: new Date(),
    },
    pollingInterval: 5000, // Fast polling during attack
  },
  parameters: {
    docs: {
      description: {
        story:
          'High activity showing active attack. Chart shows sharp peak, top IPs have very high counts. Fast 5-second polling.',
      },
    },
  },
};

// =============================================================================
// Story: Increasing Activity Pattern
// =============================================================================

/**
 * Increasing Activity Pattern
 *
 * Shows statistics with steadily increasing activity.
 * May indicate developing attack or traffic spike.
 */
export const IncreasingActivity: Story = {
  args: {
    stats: {
      totalBlocked: 1200,
      topBlockedIPs: mockStatsWithActivity.topBlockedIPs,
      triggerEvents: generateTriggerEvents(24, 'increasing'),
      lastUpdated: new Date(),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Steadily increasing activity pattern. May indicate developing attack or gradual traffic increase.',
      },
    },
  },
};

// =============================================================================
// Story: Decreasing Activity Pattern
// =============================================================================

/**
 * Decreasing Activity Pattern
 *
 * Shows statistics with declining activity.
 * Indicates attack subsiding or effective blocking.
 */
export const DecreasingActivity: Story = {
  args: {
    stats: {
      totalBlocked: 800,
      topBlockedIPs: mockStatsWithActivity.topBlockedIPs.slice(0, 3),
      triggerEvents: generateTriggerEvents(24, 'decreasing'),
      lastUpdated: new Date(),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Declining activity pattern. Shows attack subsiding or blocking effectiveness.',
      },
    },
  },
};

// =============================================================================
// Story: Loading State
// =============================================================================

/**
 * Loading State
 *
 * Shows skeleton loading state while fetching statistics.
 */
export const Loading: Story = {
  args: {
    stats: mockStatsEmpty,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while fetching statistics from router.',
      },
    },
  },
};

// =============================================================================
// Story: With Chart (Full View)
// =============================================================================

/**
 * With Chart - Full View
 *
 * Shows full stats overview with 24-hour chart expanded.
 * Chart takes prominent position for analysis.
 */
export const WithChart: Story = {
  args: {
    stats: mockStatsWithActivity,
    showChart: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '24-hour chart prominently displayed. Hover over points to see exact counts at each hour.',
      },
    },
  },
};

// =============================================================================
// Story: Without Chart (Compact)
// =============================================================================

/**
 * Without Chart - Compact View
 *
 * Hides the chart for more compact layout.
 * Shows only summary stats and top blocked IPs.
 */
export const WithoutChart: Story = {
  args: {
    stats: mockStatsWithActivity,
    showChart: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact view without chart. Shows only summary numbers and top blocked IPs.',
      },
    },
  },
};

// =============================================================================
// Story: 1 Hour Time Range
// =============================================================================

/**
 * 1 Hour Time Range
 *
 * Shows statistics for last 1 hour only.
 * More granular view for recent activity.
 */
export const OneHourRange: Story = {
  args: {
    stats: mockStatsWithActivity,
    timeRange: '1h',
  },
  parameters: {
    docs: {
      description: {
        story: 'Last 1 hour view. More granular breakdown for analyzing recent activity.',
      },
    },
  },
};

// =============================================================================
// Story: Fast Polling (5s)
// =============================================================================

/**
 * Fast Polling - 5 Seconds
 *
 * Shows stats with 5-second auto-refresh.
 * Used during active attacks or monitoring.
 */
export const FastPolling: Story = {
  args: {
    stats: mockStatsWithActivity,
    pollingInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fast 5-second polling for real-time monitoring. Use during active attacks or critical periods.',
      },
    },
  },
};

// =============================================================================
// Story: Manual Refresh Only
// =============================================================================

/**
 * Manual Refresh Only
 *
 * Disables auto-refresh, requires manual refresh button.
 * Saves bandwidth and resources.
 */
export const ManualRefresh: Story = {
  args: {
    stats: mockStatsWithActivity,
    pollingInterval: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Manual refresh mode. Auto-polling disabled, user clicks refresh to update.',
      },
    },
  },
};

// =============================================================================
// Story: Mobile Presenter
// =============================================================================

/**
 * Mobile Variant
 *
 * Forces mobile presenter (stacked layout).
 * Optimized for touch: vertical sections, simplified chart.
 */
export const MobileView: Story = {
  args: {
    stats: mockStatsWithActivity,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile stacked layout (<640px). Vertical sections with simplified chart for touch screens.',
      },
    },
  },
};

// =============================================================================
// Story: Desktop Presenter
// =============================================================================

/**
 * Desktop Variant
 *
 * Forces desktop presenter (grid layout).
 * Optimized for large screens: side-by-side panels, full chart.
 */
export const DesktopView: Story = {
  args: {
    stats: mockStatsWithActivity,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop grid layout (>1024px). Side-by-side panels with full-featured chart and analytics.',
      },
    },
  },
};

// =============================================================================
// Story: Accessibility Test
// =============================================================================

/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export const AccessibilityTest: Story = {
  args: {
    stats: mockStatsWithActivity,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Accessibility validation. Chart has accessible data table alternative, 7:1 contrast, keyboard navigable.',
      },
    },
  },
};
