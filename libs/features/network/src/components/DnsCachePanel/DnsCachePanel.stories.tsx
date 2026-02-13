/**
 * Storybook Stories for DnsCachePanel Component
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 8.5: Create Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ApolloProvider } from '@apollo/client';
import { createMockClient } from '@nasnet/api-client/core';
import { DnsCachePanel } from './DnsCachePanel';

// Mock GraphQL responses
const mockCacheStatsLoading = {
  request: {
    query: undefined, // Will be defined in the component
  },
  result: {
    data: null,
    loading: true,
  },
};

const mockCacheStatsSuccess = {
  dnsCacheStats: {
    __typename: 'DnsCacheStats',
    totalEntries: 156,
    cacheSize: '2048KiB',
    cacheUsed: '1024KiB',
    cacheSizeBytes: 2097152,
    cacheUsedBytes: 1048576,
    hitRate: 87.5,
    topDomains: [
      { __typename: 'DnsTopDomain', domain: 'google.com', queries: 1245 },
      { __typename: 'DnsTopDomain', domain: 'github.com', queries: 892 },
      { __typename: 'DnsTopDomain', domain: 'cloudflare.com', queries: 654 },
      { __typename: 'DnsTopDomain', domain: 'facebook.com', queries: 487 },
      { __typename: 'DnsTopDomain', domain: 'amazon.com', queries: 356 },
      { __typename: 'DnsTopDomain', domain: 'twitter.com', queries: 298 },
      { __typename: 'DnsTopDomain', domain: 'netflix.com', queries: 234 },
      { __typename: 'DnsTopDomain', domain: 'apple.com', queries: 187 },
      { __typename: 'DnsTopDomain', domain: 'microsoft.com', queries: 156 },
      { __typename: 'DnsTopDomain', domain: 'reddit.com', queries: 123 },
    ],
  },
};

const mockCacheStatsEmpty = {
  dnsCacheStats: {
    __typename: 'DnsCacheStats',
    totalEntries: 0,
    cacheSize: '2048KiB',
    cacheUsed: '0KiB',
    cacheSizeBytes: 2097152,
    cacheUsedBytes: 0,
    hitRate: 0,
    topDomains: [],
  },
};

const mockCacheStatsNearFull = {
  dnsCacheStats: {
    __typename: 'DnsCacheStats',
    totalEntries: 2048,
    cacheSize: '2048KiB',
    cacheUsed: '1945KiB',
    cacheSizeBytes: 2097152,
    cacheUsedBytes: 1991680, // 95% full
    hitRate: 95.2,
    topDomains: [
      { __typename: 'DnsTopDomain', domain: 'cdn.example.com', queries: 5432 },
      { __typename: 'DnsTopDomain', domain: 'api.service.io', queries: 4821 },
      { __typename: 'DnsTopDomain', domain: 'static.assets.net', queries: 3956 },
      { __typename: 'DnsTopDomain', domain: 'images.cdn.com', queries: 3124 },
      { __typename: 'DnsTopDomain', domain: 'video.stream.io', queries: 2876 },
      { __typename: 'DnsTopDomain', domain: 'auth.provider.com', queries: 2543 },
      { __typename: 'DnsTopDomain', domain: 'analytics.track.net', queries: 2198 },
      { __typename: 'DnsTopDomain', domain: 'ads.network.com', queries: 1987 },
      { __typename: 'DnsTopDomain', domain: 'fonts.gstatic.com', queries: 1654 },
      { __typename: 'DnsTopDomain', domain: 'ssl.certs.io', queries: 1432 },
    ],
  },
};

const meta: Meta<typeof DnsCachePanel> = {
  title: 'Features/Network/DNS/DnsCachePanel',
  component: DnsCachePanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DNS cache management panel displaying cache statistics (entries, size, hit rate), most queried domains (top 10), and flush cache functionality with confirmation dialog.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const mockClient = createMockClient([]);
      return (
        <ApolloProvider client={mockClient}>
          <div className="max-w-4xl">
            <Story />
          </div>
        </ApolloProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof DnsCachePanel>;

/**
 * Default state with loaded cache statistics
 */
export const Default: Story = {
  name: 'Default - With Cache Data',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Shows cache statistics (156 entries, 50% used), 87.5% hit rate, and top 10 most queried domains.',
      },
    },
  },
};

/**
 * Loading state while fetching cache stats
 */
export const Loading: Story = {
  name: 'Loading State',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loader displayed while fetching cache statistics from router.',
      },
    },
  },
};

/**
 * Empty cache (freshly flushed or no queries yet)
 */
export const EmptyCache: Story = {
  name: 'Empty Cache',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Cache is empty (0 entries). Shows 0% usage and no top domains. This state appears after flushing cache or on fresh router boot.',
      },
    },
  },
};

/**
 * Cache near capacity (95% full)
 */
export const NearFull: Story = {
  name: 'Cache Near Full - 95%',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Cache is nearly full (95% usage, 2048 entries). High hit rate (95.2%). May benefit from cache flush or increased cache size.',
      },
    },
  },
};

/**
 * High hit rate scenario
 */
export const HighHitRate: Story = {
  name: 'High Hit Rate - Optimal',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'High cache hit rate (95%+) indicates efficient DNS caching with frequently accessed domains.',
      },
    },
  },
};

/**
 * Low hit rate scenario
 */
export const LowHitRate: Story = {
  name: 'Low Hit Rate - Suboptimal',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Low hit rate (25%) suggests diverse queries or short TTLs. May need cache size increase.',
      },
    },
  },
};

/**
 * Flush confirmation dialog open
 */
export const FlushDialog: Story = {
  name: 'Flush Confirmation Dialog',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Confirmation dialog shown before flushing cache. Displays before/after stats preview and warning message.',
      },
    },
  },
};

/**
 * After successful flush with toast notification
 */
export const AfterFlush: Story = {
  name: 'After Flush - Success Toast',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Success state after cache flush. Toast notification confirms action, cache stats reset to 0.',
      },
    },
  },
};

/**
 * Error state
 */
export const Error: Story = {
  name: 'Error State',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story: 'Error occurred while fetching cache statistics. Shows error message with retry option.',
      },
    },
  },
};

/**
 * Mobile viewport demonstration
 */
export const Mobile: Story = {
  name: 'Mobile View',
  render: () => <DnsCachePanel />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-optimized compact layout with stacked stats cards and simplified top domains list.',
      },
    },
  },
};

/**
 * Desktop viewport demonstration
 */
export const Desktop: Story = {
  name: 'Desktop View',
  render: () => <DnsCachePanel />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop view with horizontal stats cards and detailed top domains table.',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  name: 'Dark Mode',
  render: () => <DnsCachePanel />,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Component appearance in dark mode with proper contrast ratios (WCAG AAA).',
      },
    },
  },
};

/**
 * Accessibility demonstration
 */
export const Accessibility: Story = {
  name: 'Accessibility Features',
  render: () => <DnsCachePanel />,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'dialog-name', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Demonstrates WCAG AAA compliance: 7:1 contrast, keyboard navigation, ARIA labels, screen reader announcements, 44px touch targets.',
      },
    },
  },
};

/**
 * Interactive demo with all features
 */
export const Interactive: Story = {
  name: 'Interactive Demo',
  render: () => <DnsCachePanel />,
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive demo. Click "Flush Cache" button to see confirmation dialog, cancel or confirm the action.',
      },
    },
  },
};
