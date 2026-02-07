/**
 * DNS Settings Form Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DnsSettingsForm } from './DnsSettingsForm';

const meta = {
  title: 'Features/Network/DNS/DnsSettingsForm',
  component: DnsSettingsForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DNS settings form with cache configuration and remote requests security toggle. Shows security warning dialog when enabling remote requests.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialValues: {
      description: 'Initial form values',
      control: 'object',
    },
    cacheUsed: {
      description: 'Current cache usage in KB',
      control: { type: 'number', min: 0, max: 10240 },
    },
    cacheUsedPercent: {
      description: 'Cache usage percentage (0-100)',
      control: { type: 'number', min: 0, max: 100 },
    },
    loading: {
      description: 'Loading state disables all interactions',
      control: 'boolean',
    },
    onSubmit: {
      description: 'Callback when form is submitted',
      action: 'submitted',
    },
  },
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof DnsSettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== Default Stories =====

/**
 * Default state with remote requests disabled and moderate cache usage
 */
export const Default: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1', '8.8.8.8'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 1024,
    cacheUsedPercent: 50,
  },
};

/**
 * Remote requests enabled (no security warning on subsequent loads)
 */
export const RemoteRequestsEnabled: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: true,
      cacheSize: 2048,
    },
    cacheUsed: 512,
    cacheUsedPercent: 25,
  },
};

/**
 * Empty cache (0% usage)
 */
export const EmptyCache: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 0,
    cacheUsedPercent: 0,
  },
};

/**
 * Full cache (100% usage)
 */
export const FullCache: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 2048,
    cacheUsedPercent: 100,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When cache is full (100%), consider increasing cache size or clearing entries.',
      },
    },
  },
};

/**
 * Minimum cache size (512 KB)
 */
export const MinimumCacheSize: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 512,
    },
    cacheUsed: 256,
    cacheUsedPercent: 50,
  },
};

/**
 * Maximum cache size (10240 KB = 10 MB)
 */
export const MaximumCacheSize: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 10240,
    },
    cacheUsed: 5120,
    cacheUsedPercent: 50,
  },
};

/**
 * Loading state (all fields disabled)
 */
export const Loading: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 1024,
    cacheUsedPercent: 50,
    loading: true,
  },
};

// ===== Interactive Stories =====

/**
 * Security warning demonstration
 * Toggle "Allow Remote Requests" to see the security warning dialog
 */
export const SecurityWarningInteraction: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 1024,
    cacheUsedPercent: 50,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the "Allow Remote Requests" toggle to see the security warning dialog. The setting is only applied after user confirms.',
      },
    },
  },
};

/**
 * Cache size validation - Below minimum
 * Try entering a cache size below 512 KB
 */
export const CacheSizeBelowMinimum: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 256, // Invalid - below minimum
    },
    cacheUsed: 128,
    cacheUsedPercent: 50,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cache size must be at least 512 KB. Values below minimum show validation error.',
      },
    },
  },
};

/**
 * Cache size validation - Above maximum
 * Try entering a cache size above 10240 KB
 */
export const CacheSizeAboveMaximum: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 20480, // Invalid - above maximum
    },
    cacheUsed: 10240,
    cacheUsedPercent: 50,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cache size cannot exceed 10240 KB (10 MB). Values above maximum show validation error.',
      },
    },
  },
};

// ===== Real-World Scenarios =====

/**
 * Home network scenario (small cache, no remote requests)
 */
export const HomeNetwork: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1', '8.8.8.8'],
      allowRemoteRequests: false,
      cacheSize: 1024,
    },
    cacheUsed: 512,
    cacheUsedPercent: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical home network configuration with moderate cache size.',
      },
    },
  },
};

/**
 * Small office scenario (larger cache, remote requests enabled)
 */
export const SmallOffice: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1', '8.8.8.8', '9.9.9.9'],
      allowRemoteRequests: true,
      cacheSize: 4096,
    },
    cacheUsed: 2048,
    cacheUsedPercent: 50,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Small office with multiple VLANs, using larger cache and allowing remote requests from internal networks.',
      },
    },
  },
};

/**
 * Enterprise scenario (maximum cache, remote requests enabled)
 */
export const Enterprise: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1', '8.8.8.8', '9.9.9.9', '208.67.222.222'],
      allowRemoteRequests: true,
      cacheSize: 10240,
    },
    cacheUsed: 8192,
    cacheUsedPercent: 80,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enterprise deployment with maximum cache size and remote requests enabled for internal DNS infrastructure.',
      },
    },
  },
};

// ===== Edge Cases =====

/**
 * Cache almost full (95%)
 */
export const CacheAlmostFull: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 1946,
    cacheUsedPercent: 95,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cache is almost full (95%). User should consider increasing cache size.',
      },
    },
  },
};

/**
 * Very low cache usage (5%)
 */
export const VeryLowCacheUsage: Story = {
  args: {
    initialValues: {
      servers: ['1.1.1.1'],
      allowRemoteRequests: false,
      cacheSize: 2048,
    },
    cacheUsed: 102,
    cacheUsedPercent: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Very low cache usage (5%). Cache size could potentially be reduced to save memory.',
      },
    },
  },
};
