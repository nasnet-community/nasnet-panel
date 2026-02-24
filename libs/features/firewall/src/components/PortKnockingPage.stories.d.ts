/**
 * Storybook stories for PortKnockingPage
 *
 * Demonstrates the port knocking page with its two tabs (Sequences and Knock Log),
 * the informational info card, the Create Sequence button, and the slide-over
 * Sheet used for creating and editing sequences.
 */
import { PortKnockingPage } from './PortKnockingPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PortKnockingPage>;
export default meta;
type Story = StoryObj<typeof PortKnockingPage>;
/**
 * Default state — sequences tab active, no dialog open.
 */
export declare const Default: Story;
/**
 * Custom container width to illustrate how the layout adapts.
 */
export declare const NarrowContainer: Story;
/**
 * Knock Log tab pre-selected.
 */
export declare const KnockLogTab: Story;
/**
 * Additional className applied — verifies className prop threading.
 */
export declare const WithCustomClass: Story;
/**
 * Dark mode variant.
 */
export declare const DarkMode: Story;
//# sourceMappingURL=PortKnockingPage.stories.d.ts.map