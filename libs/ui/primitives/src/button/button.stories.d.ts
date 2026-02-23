import { Button } from './button';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Button - Interactive element for triggering actions
 *
 * Primary component for user interactions across the application. Supports 7 semantic variants
 * and responsive sizing. All buttons include keyboard navigation (Enter/Space), focus indicators,
 * and loading state management with spinner and aria-busy.
 *
 * ## Accessibility
 * - Minimum 44px touch target on mobile devices
 * - Full keyboard navigation support (Enter, Space)
 * - Focus indicators with 2–3px ring offset
 * - Icon-only buttons must include aria-label
 * - Loading state sets aria-busy="true"
 * - Semantic HTML with proper disabled state handling
 *
 * ## Variants
 * - **default/action**: Primary CTA, golden amber background
 * - **secondary**: Secondary action, trust blue background
 * - **destructive**: Dangerous action, red background (delete, reset)
 * - **outline**: Medium emphasis, bordered style
 * - **ghost**: Minimal emphasis, background only on hover
 * - **link**: Inline action, underlined text
 *
 * ## Platform-Specific Behavior
 * - Mobile: Prioritize touch targets (44px minimum), use bottom sheet for dense actions
 * - Tablet: Balanced approach, support both touch and click
 * - Desktop: Standard cursors, all action variants visible
 */
declare const meta: Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof Button>;
/**
 * Default button with primary action styling.
 * Happy path: typical usage with default size and variant.
 */
export declare const Default: Story;
/**
 * All 7 semantic variants side-by-side for reference.
 * Use case: design system showcase, understanding context for each variant.
 */
export declare const AllVariants: Story;
/**
 * All 4 size variants with responsive heights.
 * Mobile uses larger sizes; desktop uses compact sizes.
 */
export declare const AllSizes: Story;
/**
 * Buttons with icons for common actions.
 * Icons paired with text for clarity and visual guidance.
 */
export declare const WithIcon: Story;
/**
 * Loading state with spinner and disabled interaction.
 * Shows aria-busy="true" and prevents clicks during operation.
 * Use case: form submissions, async operations, config saves.
 */
export declare const LoadingState: Story;
/**
 * Loading variant demonstration for all 3 variants.
 * Each shows spinner with appropriate text.
 */
export declare const LoadingVariants: Story;
/**
 * Disabled state showing visual feedback.
 * Use case: insufficient permissions, waiting for prerequisites, validation failure.
 */
export declare const DisabledState: Story;
/**
 * Success state showing completion feedback.
 * Use case: immediate confirmation without toast (quick operations < 1s).
 */
export declare const SuccessState: Story;
/**
 * Icon-only button with required aria-label.
 * Mobile touch target: 44px minimum.
 */
export declare const IconOnly: Story;
/**
 * Rendering as link element via asChild.
 * Use case: navigation buttons styled as primary action.
 */
export declare const AsChild: Story;
/**
 * Mobile viewport (375px): Single column, larger touch targets.
 */
export declare const Mobile: Story;
/**
 * Tablet viewport (768px): Balanced spacing and sizing.
 */
export declare const Tablet: Story;
/**
 * Desktop viewport (1280px): Standard click interaction with hover effects.
 */
export declare const Desktop: Story;
/**
 * Empty/error state: Button with no content (edge case).
 */
export declare const EdgeCase_NoContent: Story;
/**
 * Edge case: Very long button text wrapping.
 * Use case: Internationalization (German text ~30% longer than English).
 */
export declare const EdgeCase_LongText: Story;
//# sourceMappingURL=button.stories.d.ts.map