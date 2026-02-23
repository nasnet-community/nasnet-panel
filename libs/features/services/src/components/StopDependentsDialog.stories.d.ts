import { StopDependentsDialog } from './StopDependentsDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StopDependentsDialog>;
export default meta;
type Story = StoryObj<typeof StopDependentsDialog>;
/**
 * Default view with a single required dependent service.
 */
export declare const SingleDependent: Story;
/**
 * Multiple dependent services with mixed Required and Optional types.
 */
export declare const MultipleDependents: Story;
/**
 * Loading state while the stop action is being processed.
 */
export declare const Loading: Story;
/**
 * Only optional dependents — less critical than required ones.
 */
export declare const OnlyOptionalDependents: Story;
/**
 * Closed state — dialog is not visible.
 */
export declare const Closed: Story;
//# sourceMappingURL=StopDependentsDialog.stories.d.ts.map