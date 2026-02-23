/**
 * Storybook Stories for RecentLogs Component
 * Demonstrates all states: default, filtered, loading, error, empty
 * Story NAS-5.6: Recent Logs with Filtering
 */
import { RecentLogs } from './RecentLogs';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RecentLogs>;
export default meta;
type Story = StoryObj<typeof RecentLogs>;
/**
 * Default state with mixed log entries
 */
export declare const Default: Story;
/**
 * Firewall topic filter applied
 */
export declare const FilteredFirewall: Story;
/**
 * All error and critical severity logs
 */
export declare const AllErrors: Story;
/**
 * Empty state - no logs matching filter
 */
export declare const EmptyState: Story;
/**
 * Loading skeleton state
 */
export declare const Loading: Story;
/**
 * Error state with retry button
 */
export declare const ErrorState: Story;
/**
 * Mobile viewport (375px)
 */
export declare const Mobile: Story;
/**
 * High volume - rapid log updates (demonstrates limit to 10)
 */
export declare const HighVolume: Story;
/**
 * Reduced motion mode (no animations)
 */
export declare const ReducedMotion: Story;
//# sourceMappingURL=RecentLogs.stories.d.ts.map