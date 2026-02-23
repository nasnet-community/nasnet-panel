/**
 * LoadingSpinner Stories
 *
 * Storybook stories for the LoadingSpinner pattern component.
 * Demonstrates size, orientation, label, centering, and padding variants.
 */
import { LoadingSpinner } from './LoadingSpinner';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LoadingSpinner>;
export default meta;
type Story = StoryObj<typeof LoadingSpinner>;
/**
 * Default spinner — medium size, no visible label, screen-reader label only.
 */
export declare const Default: Story;
/**
 * Spinner with a visible label beneath it (vertical layout).
 */
export declare const WithLabel: Story;
/**
 * Horizontal layout — spinner and label side-by-side.
 * Useful for inline loading states inside forms or toolbars.
 */
export declare const HorizontalLayout: Story;
/**
 * All size variants displayed together.
 */
export declare const AllSizes: Story;
/**
 * Centred and padded — typical usage inside a card or page section.
 */
export declare const CenteredAndPadded: Story;
/**
 * Large spinner for full-page loading states.
 */
export declare const FullPageLoading: Story;
//# sourceMappingURL=LoadingSpinner.stories.d.ts.map