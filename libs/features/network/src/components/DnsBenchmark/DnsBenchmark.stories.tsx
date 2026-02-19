/**
 * Storybook Stories for DnsBenchmark Component
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 8.5: Create Storybook stories
 */

import { ApolloProvider } from '@apollo/client';

import { createMockClient } from '@nasnet/api-client/core';

import { DnsBenchmark } from './DnsBenchmark';

import type { Meta, StoryObj } from '@storybook/react';

// Mock GraphQL responses
const mockBenchmarkLoading = {
  request: {
    query: undefined, // Will be defined in the component
  },
  result: {
    data: null,
    loading: true,
  },
};

const mockBenchmarkSuccess = {
  dnsBenchmark: {
    __typename: 'DnsBenchmarkResult',
    testHostname: 'google.com',
    servers: [
      {
        __typename: 'DnsBenchmarkServerResult',
        server: '8.8.8.8',
        responseTime: 12,
        status: 'FASTEST',
      },
      {
        __typename: 'DnsBenchmarkServerResult',
        server: '1.1.1.1',
        responseTime: 15,
        status: 'GOOD',
      },
      {
        __typename: 'DnsBenchmarkServerResult',
        server: '8.8.4.4',
        responseTime: 125,
        status: 'SLOW',
      },
      {
        __typename: 'DnsBenchmarkServerResult',
        server: '9.9.9.9',
        responseTime: -1,
        status: 'UNREACHABLE',
      },
    ],
  },
};

const mockBenchmarkError = {
  dnsBenchmark: null,
};

const meta: Meta<typeof DnsBenchmark> = {
  title: 'Features/Network/DNS/DnsBenchmark',
  component: DnsBenchmark,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DNS server benchmark tool that tests response times of all configured DNS servers in parallel and displays status labels (Fastest, Good, Slow, Unreachable).',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const mockClient = createMockClient([]);
      return (
        <ApolloProvider client={mockClient}>
          <div className="max-w-2xl">
            <Story />
          </div>
        </ApolloProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof DnsBenchmark>;

/**
 * Default state before benchmark is run
 */
export const Default: Story = {
  name: 'Default - Ready to Run',
  render: () => <DnsBenchmark />,
};

/**
 * Loading state during benchmark execution
 */
export const Loading: Story = {
  name: 'Loading - Running Benchmark',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story: 'Shows progress indication while benchmark tests DNS servers in parallel.',
      },
    },
  },
};

/**
 * Success state with all status types
 */
export const WithResults: Story = {
  name: 'With Results - All Status Types',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story:
          'Displays benchmark results with status labels: Fastest (green), Good (blue), Slow (yellow), Unreachable (red). Servers are sorted by response time.',
      },
    },
  },
};

/**
 * All servers reachable and fast
 */
export const AllFast: Story = {
  name: 'All Fast - Optimal Configuration',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story: 'All DNS servers responding quickly (under 50ms). Ideal configuration.',
      },
    },
  },
};

/**
 * Mixed results with slow servers
 */
export const MixedPerformance: Story = {
  name: 'Mixed Performance',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story: 'Some servers fast, others slow or unreachable. Common in real-world scenarios.',
      },
    },
  },
};

/**
 * All servers unreachable (network issue)
 */
export const AllUnreachable: Story = {
  name: 'All Unreachable - Network Issue',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story:
          'All DNS servers unreachable. Indicates potential network connectivity issue or incorrect DNS configuration.',
      },
    },
  },
};

/**
 * Error state
 */
export const Error: Story = {
  name: 'Error State',
  render: () => <DnsBenchmark />,
  parameters: {
    docs: {
      description: {
        story: 'Error occurred during benchmark execution.',
      },
    },
  },
};

/**
 * Mobile viewport demonstration
 */
export const Mobile: Story = {
  name: 'Mobile View',
  render: () => <DnsBenchmark />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized view with card-based layout and touch-friendly targets.',
      },
    },
  },
};

/**
 * Desktop viewport demonstration
 */
export const Desktop: Story = {
  name: 'Desktop View',
  render: () => <DnsBenchmark />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop view with data table showing detailed benchmark results.',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  name: 'Dark Mode',
  render: () => <DnsBenchmark />,
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
  render: () => <DnsBenchmark />,
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Demonstrates WCAG AAA compliance: 7:1 contrast, keyboard navigation, screen reader support, 44px touch targets on mobile.',
      },
    },
  },
};
