/**
 * NtfyChannelForm Storybook Stories
 * NAS-18.X: Ntfy.sh notification channel with Platform Presenters
 *
 * Showcases all prop variants, server presets, authentication states,
 * priority presets, and platform-specific layouts for the ntfy.sh channel form.
 */

import { fn } from 'storybook/test';

import { NtfyChannelForm } from './NtfyChannelForm';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof NtfyChannelForm> = {
  title: 'Features/Alerts/NtfyChannelForm',
  component: NtfyChannelForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
NtfyChannelForm is a platform-aware ntfy.sh notification channel configuration form
that automatically selects the correct presenter based on screen width:

- **Mobile (<640px):** Touch-optimized single-column layout with accordion sections
- **Desktop (≥640px):** Dense two-column layout with collapsible advanced settings

**Key features:**
- Public ntfy.sh server or self-hosted server URL
- Topic name with ntfy naming rule validation (alphanumeric, hyphens, underscores)
- Optional authentication (username + password must both be set or both empty)
- Priority presets: Min (1), Low (2), Default (3), High (4), Urgent (5)
- Tag management — up to 10 tags for message categorization
- Test notification functionality

Uses the \`useNtfyChannelForm\` headless hook with React Hook Form + Zod validation.
        `,
      },
    },
  },
  argTypes: {
    onSubmit: { action: 'submit' },
    onTest: { action: 'test' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NtfyChannelForm>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default empty state — new ntfy.sh channel (public server)
 */
export const Default: Story = {
  args: {
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty form for creating a new ntfy.sh channel using the default public ntfy.sh server.',
      },
    },
  },
};

/**
 * Pre-filled using the public ntfy.sh server with tags and default priority
 */
export const PublicServerWithTags: Story = {
  args: {
    initialConfig: {
      enabled: true,
      serverUrl: 'https://ntfy.sh',
      topic: 'nasnet-router-alerts',
      priority: 3,
      tags: ['router', 'alert', 'nasnet'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configured for the public ntfy.sh server with a topic, default priority (3), and three categorization tags.',
      },
    },
  },
};

/**
 * Self-hosted ntfy server with authentication
 */
export const SelfHostedWithAuth: Story = {
  args: {
    initialConfig: {
      enabled: true,
      serverUrl: 'https://ntfy.internal.example.com',
      topic: 'critical-alerts',
      username: 'nasnet-bot',
      password: 'secure-ntfy-password',
      priority: 5,
      tags: ['critical', 'infrastructure'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Self-hosted ntfy server configuration with username/password authentication and Urgent priority (5).',
      },
    },
  },
};

/**
 * High-priority configuration for critical router events
 */
export const HighPriorityCritical: Story = {
  args: {
    initialConfig: {
      enabled: true,
      serverUrl: 'https://ntfy.sh',
      topic: 'router-critical',
      priority: 4,
      tags: ['high', 'router', 'wan', 'firewall'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'High priority (4) configuration for critical infrastructure events with multiple tags.',
      },
    },
  },
};

/**
 * Disabled state — channel temporarily turned off
 */
export const DisabledChannel: Story = {
  args: {
    initialConfig: {
      enabled: false,
      serverUrl: 'https://ntfy.sh',
      topic: 'nasnet-maintenance',
      priority: 2,
      tags: ['maintenance'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Channel disabled (enabled: false) — useful for maintenance windows or temporary muting.',
      },
    },
  },
};

/**
 * Mobile viewport — touch-optimized single-column layout
 */
export const Mobile: Story = {
  args: {
    initialConfig: {
      enabled: true,
      serverUrl: 'https://ntfy.sh',
      topic: 'nasnet-alerts',
      priority: 3,
      tags: ['router'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile presenter (<640px) with accordion sections and 44px touch targets for server room use.',
      },
    },
  },
};

/**
 * Desktop viewport — two-column dense layout
 */
export const Desktop: Story = {
  args: {
    initialConfig: {
      enabled: true,
      serverUrl: 'https://ntfy.internal.example.com',
      topic: 'infra-alerts',
      username: 'admin',
      password: 'admin-pass',
      priority: 4,
      tags: ['infra', 'router', 'vpn', 'wan'],
    },
    onSubmit: fn(),
    onTest: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Desktop presenter (≥640px) with dense two-column grid and collapsible advanced authentication settings.',
      },
    },
  },
};
