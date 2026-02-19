/**
 * SystemInfoCard Stories
 *
 * Storybook stories for the SystemInfoCard pattern component.
 * Demonstrates the data, loading, error, and empty states,
 * along with various router model examples.
 */

import { SystemInfoCard } from './SystemInfoCard';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Shared mock data
// ============================================================================

/** RouterOS uptime string format: "3d4h25m12s" */
const hAP_lite: Parameters<typeof SystemInfoCard>[0]['data'] = {
  identity: 'home-router',
  model: 'RB951Ui-2HnD (hAP)',
  routerOsVersion: '7.12.1 (stable)',
  cpuArchitecture: 'MIPSBE',
  uptime: '3d4h25m12s',
};

const RB4011: Parameters<typeof SystemInfoCard>[0]['data'] = {
  identity: 'office-gateway',
  model: 'RB4011iGS+RM',
  routerOsVersion: '7.13 (stable)',
  cpuArchitecture: 'ARM64',
  uptime: '14d2h10m5s',
};

const CHR: Parameters<typeof SystemInfoCard>[0]['data'] = {
  identity: 'cloud-router',
  model: 'CHR (Cloud Hosted Router)',
  routerOsVersion: '7.12 (stable)',
  cpuArchitecture: 'x86_64',
  uptime: '2h15m30s',
};

const noUptime: Parameters<typeof SystemInfoCard>[0]['data'] = {
  identity: 'minimal-router',
  model: 'hEX S',
  routerOsVersion: '6.49.10',
  cpuArchitecture: 'MMIPS',
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SystemInfoCard> = {
  title: 'Patterns/PageStructure/SystemInfoCard',
  component: SystemInfoCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Displays router system information — model, RouterOS version, uptime, and CPU architecture.

Three render states:
- **Data** — shows a divided list of key-value pairs
- **Loading** — skeleton placeholder rows
- **Error** — error icon with optional retry button

The \`uptime\` field accepts RouterOS format strings (e.g. \`"3d4h25m12s"\`) and converts them
to human-readable output via \`parseRouterOSUptime\`.

## Usage

\`\`\`tsx
import { SystemInfoCard } from '@nasnet/ui/patterns';

// With data
<SystemInfoCard data={systemInfo} />

// Loading
<SystemInfoCard isLoading />

// Error with retry
<SystemInfoCard error={new Error('Timeout')} onRetry={refetch} />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    data: {
      description: 'SystemInfo object from the router — model, version, uptime, architecture',
      control: 'object',
    },
    isLoading: {
      description: 'Show skeleton loading state',
      control: 'boolean',
    },
    error: {
      description: 'Error object — triggers error state with optional retry',
      control: false,
    },
    onRetry: {
      description: 'Callback invoked when the retry button is pressed in the error state',
      action: 'retry',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SystemInfoCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default populated card — typical MikroTik hAP home router.
 */
export const Default: Story = {
  args: {
    data: hAP_lite,
    isLoading: false,
    error: null,
  },
};

/**
 * High-end RB4011 router with arm64 architecture.
 */
export const RB4011Router: Story = {
  args: {
    data: RB4011,
  },
  parameters: {
    docs: {
      description: {
        story: 'RB4011iGS+ — MikroTik enterprise router running ARM64.',
      },
    },
  },
};

/**
 * Cloud Hosted Router (CHR) — x86_64, short uptime.
 */
export const CloudHostedRouter: Story = {
  args: {
    data: CHR,
  },
  parameters: {
    docs: {
      description: {
        story: 'CHR running on a VPS with x86_64 architecture and a short uptime.',
      },
    },
  },
};

/**
 * Router without an uptime value — displays "N/A".
 */
export const WithoutUptime: Story = {
  args: {
    data: noUptime,
  },
  parameters: {
    docs: {
      description: {
        story: 'When the `uptime` field is absent the card gracefully shows "N/A".',
      },
    },
  },
};

/**
 * Loading state — shows four skeleton rows.
 */
export const LoadingState: Story = {
  args: {
    isLoading: true,
    data: null,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton placeholder displayed while system info is being fetched.',
      },
    },
  },
};

/**
 * Error state with retry button.
 */
export const ErrorWithRetry: Story = {
  args: {
    isLoading: false,
    data: null,
    error: new Error('Connection timeout'),
    onRetry: () => console.log('Retry clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when the request fails — includes a retry button.',
      },
    },
  },
};

/**
 * Error state without a retry callback — retry button is hidden.
 */
export const ErrorWithoutRetry: Story = {
  args: {
    isLoading: false,
    data: null,
    error: new Error('Insufficient permissions'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state without `onRetry` — the retry button is not rendered.',
      },
    },
  },
};

/**
 * No data and no error — renders the "no information" fallback.
 */
export const NoData: Story = {
  args: {
    data: null,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fallback state when `data` is null and there is no loading or error condition.',
      },
    },
  },
};
