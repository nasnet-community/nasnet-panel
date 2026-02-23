import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ entry, isOpen, onClose, relatedEntries, onPrevious, onNext, hasPrevious, hasNext, }: import("./LogDetailPanel").LogDetailPanelProps) => import("react/jsx-runtime").JSX.Element | null>;
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
        isOpen: {
            control: "boolean";
            description: string;
        };
        onClose: {
            action: string;
        };
        relatedEntries: {
            description: string;
            control: {
                type: "object";
            };
        };
        onPrevious: {
            action: string;
        };
        onNext: {
            action: string;
        };
        hasPrevious: {
            control: "boolean";
            description: string;
        };
        hasNext: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Open: Story;
export declare const Closed: Story;
export declare const NoRelatedEntries: Story;
export declare const WithNavigationDisabled: Story;
export declare const CriticalEntry: Story;
//# sourceMappingURL=LogDetailPanel.stories.d.ts.map