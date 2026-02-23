/**
 * VStepper Storybook Stories
 *
 * Interactive stories for the Vertical Stepper (Sidebar Pattern) component.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */
import { VStepper } from './v-stepper';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VStepper>;
export default meta;
type Story = StoryObj<typeof VStepper>;
/**
 * Default story - 5 steps, all future (starting state)
 */
export declare const Default: Story;
/**
 * With completed steps - 3 complete, 1 current, 1 future
 */
export declare const WithCompletedSteps: Story;
/**
 * Current step highlighted
 */
export declare const CurrentStepHighlighted: Story;
/**
 * With error state and tooltip
 */
export declare const WithErrorState: Story;
/**
 * Disabled/locked future steps
 */
export declare const DisabledFutureSteps: Story;
/**
 * Without descriptions (compact mode)
 */
export declare const CompactMode: Story;
/**
 * Interactive story with play function
 */
export declare const Interactive: Story;
/**
 * Dark theme
 */
export declare const DarkTheme: Story;
/**
 * With custom width
 */
export declare const CustomWidth: Story;
//# sourceMappingURL=v-stepper.stories.d.ts.map