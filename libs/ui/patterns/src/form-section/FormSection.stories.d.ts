/**
 * FormSection Storybook Stories
 *
 * Comprehensive stories demonstrating all FormSection variants and use cases.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import { FormSection } from './FormSection';
import { FormSectionErrors } from './FormSectionErrors';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FormSection>;
export default meta;
type Story = StoryObj<typeof FormSection>;
/**
 * Basic non-collapsible section with title and description.
 * Uses fieldset/legend for proper form semantics.
 */
export declare const Basic: Story;
/**
 * Collapsible section starting in collapsed state.
 * Uses section/aria-labelledby for proper accessibility.
 */
export declare const CollapsibleCollapsed: Story;
/**
 * Collapsible section starting in expanded state.
 */
export declare const CollapsibleExpanded: Story;
/**
 * Section with description text.
 */
export declare const WithDescription: Story;
/**
 * Section displaying validation errors.
 * Error summary appears above form fields.
 */
export declare const WithErrors: Story;
/**
 * Section with help icon integration.
 * In production, this integrates with the Help System (NAS-4A.12).
 */
export declare const WithHelpIntegration: Story;
/**
 * Example with nested form fields showing real-world usage.
 */
export declare const NestedFormFields: Story;
/**
 * Multiple sections in a form layout.
 * Shows how sections group related fields.
 */
export declare const MultipleSections: Story;
/**
 * Dark theme variant.
 * Switch to dark theme using the toolbar to see this in action.
 */
export declare const DarkTheme: Story;
/**
 * Mobile viewport demonstration.
 * Shows responsive design with 44px minimum tap targets.
 */
export declare const MobileViewport: Story;
/**
 * FormSectionErrors standalone component.
 * Shows the error summary component in isolation.
 */
export declare const ErrorsOnly: StoryObj<typeof FormSectionErrors>;
/**
 * Accessibility test story.
 * Use with the a11y addon to verify WCAG compliance.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=FormSection.stories.d.ts.map