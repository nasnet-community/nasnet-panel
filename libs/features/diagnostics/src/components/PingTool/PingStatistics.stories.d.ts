/**
 * Storybook stories for PingStatistics
 *
 * Demonstrates all badge variants and color states of the PingStatistics
 * component, driven by different packet-loss scenarios.
 */
import { PingStatistics } from './PingStatistics';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PingStatistics>;
export default meta;
type Story = StoryObj<typeof PingStatistics>;
/**
 * Perfect — No Packet Loss
 *
 * All 10 packets received. Shows the "No Loss" success badge with green styling.
 */
export declare const NoLoss: Story;
/**
 * Partial Loss (10%)
 *
 * One packet lost out of ten. Shows the warning (amber) badge and red lost count.
 */
export declare const PartialLoss: Story;
/**
 * High Loss (60%)
 *
 * Most packets dropped. Triggers the error (red) badge variant.
 */
export declare const HighLoss: Story;
/**
 * Host Unreachable (100% Loss)
 *
 * No packets were received at all. Shows the "Host Unreachable" error badge
 * and N/A RTT values.
 */
export declare const HostUnreachable: Story;
/**
 * In Progress (Partial Data)
 *
 * Ping test still running — only a few packets sent so far.
 * Demonstrates the component with a small result set mid-test.
 */
export declare const InProgress: Story;
/**
 * High Latency Network
 *
 * All packets received but with very high RTT (satellite or heavily congested link).
 * No loss badge — but RTT values highlight the degraded connection quality.
 */
export declare const HighLatency: Story;
//# sourceMappingURL=PingStatistics.stories.d.ts.map