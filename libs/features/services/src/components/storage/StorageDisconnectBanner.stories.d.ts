/**
 * StorageDisconnectBanner Storybook Stories
 *
 * Demonstrates the persistent warning banner shown when configured external
 * storage is disconnected.
 *
 * NOTE: The component reads its data from the `useStorageSettings` hook which
 * calls GraphQL queries. In Storybook we bypass it by rendering the banner's
 * visual shell directly via render functions so the stories remain fast and
 * dependency-free.
 *
 * @see NAS-8.20: External Storage Management
 */
import type { Meta, StoryObj } from '@storybook/react';
interface MockBannerProps {
    path: string;
    affectedServices?: string[];
    onDismiss?: () => void;
}
declare function MockStorageDisconnectBanner({ path, affectedServices, onDismiss, }: MockBannerProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockStorageDisconnectBanner>;
export default meta;
type Story = StoryObj<typeof MockStorageDisconnectBanner>;
/**
 * Typical disconnect with a handful of affected services.
 */
export declare const Default: Story;
/**
 * No services installed on the external drive — only the path warning is shown.
 */
export declare const NoAffectedServices: Story;
/**
 * More than 5 affected services — the overflow "(and N more…)" label appears.
 */
export declare const ManyAffectedServices: Story;
/**
 * Long mount path (e.g. a nested directory on a USB NTFS volume).
 */
export declare const LongMountPath: Story;
/**
 * Without a dismiss handler — shows the banner without the close button,
 * representing a non-dismissible variant.
 */
export declare const NonDismissible: Story;
/**
 * Mobile viewport — verifies that text wraps gracefully and the dismiss
 * button remains accessible (≥44px tap target).
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=StorageDisconnectBanner.stories.d.ts.map