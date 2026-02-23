import { VLANPoolGauge } from './VLANPoolGauge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VLANPoolGauge>;
export default meta;
type Story = StoryObj<typeof VLANPoolGauge>;
/**
 * Low utilization (<70%) - Green indicator
 */
export declare const LowUtilization: Story;
/**
 * Medium utilization (70-90%) - Amber indicator
 */
export declare const MediumUtilization: Story;
/**
 * High utilization (>90%) - Red indicator
 */
export declare const HighUtilization: Story;
/**
 * Critical with warning (>80% utilization)
 */
export declare const CriticalWithWarning: Story;
/**
 * Near full capacity
 */
export declare const NearFull: Story;
/**
 * Empty pool
 */
export declare const Empty: Story;
/**
 * Small pool
 */
export declare const SmallPool: Story;
//# sourceMappingURL=VLANPoolGauge.stories.d.ts.map