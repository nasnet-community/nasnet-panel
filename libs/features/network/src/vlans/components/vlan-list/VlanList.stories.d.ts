/**
 * Storybook Stories for VlanList Component
 *
 * Demonstrates VLAN list in various states and configurations.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { VlanList } from './VlanList';
type Story = StoryObj<typeof VlanList>;
declare const meta: Meta<typeof VlanList>;
export default meta;
/**
 * Default state with multiple VLANs
 */
export declare const Default: Story;
/**
 * Empty state - no VLANs configured
 */
export declare const Empty: Story;
/**
 * Error state - failed to load VLANs
 */
export declare const ErrorState: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * With many VLANs (performance test)
 */
export declare const ManyVlans: Story;
//# sourceMappingURL=VlanList.stories.d.ts.map