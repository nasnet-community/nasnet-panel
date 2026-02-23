/**
 * StorageSettings Storybook Stories
 *
 * StorageSettings is a platform-adaptive container that delegates to
 * StorageSettingsDesktop or StorageSettingsMobile based on the viewport.
 * Both presenters are driven entirely by the `useStorageSettings` headless
 * hook which calls live GraphQL queries.
 *
 * Because the hook depends on an Apollo provider and live network calls,
 * these stories use the lightweight StorageUsageBar + StorageDisconnectBanner
 * primitives to showcase each UI state in isolation without mocking the
 * entire Apollo stack.
 *
 * @see NAS-8.20: External Storage Management
 * @see ADR-018: Headless + Platform Presenters Pattern
 */
import type { Meta, StoryObj } from '@storybook/react';
interface MockConfigCardProps {
    status: 'configured' | 'disconnected' | 'unconfigured';
    hasStorage?: boolean;
    scanning?: boolean;
    configuring?: boolean;
}
declare function MockConfigCard({ status, hasStorage, scanning, configuring, }: MockConfigCardProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockConfigCard>;
export default meta;
type Story = StoryObj<typeof MockConfigCard>;
/**
 * No external storage configured yet — the toggle is off and no path selected.
 */
export declare const NotConfigured: Story;
/**
 * External storage is configured and connected — normal operation.
 */
export declare const ConfiguredAndConnected: Story;
/**
 * Storage was configured but the device has been physically removed.
 * The banner fires and the badge turns red.
 */
export declare const Disconnected: Story;
/**
 * No external hardware detected at all — toggle is disabled and a
 * "plug in a USB drive" prompt is shown.
 */
export declare const NoHardwareDetected: Story;
/**
 * Device scan in progress — the button shows a spinner and is disabled.
 */
export declare const Scanning: Story;
/**
 * Flash nearly full (≥80%) while external is healthy — warns in orange.
 */
export declare const FlashWarning: Story;
//# sourceMappingURL=StorageSettings.stories.d.ts.map