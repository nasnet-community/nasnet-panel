/**
 * Storybook stories for StatsCounter
 *
 * StatsCounter is a purely presentational component that accepts a string
 * value, a label, and an optional unit type, then formats and renders the
 * value with a subtle opacity animation when it changes.
 *
 * The three unit modes are:
 * - bytes   → formatted as KB / MB / GB / TB (BigInt-aware)
 * - packets → formatted with thousand-separator commas
 * - count   → formatted with thousand-separator commas
 */
import { StatsCounter } from './stats-counter';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StatsCounter>;
export default meta;
type Story = StoryObj<typeof StatsCounter>;
/**
 * Default – bytes unit formatting. Shows a realistic multi-gigabyte TX total
 * as would appear in a long-running WAN interface panel.
 */
export declare const Default: Story;
/**
 * Zero bytes – the empty / initial state before any traffic has been counted.
 */
export declare const ZeroBytes: Story;
/**
 * Small kilobyte-range value – ensures the KB unit tier is exercised.
 */
export declare const KilobyteRange: Story;
/**
 * Packet counter – large number formatted with thousand separators.
 */
export declare const PacketCount: Story;
/**
 * Error count using the \`count\` unit – displayed with commas but semantically
 * distinct from packet counters.
 */
export declare const ErrorCount: Story;
/**
 * Zero errors – the happy-path state where an interface has no errors.
 * The parent panel typically colours this in muted-foreground.
 */
export declare const ZeroErrors: Story;
/**
 * A grid of four counters laid out side-by-side, mirroring how they appear
 * inside the real InterfaceStatsPanel component.
 */
export declare const StatsGrid: Story;
//# sourceMappingURL=stats-counter.stories.d.ts.map