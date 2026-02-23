/**
 * StatusCard Stories
 *
 * Storybook stories for the StatusCard pattern component.
 * Demonstrates all four status variants, metrics grid, subtitle,
 * clickable behaviour, and a dashboard layout example.
 */

import { StatusCard } from './StatusCard';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Shared mock data
// ============================================================================

const networkMetrics = [
  { value: 12, label: 'Interfaces', unit: '' },
  { value: '99.8', label: 'Uptime', unit: '%' },
  { value: 4, label: 'Active VPNs' },
];

const degradedMetrics = [
  { value: 8, label: 'Interfaces' },
  { value: '94.1', label: 'Uptime', unit: '%' },
  { value: 1, label: 'Active VPNs' },
];

const errorMetrics = [
  { value: 3, label: 'Interfaces' },
  { value: '67.2', label: 'Uptime', unit: '%' },
  { value: 0, label: 'Active VPNs' },
];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof StatusCard> = {
  title: 'Patterns/Common/StatusCard',
  component: StatusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `
Hero dashboard card showing overall network health and key metrics.

Implements **Design Direction 1: Clean Minimal** with four status states:
- **healthy** — green check icon, pulse animation on the status dot
- **warning** — amber triangle icon
- **error** — red X-circle icon
- **loading** — spinning loader icon with muted colouring

The metrics grid supports up to 3 items with optional units.

## Usage

\`\`\`tsx
import { StatusCard } from '@nasnet/ui/patterns';

<StatusCard
  status="healthy"
  message="Network Healthy"
  subtitle="All systems operational"
  metrics={[
    { value: 12, label: 'Interfaces' },
    { value: '99.8', label: 'Uptime', unit: '%' },
    { value: 4, label: 'Active VPNs' },
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    status: {
      description: 'Overall health status controlling icon, colors, and animation',
      control: 'select',
      options: ['healthy', 'warning', 'error', 'loading'],
    },
    message: {
      description: 'Status message / title displayed with the indicator dot',
      control: 'text',
    },
    subtitle: {
      description: 'Optional subtitle shown above the message',
      control: 'text',
    },
    metrics: {
      description: 'Array of up to 3 metrics shown in a grid below the header',
      control: 'object',
    },
    onClick: {
      description: 'Optional click handler — adds cursor-pointer and hover elevation',
      action: 'clicked',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Healthy status — green check icon with pulse animation on the status dot.
 */
export const Healthy: Story = {
  args: {
    status: 'healthy',
    message: 'Network Healthy',
    subtitle: 'All systems operational',
    metrics: networkMetrics,
  },
};

/**
 * Warning status — amber triangle, no pulse animation.
 * Used when one or more interfaces are degraded but the network is still up.
 */
export const Warning: Story = {
  args: {
    status: 'warning',
    message: 'Degraded Performance',
    subtitle: 'Some interfaces need attention',
    metrics: degradedMetrics,
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning state — amber styling signals degraded performance without full failure.',
      },
    },
  },
};

/**
 * Error status — red X-circle icon.
 * Used when the network is down or a critical failure has been detected.
 */
export const Error: Story = {
  args: {
    status: 'error',
    message: 'Network Failure Detected',
    subtitle: 'Critical interfaces offline',
    metrics: errorMetrics,
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state — red styling with XCircle icon signals a critical network failure.',
      },
    },
  },
};

/**
 * Loading status — spinning loader with muted colours.
 * Shown while initial data is being fetched from the router.
 */
export const Loading: Story = {
  args: {
    status: 'loading',
    message: 'Fetching network status...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while waiting for the first data response from the router.',
      },
    },
  },
};

/**
 * Without metrics — header only, no grid.
 */
export const WithoutMetrics: Story = {
  args: {
    status: 'healthy',
    message: 'Network Healthy',
    subtitle: 'All systems operational',
    metrics: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Card without the metrics grid — just the status header.',
      },
    },
  },
};

/**
 * Clickable card — adds hover elevation and cursor-pointer.
 * Useful when the card acts as a navigation target.
 */
export const Clickable: Story = {
  args: {
    status: 'healthy',
    message: 'Network Healthy',
    subtitle: 'Click to view full network report',
    metrics: networkMetrics,
    onClick: () => console.log('StatusCard clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `onClick` is provided the card gains `cursor-pointer` and a hover lift effect.',
      },
    },
  },
};

/**
 * All status states rendered together — useful for design review.
 */
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatusCard
        status="healthy"
        message="Network Healthy"
        subtitle="All systems operational"
        metrics={networkMetrics}
      />
      <StatusCard
        status="warning"
        message="Degraded Performance"
        subtitle="Some interfaces need attention"
        metrics={degradedMetrics}
      />
      <StatusCard
        status="error"
        message="Network Failure Detected"
        subtitle="Critical interfaces offline"
        metrics={errorMetrics}
      />
      <StatusCard
        status="loading"
        message="Fetching network status..."
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'All four status states side-by-side for visual comparison.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    status: 'healthy',
    message: 'Network Healthy',
    subtitle: 'All systems operational',
    metrics: networkMetrics,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile viewport showing card responsive layout.',
      },
    },
  },
};

export const Tablet: Story = {
  args: {
    status: 'warning',
    message: 'Degraded Performance',
    subtitle: 'Some interfaces need attention',
    metrics: degradedMetrics,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet viewport.',
      },
    },
  },
};

export const Desktop: Story = {
  args: {
    status: 'healthy',
    message: 'Network Healthy',
    subtitle: 'All systems operational',
    metrics: networkMetrics,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop viewport with full metrics display.',
      },
    },
  },
};
