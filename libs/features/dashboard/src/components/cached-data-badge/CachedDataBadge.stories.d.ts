/**
 * Storybook stories for CachedDataBadge
 * Cache age and freshness indicator with inline and banner variants
 *
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 * Color coding: green (<1 min fresh) → amber (1-5 min warning) → red (>5 min critical)
 */
import { CachedDataBadge } from './CachedDataBadge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CachedDataBadge>;
export default meta;
type Story = StoryObj<typeof CachedDataBadge>;
/**
 * Inline / fresh — data is less than 1 minute old.
 */
export declare const InlineFresh: Story;
/**
 * Inline / warning — data is 1-5 minutes old.
 */
export declare const InlineWarning: Story;
/**
 * Inline / critical — data is more than 5 minutes old.
 */
export declare const InlineCritical: Story;
/**
 * Banner / warning — full-width alert with a Retry button.
 */
export declare const BannerWarning: Story;
/**
 * Banner / critical — router is unreachable, Retry button prominently displayed.
 */
export declare const BannerCritical: Story;
/**
 * Banner / critical — data is very stale (1 hour old) and no onRetry handler is provided.
 */
export declare const BannerCriticalNoRetry: Story;
//# sourceMappingURL=CachedDataBadge.stories.d.ts.map