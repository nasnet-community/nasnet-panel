/**
 * Storybook Stories for DnsCachePanel Component
 *
 * Story: NAS-6.12 - DNS Cache & Diagnostics
 * Task 8.5: Create Storybook stories
 */
import { DnsCachePanel } from './DnsCachePanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsCachePanel>;
export default meta;
type Story = StoryObj<typeof DnsCachePanel>;
/**
 * Default state with loaded cache statistics
 */
export declare const Default: Story;
/**
 * Loading state while fetching cache stats
 */
export declare const Loading: Story;
/**
 * Empty cache (freshly flushed or no queries yet)
 */
export declare const EmptyCache: Story;
/**
 * Cache near capacity (95% full)
 */
export declare const NearFull: Story;
/**
 * High hit rate scenario
 */
export declare const HighHitRate: Story;
/**
 * Low hit rate scenario
 */
export declare const LowHitRate: Story;
/**
 * Flush confirmation dialog open
 */
export declare const FlushDialog: Story;
/**
 * After successful flush with toast notification
 */
export declare const AfterFlush: Story;
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
/**
 * Interactive demo with all features
 */
export declare const Interactive: Story;
//# sourceMappingURL=DnsCachePanel.stories.d.ts.map