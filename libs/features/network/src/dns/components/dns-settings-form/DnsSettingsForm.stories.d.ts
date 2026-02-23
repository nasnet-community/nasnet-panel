/**
 * DNS Settings Form Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./DnsSettingsForm").DnsSettingsFormProps>;
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
        initialValues: {
            description: string;
            control: "object";
        };
        cacheUsed: {
            description: string;
            control: {
                type: "number";
                min: number;
                max: number;
            };
        };
        cacheUsedPercent: {
            description: string;
            control: {
                type: "number";
                min: number;
                max: number;
            };
        };
        loading: {
            description: string;
            control: "boolean";
        };
        onSubmit: {
            description: string;
            action: string;
        };
    };
    args: {
        onSubmit: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default state with remote requests disabled and moderate cache usage
 */
export declare const Default: Story;
/**
 * Remote requests enabled (no security warning on subsequent loads)
 */
export declare const RemoteRequestsEnabled: Story;
/**
 * Empty cache (0% usage)
 */
export declare const EmptyCache: Story;
/**
 * Full cache (100% usage)
 */
export declare const FullCache: Story;
/**
 * Minimum cache size (512 KB)
 */
export declare const MinimumCacheSize: Story;
/**
 * Maximum cache size (10240 KB = 10 MB)
 */
export declare const MaximumCacheSize: Story;
/**
 * Loading state (all fields disabled)
 */
export declare const Loading: Story;
/**
 * Security warning demonstration
 * Toggle "Allow Remote Requests" to see the security warning dialog
 */
export declare const SecurityWarningInteraction: Story;
/**
 * Cache size validation - Below minimum
 * Try entering a cache size below 512 KB
 */
export declare const CacheSizeBelowMinimum: Story;
/**
 * Cache size validation - Above maximum
 * Try entering a cache size above 10240 KB
 */
export declare const CacheSizeAboveMaximum: Story;
/**
 * Home network scenario (small cache, no remote requests)
 */
export declare const HomeNetwork: Story;
/**
 * Small office scenario (larger cache, remote requests enabled)
 */
export declare const SmallOffice: Story;
/**
 * Enterprise scenario (maximum cache, remote requests enabled)
 */
export declare const Enterprise: Story;
/**
 * Cache almost full (95%)
 */
export declare const CacheAlmostFull: Story;
/**
 * Very low cache usage (5%)
 */
export declare const VeryLowCacheUsage: Story;
//# sourceMappingURL=DnsSettingsForm.stories.d.ts.map