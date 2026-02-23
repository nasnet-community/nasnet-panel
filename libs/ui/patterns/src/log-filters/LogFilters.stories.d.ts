/**
 * Stories for LogFilters component
 * Multi-select filters for log topics and severities
 */
import type { StoryObj } from '@storybook/react';
import * as React from 'react';
declare const meta: {
    title: string;
    component: React.MemoExoticComponent<({ topics, onTopicsChange, severities, onSeveritiesChange, className, }: import("./LogFilters").LogFiltersProps) => import("react/jsx-runtime").JSX.Element>;
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
        topics: {
            description: string;
            control: {
                type: "object";
            };
        };
        onTopicsChange: {
            action: string;
        };
        severities: {
            description: string;
            control: {
                type: "object";
            };
        };
        onSeveritiesChange: {
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
export declare const WithTopicsSelected: Story;
export declare const WithSeveritiesSelected: Story;
export declare const BothFiltersActive: Story;
export declare const AllTopicsSelected: Story;
//# sourceMappingURL=LogFilters.stories.d.ts.map