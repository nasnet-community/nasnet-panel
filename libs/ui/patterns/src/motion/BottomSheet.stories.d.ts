/**
 * BottomSheet Storybook Stories
 *
 * Demonstrates the mobile-optimized BottomSheet component with swipe-to-dismiss,
 * backdrop behaviour, and the BottomSheetHeader / BottomSheetContent /
 * BottomSheetFooter sub-components.
 *
 * @module @nasnet/ui/patterns/motion
 */
import { BottomSheet } from './BottomSheet';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BottomSheet>;
export default meta;
type Story = StoryObj<typeof BottomSheet>;
/**
 * Default bottom sheet with header, content, and footer.
 * Swipe down or press Escape to dismiss.
 */
export declare const Default: Story;
/**
 * Sheet without a backdrop – content remains visible beneath it.
 */
export declare const NoBackdrop: Story;
/**
 * Backdrop does not close the sheet on click.
 * Only the footer Cancel button or Escape key will close it.
 */
export declare const BackdropNotDismissable: Story;
/**
 * Swipe-to-dismiss is disabled. The sheet can only be dismissed
 * via the footer Cancel button or Escape key.
 */
export declare const NoSwipeToDismiss: Story;
/**
 * A richer sheet showing a network settings form layout
 * with labelled form fields inside the content area.
 */
export declare const NetworkSettingsSheet: Story;
/**
 * Confirmation dialog variant – destructive action with short swipe threshold.
 */
export declare const ConfirmationSheet: Story;
//# sourceMappingURL=BottomSheet.stories.d.ts.map