/**
 * Stories for LogEntry component
 * Displays a single system log entry with timestamp, topic badge, severity badge, and message
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<import("./LogEntry").LogEntryProps & import("react").RefAttributes<HTMLDivElement>>>;
    tags: string[];
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    argTypes: {
        entry: {
            description: string;
            control: {
                type: "object";
            };
        };
        compact: {
            control: "boolean";
            description: string;
        };
        showDate: {
            control: "boolean";
            description: string;
        };
        isBookmarked: {
            control: "boolean";
            description: string;
        };
        searchTerm: {
            control: "text";
            description: string;
        };
        onToggleBookmark: {
            action: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const Mobile: Story;
export declare const Tablet: Story;
export declare const Desktop: Story;
export declare const InfoEntry: Story;
export declare const CriticalEntry: Story;
export declare const WithSearchHighlight: Story;
export declare const Bookmarked: Story;
export declare const DebugSeverity: Story;
//# sourceMappingURL=LogEntry.stories.d.ts.map