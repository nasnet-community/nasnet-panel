/**
 * Storybook Stories for DnsBenchmark Component
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 8.5: Create Storybook stories
 */
import { DnsBenchmark } from './DnsBenchmark';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsBenchmark>;
export default meta;
type Story = StoryObj<typeof DnsBenchmark>;
/**
 * Default state before benchmark is run
 */
export declare const Default: Story;
/**
 * Loading state during benchmark execution
 */
export declare const Loading: Story;
/**
 * Success state with all status types
 */
export declare const WithResults: Story;
/**
 * All servers reachable and fast
 */
export declare const AllFast: Story;
/**
 * Mixed results with slow servers
 */
export declare const MixedPerformance: Story;
/**
 * All servers unreachable (network issue)
 */
export declare const AllUnreachable: Story;
/**
 * Error state
 */
export declare const Error: Story;
/**
 * Mobile viewport demonstration
 */
export declare const Mobile: Story;
/**
 * Desktop viewport demonstration
 */
export declare const Desktop: Story;
/**
 * Dark mode
 */
export declare const DarkMode: Story;
/**
 * Accessibility demonstration
 */
export declare const Accessibility: Story;
//# sourceMappingURL=DnsBenchmark.stories.d.ts.map