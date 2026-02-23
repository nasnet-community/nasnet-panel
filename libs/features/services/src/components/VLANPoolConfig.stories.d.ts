/**
 * VLANPoolConfig Stories
 *
 * Storybook stories for the VLANPoolConfig component which allows
 * configuring the allocatable VLAN range (1-4094) for service instances.
 */
import { VLANPoolConfig } from './VLANPoolConfig';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VLANPoolConfig>;
export default meta;
type Story = StoryObj<typeof VLANPoolConfig>;
/**
 * Default pool configuration with typical range (100-200) and no allocations.
 * Save and Reset buttons are disabled until the form is changed.
 */
export declare const Default: Story;
/**
 * Pool with several active VLAN allocations.
 * Shows the allocation count in the card description.
 */
export declare const WithAllocations: Story;
/**
 * Large pool spanning most of the valid VLAN range.
 * Represents a production setup with many services.
 */
export declare const LargePool: Story;
/**
 * Minimal pool with a tight VLAN range.
 * Useful for constrained environments with few services.
 */
export declare const MinimalPool: Story;
/**
 * Nearly exhausted pool showing utilization pressure.
 * Allocations are close to the pool limit.
 */
export declare const NearlyExhausted: Story;
/**
 * Network error during mutation.
 * Demonstrates the error toast when the router is unreachable.
 */
export declare const NetworkError: Story;
/**
 * Dark mode variant of the VLAN pool configuration form.
 */
export declare const DarkMode: Story;
//# sourceMappingURL=VLANPoolConfig.stories.d.ts.map