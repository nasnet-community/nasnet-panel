/**
 * Storybook stories for StatsLiveRegion
 *
 * StatsLiveRegion is a screen-reader-only (sr-only) ARIA live region.
 * It renders no visible UI – its purpose is purely accessibility.
 *
 * These stories use a custom decorator that renders the live region alongside
 * a visible debug panel so reviewers can see what message would be announced
 * to assistive technology without using a screen reader.
 */

import type { InterfaceStats } from '@nasnet/api-client/generated';

import { StatsLiveRegion } from './stats-live-region';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock InterfaceStats object.
 * All Size scalars are represented as numeric strings (BigInt-safe).
 */
function makeStats(overrides: Partial<InterfaceStats> = {}): InterfaceStats {
  return {
    txBytes: '5368709120',    // 5 GB
    rxBytes: '10737418240',   // 10 GB
    txPackets: '3145728',
    rxPackets: '6291456',
    txErrors: 0,
    rxErrors: 0,
    txDrops: 0,
    rxDrops: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Debug overlay – makes the sr-only content visible inside Storybook so
// reviewers can read the announcement text without a screen reader.
// ---------------------------------------------------------------------------
function DebugWrapper({
  children,
  stats,
  interfaceName,
}: {
  children: React.ReactNode;
  stats: InterfaceStats | null;
  interfaceName: string;
}) {
  // Build the same announcement the component would produce, so we can
  // show it in the visible debug panel.
  const totalErrors = stats ? stats.txErrors + stats.rxErrors : 0;
  const hasErrors = totalErrors > 0;

  const announcement =
    stats == null
      ? '(no stats – component renders null)'
      : hasErrors
        ? `${interfaceName} statistics updated. Transmitted ... bytes, received ... bytes. Warning: ${totalErrors} error${totalErrors === 1 ? '' : 's'} detected.`
        : `${interfaceName} statistics updated. Transmitted ... bytes, received ... bytes.`;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Simulated live-region content for visual inspection */}
      <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ARIA Live Region announcement (normally sr-only)
        </p>
        <p className="font-mono text-sm text-foreground/80">{announcement}</p>
      </div>
      {/* The actual component – rendered sr-only, invisible to sighted users */}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StatsLiveRegion> = {
  title: 'Features/Network/InterfaceStats/StatsLiveRegion',
  component: StatsLiveRegion,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**StatsLiveRegion** is a visually hidden ARIA live region that announces
interface statistics updates to screen reader users.

It renders as \`role="status"\` with \`aria-live="polite"\` and \`aria-atomic="true"\`,
placed inside a Tailwind \`sr-only\` container so it has no visible presence
in the UI.

### Accessibility behaviour
- Announces at most once every **5 seconds** (debounced) to prevent spam
- Uses **polite** interruption – waits for the screen reader to finish its
  current sentence before announcing
- Includes an **error warning** suffix when \`txErrors + rxErrors > 0\`
- Returns \`null\` when \`stats\` prop is \`null\`

> The debug panel shown in each story below is **not part of the component**;
> it exists only to make the invisible announcement text visible inside Storybook.
        `,
      },
    },
  },
  decorators: [
    (Story, ctx) => (
      <DebugWrapper
        stats={ctx.args.stats as InterfaceStats | null}
        interfaceName={String(ctx.args.interfaceName ?? '')}
      >
        <Story />
      </DebugWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatsLiveRegion>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default happy-path announcement: interface with no errors.
 * The screen reader will announce TX/RX totals in human-readable form.
 */
export const Default: Story = {
  args: {
    interfaceName: 'ether1 - WAN',
    stats: makeStats(),
  },
};

/**
 * Interface with TX errors detected.
 * A warning suffix is appended: "Warning: 3 errors detected."
 */
export const WithTxErrors: Story = {
  args: {
    interfaceName: 'ether2 - LAN',
    stats: makeStats({ txErrors: 3, rxErrors: 0 }),
  },
};

/**
 * Interface with both TX and RX errors.
 * The error count is the sum of both fields.
 */
export const WithBothErrors: Story = {
  args: {
    interfaceName: 'wlan1 - Guest WiFi',
    stats: makeStats({ txErrors: 5, rxErrors: 2 }),
  },
};

/**
 * Exactly one error – confirms singular form "1 error detected."
 */
export const SingleError: Story = {
  args: {
    interfaceName: 'ether3 - DMZ',
    stats: makeStats({ txErrors: 0, rxErrors: 1 }),
  },
};

/**
 * Null stats – component should render nothing (returns null).
 * The debug panel shows a placeholder message.
 */
export const NullStats: Story = {
  args: {
    interfaceName: 'ether1 - WAN',
    stats: null,
  },
};

/**
 * Zero traffic – interface exists but has not transmitted or received anything
 * yet. Announcement mentions "0 bytes" for both directions.
 */
export const ZeroTraffic: Story = {
  args: {
    interfaceName: 'bridge1 - Internal',
    stats: makeStats({
      txBytes: '0',
      rxBytes: '0',
      txPackets: '0',
      rxPackets: '0',
    }),
  },
};
