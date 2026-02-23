/**
 * NetworkErrorDisplay Stories
 *
 * Demonstrates the network-specific error display with auto-retry indicators,
 * troubleshooting tips, and both default and compact variants.
 *
 * Note: NetworkErrorDisplay internally uses the `useNetworkStatus` hook from
 * OfflineIndicator (reads `navigator.onLine`). In a Storybook environment the
 * browser is always online, so the "back online" success state is demonstrated
 * via the `type="offline"` story which renders the restored-connection UI when
 * the browser reports online=true.
 */
import { NetworkErrorDisplay } from './NetworkErrorDisplay';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NetworkErrorDisplay>;
export default meta;
type Story = StoryObj<typeof NetworkErrorDisplay>;
/**
 * Basic unknown network error with a manual retry button.
 */
export declare const Default: Story;
/**
 * Device offline — shown when `navigator.onLine` is false. In this Storybook
 * environment the browser reports online=true, so the card will display the
 * "Connection restored" success state to demonstrate that UI path.
 */
export declare const DeviceOffline: Story;
/**
 * Connection timed out — common when the router is under heavy load or the
 * network path has high latency.
 */
export declare const Timeout: Story;
/**
 * Connection refused — the router host is reachable but the API port is not
 * accepting connections.
 */
export declare const ConnectionRefused: Story;
/**
 * Auto-retry in progress — shows spinner, attempt counter, and countdown.
 * The retry button is disabled while retrying is active.
 */
export declare const AutoRetrying: Story;
/**
 * Compact variant — fits inside sidebars, notification bars, or inline areas.
 */
export declare const Compact: Story;
/**
 * Compact variant with auto-retry countdown.
 */
export declare const CompactRetrying: Story;
//# sourceMappingURL=NetworkErrorDisplay.stories.d.ts.map