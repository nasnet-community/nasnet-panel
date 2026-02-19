/**
 * Storybook stories for CachedDataBadge
 * Cache age and freshness indicator with inline and banner variants
 *
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 * Color coding: green (<1 min fresh) → amber (1-5 min warning) → red (>5 min critical)
 */

import { CachedDataBadge } from './CachedDataBadge';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock timestamps
// ---------------------------------------------------------------------------
const justNow = new Date(Date.now() - 15_000);           // 15 seconds ago
const twoMinutesAgo = new Date(Date.now() - 2 * 60_000); // 2 minutes ago
const sevenMinutesAgo = new Date(Date.now() - 7 * 60_000); // 7 minutes ago
const oneHourAgo = new Date(Date.now() - 60 * 60_000);   // 1 hour ago

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof CachedDataBadge> = {
  title: 'Features/Dashboard/CachedDataBadge',
  component: CachedDataBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays the age and freshness of cached router data when the live connection is lost. ' +
          'Two variants: **inline** (compact badge for cards) and **banner** (full-width alert for the dashboard header). ' +
          'Three semantic states based on cache age: ' +
          '**fresh** (<1 min, green), **warning** (1-5 min, amber), **critical** (>5 min, red). ' +
          'In critical state, mutations are disabled and a Retry button is shown in the banner variant.',
      },
    },
  },
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['fresh', 'warning', 'critical'],
      description: 'Semantic freshness state driving the colour scheme',
    },
    variant: {
      control: { type: 'select' },
      options: ['inline', 'banner'],
      description: 'inline = compact badge; banner = full-width alert row',
    },
    ageMinutes: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Age of the cached data in whole minutes',
    },
    onRetry: { action: 'onRetry' },
  },
};

export default meta;
type Story = StoryObj<typeof CachedDataBadge>;

// ---------------------------------------------------------------------------
// Inline variant stories
// ---------------------------------------------------------------------------

/**
 * Inline / fresh — data is less than 1 minute old.
 */
export const InlineFresh: Story = {
  args: {
    variant: 'inline',
    status: 'fresh',
    ageMinutes: 0,
    lastSeenAt: justNow,
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline badge with fresh (green) state. Shown when data was updated within the last minute.',
      },
    },
  },
};

/**
 * Inline / warning — data is 1-5 minutes old.
 */
export const InlineWarning: Story = {
  args: {
    variant: 'inline',
    status: 'warning',
    ageMinutes: 3,
    lastSeenAt: twoMinutesAgo,
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline badge with warning (amber) state. Displayed when the connection is intermittently lost.',
      },
    },
  },
};

/**
 * Inline / critical — data is more than 5 minutes old.
 */
export const InlineCritical: Story = {
  args: {
    variant: 'inline',
    status: 'critical',
    ageMinutes: 7,
    lastSeenAt: sevenMinutesAgo,
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline badge with critical (red) state. Mutations are disabled at this staleness level.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Banner variant stories
// ---------------------------------------------------------------------------

/**
 * Banner / warning — full-width alert with a Retry button.
 */
export const BannerWarning: Story = {
  args: {
    variant: 'banner',
    status: 'warning',
    ageMinutes: 3,
    lastSeenAt: twoMinutesAgo,
    onRetry: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Full-width banner for the dashboard header area. Amber coloring with "Connection unstable" message and Retry button.',
      },
    },
  },
};

/**
 * Banner / critical — router is unreachable, Retry button prominently displayed.
 */
export const BannerCritical: Story = {
  args: {
    variant: 'banner',
    status: 'critical',
    ageMinutes: 7,
    lastSeenAt: sevenMinutesAgo,
    onRetry: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Critical banner. Red coloring with "Router unreachable" message. Retry button triggers re-connection.',
      },
    },
  },
};

/**
 * Banner / critical — data is very stale (1 hour old) and no onRetry handler is provided.
 */
export const BannerCriticalNoRetry: Story = {
  args: {
    variant: 'banner',
    status: 'critical',
    ageMinutes: 60,
    lastSeenAt: oneHourAgo,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Critical banner without an onRetry handler. The Retry button is hidden; only the stale-data message is shown.',
      },
    },
  },
};
