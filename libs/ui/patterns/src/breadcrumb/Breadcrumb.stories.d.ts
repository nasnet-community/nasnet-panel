/**
 * Stories for Breadcrumb component
 *
 * The real Breadcrumb derives its segments automatically from TanStack Router's
 * `useMatches()` hook, which is unavailable in Storybook. This file uses a
 * MockBreadcrumb that accepts explicit segments as props so every story is
 * self-contained and runnable without a router context.
 */
import type { Meta, StoryObj } from '@storybook/react';
interface BreadcrumbSegment {
    key: string;
    label: string;
    path: string;
    isCurrent: boolean;
}
interface MockBreadcrumbProps {
    /** Array of breadcrumb segments to render */
    segments: BreadcrumbSegment[];
    /** Show home icon for first segment */
    showHomeIcon?: boolean;
    /** Compact/mobile presentation: collapse middle segments */
    compact?: boolean;
    /** Optional additional CSS classes */
    className?: string;
}
declare function MockBreadcrumb({ segments, showHomeIcon, compact, className, }: MockBreadcrumbProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockBreadcrumb>;
export default meta;
type Story = StoryObj<typeof MockBreadcrumb>;
export declare const Default: Story;
export declare const ThreeLevels: Story;
export declare const DeepPath: Story;
export declare const WithoutHomeIcon: Story;
export declare const MobileCompactCollapsed: Story;
export declare const MobileShortPath: Story;
//# sourceMappingURL=Breadcrumb.stories.d.ts.map