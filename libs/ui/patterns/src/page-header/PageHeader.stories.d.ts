/**
 * PageHeader Stories
 *
 * Demonstrates the page-level header component used at the top
 * of feature pages for consistent layout and navigation context.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';
declare const meta: Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof PageHeader>;
/**
 * Default header with title and description.
 */
export declare const Default: Story;
/**
 * Header with title only (no description).
 */
export declare const TitleOnly: Story;
/**
 * Header with title and action buttons.
 */
export declare const WithActions: Story;
/**
 * Header with multiple action buttons.
 */
export declare const WithMultipleActions: Story;
/**
 * Header with long title text (testing text wrapping).
 */
export declare const LongTitle: Story;
/**
 * Header with minimal styling (custom className).
 */
export declare const CustomStyling: Story;
//# sourceMappingURL=PageHeader.stories.d.ts.map