/**
 * SkipLinks Stories
 *
 * Demonstrates the skip-navigation components for keyboard and screen reader users.
 * The links are visually hidden by default and only become visible when focused,
 * so each story includes instructions on how to see them in Storybook.
 */
import { SkipLinks } from './skip-links';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SkipLinks>;
export default meta;
type Story = StoryObj<typeof SkipLinks>;
/**
 * Default configuration – two links targeting `#main-content` and `#navigation`.
 * Press Tab inside the story canvas to reveal the first link.
 */
export declare const Default: Story;
/**
 * Custom links – a three-link set covering main content, sidebar, and footer.
 */
export declare const CustomLinks: Story;
/**
 * Single link – minimal configuration with just the main content target.
 */
export declare const SingleLink: Story;
/**
 * SkipLink (singular) – the individual `<SkipLink>` component for custom layouts
 * that need granular placement outside the standard container.
 */
export declare const SingleSkipLink: Story;
/**
 * Visible state preview – the links are forced into their focused/visible state using
 * a custom class so the appearance can be inspected without keyboard interaction.
 */
export declare const VisiblePreview: Story;
//# sourceMappingURL=skip-links.stories.d.ts.map