/**
 * Storybook stories for CPUBreakdownModal
 * Accessible modal dialog showing per-core CPU usage as horizontal bars
 *
 * AC 5.2.4: Click CPU gauge to see breakdown of usage per core
 */
import { CPUBreakdownModal } from './CPUBreakdownModal';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CPUBreakdownModal>;
export default meta;
type Story = StoryObj<typeof CPUBreakdownModal>;
/**
 * Default open state — healthy 4-core router running at moderate load.
 */
export declare const Default: Story;
/**
 * Warning state — several cores above 70% but none critical.
 */
export declare const Warning: Story;
/**
 * Critical state — cores at or near maximum load.
 */
export declare const Critical: Story;
/**
 * Mixed state — demonstrates per-core colour differentiation when cores vary.
 */
export declare const MixedLoad: Story;
/**
 * Single-core router — common on entry-level MikroTik hardware.
 */
export declare const SingleCore: Story;
/**
 * No frequency — when the router does not expose CPU clock information.
 */
export declare const NoFrequency: Story;
//# sourceMappingURL=CPUBreakdownModal.stories.d.ts.map