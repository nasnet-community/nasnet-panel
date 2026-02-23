/**
 * BulkActionsToolbar Storybook Stories
 *
 * Story: NAS-6.3 - DHCP Lease Management
 *
 * Toolbar rendered when one or more DHCP leases are selected.
 * Provides "Make All Static", "Delete Selected", and "Clear" actions.
 * Destructive actions require confirmation via ConfirmationDialog.
 * The toolbar is hidden when selectedCount === 0.
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ selectedCount, onMakeStatic, onDelete, onClear, isLoading, className, }: import("./BulkActionsToolbar").BulkActionsToolbarProps) => import("react/jsx-runtime").JSX.Element | null>;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    tags: string[];
    argTypes: {
        selectedCount: {
            description: string;
            control: {
                type: "number";
                min: number;
                max: number;
            };
        };
        isLoading: {
            description: string;
            control: "boolean";
        };
        onMakeStatic: {
            description: string;
            action: string;
        };
        onDelete: {
            description: string;
            action: string;
        };
        onClear: {
            description: string;
            action: string;
        };
        className: {
            description: string;
            control: "text";
        };
    };
    args: {
        onMakeStatic: import("storybook/test").Mock<(...args: any[]) => any>;
        onDelete: import("storybook/test").Mock<(...args: any[]) => any>;
        onClear: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default — 5 leases selected. All three action buttons are visible.
 */
export declare const Default: Story;
/**
 * Single lease selected — label uses singular form "1 lease selected".
 */
export declare const SingleLease: Story;
/**
 * Large selection — 50 leases selected (bulk fleet cleanup scenario).
 */
export declare const LargeSelection: Story;
/**
 * Loading state — all buttons disabled while the mutation runs.
 */
export declare const Loading: Story;
/**
 * Hidden state — selectedCount is 0, so the toolbar renders nothing.
 * The story wrapper shows a helper message so the canvas is not blank.
 */
export declare const HiddenWhenNoneSelected: Story;
/**
 * Custom className — demonstrates layout integration with the parent table.
 */
export declare const WithCustomClassName: Story;
//# sourceMappingURL=BulkActionsToolbar.stories.d.ts.map