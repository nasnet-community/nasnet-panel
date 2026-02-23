import { UpdateAllPanel } from './UpdateAllPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof UpdateAllPanel>;
export default meta;
type Story = StoryObj<typeof UpdateAllPanel>;
/**
 * Mixed severity updates — security alert banner is shown, and the update
 * list is sorted highest-severity first.
 */
export declare const MixedSeverities: Story;
/**
 * Security-only updates — emphasises the destructive alert banner and
 * the red severity badge.
 */
export declare const SecurityOnly: Story;
/**
 * Patch update only — no alert banner, green badge, minimal UI.
 */
export declare const PatchOnly: Story;
/**
 * One instance mid-update — shows the progress bar inline and hides
 * the per-row "Update" button for the active instance.
 */
export declare const OneInstanceUpdating: Story;
/**
 * More than 5 updates — verifies the "and X more…" overflow message.
 */
export declare const ManyUpdates: Story;
/**
 * Loading state — "Update All" button is disabled while the mutation is in flight.
 */
export declare const LoadingState: Story;
//# sourceMappingURL=UpdateAllPanel.stories.d.ts.map