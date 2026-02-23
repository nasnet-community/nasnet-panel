import { ChangelogModal } from './ChangelogModal';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ChangelogModal>;
export default meta;
type Story = StoryObj<typeof ChangelogModal>;
/**
 * Security update with security-fix warning.
 */
export declare const SecurityUpdate: Story;
/**
 * Major update that also contains breaking changes.
 */
export declare const MajorWithBreakingChanges: Story;
/**
 * Security update that also has breaking changes — both warning banners visible.
 */
export declare const SecurityAndBreaking: Story;
/**
 * Minor update — informational badge, no warnings.
 */
export declare const MinorUpdate: Story;
/**
 * Patch update — smallest possible change, green badge, no warnings.
 */
export declare const PatchUpdate: Story;
/**
 * Modal in closed state — Dialog is not rendered, useful for asserting
 * that nothing is mounted when open is false.
 */
export declare const Closed: Story;
//# sourceMappingURL=ChangelogModal.stories.d.ts.map