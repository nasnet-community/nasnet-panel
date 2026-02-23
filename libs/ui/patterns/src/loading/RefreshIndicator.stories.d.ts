/**
 * RefreshIndicator Stories
 *
 * Storybook stories for the RefreshIndicator pattern component.
 * Demonstrates bar vs dots variants, color options, position, and fixed mode.
 */
import { RefreshIndicator } from './RefreshIndicator';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof RefreshIndicator>;
export default meta;
type Story = StoryObj<typeof RefreshIndicator>;
/**
 * Active bar indicator — the default variant.
 * Wraps in a relative container to demonstrate absolute positioning.
 */
export declare const Default: Story;
/**
 * Not refreshing — component renders nothing.
 */
export declare const NotRefreshing: Story;
/**
 * Dots variant — three pulsing dots.
 */
export declare const DotsVariant: Story;
/**
 * Bottom position with dots.
 */
export declare const BottomDots: Story;
/**
 * All color variants side-by-side.
 */
export declare const ColorVariants: Story;
/**
 * Both variants side-by-side for comparison.
 */
export declare const VariantComparison: Story;
//# sourceMappingURL=RefreshIndicator.stories.d.ts.map