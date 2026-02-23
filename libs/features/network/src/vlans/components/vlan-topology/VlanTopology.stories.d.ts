/**
 * Storybook Stories for VlanTopology Component
 *
 * Demonstrates VLAN topology visualization.
 */
import { VlanTopology } from './VlanTopology';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VlanTopology>;
export default meta;
type Story = StoryObj<typeof VlanTopology>;
/**
 * Simple topology with one interface
 */
export declare const Simple: Story;
/**
 * Complex topology with multiple interfaces
 */
export declare const Complex: Story;
/**
 * Empty state - no VLANs configured
 */
export declare const Empty: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * Large topology (50 VLANs across 5 interfaces)
 */
export declare const Large: Story;
//# sourceMappingURL=VlanTopology.stories.d.ts.map