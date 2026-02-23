/**
 * DNS Static Entry Form Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * Form for creating and editing static DNS hostname-to-IP mappings.
 * Includes RFC 1123 hostname validation, IPv4 input, TTL config,
 * optional comment, and duplicate hostname detection.
 */
import { DnsStaticEntryForm } from './DnsStaticEntryForm';
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: typeof DnsStaticEntryForm;
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
        mode: {
            description: string;
            control: {
                type: "select";
            };
            options: string[];
        };
        initialValues: {
            description: string;
            control: "object";
        };
        existingEntries: {
            description: string;
            control: "object";
        };
        currentEntryId: {
            description: string;
            control: "text";
        };
        isLoading: {
            description: string;
            control: "boolean";
        };
        onSubmit: {
            description: string;
            action: string;
        };
        onCancel: {
            description: string;
            action: string;
        };
    };
    args: {
        onSubmit: import("storybook/test").Mock<(...args: any[]) => any>;
        onCancel: import("storybook/test").Mock<(...args: any[]) => any>;
        existingEntries: {
            id: string;
            name: string;
        }[];
    };
};
export default meta;
type Story = StoryObj<typeof DnsStaticEntryForm>;
/**
 * Create mode — blank form ready for a new entry.
 */
export declare const CreateMode: Story;
/**
 * Edit mode — form pre-filled with an existing entry's values.
 */
export declare const EditMode: Story;
/**
 * Pre-filled hostname and IP — useful for testing auto-suggest flows.
 */
export declare const PreFilledHostnameAndIP: Story;
/**
 * Loading state — all fields and buttons are disabled during save.
 */
export declare const Loading: Story;
/**
 * Short TTL (1 hour) — suitable for frequently-changing devices.
 */
export declare const ShortTTL: Story;
/**
 * Maximum TTL (7 days) — suitable for infrastructure devices.
 */
export declare const MaxTTL: Story;
//# sourceMappingURL=DnsStaticEntryForm.stories.d.ts.map