/**
 * SystemInfoCard Stories
 *
 * Storybook stories for the SystemInfoCard pattern component.
 * Demonstrates the data, loading, error, and empty states,
 * along with various router model examples.
 */
import { SystemInfoCard } from './SystemInfoCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SystemInfoCard>;
export default meta;
type Story = StoryObj<typeof SystemInfoCard>;
/**
 * Default populated card — typical MikroTik hAP home router.
 */
export declare const Default: Story;
/**
 * High-end RB4011 router with arm64 architecture.
 */
export declare const RB4011Router: Story;
/**
 * Cloud Hosted Router (CHR) — x86_64, short uptime.
 */
export declare const CloudHostedRouter: Story;
/**
 * Router without an uptime value — displays "N/A".
 */
export declare const WithoutUptime: Story;
/**
 * Loading state — shows four skeleton rows.
 */
export declare const LoadingState: Story;
/**
 * Error state with retry button.
 */
export declare const ErrorWithRetry: Story;
/**
 * Error state without a retry callback — retry button is hidden.
 */
export declare const ErrorWithoutRetry: Story;
/**
 * No data and no error — renders the "no information" fallback.
 */
export declare const NoData: Story;
//# sourceMappingURL=SystemInfoCard.stories.d.ts.map