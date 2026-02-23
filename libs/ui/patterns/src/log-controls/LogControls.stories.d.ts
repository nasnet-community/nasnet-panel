import type { StoryObj } from '@storybook/react';
import type { LogControlsProps } from './LogControls';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ isPaused, onPauseToggle, lastUpdated, logs, routerIp, className, }: LogControlsProps) => import("react/jsx-runtime").JSX.Element>;
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
        isPaused: {
            control: "boolean";
            description: string;
        };
        onPauseToggle: {
            action: string;
        };
        lastUpdated: {
            description: string;
            control: {
                type: "date";
            };
        };
        logs: {
            description: string;
            control: {
                type: "object";
            };
        };
        routerIp: {
            control: "text";
            description: string;
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
export declare const Paused: Story;
export declare const NoLogs: Story;
export declare const ManyLogs: Story;
//# sourceMappingURL=LogControls.stories.d.ts.map