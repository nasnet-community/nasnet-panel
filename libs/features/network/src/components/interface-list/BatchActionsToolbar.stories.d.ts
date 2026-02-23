/**
 * BatchActionsToolbar Stories
 *
 * The BatchActionsToolbar renders a selection count, a "Batch Actions" dropdown
 * (Enable / Disable), and a "Clear Selection" button. It shows a BatchConfirmDialog
 * before executing any operation.
 *
 * Because it depends on the `useBatchInterfaceOperation` Apollo mutation, stories
 * use MockedProvider to supply controlled responses.
 */
import { BatchActionsToolbar } from './BatchActionsToolbar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BatchActionsToolbar>;
export default meta;
type Story = StoryObj<typeof BatchActionsToolbar>;
/** Two interfaces selected — shows count, Batch Actions button, and Clear. */
export declare const TwoSelected: Story;
/** Single interface selected — count should read "1 selected". */
export declare const SingleSelected: Story;
/** All four interfaces selected, including gateway-used ether1. Disabling them
 *  triggers the safety-confirmation countdown dialog. */
export declare const AllSelected: Story;
/** Simulates a partial failure: one interface succeeds and one fails. */
export declare const PartialFailure: Story;
/** No interfaces selected — toolbar still renders but count shows 0. */
export declare const NoneSelected: Story;
/** Mobile viewport — verify layout stays usable at narrow widths. */
export declare const MobileView: Story;
//# sourceMappingURL=BatchActionsToolbar.stories.d.ts.map