/**
 * TemplatePreview Storybook Stories
 *
 * Demonstrates all variants of the TemplatePreview component.
 */
import { TemplatePreview } from './TemplatePreview';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TemplatePreview>;
export default meta;
type Story = StoryObj<typeof TemplatePreview>;
/**
 * Default preview with basic template
 */
export declare const Default: Story;
/**
 * Preview with conflicts
 */
export declare const WithConflicts: Story;
/**
 * Preview with auto-preview enabled
 */
export declare const AutoPreview: Story;
/**
 * Preview with initial values
 */
export declare const WithInitialValues: Story;
/**
 * Complex template (Gaming Optimized)
 */
export declare const ComplexTemplate: Story;
/**
 * Advanced template (IoT Isolation)
 */
export declare const AdvancedTemplate: Story;
/**
 * Loading/Applying state
 */
export declare const ApplyingState: Story;
/**
 * Mobile view (force narrow viewport)
 */
export declare const MobileView: Story;
/**
 * Desktop view
 */
export declare const DesktopView: Story;
//# sourceMappingURL=TemplatePreview.stories.d.ts.map