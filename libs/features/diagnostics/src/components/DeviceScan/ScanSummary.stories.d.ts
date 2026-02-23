/**
 * Storybook stories for ScanSummary
 *
 * Covers: quick scan with few devices, large subnet result,
 * all-static network, long-running scan, and empty network.
 */
import { ScanSummary } from './ScanSummary';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ScanSummary>;
export default meta;
type Story = StoryObj<typeof ScanSummary>;
export declare const SmallNetwork: Story;
export declare const LargeNetwork: Story;
export declare const AllStatic: Story;
export declare const LongRunning: Story;
export declare const EmptyNetwork: Story;
//# sourceMappingURL=ScanSummary.stories.d.ts.map