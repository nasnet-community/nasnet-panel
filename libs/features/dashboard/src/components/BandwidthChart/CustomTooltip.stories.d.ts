/**
 * Storybook stories for CustomTooltip
 *
 * The custom Recharts tooltip for the BandwidthChart component.
 * Displays the data-point timestamp, TX/RX rates, and cumulative
 * TX/RX byte totals (AC 5.5.3).
 */
import { CustomTooltip } from './CustomTooltip';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CustomTooltip>;
export default meta;
type Story = StoryObj<typeof CustomTooltip>;
/** Typical active tooltip with moderate traffic on both TX and RX. */
export declare const ActiveWithData: Story;
/** High-bandwidth gigabit traffic — verifies Gbps / GB formatting. */
export declare const HighBandwidth: Story;
/** Very low traffic — verifies Kbps / KB formatting. */
export declare const LowBandwidth: Story;
/** Tooltip with zero traffic — both rates display as "0 bps". */
export declare const ZeroTraffic: Story;
/** Inactive state — tooltip should render nothing (empty output). */
export declare const Inactive: Story;
/** Empty payload array — tooltip should render nothing. */
export declare const EmptyPayload: Story;
//# sourceMappingURL=CustomTooltip.stories.d.ts.map