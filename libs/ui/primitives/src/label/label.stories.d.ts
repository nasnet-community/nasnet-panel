import { Label } from './label';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof Label>;
/**
 * Default label story showing basic usage
 */
export declare const Default: Story;
/**
 * Label associated with a text input field
 */
export declare const AssociatedWithInput: Story;
/**
 * Label paired with a disabled input field
 * Demonstrates peer-disabled styling (reduced opacity, not-allowed cursor)
 */
export declare const DisabledState: Story;
/**
 * Label with required field indicator
 * Shows how to mark fields as required with the error color accent
 */
export declare const RequiredField: Story;
/**
 * Group of labels with associated form fields
 */
export declare const FormGroup: Story;
/**
 * Long label text (tests text wrapping and typography)
 */
export declare const LongLabelText: Story;
/**
 * Dark mode - Default label in dark theme
 * Tests 7:1 contrast ratio in dark mode
 */
export declare const DarkModeDefault: Story;
/**
 * Dark mode - With associated input
 */
export declare const DarkModeWithInput: Story;
//# sourceMappingURL=label.stories.d.ts.map