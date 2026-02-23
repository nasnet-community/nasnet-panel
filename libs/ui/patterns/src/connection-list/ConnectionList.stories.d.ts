/**
 * Storybook Stories for ConnectionList
 *
 * Visual documentation and testing for ConnectionList pattern component.
 *
 * Stories:
 * - Empty state
 * - Few connections (5-10)
 * - Many connections (1000+)
 * - Filtered state
 * - Paused refresh state
 * - Mobile vs Desktop presenters
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */
import type { ConnectionEntry } from './types';
import type { Meta, StoryObj } from '@storybook/react';
declare function ConnectionListWrapper({ connections, onKillConnection, loading, }: {
    connections: ConnectionEntry[];
    onKillConnection: (connection: ConnectionEntry) => void;
    loading: boolean;
}): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof ConnectionListWrapper>;
export default meta;
type Story = StoryObj<typeof ConnectionListWrapper>;
export declare const Empty: Story;
export declare const Loading: Story;
export declare const FewConnections: Story;
export declare const ManyConnections: Story;
export declare const MobileView: Story;
export declare const DesktopView: Story;
export declare const AccessibilityTest: Story;
//# sourceMappingURL=ConnectionList.stories.d.ts.map