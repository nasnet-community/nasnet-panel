/**
 * AlertList Storybook Stories
 *
 * Covers all render states of the AlertList component:
 * active alerts, acknowledged alerts, loading, error, empty, and paginated.
 */
import { AlertList } from './AlertList';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertList>;
export default meta;
type Story = StoryObj<typeof AlertList>;
/**
 * Default — mixed severity unacknowledged alerts.
 */
export declare const Default: Story;
/**
 * With Queued Alerts — alerts carrying quiet-hours metadata badges.
 */
export declare const WithQueuedAlerts: Story;
/**
 * Acknowledged — historical view with greyed-out acknowledged entries.
 */
export declare const Acknowledged: Story;
/**
 * Filtered by Critical severity only.
 */
export declare const CriticalOnly: Story;
/**
 * Empty — no alerts match the current filters.
 */
export declare const Empty: Story;
/**
 * Loading — network request in flight.
 */
export declare const Loading: Story;
/**
 * Error — GraphQL query failed.
 */
export declare const ErrorState: Story;
//# sourceMappingURL=AlertList.stories.d.ts.map