import type { Meta, StoryObj } from '@storybook/react';
declare const STATUS_COLOR_CLASSES: {
    readonly green: {
        readonly dot: "bg-semantic-success";
        readonly text: "text-semantic-success";
        readonly bg: "bg-semantic-success/10";
    };
    readonly amber: {
        readonly dot: "bg-semantic-warning";
        readonly text: "text-semantic-warning";
        readonly bg: "bg-semantic-warning/10";
    };
    readonly red: {
        readonly dot: "bg-semantic-error";
        readonly text: "text-semantic-error";
        readonly bg: "bg-semantic-error/10";
    };
    readonly gray: {
        readonly dot: "bg-muted-foreground";
        readonly text: "text-muted-foreground";
        readonly bg: "bg-muted";
    };
};
type StatusColor = keyof typeof STATUS_COLOR_CLASSES;
interface MockConnectionState {
    statusLabel: string;
    statusColor: StatusColor;
    wsStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
    latencyMs: number | null;
    latencyQuality?: 'good' | 'moderate' | 'poor';
    isReconnecting: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    showManualRetry: boolean;
}
declare function ConnectionIndicatorDemo({ variant, ...state }: MockConnectionState & {
    variant?: 'mobile' | 'desktop';
}): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof ConnectionIndicatorDemo>;
export default meta;
type Story = StoryObj<typeof ConnectionIndicatorDemo>;
export declare const Connected: Story;
export declare const ConnectedMobile: Story;
export declare const Connecting: Story;
export declare const Reconnecting: Story;
export declare const Disconnected: Story;
export declare const DisconnectedMobile: Story;
export declare const LatencyQualities: Story;
export declare const AllStates: Story;
//# sourceMappingURL=ConnectionIndicator.stories.d.ts.map