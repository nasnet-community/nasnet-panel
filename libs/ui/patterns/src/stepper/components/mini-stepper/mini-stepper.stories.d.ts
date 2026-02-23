/**
 * MiniStepper Stories
 *
 * Storybook stories for the Mini Stepper mobile pattern.
 * Shows all variants and interaction states.
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
 */
import { MiniStepper } from './mini-stepper';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MiniStepper>;
export default meta;
type Story = StoryObj<typeof MiniStepper>;
export declare const Default: Story;
export declare const FirstStep: Story;
export declare const LastStep: Story;
export declare const WithValidation: Story;
export declare const DisabledSwipe: Story;
export declare const WithForm: Story;
export declare const ReducedMotion: Story;
export declare const DarkMode: Story;
//# sourceMappingURL=mini-stepper.stories.d.ts.map