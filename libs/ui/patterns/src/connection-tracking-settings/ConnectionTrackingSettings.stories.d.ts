/**
 * Storybook Stories for ConnectionTrackingSettings
 *
 * Visual documentation and testing for ConnectionTrackingSettings pattern component.
 *
 * Stories:
 * - Default state
 * - Modified state
 * - With errors (validation)
 * - Saving state (loading)
 * - Disabled tracking
 * - Mobile vs Desktop presenters
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */
import type { ConnectionTrackingSettings as SettingsType } from './types';
import type { Meta, StoryObj } from '@storybook/react';
declare function ConnectionTrackingSettingsWrapper({ initialSettings, onSubmit, loading, }: {
    initialSettings?: SettingsType;
    onSubmit?: (settings: SettingsType) => Promise<void>;
    loading?: boolean;
}): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof ConnectionTrackingSettingsWrapper>;
export default meta;
type Story = StoryObj<typeof ConnectionTrackingSettingsWrapper>;
export declare const Default: Story;
export declare const Loading: Story;
export declare const Modified: Story;
export declare const DisabledTracking: Story;
export declare const HighMaxEntries: Story;
export declare const ShortTimeouts: Story;
export declare const MobileView: Story;
export declare const DesktopView: Story;
export declare const LooseTrackingEnabled: Story;
export declare const AccessibilityTest: Story;
//# sourceMappingURL=ConnectionTrackingSettings.stories.d.ts.map