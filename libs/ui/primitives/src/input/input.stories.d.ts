import { Input } from './input';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Input Component Stories
 *
 * Comprehensive Storybook documentation for the Input primitive component.
 * Covers all input types, sizes, and states across mobile, tablet, and desktop viewports.
 *
 * Accessibility (WCAG AAA):
 * - 7:1 contrast ratio maintained in both light and dark modes
 * - 44px minimum touch target on mobile (inputSize="default")
 * - Semantic aria-invalid attribute for error states
 * - Full keyboard navigation support
 * - Screen reader compatible with proper label associations
 *
 * Dark Mode: All stories support theme toggle via Storybook theme switcher
 * Visual Regression: Baseline created in Chromatic for all story states
 */
declare const meta: Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof Input>;
/**
 * Default story - Happy path typical input
 * Demonstrates basic text input with placeholder
 */
export declare const Default: Story;
/**
 * Mobile viewport story (375px)
 * Verifies 44px touch target and single-column layout on small screens
 */
export declare const Mobile: Story;
/**
 * Tablet viewport story (768px)
 * Verifies proper spacing and readable input on medium screens
 */
export declare const Tablet: Story;
/**
 * Desktop viewport story (1280px)
 * Verifies dense layout and full detail visibility
 */
export declare const Desktop: Story;
/**
 * With Label story
 * Shows proper semantic label association (htmlFor linking)
 * Ensures screen reader compatibility
 */
export declare const WithLabel: Story;
/**
 * Disabled state story
 * Verifies visual feedback: reduced opacity, cursor-not-allowed
 * Input remains keyboard accessible but functionally disabled
 */
export declare const Disabled: Story;
/**
 * Error state story
 * Demonstrates error styling: red border + error ring on focus
 * Shows aria-invalid attribute semantic feedback for screen readers
 */
export declare const ErrorState: Story;
/**
 * Small size story
 * Verifies compact layout (9px height, 3px padding)
 * Suitable for dense data tables and advanced forms
 */
export declare const SmallSize: Story;
/**
 * Large size story
 * Verifies enhanced touch target (12px height, 5px padding)
 * Recommended for primary mobile inputs
 */
export declare const LargeSize: Story;
/**
 * Loading state story (empty)
 * Shows input ready for user interaction
 * Demonstrates proper focus ring appearance
 */
export declare const Loading: Story;
/**
 * With Button story
 * Shows input combined with action button in flex layout
 * Verifies spacing consistency (space-x-2 = 8px gap)
 */
export declare const WithButton: Story;
/**
 * File input story
 * Demonstrates file-specific styling and label association
 * Shows custom file input presentation
 */
export declare const File: Story;
/**
 * All input types showcase
 * Comprehensive demonstration of supported input types:
 * text, email, password, number, search, tel, url, file
 * Each with proper label associations
 */
export declare const AllTypes: Story;
//# sourceMappingURL=input.stories.d.ts.map