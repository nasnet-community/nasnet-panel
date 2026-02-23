import type { Meta, StoryObj } from '@storybook/react';
interface MockDHCPSummaryCardProps {
    activeLeases: number;
    totalCapacity?: number;
    ipRange?: string;
    serverName?: string;
    isLoading?: boolean;
    linkTo?: string;
    className?: string;
}
declare function MockDHCPSummaryCard({ activeLeases, totalCapacity, ipRange, serverName, isLoading, linkTo, className, }: MockDHCPSummaryCardProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockDHCPSummaryCard>;
export default meta;
type Story = StoryObj<typeof MockDHCPSummaryCard>;
export declare const Default: Story;
export declare const HighUtilization: Story;
export declare const Loading: Story;
export declare const NoCapacity: Story;
export declare const NoLink: Story;
export declare const MultipleServers: Story;
export declare const InDashboard: Story;
//# sourceMappingURL=DHCPSummaryCard.stories.d.ts.map