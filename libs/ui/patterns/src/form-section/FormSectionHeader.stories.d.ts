/**
 * FormSectionHeader Storybook Stories
 *
 * Demonstrates all variants of the FormSectionHeader sub-component:
 * static (non-collapsible) and interactive (collapsible), with error badges,
 * help icons, and reduced-motion support.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import { FormSectionHeader } from './FormSectionHeader';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FormSectionHeader>;
export default meta;
type Story = StoryObj<typeof FormSectionHeader>;
/**
 * Non-collapsible header – static div, no toggle button, no chevron.
 * Suitable for required sections that should always be visible.
 */
export declare const Static: Story;
/**
 * Collapsible header in expanded state.
 * The chevron points upward (rotated 180°).
 */
export declare const CollapsibleExpanded: Story;
/**
 * Collapsible header in collapsed state.
 * The chevron points downward (default orientation).
 */
export declare const CollapsibleCollapsed: Story;
/**
 * Error badge visible – shows error count next to the title.
 * The badge is always rendered regardless of collapsible state.
 */
export declare const WithErrors: Story;
/**
 * Collapsible with a single error – collapses to hide errors until expanded.
 */
export declare const CollapsibleWithError: Story;
/**
 * Help icon rendered – a question-mark button with tooltip appears on the right.
 */
export declare const WithHelpIcon: Story;
/**
 * Interactive toggle demo – click the header to expand/collapse.
 */
export declare const InteractiveToggle: Story;
/**
 * Reduced motion – chevron rotation CSS transition is disabled.
 * The icon still flips but without the animated transition.
 */
export declare const ReducedMotion: Story;
/**
 * Full kitchen-sink – collapsible, errors, help icon, all active together.
 */
export declare const AllFeatures: Story;
//# sourceMappingURL=FormSectionHeader.stories.d.ts.map