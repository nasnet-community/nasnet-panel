/**
 * Storybook stories for BandwidthChart
 * NAS-6.9: Implement Interface Traffic Statistics (Task 5)
 *
 * BandwidthChart fetches historical bandwidth data via
 * useInterfaceStatsHistoryQuery (Apollo Client).  Stories demonstrate the
 * full range of prop combinations.  A mock GraphQL layer (MockedProvider or
 * MSW addon) is required to return chart data; without it the component
 * renders its built-in empty-state UI.
 */
import { BandwidthChart } from './bandwidth-chart';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BandwidthChart>;
export default meta;
type Story = StoryObj<typeof BandwidthChart>;
/**
 * Default view: last 24 hours at 5-minute resolution with TX/RX legend.
 * Mocked data simulates realistic daytime traffic curve peaking at ~80 Mbps TX.
 */
export declare const Default: Story;
/**
 * Last 1 hour at 1-minute resolution – high-frequency, short window.
 * Useful when investigating a current incident.
 */
export declare const LastOneHour: Story;
/**
 * Last 7 days at 1-hour resolution – useful for weekly traffic pattern analysis.
 */
export declare const LastSevenDays: Story;
/**
 * Legend hidden – compact view suitable for embedding inside a dashboard widget.
 */
export declare const NoLegend: Story;
/**
 * LTE backup interface – different interface ID, 6-hour window.
 * Simulates lower but stable traffic typical of a mobile backup link.
 */
export declare const LteInterface: Story;
/**
 * Empty data state – when the selected time range has no stored data points.
 * Renders the dashed empty-state placeholder instead of a chart.
 */
export declare const EmptyState: Story;
//# sourceMappingURL=bandwidth-chart.stories.d.ts.map