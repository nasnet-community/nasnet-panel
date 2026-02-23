import type { Meta, StoryObj } from '@storybook/react';
type VPNProtocol = 'wireguard' | 'openvpn' | 'l2tp' | 'pptp' | 'sstp' | 'ikev2';
interface MockVPNClient {
    id: string;
    name: string;
    protocol: VPNProtocol;
    remoteAddress?: string;
    localAddress?: string;
    uptime?: string;
}
interface MockVPNClientsSummaryProps {
    connectedCount: number;
    clients?: MockVPNClient[];
    isLoading?: boolean;
    linkTo?: string;
    maxVisible?: number;
    className?: string;
}
declare function MockVPNClientsSummary({ connectedCount, clients, isLoading, linkTo, maxVisible, className, }: MockVPNClientsSummaryProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockVPNClientsSummary>;
export default meta;
type Story = StoryObj<typeof MockVPNClientsSummary>;
export declare const Default: Story;
export declare const WithExpandableList: Story;
export declare const NoClients: Story;
export declare const Loading: Story;
export declare const NoLink: Story;
export declare const MixedProtocols: Story;
export declare const InDashboard: Story;
//# sourceMappingURL=VPNClientsSummary.stories.d.ts.map