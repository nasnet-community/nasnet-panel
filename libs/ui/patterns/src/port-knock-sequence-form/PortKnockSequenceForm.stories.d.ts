/**
 * Port Knock Sequence Form Stories
 * Form for creating and editing port knock sequences
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */
import type { PortKnockSequenceInput } from '@nasnet/core/types';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Wrapper component to use the form hook
 */
declare function FormStoryWrapper({ initialValues, isEditMode, isSubmitting, }: {
    initialValues?: PortKnockSequenceInput;
    isEditMode?: boolean;
    isSubmitting?: boolean;
}): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof FormStoryWrapper>;
export default meta;
type Story = StoryObj<typeof FormStoryWrapper>;
/**
 * Create mode - Empty form for creating new sequence
 */
export declare const CreateMode: Story;
/**
 * Edit mode - Pre-filled form for editing existing sequence
 */
export declare const EditMode: Story;
/**
 * With SSH lockout warning
 */
export declare const WithLockoutWarning: Story;
/**
 * Maximum knock ports (8)
 */
export declare const MaximumKnockPorts: Story;
/**
 * Mixed TCP/UDP protocols
 */
export declare const MixedProtocols: Story;
/**
 * Submitting state
 */
export declare const Submitting: Story;
/**
 * Mobile viewport
 */
export declare const Mobile: Story;
//# sourceMappingURL=PortKnockSequenceForm.stories.d.ts.map