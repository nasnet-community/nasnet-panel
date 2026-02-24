/**
 * Storybook stories for AddressListExportDialog
 *
 * Demonstrates export dialog with CSV, JSON, and RouterOS script formats
 * for varying sizes and types of address list entries.
 */
import { AddressListExportDialog } from './AddressListExportDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddressListExportDialog>;
export default meta;
type Story = StoryObj<typeof AddressListExportDialog>;
export declare const Default: Story;
export declare const SingleEntry: Story;
export declare const BlocklistExport: Story;
export declare const LargeExport: Story;
export declare const CustomTriggerText: Story;
export declare const EmptyList: Story;
//# sourceMappingURL=AddressListExportDialog.stories.d.ts.map