/**
 * HStepper Storybook Stories
 *
 * Interactive stories for the Horizontal Stepper (Header Pattern) component.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */
import { HStepper } from './h-stepper';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof HStepper>;
export default meta;
type Story = StoryObj<typeof HStepper>;
/**
 * Default story - 5 steps horizontal header
 */
export declare const Default: Story;
/**
 * Progress at various stages
 */
export declare const ProgressStages: Story;
/**
 * With completed steps
 */
export declare const WithCompletedSteps: Story;
/**
 * With error state
 */
export declare const WithErrorState: Story;
/**
 * Responsive behavior - test at different viewport sizes
 */
export declare const Responsive: Story;
/**
 * Interactive story with working navigation
 */
export declare const Interactive: Story;
/**
 * Dark theme
 */
export declare const DarkTheme: Story;
/**
 * With menu button
 */
export declare const WithMenuButton: Story;
/**
 * Non-sticky header
 */
export declare const NonSticky: Story;
/**
 * Allow skip steps - click any step
 */
export declare const AllowSkipSteps: Story;
/**
 * 3 steps - minimal wizard
 */
export declare const ThreeSteps: Story;
//# sourceMappingURL=h-stepper.stories.d.ts.map