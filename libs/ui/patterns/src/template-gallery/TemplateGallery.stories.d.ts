/**
 * TemplateGallery Storybook Stories
 *
 * Demonstrates all variants of the TemplateGallery component.
 */
import { TemplateGallery } from './TemplateGallery';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TemplateGallery>;
export default meta;
type Story = StoryObj<typeof TemplateGallery>;
/**
 * Default gallery with all templates
 */
export declare const Default: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Empty state (no templates)
 */
export declare const Empty: Story;
/**
 * With active search filter
 */
export declare const WithSearch: Story;
/**
 * Filtered by category (Home Network)
 */
export declare const FilteredByCategory: Story;
/**
 * Filtered by complexity (Simple only)
 */
export declare const FilteredByComplexity: Story;
/**
 * Built-in templates only
 */
export declare const BuiltInOnly: Story;
/**
 * Custom templates only
 */
export declare const CustomOnly: Story;
/**
 * With template selection
 */
export declare const WithSelection: Story;
/**
 * Sorted by complexity (descending)
 */
export declare const SortedByComplexity: Story;
/**
 * Sorted by rule count (descending)
 */
export declare const SortedByRuleCount: Story;
/**
 * Mobile view (force narrow viewport)
 */
export declare const MobileView: Story;
/**
 * Desktop view with many templates
 */
export declare const DesktopView: Story;
//# sourceMappingURL=TemplateGallery.stories.d.ts.map