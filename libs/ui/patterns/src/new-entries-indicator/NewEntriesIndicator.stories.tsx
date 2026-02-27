/**
 * NewEntriesIndicator Stories
 *
 * Storybook stories for the NewEntriesIndicator pattern component.
 * This floating button appears when the user is scrolled up while new
 * log entries arrive, prompting them to scroll to the latest entries.
 */

import { useState } from 'react';

import { NewEntriesIndicator } from './NewEntriesIndicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NewEntriesIndicator> = {
  title: 'Patterns/Common/NewEntriesIndicator',
  component: NewEntriesIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Floating indicator button that appears when new log entries have arrived while the user is scrolled up reading older content. ' +
          'Renders `null` when `count` is 0 or negative. Uses `fixed` positioning at `bottom-20 left-1/2`. ' +
          'Singular/plural-aware label: "1 new entry" vs "5 new entries".',
      },
    },
  },
  argTypes: {
    count: {
      description: 'Number of new entries. Component renders nothing when count ≤ 0.',
      control: { type: 'number', min: 0 },
    },
    onClick: {
      description: 'Callback fired when the user clicks the indicator to jump to new entries.',
      action: 'scrollToBottom',
    },
    className: {
      description: 'Additional CSS classes for customising the button appearance.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NewEntriesIndicator>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default state: one new entry (singular label).
 */
export const SingleEntry: Story = {
  args: {
    count: 1,
    onClick: () => console.log('Scroll to bottom'),
  },
};

/**
 * Multiple new entries: plural label "5 new entries".
 */
export const MultipleEntries: Story = {
  args: {
    count: 5,
    onClick: () => console.log('Scroll to bottom'),
  },
};

/**
 * High-volume case: 99 new entries, e.g., a burst of log activity.
 */
export const HighVolumeEntries: Story = {
  args: {
    count: 99,
    onClick: () => console.log('Scroll to bottom'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Very high entry count as would occur during a log burst or after reconnection.',
      },
    },
  },
};

/**
 * Zero count: component renders nothing — useful to verify null output.
 */
export const ZeroCount: Story = {
  args: {
    count: 0,
    onClick: () => console.log('This should not appear'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `count` is 0 the component returns `null` — nothing is rendered. The canvas will appear empty.',
      },
    },
  },
};

/**
 * Interactive: click the button and the count resets to 0, hiding the indicator.
 */
export const Interactive: Story = {
  render: () => {
    function Demo() {
      const [count, setCount] = useState(12);

      return (
        <div className="border-border bg-muted/30 relative flex h-[300px] w-[400px] flex-col overflow-hidden rounded-lg border">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="text-muted-foreground bg-card border-border rounded border px-3 py-2 font-mono text-xs"
              >
                <span className="text-cyan-500">2024-01-15 09:3{i}:22</span>{' '}
                <span className="text-amber-400">INFO</span> system: log entry {i + 1}
              </div>
            ))}
          </div>

          {/* Simulated floating indicator — using static positioning for story demo */}
          {count > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <NewEntriesIndicator
                count={count}
                onClick={() => setCount(0)}
                className="static bottom-auto left-auto translate-x-0"
              />
            </div>
          )}

          {count === 0 && (
            <div className="absolute bottom-4 right-4">
              <button
                className="text-muted-foreground border-border hover:bg-muted rounded border px-2 py-1 text-xs"
                onClick={() => setCount(12)}
              >
                Simulate new entries
              </button>
            </div>
          )}
        </div>
      );
    }

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulated log viewer: click the indicator to dismiss it. Use the "Simulate new entries" button to bring it back.',
      },
    },
  },
};
