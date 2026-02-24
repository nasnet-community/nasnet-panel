/**
 * Storybook stories for AddressListEntryForm
 *
 * Covers the full range of states: empty form, pre-filled list, loading,
 * and various address format modes (IP, CIDR, range).
 */
import { AddressListEntryForm } from './AddressListEntryForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddressListEntryForm>;
export default meta;
type Story = StoryObj<typeof AddressListEntryForm>;
export declare const Default: Story;
export declare const NoExistingLists: Story;
export declare const WithDefaultList: Story;
export declare const LoadingState: Story;
export declare const WithoutCancelButton: Story;
export declare const WithSubmissionError: Story;
//# sourceMappingURL=AddressListEntryForm.stories.d.ts.map