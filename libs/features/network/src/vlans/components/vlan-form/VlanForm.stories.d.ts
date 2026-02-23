/**
 * Storybook Stories for VlanForm Component
 *
 * Demonstrates VLAN form in create and edit modes with validation.
 */
import { VlanForm } from './VlanForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VlanForm>;
export default meta;
type Story = StoryObj<typeof VlanForm>;
/**
 * Create mode - empty form
 */
export declare const CreateMode: Story;
/**
 * Edit mode - pre-filled form
 */
export declare const EditMode: Story;
/**
 * Loading state - form submission in progress
 */
export declare const Loading: Story;
/**
 * Duplicate VLAN ID error
 */
export declare const DuplicateVlanId: Story;
/**
 * VLAN 1 warning (default VLAN)
 */
export declare const Vlan1Warning: Story;
/**
 * VLAN 4095 warning (reserved)
 */
export declare const Vlan4095Warning: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * Jumbo frames MTU
 */
export declare const JumboFrames: Story;
//# sourceMappingURL=VlanForm.stories.d.ts.map