/**
 * Storybook stories for InterfaceComparison
 *
 * This component depends on:
 * - useInterfaceStatsSubscription (GraphQL subscription) – mocked via args
 * - BandwidthChart (rendered only when interfaces are selected)
 * - DataTable / Card primitives
 *
 * Stories exercise the table in various data configurations.
 * Live subscriptions and chart rendering are intentionally left as stubs so
 * stories load instantly without a real backend.
 */
import { InterfaceComparison } from './interface-comparison';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceComparison>;
export default meta;
type Story = StoryObj<typeof InterfaceComparison>;
/**
 * All interfaces online – the most common production state.
 * Top 3 rows will be marked as Hotspot (all show 0 B/s since there is no
 * live subscription in Storybook).
 */
export declare const Default: Story;
/**
 * Mixed statuses (online / degraded / offline) showing all three badge
 * variants simultaneously.
 */
export declare const MixedStatus: Story;
/**
 * Only a single interface available – minimal table, no charts selectable
 * until the checkbox is ticked.
 */
export declare const SingleInterface: Story;
/**
 * Empty interface list – should render the DataTable empty-state message.
 */
export declare const NoInterfaces: Story;
/**
 * Eight interfaces representing a larger fleet. Demonstrates how the table
 * handles more rows and confirms Hotspot labelling on only the top 3.
 */
export declare const LargeFleet: Story;
/**
 * Short 1-hour time range with real-time 1-second polling – as would be
 * used during active incident investigation.
 */
export declare const RealTimeShortRange: Story;
//# sourceMappingURL=interface-comparison.stories.d.ts.map