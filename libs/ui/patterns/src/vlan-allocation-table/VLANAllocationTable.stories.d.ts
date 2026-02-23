import { VLANAllocationTable } from './VLANAllocationTable';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VLANAllocationTable>;
export default meta;
type Story = StoryObj<typeof VLANAllocationTable>;
/**
 * Default table with mixed allocations
 */
export declare const Default: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Empty state
 */
export declare const Empty: Story;
/**
 * All allocated (active)
 */
export declare const AllAllocated: Story;
/**
 * Single service type (Tor only)
 */
export declare const SingleServiceType: Story;
/**
 * Large dataset (100 allocations)
 */
export declare const LargeDataset: Story;
//# sourceMappingURL=VLANAllocationTable.stories.d.ts.map