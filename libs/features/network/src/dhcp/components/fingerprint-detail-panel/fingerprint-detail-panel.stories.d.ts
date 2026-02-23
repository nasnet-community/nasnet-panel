/**
 * FingerprintDetailPanel Storybook Stories
 *
 * Story: NAS-6.13 - DHCP Fingerprinting
 *
 * Displays DHCP fingerprint details for a single lease:
 * device type, confidence, fingerprint hash, DHCP options 55/60,
 * hostname, MAC vendor, and identification source badge.
 */
import type { StoryObj } from '@storybook/react';
import { FingerprintDetailPanel } from './fingerprint-detail-panel';
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ lease, identification, onEdit, onCopy, className, }: import("./fingerprint-detail-panel").FingerprintDetailPanelProps) => import("react/jsx-runtime").JSX.Element>;
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
        lease: {
            description: string;
            control: "object";
        };
        identification: {
            description: string;
            control: "object";
        };
        onEdit: {
            description: string;
            action: string;
        };
        onCopy: {
            description: string;
            action: string;
        };
    };
    args: {
        onEdit: import("storybook/test").Mock<(...args: any[]) => any>;
        onCopy: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof FingerprintDetailPanel>;
/**
 * iPhone automatically identified with high confidence.
 */
export declare const AutomaticIOS: Story;
/**
 * Windows PC automatically identified.
 * Shows Option 55 as a comma-separated string (alternative format).
 */
export declare const AutomaticWindows: Story;
/**
 * Device manually identified by the administrator.
 * The source badge shows "Manual" instead of "Automatic".
 */
export declare const ManuallyIdentified: Story;
/**
 * Unknown device with low confidence. No hostname or Option 60 provided.
 */
export declare const UnknownDeviceLowConfidence: Story;
/**
 * NAS device with all optional fields present (Option 60, hostname, NTP).
 */
export declare const NASDevice: Story;
/**
 * Read-only view — no Edit callback provided, only Copy JSON is available.
 */
export declare const ReadOnly: Story;
//# sourceMappingURL=fingerprint-detail-panel.stories.d.ts.map