/**
 * RateLimitingPage Storybook Stories
 *
 * Interactive stories for the Rate Limiting page domain component.
 * Demonstrates three tabs (Rate Limits, SYN Flood, Statistics), empty states, and responsive layout.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { RateLimitingPage } from './RateLimitingPage';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

/**
 * RateLimitingPage - Connection rate limiting management page
 *
 * The RateLimitingPage provides a three-tab interface for managing connection rate limiting,
 * SYN flood protection, and viewing blocking statistics on MikroTik routers.
 *
 * ## Features
 *
 * - **Rate Limits Tab**: Manage per-IP/subnet connection rate limit rules
 * - **SYN Flood Tab**: Configure SYN flood protection with info and warning alerts
 * - **Statistics Tab**: View rate limit stats overview and blocked IPs table
 * - **Add Rule**: Opens RateLimitRuleEditor Sheet (tab-aware header action)
 * - **Refresh**: Re-fetch statistics with spinning icon feedback
 * - **Export CSV**: Download statistics for reporting
 * - **Clear Blocked IPs**: Bulk unblock all blocked IPs (shown only when IPs exist)
 * - **Empty States**: Tab-specific empty states with contextual guidance
 * - **Loading Skeletons**: Smooth loading during data fetch
 * - **Responsive**: Bottom Sheet on mobile, right Sheet on desktop
 * - **Accessibility**: WCAG AAA with min-h-[44px] touch targets
 *
 * ## Tab Behaviors
 *
 * - **rate-limits**: Header shows "Add Rate Limit" button
 * - **syn-flood**: Header is empty (config panel handles its own actions)
 * - **statistics**: Header shows Refresh, Export CSV, and optional Clear buttons
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitingPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <RateLimitingPage />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/Pages/RateLimitingPage',
  component: RateLimitingPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main page for connection rate limiting with three tabs: Rate Limits (rule management), SYN Flood (DDoS protection configuration), and Statistics (blocked IP tracking and reporting).',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RateLimitingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Rate Limits Tab - Empty State
 *
 * No rate limit rules configured. Shows a dashed-border card with "Add Rate Limit" CTA.
 * The header also shows the "Add Rate Limit" button since this is the active tab.
 */
export const EmptyRateLimitsTab: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty "Rate Limits" tab. Both the header button and the empty state card CTA lead to the RateLimitRuleEditor Sheet. Guides users to create their first rate limiting rule.',
      },
    },
    mockData: {
      selectedTab: 'rate-limits',
      hasRules: false,
      hasBlockedIPs: false,
    },
  },
};

/**
 * SYN Flood Protection Tab
 *
 * The SYN Flood tab shows two alerts (info and warning) plus the SynFloodConfigPanel.
 * The header has no action buttons when this tab is active — config handles itself.
 */
export const SynFloodTab: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'SYN Flood Protection tab. Shows an info alert explaining the feature, a destructive warning alert about production impacts, and the SynFloodConfigPanel for threshold configuration. No header buttons on this tab.',
      },
    },
    mockData: {
      selectedTab: 'syn-flood',
      hasRules: false,
      hasBlockedIPs: false,
    },
  },
};

/**
 * Statistics Tab - Empty Blocked IPs
 *
 * Statistics tab with the RateLimitStatsOverview visible but no blocked IPs yet.
 * Shows empty state for the blocked IPs section. Header shows Refresh and Export CSV.
 */
export const StatisticsTabEmpty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Statistics tab with no blocked IPs. RateLimitStatsOverview renders (counters at zero). Empty state card for blocked IPs section. Header shows Refresh (with spin animation) and Export CSV buttons.',
      },
    },
    mockData: {
      selectedTab: 'statistics',
      hasRules: true,
      hasBlockedIPs: false,
    },
  },
};

/**
 * Statistics Tab - With Blocked IPs
 *
 * Statistics tab showing the BlockedIPsTable with active blocked IPs.
 * Header gains a "Clear Blocked IPs" destructive button when blocked IPs exist.
 */
export const StatisticsTabWithBlockedIPs: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Statistics tab with active blocked IPs. The BlockedIPsTable renders with entries. Header shows three buttons: Refresh, Export CSV, and Clear (destructive) — the Clear button only appears when hasBlockedIPs is true.',
      },
    },
    mockData: {
      selectedTab: 'statistics',
      hasRules: true,
      hasBlockedIPs: true,
      blockedIPs: [
        {
          address: '203.0.113.55',
          blockedAt: '2024-01-25T14:32:00Z',
          reason: 'Exceeded 100 connections/min',
          hitCount: 1547,
        },
        {
          address: '198.51.100.200',
          blockedAt: '2024-01-25T15:10:00Z',
          reason: 'SYN flood detected',
          hitCount: 45678,
        },
        {
          address: '192.0.2.88',
          blockedAt: '2024-01-25T16:05:00Z',
          reason: 'Port scan detected',
          hitCount: 234,
        },
      ],
    },
  },
};

/**
 * Mobile View
 *
 * Mobile layout (<640px) with horizontally scrollable tabs and bottom Sheet for rule editor.
 * Tab labels may be truncated; touch targets meet 44px minimum requirement.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized view (<640px). Tab list scrolls horizontally (overflow-x-auto). Rule editor Sheet opens from the bottom (h-[90vh]). All action buttons have min-h-[44px] for touch accessibility.',
      },
    },
    mockData: {
      selectedTab: 'rate-limits',
      hasRules: false,
      hasBlockedIPs: false,
    },
  },
};
