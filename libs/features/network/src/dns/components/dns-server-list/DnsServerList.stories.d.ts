/**
 * DNS Server List Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import { DnsServerList } from './DnsServerList';
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./DnsServerList").DnsServerListProps>;
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
        servers: {
            description: string;
            control: "object";
        };
        loading: {
            description: string;
            control: "boolean";
        };
        onReorder: {
            description: string;
            action: string;
        };
        onRemove: {
            description: string;
            action: string;
        };
        onAdd: {
            description: string;
            action: string;
        };
    };
    args: {
        onReorder: import("storybook/test").Mock<(...args: any[]) => any>;
        onRemove: import("storybook/test").Mock<(...args: any[]) => any>;
        onAdd: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof DnsServerList>;
/**
 * Default state with mix of static and dynamic servers
 */
export declare const Default: Story;
/**
 * Empty state with no servers configured
 */
export declare const Empty: Story;
/**
 * Only static servers (all can be reordered/removed)
 */
export declare const OnlyStaticServers: Story;
/**
 * Only dynamic servers (from DHCP/PPPoE, read-only)
 */
export declare const OnlyDynamicServers: Story;
/**
 * Single server
 */
export declare const SingleServer: Story;
/**
 * Loading state (all interactions disabled)
 */
export declare const Loading: Story;
/**
 * Many servers (tests scrolling behavior)
 */
export declare const ManyServers: Story;
/**
 * Demonstrates reordering interaction
 * (In Storybook, use drag handles to reorder static servers)
 */
export declare const InteractiveReordering: Story;
/**
 * Demonstrates remove interaction
 */
export declare const InteractiveRemove: Story;
/**
 * Dynamic server at the top (common scenario)
 */
export declare const DynamicServerFirst: Story;
/**
 * Long IP addresses (IPv4 max length)
 */
export declare const LongAddresses: Story;
//# sourceMappingURL=DnsServerList.stories.d.ts.map