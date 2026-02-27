/**
 * LastUpdated Stories
 *
 * Storybook stories for the LastUpdated pattern component.
 * Demonstrates how the component renders relative timestamps
 * sourced from TanStack Query's `dataUpdatedAt` field.
 */

import { useEffect, useState } from 'react';

import { LastUpdated } from './LastUpdated';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LastUpdated> = {
  title: 'Patterns/DataDisplay/LastUpdated',
  component: LastUpdated,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Displays a clock icon followed by a live-updating relative timestamp string
showing when data was last fetched.

- Renders **nothing** when \`timestamp\` is null or undefined
- Uses the \`useRelativeTime\` hook which ticks every second
- Designed to receive \`dataUpdatedAt\` from TanStack Query / Apollo Client

## Usage

\`\`\`tsx
import { LastUpdated } from '@nasnet/ui/patterns';

function Dashboard() {
  const { dataUpdatedAt } = useQuery(GET_INTERFACES);
  return <LastUpdated timestamp={dataUpdatedAt} />;
}
\`\`\`
      `,
      },
    },
  },
  argTypes: {
    timestamp: {
      description:
        'Unix timestamp in milliseconds (e.g., from TanStack Query `dataUpdatedAt`). Pass `null` or `undefined` to render nothing.',
      control: { type: 'number' },
    },
    className: {
      description: 'Additional CSS classes for custom styling.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LastUpdated>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Just now: timestamp is the current moment — renders "Updated just now".
 */
export const JustNow: Story = {
  args: {
    timestamp: Date.now(),
  },
};

/**
 * A few seconds ago: simulates data fetched 30 seconds before render.
 */
export const ThirtySecondsAgo: Story = {
  args: {
    timestamp: Date.now() - 30_000,
  },
};

/**
 * Several minutes ago: simulates data fetched 5 minutes before render.
 */
export const FiveMinutesAgo: Story = {
  args: {
    timestamp: Date.now() - 5 * 60_000,
  },
};

/**
 * Over an hour ago: simulates stale data.
 */
export const TwoHoursAgo: Story = {
  args: {
    timestamp: Date.now() - 2 * 60 * 60_000,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stale data scenario — data was last refreshed 2 hours ago.',
      },
    },
  },
};

/**
 * No timestamp: component renders null — canvas will be empty.
 */
export const NoTimestamp: Story = {
  args: {
    timestamp: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `timestamp` is `undefined` or `null` the component renders nothing. The canvas will appear empty.',
      },
    },
  },
};

/**
 * Custom className: applies additional styling, e.g., different text colour.
 */
export const CustomClassName: Story = {
  args: {
    timestamp: Date.now() - 45_000,
    className: 'text-primary font-semibold',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates overriding default muted styling via `className`.',
      },
    },
  },
};

/**
 * Live ticker: timestamp updates every 10 seconds to show the hook's auto-refresh.
 */
export const LiveTicker: Story = {
  render: () => {
    function LiveDemo() {
      const [ts, setTs] = useState(() => Date.now() - 5_000);

      // Re-fetch simulation: update timestamp every 10 seconds
      useEffect(() => {
        const id = setInterval(() => setTs(Date.now()), 10_000);
        return () => clearInterval(id);
      }, []);

      return (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Simulates a query that re-fetches every 10 s. The label updates live each second.
          </p>
          <div className="border-border bg-card flex items-center gap-4 rounded-lg border p-3">
            <span className="text-sm font-medium">Network Interfaces</span>
            <LastUpdated timestamp={ts} />
          </div>
        </div>
      );
    }

    return <LiveDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live demo: the timestamp resets every 10 seconds simulating a background re-fetch. Observe the label tick from "just now" through to "N seconds ago".',
      },
    },
  },
};
