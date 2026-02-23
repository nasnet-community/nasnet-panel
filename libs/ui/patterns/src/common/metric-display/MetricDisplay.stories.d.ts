/**
 * MetricDisplay Stories
 *
 * Storybook stories for the MetricDisplay pattern component.
 */
import { MetricDisplay } from './MetricDisplay';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MetricDisplay>;
export default meta;
type Story = StoryObj<typeof MetricDisplay>;
/**
 * Default metric display
 */
export declare const Default: Story;
/**
 * With icon and trend indicator
 */
export declare const WithIconAndTrend: Story;
/**
 * Success variant for healthy metrics
 */
export declare const SuccessVariant: Story;
/**
 * Error variant for critical metrics
 */
export declare const ErrorVariant: Story;
/**
 * Interactive metric that navigates on click
 */
export declare const Interactive: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Small size variant
 */
export declare const SmallSize: Story;
/**
 * Large size variant for hero metrics
 */
export declare const LargeSize: Story;
/**
 * Mobile presenter directly
 */
export declare const MobilePresenter: Story;
/**
 * Desktop presenter directly
 */
export declare const DesktopPresenter: Story;
/**
 * Grid of metrics
 */
export declare const MetricsGrid: Story;
//# sourceMappingURL=MetricDisplay.stories.d.ts.map