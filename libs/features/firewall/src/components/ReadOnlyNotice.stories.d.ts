/**
 * Storybook stories for ReadOnlyNotice
 *
 * Displays an informational banner explaining that firewall editing is disabled
 * in Phase 0. The banner is dismissible with localStorage persistence.
 */
import { ReadOnlyNotice } from './ReadOnlyNotice';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ReadOnlyNotice>;
export default meta;
type Story = StoryObj<typeof ReadOnlyNotice>;
/**
 * Default state — banner is fully visible and dismissible.
 */
export declare const Default: Story;
/**
 * With an extra className applied to the wrapper.
 */
export declare const WithCustomClass: Story;
/**
 * Narrow container to verify text wrapping behaviour on mobile viewports.
 */
export declare const NarrowContainer: Story;
/**
 * Wide container — simulates a full-page desktop layout.
 */
export declare const WideContainer: Story;
/**
 * Dark-mode preview. Toggle your Storybook theme to dark to see the inverted
 * blue palette in action.
 */
export declare const DarkMode: Story;
/**
 * Shows the notice embedded inside a realistic page section.
 */
export declare const InPageContext: Story;
//# sourceMappingURL=ReadOnlyNotice.stories.d.ts.map