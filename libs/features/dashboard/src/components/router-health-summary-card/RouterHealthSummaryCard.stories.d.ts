/**
 * RouterHealthSummaryCard Storybook Stories
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * 7 stories as specified in Dev Notes:
 * 1. Default (online, healthy, fresh, desktop)
 * 2. OfflineStale (offline, critical, 6min old, desktop)
 * 3. DegradedWarning (online, warning, 30sec old, desktop)
 * 4. CriticalHealth (online, critical, 1min old, desktop)
 * 5. LoadingSkeleton (loading state, desktop)
 * 6. MobileCompact (online, healthy, fresh, 375px)
 * 7. TabletGrid (online, healthy, fresh, 768px)
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./RouterHealthSummaryCard").RouterHealthSummaryCardProps>;
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
        routerId: {
            control: "text";
            description: string;
        };
        onRefresh: {
            description: string;
            action: string;
        };
        pollInterval: {
            control: "number";
            description: string;
        };
        enableSubscription: {
            control: "boolean";
            description: string;
        };
        compact: {
            control: "boolean";
            description: string;
        };
    };
    args: {
        routerId: string;
        onRefresh: import("storybook/test").Mock<(...args: any[]) => any>;
        pollInterval: number;
        enableSubscription: true;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const OfflineStale: Story;
export declare const DegradedWarning: Story;
export declare const CriticalHealth: Story;
export declare const LoadingSkeleton: Story;
export declare const MobileCompact: Story;
export declare const TabletGrid: Story;
export declare const NoTemperatureSensor: Story;
export declare const VeryLongRouterName: Story;
//# sourceMappingURL=RouterHealthSummaryCard.stories.d.ts.map