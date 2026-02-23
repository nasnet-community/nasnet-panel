/**
 * AlertTemplateBrowser Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Comprehensive stories showcasing all states and variants of the AlertTemplateBrowser component.
 */
import { AlertTemplateBrowser } from './AlertTemplateBrowser';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertTemplateBrowser>;
export default meta;
type Story = StoryObj<typeof AlertTemplateBrowser>;
/**
 * Default state with all templates
 */
export declare const Default: Story;
/**
 * Filtered by Network category
 */
export declare const FilteredByCategory: Story;
/**
 * Security category templates
 */
export declare const SecurityTemplates: Story;
/**
 * Resources category templates
 */
export declare const ResourceTemplates: Story;
/**
 * Empty state - no templates found
 */
export declare const Empty: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Error state
 */
export declare const ErrorState: Story;
/**
 * Custom templates only
 */
export declare const CustomOnly: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
/**
 * Tablet viewport
 */
export declare const Tablet: Story;
/**
 * Desktop viewport
 */
export declare const Desktop: Story;
/**
 * Interactive test - Apply template
 */
export declare const InteractiveApply: Story;
//# sourceMappingURL=AlertTemplateBrowser.stories.d.ts.map