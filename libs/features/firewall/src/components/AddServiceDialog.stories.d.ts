/**
 * AddServiceDialog Storybook Stories
 *
 * Visual documentation and interactive testing for the AddServiceDialog component.
 *
 * Stories:
 * - Add mode (empty form)
 * - Edit mode (pre-filled values)
 * - With validation errors
 * - With conflict error
 * - Submitting state (loading)
 * - All protocol options
 */
import { AddServiceDialog } from './AddServiceDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddServiceDialog>;
export default meta;
type Story = StoryObj<typeof AddServiceDialog>;
/**
 * Default story: Add mode with empty form
 */
export declare const AddMode: Story;
/**
 * Edit mode with pre-filled values
 */
export declare const EditMode: Story;
/**
 * With validation errors (demonstrates form validation)
 */
export declare const WithValidationErrors: Story;
/**
 * With conflict error (service name already exists)
 */
export declare const WithConflictError: Story;
/**
 * UDP protocol selected
 */
export declare const UDPProtocol: Story;
/**
 * Both (TCP & UDP) protocol selected
 */
export declare const BothProtocols: Story;
/**
 * Long description (max length test)
 */
export declare const LongDescription: Story;
/**
 * Closed state (for testing open/close behavior)
 */
export declare const Closed: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * Tablet viewport
 */
export declare const Tablet: Story;
/**
 * Dark mode
 */
export declare const DarkMode: Story;
/**
 * Interaction test (keyboard navigation)
 */
export declare const KeyboardNavigation: Story;
//# sourceMappingURL=AddServiceDialog.stories.d.ts.map