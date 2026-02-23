/**
 * ValidationProgress Stories
 *
 * Storybook stories for the ValidationProgress pattern component.
 */
import { ValidationProgress } from './ValidationProgress';
import { ValidationStage } from './ValidationStage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ValidationProgress>;
export default meta;
type Story = StoryObj<typeof ValidationProgress>;
/**
 * Ready state - no validation running
 */
export declare const Ready: Story;
/**
 * Validation in progress - some stages running
 */
export declare const InProgress: Story;
/**
 * Validation passed - all stages successful
 */
export declare const Passed: Story;
/**
 * Validation failed - with errors
 */
export declare const Failed: Story;
/**
 * With warnings
 */
export declare const WithWarnings: Story;
/**
 * Low risk validation - only schema and syntax
 */
export declare const LowRisk: Story;
/**
 * Medium risk validation
 */
export declare const MediumRisk: Story;
export declare const StagePending: StoryObj<typeof ValidationStage>;
export declare const StageRunning: StoryObj<typeof ValidationStage>;
export declare const StagePassed: StoryObj<typeof ValidationStage>;
export declare const StageFailed: StoryObj<typeof ValidationStage>;
export declare const StageWithMultipleErrors: StoryObj<typeof ValidationStage>;
//# sourceMappingURL=ValidationProgress.stories.d.ts.map