/**
 * Storybook stories for AddressListImportDialog
 *
 * Demonstrates the multi-step import dialog: select, preview, importing, and complete.
 * Covers scenarios with no existing lists, existing lists for autocomplete, and
 * a simulated async import callback.
 */
import { AddressListImportDialog } from './AddressListImportDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddressListImportDialog>;
export default meta;
type Story = StoryObj<typeof AddressListImportDialog>;
export declare const Default: Story;
export declare const NoExistingLists: Story;
export declare const WithSuccessfulImport: Story;
export declare const WithFailingImport: Story;
export declare const ManyExistingLists: Story;
export declare const NoImportCallback: Story;
//# sourceMappingURL=AddressListImportDialog.stories.d.ts.map