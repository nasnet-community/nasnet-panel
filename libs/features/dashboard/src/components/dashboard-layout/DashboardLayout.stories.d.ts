/**
 * DashboardLayout Storybook Stories
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Stories demonstrate:
 * - Responsive layouts at all breakpoints (Mobile 375px, Tablet 768px, Desktop 1440px)
 * - Grid column calculations
 * - Refresh interaction
 * - Multiple cards in grid
 *
 * @see Story 4.2: shadcn/ui Design System for Card component usage
 */
import type { StoryObj } from '@storybook/react';
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./DashboardLayout").DashboardLayoutProps>;
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
        children: {
            description: string;
            control: false;
        };
        onRefresh: {
            description: string;
            action: string;
        };
        showRefresh: {
            description: string;
            control: "boolean";
        };
        className: {
            description: string;
            control: "text";
        };
    };
    args: {
        onRefresh: import("storybook/test").Mock<(...args: any[]) => any>;
        showRefresh: true;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const MobileViewport: Story;
export declare const TabletViewport: Story;
export declare const DesktopViewport: Story;
export declare const NoRefreshButton: Story;
export declare const SingleCard: Story;
export declare const EmptyState: Story;
export declare const LoadingSkeleton: Story;
export declare const CustomSpacing: Story;
//# sourceMappingURL=DashboardLayout.stories.d.ts.map