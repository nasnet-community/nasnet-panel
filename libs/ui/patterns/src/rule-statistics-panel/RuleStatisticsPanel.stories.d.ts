/**
 * RuleStatisticsPanel Storybook Stories
 */
import { RuleStatisticsPanel } from './RuleStatisticsPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RuleStatisticsPanel>;
export default meta;
type Story = StoryObj<typeof RuleStatisticsPanel>;
/**
 * Empty history - No data available
 */
export declare const EmptyHistory: Story;
/**
 * 1-Hour Data - 6 data points
 */
export declare const OneHourData: Story;
/**
 * 24-Hour Data - 24 data points
 */
export declare const TwentyFourHourData: Story;
/**
 * 7-Day Data - 168 data points
 */
export declare const SevenDayData: Story;
/**
 * Large Dataset - Stress test with 500 data points
 */
export declare const LargeDataset: Story;
/**
 * Mobile Viewport - Force mobile layout
 */
export declare const MobileViewport: Story;
/**
 * Desktop Viewport - Force desktop layout
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=RuleStatisticsPanel.stories.d.ts.map