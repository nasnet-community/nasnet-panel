import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ group, searchTerm, onEntryClick, isBookmarked, onToggleBookmark, className, }: import("./LogGroup").LogGroupProps) => import("react/jsx-runtime").JSX.Element>;
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
        group: {
            description: string;
            control: {
                type: "object";
            };
        };
        searchTerm: {
            control: "text";
            description: string;
        };
        isBookmarked: {
            description: string;
        };
        onEntryClick: {
            action: string;
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
export declare const Expanded: Story;
export declare const SingleEntry: Story;
export declare const CriticalSeverity: Story;
export declare const WithSearch: Story;
declare const meta2: {
    title: string;
    component: import("react").MemoExoticComponent<({ groups, searchTerm, onEntryClick, isBookmarked, onToggleBookmark, className, }: import("./LogGroup").LogGroupListProps) => import("react/jsx-runtime").JSX.Element>;
    tags: string[];
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
};
export declare const ListDefault: StoryObj<typeof meta2>;
//# sourceMappingURL=LogGroup.stories.d.ts.map