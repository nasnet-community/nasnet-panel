/**
 * UpdateIndicator Storybook Stories (NAS-8.7)
 */
import { UpdateIndicator } from './UpdateIndicator';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof UpdateIndicator>;
export default meta;
type Story = StoryObj<typeof UpdateIndicator>;
/**
 * No update available - component is hidden
 */
export declare const NoUpdate: Story;
/**
 * Minor update available
 */
export declare const MinorUpdate: Story;
/**
 * Security update with critical fixes
 */
export declare const SecurityUpdate: Story;
/**
 * Major update with breaking changes
 */
export declare const MajorUpdateWithBreakingChanges: Story;
/**
 * Patch update (bug fixes only)
 */
export declare const PatchUpdate: Story;
/**
 * Update in progress - downloading
 */
export declare const Updating_Downloading: Story;
/**
 * Update in progress - verifying
 */
export declare const Updating_Verifying: Story;
/**
 * Update in progress - stopping service
 */
export declare const Updating_Stopping: Story;
/**
 * Update in progress - installing
 */
export declare const Updating_Installing: Story;
/**
 * Update in progress - health check
 */
export declare const Updating_HealthCheck: Story;
/**
 * Update complete
 */
export declare const UpdateComplete: Story;
/**
 * Update failed
 */
export declare const UpdateFailed: Story;
/**
 * Update rolled back after health check failure
 */
export declare const UpdateRolledBack: Story;
/**
 * Large binary download
 */
export declare const LargeBinaryDownload: Story;
/**
 * Multiple warnings
 */
export declare const MultipleWarnings: Story;
//# sourceMappingURL=UpdateIndicator.stories.d.ts.map