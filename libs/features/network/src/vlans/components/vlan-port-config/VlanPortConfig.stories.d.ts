/**
 * Storybook Stories for VlanPortConfig Component
 *
 * Demonstrates trunk and access port configuration.
 */
import { VlanPortConfig } from './VlanPortConfig';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VlanPortConfig>;
export default meta;
type Story = StoryObj<typeof VlanPortConfig>;
/**
 * Access mode - default state
 */
export declare const AccessMode: Story;
/**
 * Trunk mode - multiple tagged VLANs
 */
export declare const TrunkMode: Story;
/**
 * Trunk mode - no native VLAN
 */
export declare const TrunkModeNoNative: Story;
/**
 * Empty configuration
 */
export declare const Empty: Story;
/**
 * With command preview visible
 */
export declare const WithPreview: Story;
/**
 * Many VLANs in trunk mode
 */
export declare const ManyVlans: Story;
//# sourceMappingURL=VlanPortConfig.stories.d.ts.map