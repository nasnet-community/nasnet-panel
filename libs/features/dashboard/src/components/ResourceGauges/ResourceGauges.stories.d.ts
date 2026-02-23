/**
 * ResourceGauges Storybook Stories
 * Visual documentation and testing for resource utilization display
 * Story 5.2: Real-Time Resource Utilization Display
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: {
        (props: import("./ResourceGauges").ResourceGaugesProps): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    parameters: {
        layout: string;
    };
    tags: string[];
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WarningState: Story;
export declare const CriticalState: Story;
export declare const NoTemperature: Story;
export declare const Loading: Story;
export declare const CPUBreakdownInteractive: Story;
//# sourceMappingURL=ResourceGauges.stories.d.ts.map