/**
 * DNS Static Entries List Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * Platform-adaptive list of static DNS hostname→IP mappings.
 * Desktop: sortable DataTable. Mobile: card-based layout.
 * Stories cover the full range of data states and interaction modes.
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./DnsStaticEntriesList").DnsStaticEntriesListProps>;
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
        entries: {
            description: string;
            control: "object";
        };
        loading: {
            description: string;
            control: "boolean";
        };
        onEdit: {
            description: string;
            action: string;
        };
        onDelete: {
            description: string;
            action: string;
        };
        onAdd: {
            description: string;
            action: string;
        };
    };
    args: {
        onEdit: import("storybook/test").Mock<(...args: any[]) => any>;
        onDelete: import("storybook/test").Mock<(...args: any[]) => any>;
        onAdd: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default state with a realistic set of static DNS entries.
 */
export declare const Default: Story;
/**
 * Empty state — no static entries configured yet.
 * Shows the EmptyState component with an Add action.
 */
export declare const Empty: Story;
/**
 * Single entry — minimal list.
 */
export declare const SingleEntry: Story;
/**
 * Loading state — all actions are disabled during an async operation.
 */
export declare const Loading: Story;
/**
 * Entries with mixed TTL values — verifies human-readable TTL formatting.
 */
export declare const MixedTTLValues: Story;
/**
 * Entries without comments — verifies graceful handling of empty comment field.
 */
export declare const NoComments: Story;
/**
 * Large list — tests alphabetical sorting and table scroll behavior.
 */
export declare const LargeList: Story;
//# sourceMappingURL=DnsStaticEntriesList.stories.d.ts.map