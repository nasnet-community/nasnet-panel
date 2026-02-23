/**
 * StorageUsageBar Storybook Stories
 *
 * Visual documentation for the StorageUsageBar component.
 * Demonstrates all threshold states, BigInt formatting, and edge cases.
 *
 * @see NAS-8.20: External Storage Management
 */
import { StorageUsageBar } from './StorageUsageBar';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StorageUsageBar>;
export default meta;
type Story = StoryObj<typeof StorageUsageBar>;
/**
 * Healthy usage — below 80%. Bar is green.
 */
export declare const Healthy: Story;
/**
 * Warning zone — 80–89%. Bar turns amber to alert the user.
 */
export declare const WarningThreshold: Story;
/**
 * Critical usage — 90%+. Bar turns red.
 */
export declare const Critical: Story;
/**
 * Completely full — 100%. Useful for checking that the bar doesn't overflow.
 */
export declare const Full: Story;
/**
 * Force warning styling via prop even when usage is low.
 * Used when the storage device is disconnected / unavailable.
 */
export declare const ForcedWarning: Story;
/**
 * Provide explicit freeBytes instead of letting the component calculate it.
 */
export declare const ExplicitFreeBytes: Story;
/**
 * Very small flash storage — 32 MB total.
 * Demonstrates byte-level formatting for MikroTik onboard flash.
 */
export declare const SmallFlashStorage: Story;
/**
 * All threshold states side-by-side for quick visual comparison.
 */
export declare const AllThresholds: Story;
//# sourceMappingURL=StorageUsageBar.stories.d.ts.map