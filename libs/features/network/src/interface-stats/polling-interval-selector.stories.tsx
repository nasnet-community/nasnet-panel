/**
 * Storybook stories for PollingIntervalSelector
 *
 * Covers the full-form (with label) and inline variants,
 * plus a decorator that stubs out the Zustand store so
 * stories work without a real localStorage environment.
 */

import { PollingIntervalSelector } from './polling-interval-selector';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Store mock – replace the Zustand hook so the component renders in isolation.
// ---------------------------------------------------------------------------

// We need to intercept the store import before it reaches the module. The
// simplest approach inside a Storybook story file is to render a thin wrapper
// that overrides the hook via moduleNameMapper / automock – but since that
// requires a Jest / Vitest config change, we instead demonstrate the component
// by providing a decorator that seeds localStorage with a known value so the
// persisted store hydrates correctly.

const meta: Meta<typeof PollingIntervalSelector> = {
  title: 'Features/Network/InterfaceStats/PollingIntervalSelector',
  component: PollingIntervalSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**PollingIntervalSelector** lets users configure how often interface traffic
statistics are refreshed.

Four intervals are available:
| Value | Label | Description |
|-------|-------|-------------|
| \`1s\` | 1 second | Real-time (high CPU) |
| \`5s\` | 5 seconds | Recommended |
| \`10s\` | 10 seconds | Low bandwidth |
| \`30s\` | 30 seconds | Minimal updates |

The component reads/writes from the persisted \`useInterfaceStatsStore\` Zustand
store, so changes survive page reloads. Two layout modes are supported:

- **Default** – labelled form field (200 px wide select + helper text)
- **Inline** – compact select trigger only, for use inside toolbars
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      // Seed the persisted store with a known interval before each story
      // renders so the select shows a deterministic initial value.
      try {
        localStorage.setItem(
          'nasnet-interface-stats-preferences',
          JSON.stringify({ state: { pollingInterval: '5s' }, version: 1 })
        );
      } catch {
        // Ignore – localStorage may be unavailable in some test runners.
      }
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PollingIntervalSelector>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default full layout with an "Update Interval" label, a 200 px wide select,
 * and a helper text line below it. This is the primary use-case inside a
 * settings panel or preferences dialog.
 */
export const Default: Story = {
  args: {},
};

/**
 * Inline mode renders only the SelectTrigger with no surrounding label or
 * helper text. Ideal for embedding in page toolbars or card headers alongside
 * other controls.
 */
export const Inline: Story = {
  args: {
    inline: true,
  },
};

/**
 * Inline selector with a custom className to constrain its width – shows how
 * callers can style the trigger when placed inside a flex toolbar.
 */
export const InlineNarrow: Story = {
  args: {
    inline: true,
    className: 'w-[120px]',
  },
};

/**
 * Full layout with an extra className applied to the outer wrapper, e.g. to
 * add top margin when placed below another settings group.
 */
export const WithCustomClass: Story = {
  args: {
    className: 'mt-component-md p-component-sm border rounded-md bg-muted/30 w-[280px]',
  },
};

/**
 * Inline selector embedded inside a realistic toolbar context.
 * Demonstrates how the component composes with sibling controls.
 */
export const InsideToolbar: Story = {
  render: (args) => (
    <div className="gap-component-xs bg-card px-component-sm py-component-xs flex items-center rounded-md border shadow-sm">
      <span className="text-muted-foreground text-sm font-medium">Refresh:</span>
      <PollingIntervalSelector
        {...args}
        inline
        className="w-[130px]"
      />
    </div>
  ),
  args: {},
};
