/**
 * ConnectionBanner Stories
 *
 * Demonstrates the connection-state banner shown below the app header when
 * the router WebSocket connection is lost or actively reconnecting.
 *
 * ConnectionBanner reads its state from the Zustand `useConnectionStore`.
 * These stories use a self-contained mock presenter that mirrors the
 * component's render tree so each connection state can be demonstrated in
 * isolation without coupling to a real store or WebSocket.
 */
import type { Meta, StoryObj } from '@storybook/react';
type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';
interface MockConnectionBannerProps {
    /** Simulated connection state (mirrors useConnectionStore().state) */
    state?: ConnectionState;
}
declare function MockConnectionBanner({ state }: MockConnectionBannerProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockConnectionBanner>;
export default meta;
type Story = StoryObj<typeof MockConnectionBanner>;
/**
 * Connection lost — displayed when the WebSocket drops and no active reconnect
 * is in progress. Shows an AlertTriangle icon and the static warning message.
 */
export declare const Disconnected: Story;
/**
 * Reconnecting — displayed while the client is actively attempting to
 * re-establish the WebSocket. The Wifi icon pulses to indicate ongoing activity.
 */
export declare const Reconnecting: Story;
/**
 * Connected — the banner returns null in the real component. The mock shows a
 * subtle placeholder so the story canvas is not entirely blank.
 */
export declare const Connected: Story;
/**
 * All three states stacked for side-by-side design review.
 * The wrapper decorator is overridden here so each state is labelled inline.
 */
export declare const AllStates: Story;
//# sourceMappingURL=ConnectionBanner.stories.d.ts.map