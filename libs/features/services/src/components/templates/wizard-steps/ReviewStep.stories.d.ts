/**
 * Storybook stories for ReviewStep
 *
 * Second step of the template installation wizard.
 * Shows services list, configuration variable values, estimated resource usage,
 * and a prerequisite warning card.
 */
import { ReviewStep } from './ReviewStep';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ReviewStep>;
export default meta;
type Story = StoryObj<typeof ReviewStep>;
/**
 * Single service template with one configured variable.
 * Minimal resource estimate, no prerequisites.
 */
export declare const SingleService: Story;
/**
 * Multi-service chained template with multiple variable values,
 * including a boolean "Enabled" value and a numeric port.
 */
export declare const MultiServiceWithVariables: Story;
/**
 * Template with prerequisites warning card visible.
 * The prerequisites section should display with a warning-colored card.
 */
export declare const WithPrerequisites: Story;
/**
 * Empty variables — the configuration card should be hidden entirely
 * since there are no variable values to display.
 */
export declare const NoVariables: Story;
/**
 * Template without resource estimates — the Estimated Resources card
 * should not appear at all.
 */
export declare const NoResourceEstimate: Story;
/**
 * Full scenario: two services, three variables (string, number, boolean),
 * resource estimate, and prerequisite warnings all visible together.
 */
export declare const FullReview: Story;
//# sourceMappingURL=ReviewStep.stories.d.ts.map