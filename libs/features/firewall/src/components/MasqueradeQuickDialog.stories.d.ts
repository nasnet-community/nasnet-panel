/**
 * Storybook stories for MasqueradeQuickDialog
 *
 * Demonstrates the simple one-step masquerade creation dialog:
 * WAN interface selection and optional comment, with various interface sets.
 */
import { MasqueradeQuickDialog } from './MasqueradeQuickDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MasqueradeQuickDialog>;
export default meta;
type Story = StoryObj<typeof MasqueradeQuickDialog>;
export declare const Default: Story;
export declare const SingleInterface: Story;
export declare const WithPppoeInterface: Story;
export declare const ManyInterfaces: Story;
export declare const WithSuccessCallback: Story;
export declare const AlternateRouter: Story;
//# sourceMappingURL=MasqueradeQuickDialog.stories.d.ts.map